<?php
// 简易 .env 加载器：读取 ktv-api/.env 到环境变量

if (!function_exists('loadEnvFile')) {
    function loadEnvFile($filePath)
    {
        if (!file_exists($filePath)) {
            return;
        }
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || $trimmed[0] === '#') {
                continue;
            }
            $pos = strpos($trimmed, '=');
            if ($pos === false) {
                continue;
            }
            $name = trim(substr($trimmed, 0, $pos));
            $value = trim(substr($trimmed, $pos + 1));
            // 去掉包裹引号
            if (strlen($value) >= 2) {
                $first = $value[0];
                $last = substr($value, -1);
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

if (!getenv('APP_ENV_LOADED')) {
    loadEnvFile(__DIR__ . '/.env');
    putenv('APP_ENV_LOADED=1');
}

if (!function_exists('envValue')) {
    function envValue($key, $default = null)
    {
        $val = getenv($key);
        return $val !== false ? $val : $default;
    }
}
?>


