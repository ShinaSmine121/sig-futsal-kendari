<?php
require_once '../config/database.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Deteksi jika URL mengandung 'get_lapangan'
if (strpos($uri, 'get_lapangan') !== false) {
    $sql = "SELECT id, nama, alamat, latitude, longitude, harga_sewa, fasilitas FROM lapangan_futsal";
    $result = $conn->query($sql);

    $data = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $row['latitude'] = (float)$row['latitude'];
            $row['longitude'] = (float)$row['longitude'];
            $data[] = $row;
        }
    }
    
    echo json_encode([
        "status" => "success",
        "data" => $data
    ]);
    exit();
}

http_response_code(404);
echo json_encode(["status" => "error", "message" => "Endpoint tidak ditemukan"]);
?>