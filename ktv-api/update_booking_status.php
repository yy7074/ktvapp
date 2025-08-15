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

    $data = getPostData();
    $bookingId = $data['booking_id'] ?? 0;
    $status = $data['status'] ?? '';

    // 验证参数
    if (!$bookingId || !$status) {
        response(false, '缺少必需参数');
    }

    // 验证状态值
    $validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!in_array($status, $validStatuses)) {
        response(false, '无效的状态值');
    }

    // 检查预约是否存在
    $stmt = $pdo->prepare("SELECT id, status, user_phone FROM bookings WHERE id = ?");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        response(false, '预约不存在');
    }

    // 更新预约状态
    $stmt = $pdo->prepare("
        UPDATE bookings 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ");
    $stmt->execute([$status, $bookingId]);

    if ($stmt->rowCount() === 0) {
        response(false, '更新失败');
    }

    // 这里可以添加发送通知给用户的逻辑
    // 例如发送短信通知用户预约状态变更
    
    $statusText = [
        'pending' => '待确认',
        'confirmed' => '已确认',
        'completed' => '已完成',
        'cancelled' => '已取消'
    ];

    response(true, "预约状态已更新为：{$statusText[$status]}", [
        'booking_id' => $bookingId,
        'status' => $status,
        'status_text' => $statusText[$status]
    ]);

} catch (Exception $e) {
    error_log("更新预约状态失败: " . $e->getMessage());
    response(false, '更新预约状态失败');
}
?> 