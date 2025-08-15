<?php
require_once 'config.php';

// 验证管理员token
$token = validateAdminToken();
if (!$token) {
    response(false, '未授权访问', null, 401);
}

$pdo = getConnection();
if (!$pdo) {
    response(false, '数据库连接失败');
}

try {
    // 获取分页参数
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 20;
    $offset = ($page - 1) * $limit;
    
    // 获取搜索参数
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    
    // 构建查询条件
    $whereClause = '';
    $params = [];
    
    if (!empty($search)) {
        $whereClause = 'WHERE phone LIKE ?';
        $params[] = '%' . $search . '%';
    }
    
    // 获取总数
    $countSql = "SELECT COUNT(*) as total FROM users $whereClause";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = $countStmt->fetch()['total'];
    
    // 获取用户列表
    $sql = "
        SELECT 
            id,
            phone,
            created_at,
            (SELECT COUNT(*) FROM bookings WHERE user_id = users.id) as booking_count,
            (SELECT MAX(created_at) FROM bookings WHERE user_id = users.id) as last_booking_time
        FROM users 
        $whereClause
        ORDER BY created_at DESC 
        LIMIT $limit OFFSET $offset
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();
    
    // 格式化数据
    foreach ($users as &$user) {
        $user['created_at_formatted'] = date('Y-m-d H:i:s', strtotime($user['created_at']));
        $user['last_booking_time_formatted'] = $user['last_booking_time'] 
            ? date('Y-m-d H:i:s', strtotime($user['last_booking_time']))
            : '无';
    }
    
    response(true, '获取用户列表成功', [
        'users' => $users,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => ceil($total / $limit),
            'total_records' => intval($total),
            'per_page' => $limit
        ]
    ]);
    
} catch (Exception $e) {
    error_log("获取用户列表失败: " . $e->getMessage());
    response(false, '获取用户列表失败');
}
?> 