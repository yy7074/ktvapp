<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    if (!$pdo) {
        response(false, '数据库连接失败');
    }

    $data = getPostData();
    
    // 获取参数
    $userPhone = $data['user_phone'] ?? '';
    $userName = $data['user_name'] ?? '';
    $bookingTime = $data['booking_time'] ?? '';
    $latitude = $data['latitude'] ?? '';
    $longitude = $data['longitude'] ?? '';
    $remark = $data['remark'] ?? '';

    // 验证必需参数
    if (!$userPhone || !$userName) {
        response(false, '缺少必需参数');
    }

    // 验证手机号
    if (!validatePhone($userPhone)) {
        response(false, '手机号格式不正确');
    }

    // 查找用户ID（基于手机号）
    $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
    $stmt->execute([$userPhone]);
    $user = $stmt->fetch();
    
    if (!$user) {
        response(false, '用户不存在，请先登录');
    }
    
    $userId = $user['id'];

    // 如果有位置信息，找到最近的KTV
    $ktvId = null;
    $ktvName = '';
    
    if ($latitude && $longitude) {
        // 查找最近的活跃KTV
        $stmt = $pdo->prepare("
            SELECT id, name, 
            (6371000 * acos(
                cos(radians(?)) * cos(radians(latitude)) * 
                cos(radians(longitude) - radians(?)) + 
                sin(radians(?)) * sin(radians(latitude))
            )) AS distance
            FROM ktv_venues 
            WHERE status = 'active'
            ORDER BY distance ASC
            LIMIT 1
        ");
        $stmt->execute([$latitude, $longitude, $latitude]);
        $nearestKtv = $stmt->fetch();
        
        if ($nearestKtv) {
            $ktvId = $nearestKtv['id'];
            $ktvName = $nearestKtv['name'];
        }
    }
    
    // 如果没有找到具体KTV，使用默认KTV（ID=1）
    if (!$ktvId) {
        $stmt = $pdo->prepare("SELECT id, name FROM ktv_venues WHERE status = 'active' LIMIT 1");
        $stmt->execute();
        $defaultKtv = $stmt->fetch();
        
        if ($defaultKtv) {
            $ktvId = $defaultKtv['id'];
            $ktvName = $defaultKtv['name'];
        } else {
            response(false, '暂无可用KTV，请稍后再试');
        }
    }

    // 开始事务
    $pdo->beginTransaction();

    try {
        // 创建快速预约记录
        $stmt = $pdo->prepare("
            INSERT INTO bookings (
                user_id, ktv_id, ktv_name, user_phone, 
                booking_time, room_type, people_count, remark, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        
        $stmt->execute([
            $userId, 
            $ktvId, 
            $ktvName,
            $userPhone,
            $bookingTime ?: date('Y-m-d H:i:s'),
            '标准包厢', // 默认房型
            '2-6人', // 默认人数
            $remark
        ]);
        
        $bookingId = $pdo->lastInsertId();

        // 提交事务
        $pdo->commit();

        response(true, '预约提交成功，客服将尽快联系您确认', [
            'booking_id' => $bookingId,
            'ktv_name' => $ktvName,
            'status' => 'pending'
        ]);

    } catch (Exception $e) {
        // 回滚事务
        $pdo->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log("快速预约失败: " . $e->getMessage());
    response(false, '预约失败，请稍后重试');
}
?>