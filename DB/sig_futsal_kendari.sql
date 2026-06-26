-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 21, 2026 at 09:24 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sig_futsal_kendari`
--

-- --------------------------------------------------------

--
-- Table structure for table `lapangan_futsal`
--

CREATE TABLE `lapangan_futsal` (
  `id` int(11) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `alamat` text NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `harga_sewa` int(11) NOT NULL,
  `fasilitas` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lapangan_futsal`
--

INSERT INTO `lapangan_futsal` (`id`, `nama`, `alamat`, `latitude`, `longitude`, `harga_sewa`, `fasilitas`, `created_at`, `updated_at`) VALUES
(1, 'Lapangan Futsal Kendari Sport Center', 'Jl. Ahmad Yani No. 45, Kendari', -3.97220000, 122.51490000, 150000, 'Parkir, Locker, Kantin', '2026-06-19 16:57:13', '2026-06-19 16:57:13'),
(2, 'Gor Futsal Anduonohu', 'Jl. Anduonohu, Kendari', -3.96540000, 122.52830000, 120000, 'Parkir, Ruang Ganti', '2026-06-19 16:57:13', '2026-06-19 16:57:13'),
(3, 'Lapangan Futsal BTN Kendari', 'Perumahan BTN, Kendari', -3.98150000, 122.50720000, 100000, 'Parkir, Pencahayaan Malam', '2026-06-19 16:57:13', '2026-06-19 16:57:13'),
(4, 'Futsal Arena Poasi', 'Jl. Poasi, Kendari', -3.95870000, 122.51980000, 130000, 'Parkir, Kantin, WiFi', '2026-06-19 16:57:13', '2026-06-19 16:57:13'),
(5, 'GARUDA FUTSAL', 'Jl. Malaka No.3, Anduonohu, Kec. Poasia, Kota Kendari', -3.99565755, 122.53327964, 120000, 'Parkir Luas, Ruang Ganti, Kantin', '2026-06-19 18:30:11', '2026-06-19 18:30:11'),
(6, 'RAHKA FUTSAL', 'Jl. Latsitarda, Kambu, Kec. Kambu, Kota Kendari', -4.01120599, 122.53128267, 100000, 'Parkir, Toilet, Ruang Ganti', '2026-06-19 18:30:11', '2026-06-19 18:30:11'),
(7, 'Lapangan Futsal Hikari', 'XGWQ+9MH, Anduonohu, Kec. Poasia, Kota Kendari', -4.00364060, 122.53922494, 110000, 'Parkir, Kantin, Tribun', '2026-06-19 18:30:11', '2026-06-19 18:30:11'),
(8, 'Kubra II Futsal & GYM', 'Jl. Bunggasi, Anduonohu, Kec. Poasia, Kota Kendari', -3.99944509, 122.53832362, 150000, 'Parkir Luas, Gym, Loker, Kantin', '2026-06-19 18:30:11', '2026-06-19 18:30:11'),
(9, 'Mubaraq Sport', 'XGJH+7XP, Mokoau, Kec. Kambu, Kota Kendari', -4.01878442, 122.53003903, 120000, 'Parkir, Mushola, Ruang Ganti', '2026-06-19 18:30:11', '2026-06-19 18:30:11'),
(10, 'Futsal La Malona Sport Center', 'Lrg. Lailaingu, Padaleu, Kec. Kambu, Kota Kendari', -4.01962703, 122.51832150, 130000, 'Parkir, Tribun, Kantin', '2026-06-19 18:30:11', '2026-06-19 18:30:11'),
(11, 'Kancil Futsal', 'XGWQ+9MF, Anduonohu, Kec. Poasia, Kota Kendari', -4.00346209, 122.53920431, 100000, 'Parkir, Toilet Bersih', '2026-06-19 18:30:11', '2026-06-19 18:30:11'),
(12, 'HBM Futsal dan Badminton new', 'Anduonohu, Kec. Poasia, Kota Kendari', -3.99907379, 122.54433293, 140000, 'Parkir, Lapangan Badminton, Loker, Kantin', '2026-06-19 18:30:11', '2026-06-19 18:30:11'),
(13, 'TAWANG ALUN FUTSAL ARENA', 'Jl. Tembusan Boulevard, Lepo-Lepo, Kec. Baruga, Kota Kendari', -4.02840445, 122.52050134, 130000, 'Parkir Luas, Papan Skor Digital, Tribun', '2026-06-19 18:30:11', '2026-06-19 18:30:11'),
(14, 'Metro Sports Arena', 'Lrg. Sepakat, Lalolara, Kec. Kambu, Kota Kendari', -3.99735143, 122.52115662, 150000, 'Parkir Luas, Tribun, Ruang Ganti', '2026-06-19 18:30:27', '2026-06-19 18:30:27');

-- --------------------------------------------------------

--
-- Table structure for table `lapangan_images`
--

CREATE TABLE `lapangan_images` (
  `id` int(11) NOT NULL,
  `lapangan_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `slot_waktu`
--

CREATE TABLE `slot_waktu` (
  `id` int(11) NOT NULL,
  `lapangan_id` int(11) NOT NULL,
  `hari` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `harga_khusus` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaksi_booking`
--

CREATE TABLE `transaksi_booking` (
  `id` int(11) NOT NULL,
  `lapangan_id` int(11) NOT NULL,
  `nama_pemesan` varchar(100) NOT NULL,
  `kontak_pemesan` varchar(20) NOT NULL,
  `tanggal_main` date NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `total_harga` decimal(10,2) NOT NULL,
  `status_booking` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `lapangan_futsal`
--
ALTER TABLE `lapangan_futsal`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lapangan_images`
--
ALTER TABLE `lapangan_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lapangan_id` (`lapangan_id`);

--
-- Indexes for table `slot_waktu`
--
ALTER TABLE `slot_waktu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lapangan_id` (`lapangan_id`);

--
-- Indexes for table `transaksi_booking`
--
ALTER TABLE `transaksi_booking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lapangan_id` (`lapangan_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `lapangan_futsal`
--
ALTER TABLE `lapangan_futsal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `lapangan_images`
--
ALTER TABLE `lapangan_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `slot_waktu`
--
ALTER TABLE `slot_waktu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaksi_booking`
--
ALTER TABLE `transaksi_booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `lapangan_images`
--
ALTER TABLE `lapangan_images`
  ADD CONSTRAINT `lapangan_images_ibfk_1` FOREIGN KEY (`lapangan_id`) REFERENCES `lapangan_futsal` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `slot_waktu`
--
ALTER TABLE `slot_waktu`
  ADD CONSTRAINT `slot_waktu_ibfk_1` FOREIGN KEY (`lapangan_id`) REFERENCES `lapangan_futsal` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transaksi_booking`
--
ALTER TABLE `transaksi_booking`
  ADD CONSTRAINT `transaksi_booking_ibfk_1` FOREIGN KEY (`lapangan_id`) REFERENCES `lapangan_futsal` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
