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
    $required = ['id', 'name', 'address', 'latitude', 'longitude'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            response(false, "缺少必填字段: {$field}");
        }
    }

    $ktvId = intval($data['id']);
    
    // 检查KTV是否存在
    $stmt = $pdo->prepare("SELECT id, name FROM ktv_venues WHERE id = ?");
    $stmt->execute([$ktvId]);
    $existingKtv = $stmt->fetch();
    
    if (!$existingKtv) {
        response(false, 'KTV店铺不存在');
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

    // 检查店铺名称是否与其他店铺重复（排除自己）
    $stmt = $pdo->prepare("SELECT id FROM ktv_venues WHERE name = ? AND id != ?");
    $stmt->execute([$data['name'], $ktvId]);
    if ($stmt->fetch()) {
        response(false, '店铺名称已被其他店铺使用');
    }

    // 更新KTV店铺数据
    $stmt = $pdo->prepare("
        UPDATE ktv_venues SET 
            name = ?, 
            address = ?, 
            latitude = ?, 
            longitude = ?, 
            phone = ?, 
            rating = ?, 
            status = ?, 
            updated_at = NOW()
        WHERE id = ?
    ");

    $result = $stmt->execute([
        $data['name'],
        $data['address'],
        $latitude,
        $longitude,
        $data['phone'] ?? null,
        $rating,
        $status,
        $ktvId
    ]);

    if ($result) {
        // 记录操作日志
        error_log("管理员 {$adminId} 更新了KTV店铺: {$data['name']} (ID: {$ktvId})");
        
        response(true, 'KTV店铺更新成功', [
            'id' => $ktvId,
            'name' => $data['name']
        ]);
    } else {
        response(false, '更新失败，请稍后重试');
    }

} catch (Exception $e) {
    error_log("更新KTV店铺失败: " . $e->getMessage());
    response(false, '系统错误，请稍后重试');
}
?> 