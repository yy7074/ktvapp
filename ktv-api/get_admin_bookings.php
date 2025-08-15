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

    // 获取分页参数
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 50;
    $status = $_GET['status'] ?? '';
    
    $offset = ($page - 1) * $limit;

    // 构建查询条件
    $whereClause = '';
    $params = [];
    
    if (!empty($status)) {
        $whereClause = 'WHERE status = ?';
        $params[] = $status;
    }

    // 获取预约列表
    $sql = "
        SELECT 
            b.id,
            b.user_phone,
            b.ktv_name,
            b.booking_time,
            b.room_type,
            b.people_count,
            b.remark,
            b.status,
            b.created_at,
            b.updated_at,
            u.nickname as user_nickname
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        {$whereClause}
        ORDER BY b.created_at DESC
        LIMIT {$limit} OFFSET {$offset}
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();

    // 获取总数
    $countSql = "SELECT COUNT(*) as total FROM bookings b {$whereClause}";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = $countStmt->fetch()['total'];

    response(true, '获取成功', $bookings, [
        'total' => (int)$total,
        'page' => (int)$page,
        'limit' => (int)$limit,
        'pages' => ceil($total / $limit)
    ]);

} catch (Exception $e) {
    error_log("获取预约列表失败: " . $e->getMessage());
    response(false, '获取预约列表失败');
}
?> 