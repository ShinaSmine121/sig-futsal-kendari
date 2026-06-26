<?php
$host = 'localhost';
$user = 'root';
$pass = ''; // Default XAMPP biasanya kosong
$db   = 'sig_futsal_kendari';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode([
        "status" => "error", 
        "message" => "Koneksi database gagal: " . $conn->connect_error
    ]));
}
?>