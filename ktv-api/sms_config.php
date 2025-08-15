<?php
// 阿里云短信服务配置
define('ALIYUN_ACCESS_KEY_ID', 'LTAI5tAgxEfwZrWw1sSpm9qF');
define('ALIYUN_ACCESS_KEY_SECRET', 'WpZgkZH9eNLdtc7deUiGzU7gqp5uRK');
define('ALIYUN_SMS_REGION', 'cn-hangzhou');
define('ALIYUN_SMS_SIGN_NAME', '大潮网络');
define('ALIYUN_SMS_TEMPLATE_CODE', 'SMS_474780238');

// 短信发送限制配置
define('SMS_CODE_EXPIRE_TIME', 300); // 验证码有效期5分钟
define('SMS_SEND_INTERVAL', 60);     // 发送间隔60秒
define('SMS_DAILY_LIMIT', 10);       // 每日发送限制10条

class AliyunSmsService {
    private $client;
    
    public function __construct() {
        // 检查是否加载了composer autoload
        if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
            throw new Exception('请先安装阿里云短信SDK: composer install');
        }
        
        require_once __DIR__ . '/vendor/autoload.php';
        
        try {
            // 创建短信客户端
            $config = new \AlibabaCloud\SDK\Dysmsapi\V20170525\Models\Config([
                'accessKeyId' => ALIYUN_ACCESS_KEY_ID,
                'accessKeySecret' => ALIYUN_ACCESS_KEY_SECRET,
                'regionId' => ALIYUN_SMS_REGION,
                'endpoint' => 'dysmsapi.aliyuncs.com'
            ]);
            
            $this->client = new \AlibabaCloud\SDK\Dysmsapi\V20170525\Dysmsapi($config);
        } catch (Exception $e) {
            error_log("阿里云短信客户端初始化失败: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * 发送验证码短信
     */
    public function sendVerificationCode($phone, $code) {
        try {
            $request = new \AlibabaCloud\SDK\Dysmsapi\V20170525\Models\SendSmsRequest([
                'phoneNumbers' => $phone,
                'signName' => ALIYUN_SMS_SIGN_NAME,
                'templateCode' => ALIYUN_SMS_TEMPLATE_CODE,
                'templateParam' => json_encode(['code' => $code])
            ]);
            
            $response = $this->client->sendSms($request);
            
            if ($response->body->code === 'OK') {
                return [
                    'success' => true,
                    'message' => '短信发送成功',
                    'request_id' => $response->body->requestId
                ];
            } else {
                return [
                    'success' => false,
                    'message' => '短信发送失败: ' . $response->body->message,
                    'code' => $response->body->code
                ];
            }
            
        } catch (Exception $e) {
            error_log("发送短信异常: " . $e->getMessage());
            return [
                'success' => false,
                'message' => '短信发送异常: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * 检查发送频率限制
     */
    public function checkSendLimit($phone) {
        global $pdo;
        
        try {
            // 检查60秒内是否已发送
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM verification_codes 
                WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
            ");
            $stmt->execute([$phone, SMS_SEND_INTERVAL]);
            $recent = $stmt->fetch();
            
            if ($recent['count'] > 0) {
                return [
                    'allowed' => false,
                    'message' => '发送过于频繁，请' . SMS_SEND_INTERVAL . '秒后再试'
                ];
            }
            
            // 检查今日发送次数
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM verification_codes 
                WHERE phone = ? AND DATE(created_at) = CURDATE()
            ");
            $stmt->execute([$phone]);
            $daily = $stmt->fetch();
            
            if ($daily['count'] >= SMS_DAILY_LIMIT) {
                return [
                    'allowed' => false,
                    'message' => '今日发送次数已达上限'
                ];
            }
            
            return ['allowed' => true];
            
        } catch (Exception $e) {
            error_log("检查发送限制失败: " . $e->getMessage());
            return [
                'allowed' => false,
                'message' => '系统错误'
            ];
        }
    }
}

/**
 * 生成6位数字验证码
 */
function generateVerificationCode() {
    return str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
}

/**
 * 保存验证码到数据库
 */
function saveVerificationCode($phone, $code) {
    global $pdo;
    
    try {
        // 设置过期时间
        $expiresAt = date('Y-m-d H:i:s', time() + SMS_CODE_EXPIRE_TIME);
        
        $stmt = $pdo->prepare("
            INSERT INTO verification_codes (phone, code, expires_at, created_at) 
            VALUES (?, ?, ?, NOW())
        ");
        
        return $stmt->execute([$phone, $code, $expiresAt]);
        
    } catch (Exception $e) {
        error_log("保存验证码失败: " . $e->getMessage());
        return false;
    }
}

/**
 * 验证验证码
 */
function verifyCode($phone, $code) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM verification_codes 
            WHERE phone = ? AND code = ? AND used = 0 AND expires_at > NOW() 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$phone, $code]);
        $result = $stmt->fetch();
        
        if ($result) {
            // 标记验证码为已使用
            $updateStmt = $pdo->prepare("UPDATE verification_codes SET used = 1 WHERE id = ?");
            $updateStmt->execute([$result['id']]);
            
            return true;
        }
        
        return false;
        
    } catch (Exception $e) {
        error_log("验证验证码失败: " . $e->getMessage());
        return false;
    }
}
?> 