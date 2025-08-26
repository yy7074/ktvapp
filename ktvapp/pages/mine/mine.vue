<template>
	<view class="container">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{height: statusBarHeight + 'px'}"></view>
		
		<!-- 头部用户信息卡片 - 像素级还原设计图 -->
		<view class="header-card">
			<view class="profile-card">
				<!-- 用户头像 -->
				<view class="avatar-container">
					<image src="/static/1.jpg" class="user-avatar" mode="aspectFill"></image>
				</view>
				
				<!-- 用户姓名 -->
				<text class="user-name">{{ userInfo.nickname || '柠檬水橘子' }}</text>
				
				<!-- VIP徽章 -->
				<view class="vip-section">
					<view class="vip-badge">
						<text class="vip-diamond">💎</text>
						<text class="vip-text">KTV会员</text>
					</view>
				</view>
				
				<!-- 订阅会员按钮 -->
				<button class="subscribe-button" @click="upgradeVip">订阅会员</button>
			</view>
		</view>
		
		<!-- 包厢卡片标题 -->
		<view class="section-title">
			<text class="title-text">包厢卡</text>
		</view>
		
		<!-- 包厢卡片列表 -->
		<view class="card-list" v-if="cardList.length > 0">
			<view 
				class="card-item" 
				v-for="(item, index) in cardList" 
				:key="index"
				@click="viewCard(item)"
			>
				<view class="card-content">
					<view class="card-tag">
						<image src="/static/yue.jpg" class="tag-bg" mode="aspectFit"></image>
						<text class="tag-text">约</text>
					</view>
					<text class="card-name">{{ item.name }}</text>
				</view>
				<view class="card-status">
					<text class="status-text" :class="item.status">{{ getStatusText(item.status) }}</text>
				</view>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<image src="/static/yue.jpg" class="empty-icon" mode="aspectFit"></image>
			<text class="empty-text">空空如也</text>
		</view>
		
		<!-- 菜单列表 -->
		<view class="menu-list">
			<view class="menu-item" @click="goToBookings">
				<text class="menu-text">我的预约</text>
				<image src="/static/返 回@1x.png" class="menu-arrow" mode="aspectFit"></image>
			</view>
			<view class="menu-item" @click="logout">
				<text class="menu-text">退出登录</text>
				<image src="/static/返 回@1x.png" class="menu-arrow" mode="aspectFit"></image>
			</view>
		</view>
		
		<!-- 自定义tabbar -->
		<custom-tabbar :current="1"></custom-tabbar>
	</view>
</template>

<script>
import CustomTabbar from '../../components/custom-tabbar/custom-tabbar.vue';

export default {
	components: {
		CustomTabbar
	},
	data() {
		return {
			statusBarHeight: 0,
			userInfo: {},
			cardList: []
		}
	},
	onLoad() {
		// 获取状态栏高度
		try {
			// 优先使用新的API
			if (uni.getWindowInfo) {
				const windowInfo = uni.getWindowInfo();
				this.statusBarHeight = windowInfo.statusBarHeight;
			} else {
				// 兼容旧版本
				const systemInfo = uni.getSystemInfoSync();
				this.statusBarHeight = systemInfo.statusBarHeight;
			}
		} catch (error) {
			console.log('获取系统信息失败，使用默认值');
			this.statusBarHeight = 44; // 默认状态栏高度
		}
	},
	onShow() {
		// 每次显示页面时刷新数据
		this.getUserInfo();
		this.getCardList();
	},
	methods: {
		getUserInfo() {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo) {
				this.userInfo = userInfo;
			}
		},
		
		async getCardList() {
			try {
				// 模拟获取包厢卡列表（开发阶段）
				console.log('模拟获取包厢卡列表');
				
				// 模拟网络延迟
				await new Promise(resolve => setTimeout(resolve, 500));
				
				// 模拟预约数据 - 显示用户的预约记录
				const userInfo = uni.getStorageSync('userInfo');
				const mockBookings = uni.getStorageSync('mockBookings') || [];
				
				this.cardList = mockBookings.map(booking => ({
					id: booking.id,
					name: booking.ktv_name,
					status: booking.status,
					booking_time: booking.booking_time,
					room_type: booking.room_type,
					people_count: booking.people_count,
					created_at: booking.created_at
				}));
				
			} catch (error) {
				console.error('获取包厢卡列表失败:', error);
				this.cardList = [];
			}
		},
		
		getStatusText(status) {
			const statusMap = {
				'pending': '待确认',
				'confirmed': '已确认',
				'completed': '已完成',
				'cancelled': '已取消'
			};
			return statusMap[status] || '未知';
		},
		
		viewCard(item) {
			uni.navigateTo({
				url: `/pages/booking/booking?id=${item.id}&mode=view`
			});
		},
		
		upgradeVip() {
			uni.showToast({
				title: '会员功能开发中',
				icon: 'none'
			});
		},
		
		goToBookings() {
			uni.navigateTo({
				url: '/pages/bookings/bookings'
			});
		},
		

		
		logout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('userInfo');
						uni.removeStorageSync('token');
						uni.redirectTo({
							url: '/pages/login/login'
						});
					}
				}
			});
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: linear-gradient(180deg, #434343 0%, #313640 100%);
	color: white;
	padding-bottom: 160rpx; /* 为自定义tabbar留出空间 */
}

.status-bar {
	width: 100%;
}

/* === 像素级还原设计图卡片样式 === */
.header-card {
	padding: 32rpx 32rpx 0 32rpx;
	margin-bottom: 40rpx;
}

.profile-card {
	position: relative;
	background: #2A2E3A;
	border-radius: 32rpx;
	padding: 0;
	height: 240rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.25);
	overflow: hidden;
}

/* 头像样式 - 精确还原设计图 */
.avatar-container {
	position: absolute;
	left: 32rpx;
	top: 32rpx;
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	border: 4rpx solid #FFFFFF;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
}

.user-avatar {
	width: 100%;
	height: 100%;
}

/* 用户名 - 精确位置还原设计图 */
.user-name {
	position: absolute;
	left: 180rpx;
	top: 68rpx;
	font-size: 40rpx;
	font-weight: 500;
	color: #FFFFFF;
	letter-spacing: 1rpx;
	line-height: 1.2;
}

/* VIP区域 */
.vip-section {
	position: absolute;
	left: 32rpx;
	bottom: 32rpx;
}

.vip-badge {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.vip-diamond {
	font-size: 32rpx;
	color: #FFD700;
}

.vip-text {
	font-size: 28rpx;
	color: #FFD700;
	font-weight: 500;
}

/* 订阅会员按钮 - 精确还原设计图 */
.subscribe-button {
	position: absolute;
	right: 32rpx;
	bottom: 32rpx;
	background: #7ED321;
	color: #1C1C1E;
	border: none;
	border-radius: 44rpx;
	padding: 16rpx 32rpx;
	font-size: 26rpx;
	font-weight: 600;
	box-shadow: 0 4rpx 16rpx rgba(126, 211, 33, 0.4);
	min-width: 140rpx;
	height: 64rpx;
	line-height: 32rpx;
}


.section-title {
	padding: 0 60rpx;
	margin-bottom: 28rpx;
}

.title-text {
	font-size: 32rpx;
	font-weight: 500;
	position: relative;
}

.title-text::after {
	content: '';
	position: absolute;
	left: 0;
	bottom: -10rpx;
	width: 60rpx;
	height: 4rpx;
	background: #7ED321;
}

.card-list {
	padding: 0 60rpx;
	margin-bottom: 60rpx;
}

.card-item {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.card-content {
	flex: 1;
	display: flex;
	align-items: center;
}

.card-tag {
	position: relative;
	width: 120rpx;
	height: 160rpx;
	margin-right: 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.tag-bg {
	position: absolute;
	width: 100%;
	height: 100%;
	z-index: 1;
}

.tag-text {
	position: relative;
	z-index: 2;
	font-size: 48rpx;
	font-weight: bold;
	color: #2C2C2E;
}

.card-name {
	font-size: 32rpx;
	font-weight: 500;
}

.card-status {
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
}

.status-text {
	font-size: 24rpx;
}

.status-text.pending {
	color: #FF9500;
}

.status-text.confirmed {
	color: #7ED321;
}

.status-text.completed {
	color: #999999;
}

.status-text.cancelled {
	color: #FF3B30;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 140rpx 60rpx;
	margin-bottom: 60rpx;
}

.empty-icon {
	width: 200rpx;
	height: 200rpx;
	opacity: 0.3;
	margin-bottom: 40rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #999999;
}

.menu-list {
	padding: 0 60rpx;
}

.menu-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 40rpx 0;
	border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-text {
	font-size: 32rpx;
}

.menu-arrow {
	width: 20rpx;
	height: 20rpx;
	transform: rotate(180deg);
	opacity: 0.6;
}

</style> 