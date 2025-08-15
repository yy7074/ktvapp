<?php
// 数据库配置
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '123456');
define('DB_NAME', 'ktv_booking');

// 允许跨域
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 数据库连接函数
function getConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]
        );
        
        // 设置时区为中国标准时间，确保时间一致性
        $pdo->exec("SET time_zone = '+08:00'");
        
        return $pdo;
    } catch (PDOException $e) {
        error_log("数据库连接失败: " . $e->getMessage());
        return null;
    }
}

// 统一响应函数
function response($success = true, $message = '', $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 获取POST数据
function getPostData() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: $_POST;
}

// 验证手机号
function validatePhone($phone) {
    return preg_match('/^1[3-9]\d{9}$/', $phone);
}

// 生成随机验证码
function generateCode($length = 4) {
    return str_pad(rand(0, pow(10, $length) - 1), $length, '0', STR_PAD_LEFT);
}

// 生成JWT Token (简单版本)
function generateToken($userId) {
    $payload = [
        'user_id' => $userId,
        'exp' => time() + 86400 * 7 // 7天过期
    ];
    return base64_encode(json_encode($payload));
}

// 验证Token
function validateToken($token) {
    try {
        $payload = json_decode(base64_decode($token), true);
        if ($payload && $payload['exp'] > time()) {
            return $payload['user_id'];
        }
    } catch (Exception $e) {
        error_log("Token验证失败: " . $e->getMessage());
    }
    return false;
}
?> 