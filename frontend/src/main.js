import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

const STORAGE_KEY = 'kendariFutsalHubState';

function readStoredState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
        return {};
    }
}

function writeStoredState(partialState) {
    try {
        const nextState = { ...readStoredState(), ...partialState };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (error) {
        // Storage can fail in private browsing; the app should keep working.
    }
}

const storedState = readStoredState();
const initialCenter = Array.isArray(storedState.center) ? storedState.center : [-3.9905, 122.5129];
const initialZoom = Number(storedState.zoom || 13);
const map = L.map('map', { zoomControl: false }).setView(initialCenter, initialZoom);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let userLocation = null;
let routingControl = null;
let activeId = null;
let lapanganData = [];
let activeFacilityFilters = new Set(storedState.facilities || []);
const markersData = {};
const cardsData = {};
const courtLookup = {};

const listContainer = document.getElementById('lapangan-list');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const facilityFilters = document.getElementById('facility-filters');
const courtDetail = document.getElementById('court-detail');
const geoStatus = document.getElementById('geo-status');
const geoStatusText = document.getElementById('geo-status-text');
const resultCount = document.getElementById('result-count');
const mapStatus = document.getElementById('map-status');
const mapStatusText = document.getElementById('map-status-text');
const locateButton = document.getElementById('locate-button');
const toastRegion = document.getElementById('toast-region');

const formatRupiah = (value) => Number(value || 0).toLocaleString('id-ID');

const FACILITIES = {
    parking: { label: 'Parking', icon: '<path d="M8 19V5h6a4 4 0 0 1 0 8H8m0 0h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    restroom: { label: 'Restroom', icon: '<path d="M7 21v-7H5l2-6h4l2 6h-2v7M17 21v-8M17 5.5v.01M8.5 4.5v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    musholla: { label: 'Musholla', icon: '<path d="M4 20h16M6 20v-8a6 6 0 0 1 12 0v8M12 4c2 1 4 3 4 6H8c0-3 2-5 4-6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    cafeteria: { label: 'Cafeteria', icon: '<path d="M4 6h12v5a6 6 0 0 1-12 0V6Zm12 2h2a2 2 0 1 1 0 4h-2M6 20h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    wifi: { label: 'Wi-Fi', icon: '<path d="M5 9a11 11 0 0 1 14 0M8 12a6 6 0 0 1 8 0M11 15a2 2 0 0 1 2 0M12 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
    locker: { label: 'Locker Room', icon: '<path d="M6 3h12v18H6V3Zm6 0v18M9 11h.01M15 11h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    waiting: { label: 'Waiting Area', icon: '<path d="M5 12h14v7H5v-7Zm2-4h10a2 2 0 0 1 2 2v2H5v-2a2 2 0 0 1 2-2Zm0 11v2m10-2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    cctv: { label: 'CCTV', icon: '<path d="M4 9l9-4 2 5-9 4-2-5Zm12 1 4 2-2 4-4-2m-5 2v3m-3 0h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    lighting: { label: 'LED Lighting', icon: '<path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    indoor: { label: 'Indoor', icon: '<path d="M3 11 12 4l9 7M5 10v10h14V10M9 20v-6h6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    outdoor: { label: 'Outdoor', icon: '<path d="M12 2v3m0 14v3m10-10h-3M5 12H2m17.1-7.1-2.1 2.1M7 17l-2.1 2.1m14.2 0L17 17M7 7 4.9 4.9M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
    grass: { label: 'Synthetic Grass', icon: '<path d="M4 20c2-5 2-9 2-14m6 14c0-5-1-9-3-13m11 13c-2-5-2-9-2-14M3 20h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
    changing: { label: 'Changing Room', icon: '<path d="M8 21V8l4-3 4 3v13M5 8l7-5 7 5M11 13h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    water: { label: 'Drinking Water', icon: '<path d="M12 3s5 6 5 11a5 5 0 0 1-10 0c0-5 5-11 5-11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
    charging: { label: 'Charging Station', icon: '<path d="M13 2 6 13h6l-1 9 7-12h-6l1-8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' }
};

const FILTER_FACILITIES = ['indoor', 'outdoor', 'parking', 'wifi', 'musholla', 'cafeteria', 'cctv', 'locker'];
const IMPORTANT_FACILITIES = ['indoor', 'outdoor', 'parking', 'wifi', 'musholla', 'cafeteria'];
const REVIEW_CATEGORIES = ['Field Quality', 'Cleanliness', 'Lighting', 'Parking', 'Staff Service', 'Facilities', 'Value for Money'];

const escapeHTML = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function iconSVG(key) {
    return `<svg class="chip-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">${FACILITIES[key]?.icon || ''}</svg>`;
}

function renderFacilityChip(key) {
    const facility = FACILITIES[key];
    if (!facility) return '';

    return `<span class="facility-chip">${iconSVG(key)}${facility.label}</span>`;
}

function renderStars(score) {
    const rounded = Math.round(score);
    return '★★★★★'.split('').map((star, index) => index < rounded ? '★' : '☆').join('');
}

function seededIndex(seed, max) {
    const value = String(seed).split('').reduce((total, char) => total + char.charCodeAt(0), 0);
    return value % max;
}

function getFacilityKeys(lapangan) {
    if (Array.isArray(lapangan.fasilitas)) return lapangan.fasilitas;
    if (Array.isArray(lapangan.facilities)) return lapangan.facilities;

    const pools = [
        ['indoor', 'parking', 'wifi', 'musholla', 'locker', 'waiting', 'lighting', 'grass', 'water'],
        ['outdoor', 'parking', 'cafeteria', 'cctv', 'lighting', 'grass', 'changing', 'water'],
        ['indoor', 'parking', 'restroom', 'musholla', 'cafeteria', 'cctv', 'charging', 'waiting'],
        ['outdoor', 'restroom', 'parking', 'wifi', 'lighting', 'grass', 'changing', 'locker'],
        ['indoor', 'parking', 'wifi', 'cafeteria', 'cctv', 'locker', 'water', 'charging']
    ];

    return pools[seededIndex(lapangan.id || lapangan.nama, pools.length)];
}

function createReviews(lapangan) {
    const names = ['Ardi Pratama', 'Nadya Safitri', 'Rizky Ramadhan', 'Maya Lestari', 'Fajar Nugroho', 'Putri Ananda'];
    const comments = [
        'Lapangan nyaman, rumput sintetisnya enak buat kontrol bola dan area tunggunya rapi.',
        'Pencahayaan malam bagus. Parkir cukup luas walau kantin bisa dibuat lebih lengkap.',
        'Booking lancar, staf responsif, kamar ganti bersih, cocok untuk main rutin.',
        'Lokasinya mudah dijangkau. Fasilitas inti lengkap dan suasananya aman.',
        'Lapangan cukup terawat, CCTV dan area tunggu bikin lebih tenang saat bawa barang.',
        'Harga sesuai kualitas. Musholla dan air minum jadi nilai plus setelah main.'
    ];
    const base = seededIndex(lapangan.id || lapangan.nama, 5);

    return names.map((name, index) => ({
        id: `${lapangan.id}-${index}`,
        name,
        avatar: name.split(' ').map(part => part[0]).slice(0, 2).join(''),
        rating: Math.max(3, 5 - ((index + base) % 3)),
        date: new Date(2026, 4 - ((index + base) % 4), 24 - index * 3).toISOString(),
        content: comments[(index + base) % comments.length],
        helpful: 4 + ((index + 1) * (base + 2)),
        verified: index !== 4,
        categories: REVIEW_CATEGORIES.reduce((ratings, category, categoryIndex) => {
            ratings[category] = Math.max(3, 5 - ((index + categoryIndex + base) % 3));
            return ratings;
        }, {})
    }));
}

function getRatingSummary(reviews) {
    const total = reviews.length || 1;
    const score = reviews.reduce((sum, review) => sum + review.rating, 0) / total;
    const distribution = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(review => review.rating === star).length
    }));

    return {
        score: Number(score.toFixed(1)),
        total,
        distribution
    };
}

function enrichCourt(lapangan) {
    const reviews = createReviews(lapangan);
    const rating = getRatingSummary(reviews);
    const facilities = getFacilityKeys(lapangan);
    const distance = userLocation && lapangan.latitude && lapangan.longitude
        ? map.distance(userLocation, L.latLng(lapangan.latitude, lapangan.longitude)) / 1000
        : null;

    return {
        ...lapangan,
        facilities,
        reviews,
        rating,
        distance,
        travelTime: distance ? Math.max(5, Math.round(distance * 5)) : null,
        completedBooking: seededIndex(lapangan.id || lapangan.nama, 3) === 0
    };
}

function getQuality(score) {
    if (score >= 4.6) return 'high';
    if (score >= 4.1) return 'medium';
    return 'low';
}

function highlightText(value, keyword) {
    const safeValue = escapeHTML(value);
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) return safeValue;

    const escapedKeyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safeValue.replace(new RegExp(`(${escapedKeyword})`, 'gi'), '<mark>$1</mark>');
}

function setGeoStatus(message, state = 'loading') {
    geoStatus.classList.toggle('is-ready', state === 'ready');
    geoStatus.classList.toggle('is-error', state === 'error');
    geoStatusText.textContent = message;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast is-${type}`;
    toast.textContent = message;
    toastRegion.appendChild(toast);

    window.setTimeout(() => {
        toast.classList.add('is-hiding');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 2600);
}

function showMapStatus(message) {
    mapStatusText.textContent = message;
    mapStatus.classList.add('is-visible');
}

function updateResultCount(visible, total = lapanganData.length) {
    resultCount.textContent = total ? `${visible} dari ${total} lapangan` : `${visible} lapangan`;
    resultCount.classList.add('is-updating');
    window.setTimeout(() => resultCount.classList.remove('is-updating'), 220);
}

function hideMapStatus(delay = 500) {
    window.setTimeout(() => {
        mapStatus.classList.remove('is-visible');
    }, delay);
}

function createCourtIcon(state = '', quality = 'medium') {
    const stateClass = state ? ` is-${state}` : '';
    const qualityClass = quality ? ` is-${quality}` : '';
    return L.divIcon({
        className: 'court-marker-shell',
        html: `<div class="court-marker${qualityClass}${stateClass}"></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 30],
        popupAnchor: [0, -28]
    });
}

function setMarkerState(id, state = '') {
    const marker = markersData[id];
    const court = courtLookup[id];
    if (!marker) return;

    marker.setIcon(createCourtIcon(state, court?.quality));
}

function setActiveLapangan(id, options = {}) {
    if (!id || !markersData[id]) return;

    if (activeId && activeId !== id) {
        cardsData[activeId]?.classList.remove('is-active');
        setMarkerState(activeId);
    }

    activeId = id;
    const card = cardsData[id];
    const marker = markersData[id];

    card?.classList.add('is-active');
    card?.classList.add('is-spotlight');
    setMarkerState(id, 'active');
    writeStoredState({ selectedId: id });

    card?.addEventListener('animationend', () => {
        card.classList.remove('is-spotlight');
    }, { once: true });

    if (options.openPopup) marker.openPopup();
    if (options.scrollCard && card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function getPopupHTML(lapangan) {
    const nama = escapeHTML(lapangan.nama || 'Lapangan futsal');
    const alamat = escapeHTML(lapangan.alamat || 'Alamat belum tersedia');
    const harga = formatRupiah(lapangan.harga_sewa);

    return `
        <div class="popup-card">
            <div class="popup-title">${nama}</div>
            <div class="rating-row">
                <span class="stars">${renderStars(lapangan.rating.score)}</span>
                <span class="rating-score">${lapangan.rating.score}</span>
                <span>${lapangan.rating.total} ulasan</span>
            </div>
            <div class="popup-price">Rp ${harga}<small>/jam</small></div>
            <div class="popup-address">${alamat}</div>
            <div class="card-facilities">${lapangan.facilities.slice(0, 3).map(renderFacilityChip).join('')}</div>
            <button class="btn btn-primary popup-action btn-rute" data-id="${lapangan.id}" data-lat="${lapangan.latitude}" data-lng="${lapangan.longitude}">
                <span>Mulai Rute</span>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
    `;
}

function showSkeletons() {
    listContainer.innerHTML = `
        <div class="skeleton-card" aria-hidden="true"></div>
        <div class="skeleton-card" aria-hidden="true"></div>
        <div class="skeleton-card" aria-hidden="true"></div>
    `;
}

function showEmptyState(keyword) {
    listContainer.innerHTML = `
        <div class="empty-state">
            <strong>Tidak ada lapangan ditemukan</strong>
            <p>Coba kata kunci lain untuk "${escapeHTML(keyword)}".</p>
        </div>
    `;
}

function showErrorState() {
    listContainer.innerHTML = `
        <div class="error-state">
            <strong>Gagal memuat data</strong>
            <p>Periksa koneksi server API lalu muat ulang halaman.</p>
        </div>
    `;
}

function renderFacilityFilters() {
    facilityFilters.innerHTML = FILTER_FACILITIES.map(key => {
        const isActive = activeFacilityFilters.has(key);
        return `
            <button type="button" class="filter-chip${isActive ? ' is-active' : ''}" data-facility="${key}" aria-pressed="${isActive}">
                ${iconSVG(key)}
                ${FACILITIES[key].label}
            </button>
        `;
    }).join('');
}

function getCommunityHighlights(court) {
    const labels = court.facilities.map(key => FACILITIES[key]?.label).filter(Boolean);
    return [
        `Most visitors praise the ${court.rating.score >= 4.5 ? 'field quality and lighting' : 'accessible location'}.`,
        labels.includes('Parking') ? 'Parking is spacious and easy to access.' : 'Visitors appreciate the practical court layout.',
        labels.includes('LED Lighting') ? 'Lighting is consistently mentioned as a strength.' : 'Players value the straightforward booking experience.',
        labels.includes('Waiting Area') ? 'Waiting area feels comfortable before and after matches.' : 'Core futsal facilities are available for regular play.',
        labels.includes('Cafeteria') ? 'Some users suggest improving cafeteria menu variety.' : 'Adding more refreshment options could improve the experience.'
    ];
}

function renderRatingDistribution(summary) {
    const max = Math.max(...summary.distribution.map(item => item.count), 1);
    return summary.distribution.map(item => `
        <div class="rating-bar-row">
            <span>${'★'.repeat(item.star)}${'☆'.repeat(5 - item.star)}</span>
            <span class="rating-track"><span class="rating-fill" style="width: ${(item.count / max) * 100}%"></span></span>
            <span>${item.count}</span>
        </div>
    `).join('');
}

function sortReviews(reviews, sortMode, ratingFilter) {
    let sorted = [...reviews];
    if (ratingFilter !== 'all') sorted = sorted.filter(review => review.rating === Number(ratingFilter));

    return sorted.sort((a, b) => {
        if (sortMode === 'highest') return b.rating - a.rating;
        if (sortMode === 'lowest') return a.rating - b.rating;
        if (sortMode === 'helpful') return b.helpful - a.helpful;
        return new Date(b.date) - new Date(a.date);
    });
}

function renderReviews(court, sortMode = 'newest', ratingFilter = 'all', limit = 3) {
    const reviews = sortReviews(court.reviews, sortMode, ratingFilter).slice(0, limit);
    if (!reviews.length) {
        return '<div class="locked-review">Belum ada ulasan yang cocok dengan filter ini.</div>';
    }

    return reviews.map(review => `
        <article class="review-item">
            <div class="avatar">${escapeHTML(review.avatar)}</div>
            <div>
                <div class="review-head">
                    <div>
                        <div class="review-name">${escapeHTML(review.name)}</div>
                        ${review.verified ? '<div class="verified-badge">✓ Verified Booking</div>' : ''}
                    </div>
                    <time class="review-date">${new Date(review.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                </div>
                <div class="rating-row"><span class="stars">${renderStars(review.rating)}</span><span>${review.rating}.0</span></div>
                <p class="review-copy">${escapeHTML(review.content)}</p>
                <div class="helpful">${review.helpful} orang merasa ini membantu</div>
            </div>
        </article>
    `).join('');
}

function renderReviewForm(court) {
    if (!court.completedBooking) {
        return `
            <div class="locked-review">
                Review hanya tersedia setelah booking selesai. Setelah bermain, form ulasan akan terbuka otomatis dan ditandai sebagai Verified Booking.
            </div>
        `;
    }

    return `
        <div class="category-ratings">
            ${REVIEW_CATEGORIES.map(category => `
                <div class="category-row">
                    <span>${category}</span>
                    <span class="mini-stars" aria-label="Rating ${category}">&#9734;&#9734;&#9734;&#9734;&#9734;</span>
                </div>
            `).join('')}
            <button class="btn btn-primary" type="button">
                <span>Tulis Review Terverifikasi</span>
            </button>
        </div>
    `;
}

function renderDetailPanel(court) {
    const highlights = getCommunityHighlights(court);
    courtDetail.classList.add('is-visible');
    courtDetail.innerHTML = `
        <div class="detail-inner" data-court-id="${court.id}">
            <div class="detail-cover">
                <div class="detail-cover-content">
                    <div class="detail-title">${escapeHTML(court.nama || 'Lapangan futsal')}</div>
                    <div class="detail-subtitle">${escapeHTML(court.alamat || 'Alamat belum tersedia')}</div>
                    <div class="rating-row">
                        <span class="stars">${renderStars(court.rating.score)}</span>
                        <span>${court.rating.score} · ${court.rating.total} ulasan</span>
                    </div>
                </div>
                <button class="detail-close" type="button" aria-label="Tutup detail">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>

            <div class="detail-summary-grid">
                <div class="metric"><div class="metric-label">Harga</div><div class="metric-value">Rp ${formatRupiah(court.harga_sewa)}/jam</div></div>
                <div class="metric"><div class="metric-label">Jarak</div><div class="metric-value">${court.distance ? `${court.distance.toFixed(1)} km` : 'Aktifkan lokasi'}</div></div>
                <div class="metric"><div class="metric-label">Estimasi</div><div class="metric-value">${court.travelTime ? `${court.travelTime} mnt` : '-'}</div></div>
            </div>

            <button class="btn btn-primary btn-rute" data-id="${court.id}" data-lat="${court.latitude}" data-lng="${court.longitude}" type="button">
                <span>Booking & Rute</span>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>

            <section class="detail-section">
                <div class="section-header"><h2 class="section-title">Facilities</h2></div>
                <div class="facility-grid">${court.facilities.map(renderFacilityChip).join('')}</div>
            </section>

            <section class="detail-section">
                <div class="section-header"><h2 class="section-title">Availability Calendar</h2><button class="section-action" type="button">Hari ini</button></div>
                <div class="highlight-list">
                    <li>18:00 - 19:00 tersedia</li>
                    <li>20:00 - 21:00 hampir penuh</li>
                    <li>Booking summary akan terhubung ke modul pembayaran.</li>
                </div>
            </section>

            <section class="detail-section">
                <div class="section-header"><h2 class="section-title">Community Highlights</h2></div>
                <ul class="highlight-list">${highlights.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
            </section>

            <section class="detail-section">
                <div class="section-header"><h2 class="section-title">Rating Distribution</h2><span class="rating-score">${court.rating.score}</span></div>
                <div class="rating-distribution">${renderRatingDistribution(court.rating)}</div>
            </section>

            <section class="detail-section">
                <div class="section-header"><h2 class="section-title">Latest Reviews</h2></div>
                <div class="review-toolbar">
                    <select class="review-sort" aria-label="Urutkan ulasan">
                        <option value="newest">Newest</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                        <option value="helpful">Most Helpful</option>
                    </select>
                    <select class="review-filter" aria-label="Filter rating ulasan">
                        <option value="all">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                    </select>
                </div>
                <div class="review-list" data-review-list>${renderReviews(court)}</div>
            </section>

            <section class="detail-section">
                <div class="section-header"><h2 class="section-title">Write Review</h2></div>
                ${renderReviewForm(court)}
            </section>
        </div>
    `;
}

// 1. Geolokasi User
showSkeletons();
renderFacilityFilters();
showMapStatus('Mendeteksi lokasi kamu');
map.locate({ setView: !storedState.center, maxZoom: 14 });

map.on('locationfound', (e) => {
    userLocation = e.latlng;
    const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: '<div class="user-marker"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
    L.marker(userLocation, { icon: userIcon }).addTo(map).bindPopup("Lokasi Kamu Saat Ini");
    setGeoStatus('Lokasi aktif', 'ready');
    hideMapStatus();
    showToast('Lokasi kamu berhasil terdeteksi.', 'success');
    fetchData();
});

map.on('locationerror', () => {
    setGeoStatus('Lokasi tidak aktif', 'error');
    showMapStatus('Lokasi tidak terdeteksi, daftar tetap dimuat');
    hideMapStatus(1200);
    showToast('Lokasi belum aktif. Kamu tetap bisa melihat daftar lapangan.', 'error');
    fetchData();
});

// 2. Fetch Data dari API
async function fetchData() {
    try {
        const response = await fetch('http://localhost/sig-futsal/backend/public/index.php/get_lapangan');
        const result = await response.json();

        if (result.status === 'success') {
            lapanganData = (result.data || []).map(enrichCourt);
            renderSidebarAndMap(lapanganData);
            showToast(`${lapanganData.length} lapangan berhasil dimuat.`, 'success');
        }
    } catch (error) {
        console.error('API Error:', error);
        showErrorState();
        resultCount.textContent = '';
        showToast('Data lapangan belum bisa dimuat.', 'error');
    }
}

// 3. Render UI dan Interaksi
function renderSidebarAndMap(data) {
    listContainer.innerHTML = ''; // Bersihkan loading text
    updateResultCount(data.length, data.length);

    data.forEach(lapangan => {
        // --- BUAT MARKER ---
        const latLng = [lapangan.latitude, lapangan.longitude];
        lapangan.quality = getQuality(lapangan.rating.score);
        courtLookup[lapangan.id] = lapangan;
        const marker = L.marker(latLng, { icon: createCourtIcon('', lapangan.quality) }).addTo(map);
        const alamat = lapangan.alamat || 'Alamat belum tersedia';
        const hargaSewa = Number(lapangan.harga_sewa || 0);
        
        marker.bindPopup(getPopupHTML(lapangan));
        markersData[lapangan.id] = marker; // Simpan referensi

        // --- BUAT KARTU DI SIDEBAR ---
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('role', 'listitem');
        card.setAttribute('tabindex', '0');
        card.dataset.id = lapangan.id;
        card.dataset.nama = lapangan.nama || '';
        card.dataset.alamat = alamat;
        card.dataset.facilities = lapangan.facilities.join(',');
        card.innerHTML = `
            <div class="card-top">
                <div class="card-title">${escapeHTML(lapangan.nama || 'Lapangan futsal')}</div>
                <span class="card-badge">${lapangan.quality === 'high' ? 'Top Rated' : 'Futsal'}</span>
            </div>
            <div class="rating-row">
                <span class="stars">${renderStars(lapangan.rating.score)}</span>
                <span class="rating-score">${lapangan.rating.score}</span>
                <span>${lapangan.rating.total} ulasan</span>
            </div>
            <div class="card-address"><span aria-hidden="true">&#128205;</span><div>${escapeHTML(alamat)}</div></div>
            <div class="card-facilities">
                ${lapangan.facilities.filter(key => IMPORTANT_FACILITIES.includes(key)).slice(0, 4).map(renderFacilityChip).join('')}
            </div>
            <div class="card-meta">
                <div class="card-price">Rp ${hargaSewa.toLocaleString('id-ID')}<small>/jam</small></div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-rute" data-id="${lapangan.id}" data-lat="${lapangan.latitude}" data-lng="${lapangan.longitude}">
                    <span>Mulai Rute</span>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `;
        cardsData[lapangan.id] = card;

        // Interaksi klik kartu -> Fly to Map
        card.addEventListener('click', (e) => {
            // Jangan flyTo jika yang diklik adalah tombol rute
            if (e.target.closest('.btn-rute')) return; 
            
            setActiveLapangan(lapangan.id, { openPopup: true });
            renderDetailPanel(lapangan);
            map.flyTo(latLng, 16, { duration: 1.1 });
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveLapangan(lapangan.id, { openPopup: true });
                renderDetailPanel(lapangan);
                map.flyTo(latLng, 16, { duration: 1.1 });
            }
        });

        card.addEventListener('mouseenter', () => {
            if (activeId !== lapangan.id) setMarkerState(lapangan.id, 'hovered');
        });

        card.addEventListener('mouseleave', () => {
            if (activeId !== lapangan.id) setMarkerState(lapangan.id);
        });

        marker.on('click', () => {
            setActiveLapangan(lapangan.id, { scrollCard: true });
            renderDetailPanel(lapangan);
        });

        marker.on('mouseover', () => {
            cardsData[lapangan.id]?.classList.add('is-hovered');
            if (activeId !== lapangan.id) setMarkerState(lapangan.id, 'hovered');
        });

        marker.on('mouseout', () => {
            cardsData[lapangan.id]?.classList.remove('is-hovered');
            if (activeId !== lapangan.id) setMarkerState(lapangan.id);
        });

        listContainer.appendChild(card);
    });

    searchInput.value = storedState.search || '';

    if (storedState.selectedId && markersData[storedState.selectedId]) {
        setActiveLapangan(storedState.selectedId, { scrollCard: true });
        renderDetailPanel(courtLookup[storedState.selectedId]);
    }

    applySearch(searchInput.value || storedState.search || '');
}

function startRoute(button) {
    if (!userLocation) {
        setGeoStatus('Lokasi dibutuhkan untuk rute', 'error');
        showMapStatus('Izinkan akses lokasi untuk membuat rute');
        hideMapStatus(1500);
        showToast('Aktifkan izin lokasi untuk memakai rute.', 'error');
        return;
    }

    const targetLat = parseFloat(button.getAttribute('data-lat'));
    const targetLng = parseFloat(button.getAttribute('data-lng'));
    const id = button.getAttribute('data-id');

    setActiveLapangan(id, { openPopup: true, scrollCard: true });
    if (courtLookup[id]) renderDetailPanel(courtLookup[id]);
    map.flyTo([targetLat, targetLng], 15, { duration: 1.1 });

    if (routingControl) { map.removeControl(routingControl); }

    showMapStatus('Menghitung rute terbaik');
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(userLocation.lat, userLocation.lng),
            L.latLng(targetLat, targetLng)
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        showAlternatives: false,
        lineOptions: { styles: [{color: '#2563eb', opacity: 0.85, weight: 5}] }
    })
        .on('routesfound', () => {
            hideMapStatus();
            showToast('Rute terbaik sudah siap.', 'success');
        })
        .on('routingerror', () => {
            showMapStatus('Rute belum dapat dibuat');
            hideMapStatus(1600);
            showToast('Rute belum dapat dibuat saat ini.', 'error');
        })
        .addTo(map);
}

document.addEventListener('click', (e) => {
    const routeButton = e.target.closest('.btn-rute');
    if (routeButton) startRoute(routeButton);
});

function applySearch(value) {
    const trimmedKeyword = value.trim();
    const keyword = trimmedKeyword.toLowerCase();
    let visibleCount = 0;

    if (!lapanganData.length) return;

    searchClear.classList.toggle('is-visible', Boolean(trimmedKeyword));

    Object.values(cardsData).forEach(card => {
        const title = card.dataset.nama.toLowerCase();
        const address = card.dataset.alamat.toLowerCase();
        const facilities = card.dataset.facilities.split(',');
        const marker = markersData[card.dataset.id];
        const titleNode = card.querySelector('.card-title');
        const addressNode = card.querySelector('.card-address div');
        const matchesText = title.includes(keyword) || address.includes(keyword);
        const matchesFacilities = [...activeFacilityFilters].every(filter => facilities.includes(filter));
        const isMatch = matchesText && matchesFacilities;

        titleNode.innerHTML = highlightText(card.dataset.nama, trimmedKeyword);
        addressNode.innerHTML = highlightText(card.dataset.alamat, trimmedKeyword);

        if (isMatch) {
            card.style.display = 'flex';
            if (marker && !map.hasLayer(marker)) marker.addTo(map);
            visibleCount += 1;
        } else {
            card.style.display = 'none';
            if (marker && map.hasLayer(marker)) marker.removeFrom(map);
        }
    });

    updateResultCount(visibleCount, lapanganData.length);
    writeStoredState({ search: value, facilities: [...activeFacilityFilters] });

    const existingEmptyState = listContainer.querySelector('.empty-state');
    if (visibleCount === 0 && !existingEmptyState) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <strong>Tidak ada lapangan ditemukan</strong>
            <p>Coba kata kunci lain untuk "${escapeHTML(trimmedKeyword)}".</p>
        `;
        listContainer.appendChild(emptyState);
    } else if (visibleCount > 0 && existingEmptyState) {
        existingEmptyState.remove();
    }

    if (activeId && cardsData[activeId]?.style.display === 'none') {
        courtDetail.classList.remove('is-visible');
    }
}

searchInput.addEventListener('input', function(e) {
    applySearch(e.target.value);
}); 

facilityFilters.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-chip');
    if (!button) return;

    const facility = button.dataset.facility;
    if (activeFacilityFilters.has(facility)) {
        activeFacilityFilters.delete(facility);
    } else {
        activeFacilityFilters.add(facility);
    }

    renderFacilityFilters();
    applySearch(searchInput.value);
});

courtDetail.addEventListener('click', (event) => {
    if (event.target.closest('.detail-close')) {
        courtDetail.classList.remove('is-visible');
        return;
    }
});

courtDetail.addEventListener('change', (event) => {
    const container = event.target.closest('.detail-inner');
    if (!container) return;

    const court = courtLookup[container.dataset.courtId];
    const sortMode = container.querySelector('.review-sort')?.value || 'newest';
    const ratingFilter = container.querySelector('.review-filter')?.value || 'all';
    const reviewList = container.querySelector('[data-review-list]');

    if (court && reviewList) {
        reviewList.innerHTML = renderReviews(court, sortMode, ratingFilter);
    }
});

searchClear.addEventListener('click', () => {
    searchInput.value = '';
    applySearch('');
    searchInput.focus();
});

locateButton.addEventListener('click', () => {
    if (!userLocation) {
        showMapStatus('Mendeteksi ulang lokasi kamu');
        map.locate({ setView: true, maxZoom: 15 });
        return;
    }

    map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
    showToast('Peta dipusatkan ke lokasi kamu.', 'success');
});

map.on('moveend', () => {
    const center = map.getCenter();
    writeStoredState({
        center: [Number(center.lat.toFixed(6)), Number(center.lng.toFixed(6))],
        zoom: map.getZoom()
    });
});

document.addEventListener('keydown', (event) => {
    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (event.key === '/' && !isTyping) {
        event.preventDefault();
        searchInput.focus();
    }
});
