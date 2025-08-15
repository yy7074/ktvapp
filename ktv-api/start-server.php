<?php
// 启动PHP内置服务器脚本
echo "正在启动KTV预约后台服务器...\n";
echo "服务器地址: http://localhost:3000\n";
echo "管理后台: http://localhost:3000/admin/\n";
echo "按 Ctrl+C 停止服务器\n\n";

// 启动内置服务器
$command = 'php -S localhost:3000 -t ' . __DIR__;
passthru($command);
?> 