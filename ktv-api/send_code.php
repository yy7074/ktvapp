<?php
require_once 'config.php';

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

    // 验证手机号
    if (empty($phone) || !validatePhone($phone)) {
        response(false, '请输入正确的手机号');
    }

    // 检查发送频率限制
    if ($smsConfigExists) {
        $smsService = new AliyunSmsSimple();
        $limitCheck = $smsService->checkSendLimit($phone);
        if (!$limitCheck['allowed']) {
            response(false, $limitCheck['message']);
        }
    } else {
        // 原有的频率检查逻辑
        $stmt = $pdo->prepare("
            SELECT created_at FROM verification_codes 
            WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt->execute([$phone]);
        if ($stmt->fetch()) {
            response(false, '验证码发送过于频繁，请稍后再试');
        }
    }

    // 生成验证码
    if ($smsConfigExists) {
        $code = generateVerificationCode(); // 6位验证码
    } else {
        $code = generateCode(4); // 原有的4位验证码
    }
    
    // 保存验证码到数据库
    if ($smsConfigExists) {
        $saved = saveVerificationCode($phone, $code);
        if (!$saved) {
            response(false, '系统错误，请稍后重试');
        }
    } else {
        // 原有的保存逻辑，使用MySQL时间函数
        $stmt = $pdo->prepare("
            INSERT INTO verification_codes (phone, code, expires_at, created_at) 
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 300 SECOND), NOW())
        ");
        $stmt->execute([$phone, $code]);
    }

    // 发送短信
    if ($smsConfigExists) {
        try {
            $smsService = new AliyunSmsSimple();
            $smsResult = $smsService->sendVerificationCode($phone, $code);
            
            if ($smsResult['success']) {
                // 阿里云短信发送成功
                response(true, '验证码发送成功，请注意查收', [
                    'request_id' => $smsResult['request_id'] ?? null
                ]);
            } else {
                // 短信发送失败，记录错误但不暴露给用户
                error_log("阿里云短信发送失败: " . $smsResult['message']);
                response(false, '验证码发送失败，请稍后重试');
            }
        } catch (Exception $e) {
            // SDK未安装或其他错误，降级到开发模式
            error_log("短信服务异常，降级到开发模式: " . $e->getMessage());
            
            // 开发模式返回验证码
            $responseData = null;
            if ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1') {
                $responseData = ['code' => $code];
            }
            response(true, '验证码发送成功（开发模式）', $responseData);
        }
    } else {
        // 原有的模拟发送逻辑
        error_log("发送验证码到 {$phone}: {$code}");
        
        // 为了方便测试，在开发环境下返回验证码
        $responseData = null;
        if ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1') {
            $responseData = ['code' => $code];
        }
        response(true, '验证码发送成功', $responseData);
    }

} catch (Exception $e) {
    error_log("发送验证码失败: " . $e->getMessage());
    response(false, '发送验证码失败，请稍后重试');
}
?> 