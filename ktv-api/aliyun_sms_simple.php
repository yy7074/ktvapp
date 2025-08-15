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

class AliyunSmsSimple {
    private $accessKeyId;
    private $accessKeySecret;
    private $endpoint = 'https://dysmsapi.aliyuncs.com';
    
    public function __construct() {
        $this->accessKeyId = ALIYUN_ACCESS_KEY_ID;
        $this->accessKeySecret = ALIYUN_ACCESS_KEY_SECRET;
    }
    
    /**
     * 发送验证码短信
     */
    public function sendVerificationCode($phone, $code) {
        $params = [
            'Action' => 'SendSms',
            'Version' => '2017-05-25',
            'RegionId' => ALIYUN_SMS_REGION,
            'PhoneNumbers' => $phone,
            'SignName' => ALIYUN_SMS_SIGN_NAME,
            'TemplateCode' => ALIYUN_SMS_TEMPLATE_CODE,
            'TemplateParam' => json_encode(['code' => $code]),
            'Format' => 'JSON',
            'Timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
            'SignatureMethod' => 'HMAC-SHA1',
            'SignatureVersion' => '1.0',
            'SignatureNonce' => uniqid(),
            'AccessKeyId' => $this->accessKeyId
        ];
        
        // 生成签名
        $signature = $this->generateSignature($params, 'POST');
        $params['Signature'] = $signature;
        
        // 发送HTTP请求
        $response = $this->httpPost($this->endpoint, $params);
        
        if ($response) {
            $result = json_decode($response, true);
            
            if (isset($result['Code']) && $result['Code'] === 'OK') {
                return [
                    'success' => true,
                    'message' => '短信发送成功',
                    'request_id' => $result['RequestId'] ?? null
                ];
            } else {
                return [
                    'success' => false,
                    'message' => '短信发送失败: ' . ($result['Message'] ?? 'Unknown error'),
                    'code' => $result['Code'] ?? 'Unknown'
                ];
            }
        } else {
            return [
                'success' => false,
                'message' => '网络请求失败'
            ];
        }
    }
    
    /**
     * 生成阿里云API签名
     */
    private function generateSignature($params, $method) {
        ksort($params);
        
        $queryString = '';
        foreach ($params as $key => $value) {
            if ($queryString) $queryString .= '&';
            $queryString .= $this->percentEncode($key) . '=' . $this->percentEncode($value);
        }
        
        $stringToSign = $method . '&' . $this->percentEncode('/') . '&' . $this->percentEncode($queryString);
        
        return base64_encode(hash_hmac('sha1', $stringToSign, $this->accessKeySecret . '&', true));
    }
    
    /**
     * URL编码
     */
    private function percentEncode($str) {
        $res = urlencode($str);
        $res = str_replace(['+', '*'], ['%20', '%2A'], $res);
        $res = preg_replace('/%7E/', '~', $res);
        return $res;
    }
    
    /**
     * 发送HTTP POST请求
     */
    private function httpPost($url, $params) {
        $postData = http_build_query($params);
        
        $options = [
            'http' => [
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'method' => 'POST',
                'content' => $postData,
                'timeout' => 30
            ]
        ];
        
        $context = stream_context_create($options);
        $result = file_get_contents($url, false, $context);
        
        return $result;
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
 * 生成4位数字验证码
 */
function generateVerificationCode() {
    return str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
}

/**
 * 保存验证码到数据库
 */
function saveVerificationCode($phone, $code) {
    global $pdo;
    
    try {
        // 使用MySQL的时间函数来保证时区一致性
        $stmt = $pdo->prepare("
            INSERT INTO verification_codes (phone, code, expires_at, created_at) 
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), NOW())
        ");
        
        return $stmt->execute([$phone, $code, SMS_CODE_EXPIRE_TIME]);
        
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