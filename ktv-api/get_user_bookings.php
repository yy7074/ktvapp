<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    if (!$pdo) {
        response(false, '数据库连接失败');
    }

    // 获取用户ID（从请求参数或token中）
    $userId = $_GET['user_id'] ?? 0;
    $userPhone = $_GET['user_phone'] ?? '';
    
    // 验证参数
    if (!$userId && !$userPhone) {
        response(false, '缺少用户标识参数');
    }
    
    // 构建查询条件
    $whereClause = '';
    $params = [];
    
    if ($userId) {
        $whereClause = 'WHERE user_id = ?';
        $params[] = $userId;
    } else {
        $whereClause = 'WHERE user_phone = ?';
        $params[] = $userPhone;
    }
    
    // 获取用户的预约列表
    $sql = "
        SELECT 
            id,
            ktv_id,
            ktv_name,
            user_id,
            user_phone,
            booking_time,
            room_type,
            people_count,
            remark,
            status,
            created_at,
            updated_at
        FROM bookings 
        {$whereClause}
        ORDER BY created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();
    
    // 格式化数据
    foreach ($bookings as &$booking) {
        $booking['id'] = intval($booking['id']);
        $booking['ktv_id'] = intval($booking['ktv_id']);
        $booking['user_id'] = intval($booking['user_id']);
        $booking['created_at_formatted'] = date('Y-m-d H:i:s', strtotime($booking['created_at']));
        $booking['booking_time_formatted'] = date('Y-m-d H:i', strtotime($booking['booking_time']));
        
        // 状态文本
        $statusMap = [
            'pending' => '待确认',
            'confirmed' => '已确认',
            'completed' => '已完成',
            'cancelled' => '已取消'
        ];
        $booking['status_text'] = $statusMap[$booking['status']] ?? '未知';
        
        // 是否可以取消（只有待确认和已确认的预约可以取消，且预约时间未过期）
        $booking['can_cancel'] = in_array($booking['status'], ['pending', 'confirmed']) 
            && strtotime($booking['booking_time']) > time();
    }
    
    response(true, '获取预约列表成功', [
        'bookings' => $bookings,
        'total' => count($bookings)
    ]);
    
} catch (Exception $e) {
    error_log("获取用户预约列表失败: " . $e->getMessage());
    response(false, '获取预约列表失败');
}
?> 