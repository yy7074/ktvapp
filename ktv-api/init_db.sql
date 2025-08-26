-- 创建数据库
CREATE DATABASE IF NOT EXISTS ktv_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ktv_booking;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(11) UNIQUE NOT NULL COMMENT '手机号',
    nickname VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    avatar VARCHAR(255) DEFAULT NULL COMMENT '头像',
    vip_level INT DEFAULT 0 COMMENT 'VIP等级',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(11) NOT NULL COMMENT '手机号',
    code VARCHAR(6) NOT NULL COMMENT '验证码',
    type ENUM('login', 'register') DEFAULT 'login' COMMENT '验证码类型',
    used TINYINT(1) DEFAULT 0 COMMENT '是否已使用',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='验证码表';

-- KTV商家表
CREATE TABLE IF NOT EXISTS ktv_venues (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '商家名称',
    address VARCHAR(255) NOT NULL COMMENT '地址',
    latitude DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
    longitude DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
    phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    rating DECIMAL(3,1) DEFAULT 0.0 COMMENT '评分',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='KTV商家表';

-- 包厢类型表
CREATE TABLE IF NOT EXISTS room_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ktv_id INT NOT NULL COMMENT 'KTV商家ID',
    name VARCHAR(50) NOT NULL COMMENT '包厢类型名称',
    capacity VARCHAR(20) NOT NULL COMMENT '容纳人数',
    price DECIMAL(10,2) DEFAULT 0.00 COMMENT '价格',
    description TEXT DEFAULT NULL COMMENT '描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ktv_id) REFERENCES ktv_venues(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='包厢类型表';

-- 预约表
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    ktv_id INT NOT NULL COMMENT 'KTV商家ID',
    ktv_name VARCHAR(100) NOT NULL COMMENT 'KTV名称',
    user_phone VARCHAR(11) NOT NULL COMMENT '用户手机号',
    booking_time VARCHAR(50) NOT NULL COMMENT '预约时间',
    room_type VARCHAR(50) NOT NULL COMMENT '包厢类型',
    people_count VARCHAR(20) NOT NULL COMMENT '人数',
    remark TEXT DEFAULT NULL COMMENT '备注',
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ktv_id) REFERENCES ktv_venues(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约表';

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 插入示例数据
INSERT INTO ktv_venues (name, address, latitude, longitude, phone, rating) VALUES
('星光KTV', '北京市朝阳区三里屯路123号', 39.936404, 116.446324, '010-12345678', 4.8),
('欢乐颂KTV', '北京市海淀区中关村大街456号', 39.982171, 116.308479, '010-87654321', 4.6),
('金麦克KTV', '北京市西城区西单北大街789号', 39.913908, 116.374981, '010-11223344', 4.9),
('麦乐迪KTV', '北京市东城区王府井大街321号', 39.914000, 116.407000, '010-55667788', 4.7),
('好声音KTV', '北京市丰台区方庄路654号', 39.865000, 116.420000, '010-99887766', 4.5),
('唱吧KTV', '北京市昌平区回龙观大街888号', 40.070000, 116.330000, '010-33445566', 4.4),
('音乐时光KTV', '北京市大兴区亦庄开发区999号', 39.795000, 116.520000, '010-77889900', 4.6),
('梦想KTV', '北京市石景山区石景山路111号', 39.905000, 116.220000, '010-11335577', 4.8);

INSERT INTO room_types (ktv_id, name, capacity, price) VALUES
(1, '小包厢', '2-6人', 200.00),
(1, '中包厢', '6-12人', 400.00),
(1, '大包厢', '12-20人', 600.00),
(1, 'VIP包厢', '20+人', 1000.00),
(2, '小包厢', '2-6人', 180.00),
(2, '中包厢', '6-12人', 380.00),
(2, '大包厢', '12-20人', 580.00),
(3, '小包厢', '2-6人', 220.00),
(3, '中包厢', '6-12人', 420.00),
(3, '大包厢', '12-20人', 620.00),
(3, 'VIP包厢', '20+人', 1200.00),
(4, '小包厢', '2-6人', 190.00),
(4, '中包厢', '6-12人', 390.00),
(4, '大包厢', '12-20人', 590.00),
(5, '小包厢', '2-6人', 170.00),
(5, '中包厢', '6-12人', 370.00),
(5, '大包厢', '12-20人', 570.00),
(6, '小包厢', '2-6人', 160.00),
(6, '中包厢', '6-12人', 350.00),
(7, '小包厢', '2-6人', 210.00),
(7, '中包厢', '6-12人', 410.00),
(7, 'VIP包厢', '20+人', 1100.00),
(8, '小包厢', '2-6人', 200.00),
(8, '中包厢', '6-12人', 400.00),
(8, '大包厢', '12-20人', 600.00);

-- 插入管理员账号 (密码: admin123)
INSERT INTO admins (username, password, name) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员');

-- 创建索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);
CREATE INDEX idx_ktv_venues_location ON ktv_venues(latitude, longitude);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_ktv_id ON bookings(ktv_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at); 