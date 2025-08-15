<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    if (!$pdo) {
        response(false, '数据库连接失败');
    }

    // 简单的token验证
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!$authHeader || strpos($authHeader, 'Bearer ') !== 0) {
        response(false, '未授权访问');
    }

    $token = substr($authHeader, 7);
    $userId = validateToken($token);
    
    if (!$userId) {
        response(false, '无效的访问令牌');
    }

    // 获取统计数据
    $stats = [];

    // 总预约数
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM bookings");
    $stmt->execute();
    $stats['total_bookings'] = $stmt->fetch()['count'];

    // 待确认预约数
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'");
    $stmt->execute();
    $stats['pending_bookings'] = $stmt->fetch()['count'];

    // 已确认预约数
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'");
    $stmt->execute();
    $stats['confirmed_bookings'] = $stmt->fetch()['count'];

    // 总用户数
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users");
    $stmt->execute();
    $stats['total_users'] = $stmt->fetch()['count'];

    // 今日新增预约
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = CURDATE()");
    $stmt->execute();
    $stats['today_bookings'] = $stmt->fetch()['count'];

    // 今日新增用户
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()");
    $stmt->execute();
    $stats['today_users'] = $stmt->fetch()['count'];

    response(true, '获取成功', $stats);

} catch (Exception $e) {
    error_log("获取统计数据失败: " . $e->getMessage());
    response(false, '获取统计数据失败');
}
?> 