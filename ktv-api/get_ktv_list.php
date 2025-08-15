<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    if (!$pdo) {
        response(false, '数据库连接失败');
    }

    $latitude = $_GET['latitude'] ?? 0;
    $longitude = $_GET['longitude'] ?? 0;
    $radius = $_GET['radius'] ?? 5000; // 默认5公里

    // 基础查询
    $sql = "
        SELECT 
            id,
            name,
            address,
            latitude,
            longitude,
            phone,
            rating,
            status
        FROM ktv_venues 
        WHERE status = 'active'
    ";
    
    $params = [];
    
    // 如果提供了位置信息，计算距离并排序
    if ($latitude && $longitude) {
        $sql = "
            SELECT 
                id,
                name,
                address,
                latitude,
                longitude,
                phone,
                rating,
                status,
                (6371000 * acos(
                    cos(radians(?)) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(latitude))
                )) AS distance
            FROM ktv_venues 
            WHERE status = 'active'
            HAVING distance <= ?
            ORDER BY distance ASC
        ";
        $params = [$latitude, $longitude, $latitude, $radius];
    } else {
        $sql .= " ORDER BY rating DESC, id ASC";
    }
    
    $sql .= " LIMIT 50";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $venues = $stmt->fetchAll();

    // 格式化数据
    $result = [];
    foreach ($venues as $venue) {
        $item = [
            'id' => (int)$venue['id'],
            'name' => $venue['name'],
            'address' => $venue['address'],
            'phone' => $venue['phone'],
            'rating' => (float)$venue['rating']
        ];
        
        if (isset($venue['distance'])) {
            $distanceInMeters = (int)$venue['distance'];
            if ($distanceInMeters < 1000) {
                $item['distance'] = $distanceInMeters . 'm';
            } else {
                $item['distance'] = round($distanceInMeters / 1000, 1) . 'km';
            }
            $item['distance_value'] = $distanceInMeters; // 用于排序的原始值
        } else {
            $item['distance'] = '距离未知';
        }
        
        $result[] = $item;
    }

    response(true, '获取成功', $result);

} catch (Exception $e) {
    error_log("获取KTV列表失败: " . $e->getMessage());
    response(false, '获取KTV列表失败');
}
?> 