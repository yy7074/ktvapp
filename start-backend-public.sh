#!/bin/bash

echo "🚀 启动KTV预约后台系统（公网访问模式）"
echo "================================"
echo "📍 本地地址: http://localhost:3000"
echo "🌐 域名地址: http://catdog.dachaonet.com"
echo "🔧 管理后台: http://catdog.dachaonet.com/admin/"
echo "👤 管理员账号: admin / admin123"
echo "================================"
echo "⚠️  请确保域名 catdog.dachaonet.com 已解析到您的公网IP"
echo "⚠️  如果在局域网内测试，请将域名解析到本机内网IP"
echo "================================"
echo ""

cd ktv-api
# 监听所有网络接口的3000端口，允许外部访问
php -S 0.0.0.0:3000 