<?php
require_once 'config.php';
require_once __DIR__ . '/env.php';

// 尝试加载短信配置（如果存在）
$smsConfigExists = false;
if (file_exists('aliyun_sms_simple.php')) {
    require_once 'aliyun_sms_simple.php';
    $smsConfigExists = true;
}

try {
    $pdo = getConnection();
    if (!$pdo) {
        response(false, '数据库连接失败');
    }

    $data = getPostData();
    $phone = $data['phone'] ?? '';
    $code = $data['code'] ?? '';

    // 验证输入
    if (empty($phone) || !validatePhone($phone)) {
        response(false, '请输入正确的手机号');
    }

    if (empty($code)) {
        response(false, '请输入验证码');
    }

    // 验证验证码
    $fixedCode = envValue('SMS_FIXED_CODE', '');
    if (!empty($fixedCode)) {
        if ($code !== $fixedCode) {
            response(false, '验证码错误');
        }
    } else if ($smsConfigExists) {
        // 使用新的验证码验证函数
        if (!verifyCode($phone, $code)) {
            response(false, '验证码错误或已过期');
        }
    } else {
        // 原有的验证码验证逻辑
        $stmt = $pdo->prepare("
            SELECT id, code, used FROM verification_codes 
            WHERE phone = ? AND expires_at > NOW() 
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt->execute([$phone]);
        $verificationCode = $stmt->fetch();

        if (!$verificationCode) {
            response(false, '验证码已过期，请重新获取');
        }

        if ($verificationCode['used']) {
            response(false, '验证码已使用，请重新获取');
        }

        if ($verificationCode['code'] !== $code) {
            response(false, '验证码错误');
        }

        // 标记验证码为已使用
        $stmt = $pdo->prepare("UPDATE verification_codes SET used = 1 WHERE id = ?");
        $stmt->execute([$verificationCode['id']]);
    }

    // 查找或创建用户
    $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ?");
    $stmt->execute([$phone]);
    $user = $stmt->fetch();

    if (!$user) {
        // 创建新用户
        $nickname = '用户' . substr($phone, -4);
        $stmt = $pdo->prepare("
            INSERT INTO users (phone, nickname) VALUES (?, ?)
        ");
        $stmt->execute([$phone, $nickname]);
        $userId = $pdo->lastInsertId();

        // 获取新创建的用户信息
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
    }

    // 生成token
    $token = generateToken($user['id']);

    // 返回用户信息
    $userData = [
        'id' => $user['id'],
        'phone' => $user['phone'],
        'nickname' => $user['nickname'],
        'avatar' => $user['avatar'],
        'vip_level' => $user['vip_level']
    ];

    response(true, '登录成功', [
        'user' => $userData,
        'token' => $token
    ]);

} catch (Exception $e) {
    error_log("登录失败: " . $e->getMessage());
    response(false, '登录失败，请稍后重试');
}
?> 