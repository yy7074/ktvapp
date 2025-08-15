<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    if (!$pdo) {
        response(false, '数据库连接失败');
    }

    $data = getPostData();
    
    // 获取参数
    $bookingId = $data['booking_id'] ?? 0;
    $userId = $data['user_id'] ?? 0;
    $userPhone = $data['user_phone'] ?? '';
    
    // 验证参数
    if (!$bookingId) {
        response(false, '缺少预约ID');
    }
    
    if (!$userId && !$userPhone) {
        response(false, '缺少用户标识');
    }
    
    // 查询预约信息
    $sql = "SELECT id, status, user_id, user_phone, booking_time, ktv_name FROM bookings WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();
    
    if (!$booking) {
        response(false, '预约不存在');
    }
    
    // 验证预约归属
    $isOwner = false;
    if ($userId && $booking['user_id'] == $userId) {
        $isOwner = true;
    } elseif ($userPhone && $booking['user_phone'] == $userPhone) {
        $isOwner = true;
    }
    
    if (!$isOwner) {
        response(false, '无权取消此预约');
    }
    
    // 检查预约状态
    if ($booking['status'] === 'cancelled') {
        response(false, '预约已经取消');
    }
    
    if ($booking['status'] === 'completed') {
        response(false, '预约已完成，无法取消');
    }
    
    // 检查预约时间（不能取消已过期的预约）
    if (strtotime($booking['booking_time']) <= time()) {
        response(false, '预约时间已过，无法取消');
    }
    
    // 只有待确认和已确认的预约可以取消
    if (!in_array($booking['status'], ['pending', 'confirmed'])) {
        response(false, '当前状态无法取消');
    }
    
    // 开始事务
    $pdo->beginTransaction();
    
    try {
        // 更新预约状态为已取消
        $updateSql = "UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($updateSql);
        $stmt->execute([$bookingId]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('更新预约状态失败');
        }
        
        // 提交事务
        $pdo->commit();
        
        // 这里可以添加通知商家的逻辑
        // 例如发送短信通知商家用户取消了预约
        
        response(true, '预约已成功取消', [
            'booking_id' => $bookingId,
            'status' => 'cancelled',
            'ktv_name' => $booking['ktv_name'],
            'booking_time' => $booking['booking_time']
        ]);
        
    } catch (Exception $e) {
        // 回滚事务
        $pdo->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("取消预约失败: " . $e->getMessage());
    response(false, '取消预约失败，请稍后重试');
}
?> 