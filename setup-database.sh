#!/bin/bash

echo "🗄️  初始化KTV预约数据库"
echo "================================"
echo "📋 正在创建数据库和表结构..."
echo ""

# 使用用户提供的密码初始化数据库
mysql -u root -p123456 < ktv-api/init_db.sql

if [ $? -eq 0 ]; then
    echo "✅ 数据库初始化成功！"
    echo ""
    echo "📊 数据库信息:"
    echo "   数据库名: ktv_booking"
    echo "   用户名: root"
    echo "   密码: 123456"
    echo "   主机: localhost"
    echo ""
    echo "🎯 下一步: 运行 ./start-backend.sh 启动后端服务"
else
    echo "❌ 数据库初始化失败！"
    echo "请检查MySQL服务是否运行，密码是否正确"
    echo ""
    echo "🔧 故障排除:"
    echo "   1. 检查MySQL服务: brew services list | grep mysql"
    echo "   2. 启动MySQL: brew services start mysql"
    echo "   3. 测试连接: mysql -u root -p123456"
fi 