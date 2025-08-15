<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    if (!$pdo) {
        response(false, '数据库连接失败');
    }

    $data = getPostData();
    
    // 获取必需参数
    $ktvId = $data['ktv_id'] ?? 0;
    $ktvName = $data['ktv_name'] ?? '';
    $userId = $data['user_id'] ?? 0;
    $userPhone = $data['user_phone'] ?? '';
    $bookingTime = $data['booking_time'] ?? '';
    $roomType = $data['room_type'] ?? '';
    $peopleCount = $data['people_count'] ?? '';
    $remark = $data['remark'] ?? '';

    // 验证必需参数
    if (!$ktvId || !$userId || !$userPhone || !$bookingTime || !$roomType || !$peopleCount) {
        response(false, '缺少必需参数');
    }

    // 验证手机号
    if (!validatePhone($userPhone)) {
        response(false, '手机号格式不正确');
    }

    // 验证KTV是否存在
    $stmt = $pdo->prepare("SELECT id, name FROM ktv_venues WHERE id = ? AND status = 'active'");
    $stmt->execute([$ktvId]);
    $ktv = $stmt->fetch();
    
    if (!$ktv) {
        response(false, 'KTV不存在或已停业');
    }

    // 验证用户是否存在
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    if (!$stmt->fetch()) {
        response(false, '用户不存在');
    }

    // 检查是否有重复预约 (同一用户在同一时间段的预约)
    $stmt = $pdo->prepare("
        SELECT id FROM bookings 
        WHERE user_id = ? AND booking_time = ? AND status IN ('pending', 'confirmed')
    ");
    $stmt->execute([$userId, $bookingTime]);
    if ($stmt->fetch()) {
        response(false, '该时间段已有预约，请选择其他时间');
    }

    // 开始事务
    $pdo->beginTransaction();

    try {
        // 创建预约记录
        $stmt = $pdo->prepare("
            INSERT INTO bookings (
                user_id, ktv_id, ktv_name, user_phone, 
                booking_time, room_type, people_count, remark, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        
        $stmt->execute([
            $userId, $ktvId, $ktvName ?: $ktv['name'], $userPhone,
            $bookingTime, $roomType, $peopleCount, $remark
        ]);
        
        $bookingId = $pdo->lastInsertId();

        // 提交事务
        $pdo->commit();

        // 这里可以添加发送通知给商家的逻辑
        // 例如发送短信、邮件或推送通知
        
        response(true, '预约成功，客服将尽快联系您', [
            'booking_id' => $bookingId,
            'status' => 'pending'
        ]);

    } catch (Exception $e) {
        // 回滚事务
        $pdo->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log("创建预约失败: " . $e->getMessage());
    response(false, '预约失败，请稍后重试');
}
?> 