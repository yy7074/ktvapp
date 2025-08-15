<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    if (!$pdo) {
        response(false, '数据库连接失败');
    }

    // 验证管理员权限
    $token = getBearerToken();
    if (!$token) {
        response(false, '未提供认证token', null, 401);
    }

    $adminId = validateToken($token);
    if (!$adminId) {
        response(false, '无效的token', null, 401);
    }

    $data = getPostData();

    // 验证必填字段
    $required = ['name', 'address', 'latitude', 'longitude'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            response(false, "缺少必填字段: {$field}");
        }
    }

    // 验证坐标范围
    $latitude = floatval($data['latitude']);
    $longitude = floatval($data['longitude']);
    
    if ($latitude < -90 || $latitude > 90) {
        response(false, '纬度范围应在-90到90之间');
    }
    
    if ($longitude < -180 || $longitude > 180) {
        response(false, '经度范围应在-180到180之间');
    }

    // 验证评分
    $rating = isset($data['rating']) ? floatval($data['rating']) : 4.5;
    if ($rating < 0 || $rating > 5) {
        response(false, '评分范围应在0到5之间');
    }

    // 验证状态
    $status = isset($data['status']) ? $data['status'] : 'active';
    if (!in_array($status, ['active', 'inactive'])) {
        response(false, '状态值无效');
    }

    // 检查店铺名称是否重复
    $stmt = $pdo->prepare("SELECT id FROM ktv_venues WHERE name = ?");
    $stmt->execute([$data['name']]);
    if ($stmt->fetch()) {
        response(false, '店铺名称已存在');
    }

    // 插入KTV店铺数据
    $stmt = $pdo->prepare("
        INSERT INTO ktv_venues (
            name, address, latitude, longitude, 
            phone, rating, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $result = $stmt->execute([
        $data['name'],
        $data['address'],
        $latitude,
        $longitude,
        $data['phone'] ?? null,
        $rating,
        $status
    ]);

    if ($result) {
        $ktvId = $pdo->lastInsertId();
        
        // 记录操作日志
        error_log("管理员 {$adminId} 添加了KTV店铺: {$data['name']} (ID: {$ktvId})");
        
        response(true, 'KTV店铺添加成功', [
            'id' => $ktvId,
            'name' => $data['name']
        ]);
    } else {
        response(false, '添加失败，请稍后重试');
    }

} catch (Exception $e) {
    error_log("添加KTV店铺失败: " . $e->getMessage());
    response(false, '系统错误，请稍后重试');
}
?> 