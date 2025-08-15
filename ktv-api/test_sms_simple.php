<?php
require_once 'config.php';
require_once 'aliyun_sms_simple.php';

// 测试手机号（请替换为真实的手机号进行测试）
$testPhone = '18663764585';

echo "=== 阿里云短信服务测试（简化版）===\n";
echo "测试手机号: {$testPhone}\n";
echo "短信签名: " . ALIYUN_SMS_SIGN_NAME . "\n";
echo "短信模板: " . ALIYUN_SMS_TEMPLATE_CODE . "\n";
echo "========================\n\n";

try {
    // 初始化数据库连接
    $pdo = getConnection();
    if (!$pdo) {
        die("数据库连接失败\n");
    }
    
    // 创建短信服务实例
    $smsService = new AliyunSmsSimple();
    echo "✅ 阿里云短信客户端初始化成功\n";
    
    // 检查发送限制
    $limitCheck = $smsService->checkSendLimit($testPhone);
    if (!$limitCheck['allowed']) {
        echo "⚠️  发送限制: " . $limitCheck['message'] . "\n";
        exit;
    }
    echo "✅ 发送频率检查通过\n";
    
    // 生成验证码
    $code = generateVerificationCode();
    echo "📱 生成验证码: {$code}\n";
    
    // 保存验证码到数据库
    if (!saveVerificationCode($testPhone, $code)) {
        echo "❌ 保存验证码到数据库失败\n";
        exit;
    }
    echo "✅ 验证码已保存到数据库\n";
    
    // 发送短信
    echo "📤 正在发送短信...\n";
    $result = $smsService->sendVerificationCode($testPhone, $code);
    
    if ($result['success']) {
        echo "✅ 短信发送成功!\n";
        echo "   RequestId: " . ($result['request_id'] ?? 'N/A') . "\n";
        echo "   消息: " . $result['message'] . "\n";
        
        // 测试验证码验证
        echo "\n--- 测试验证码验证 ---\n";
        if (verifyCode($testPhone, $code)) {
            echo "✅ 验证码验证成功\n";
        } else {
            echo "❌ 验证码验证失败\n";
        }
        
    } else {
        echo "❌ 短信发送失败!\n";
        echo "   错误: " . $result['message'] . "\n";
        if (isset($result['code'])) {
            echo "   错误代码: " . $result['code'] . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ 测试失败: " . $e->getMessage() . "\n";
    echo "错误详情: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=== 测试完成 ===\n";
?> 