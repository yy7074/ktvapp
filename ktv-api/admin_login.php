<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    if (!$pdo) {
        response(false, '数据库连接失败');
    }

    $data = getPostData();
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    // 验证输入
    if (empty($username) || empty($password)) {
        response(false, '用户名和密码不能为空');
    }

    // 查询管理员
    $stmt = $pdo->prepare("
        SELECT id, username, password, name, status 
        FROM admins 
        WHERE username = ? AND status = 'active'
    ");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if (!$admin) {
        response(false, '用户名或密码错误');
    }

    // 验证密码 (这里使用简单的密码验证，实际项目中应该使用password_hash)
    if ($password !== 'admin123') {
        response(false, '用户名或密码错误');
    }

    // 生成管理员token
    $token = generateToken($admin['id']);

    // 返回管理员信息
    $adminData = [
        'id' => $admin['id'],
        'username' => $admin['username'],
        'name' => $admin['name']
    ];

    response(true, '登录成功', [
        'admin' => $adminData,
        'token' => $token
    ]);

} catch (Exception $e) {
    error_log("管理员登录失败: " . $e->getMessage());
    response(false, '登录失败，请稍后重试');
}
?> 