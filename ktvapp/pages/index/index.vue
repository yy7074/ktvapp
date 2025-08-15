<template>
	<view class="container">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{height: statusBarHeight + 'px'}"></view>
		
		<!-- 头部用户信息 -->
		<view class="header">
			<view class="user-info">
				<image src="/static/yue.jpg" class="avatar" mode="aspectFill"></image>
				<view class="user-details">
					<text class="username">{{ userInfo.nickname || '柠檬水橘子' }}</text>
					<view class="vip-info">
						<image src="/static/矩形@1x.png" class="vip-icon" mode="aspectFit"></image>
						<text class="vip-text">KTV会员</text>
					</view>
				</view>
			</view>
			<button class="upgrade-btn" @click="upgradeVip">订阅会员</button>
		</view>
		
		<!-- 包厢卡片标题 -->
		<view class="section-title">
			<text class="title-text">包厢卡</text>
		</view>
		
		<!-- KTV列表 -->
		<view class="ktv-list" v-if="ktvList.length > 0">
			<view 
				class="ktv-item" 
				v-for="(item, index) in ktvList" 
				:key="index"
				@click="bookKtv(item)"
			>
				<view class="ktv-card">
									<view class="ktv-tag">
					<image src="/static/yue.jpg" class="tag-bg" mode="aspectFit"></image>
					<text class="tag-text">约</text>
				</view>
					<view class="ktv-info">
						<text class="ktv-name">{{ item.name }}</text>
						<view class="ktv-details">
							<text class="ktv-distance" v-if="item.distance">{{ item.distance }}</text>
							<text class="ktv-rating" v-if="item.rating">★{{ item.rating }}</text>
						</view>
						<text class="ktv-address" v-if="item.address">{{ item.address }}</text>
					</view>
				</view>
				<button class="book-btn" @click.stop="bookKtv(item)">预约</button>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<image src="/static/yue.jpg" class="empty-icon" mode="aspectFit"></image>
			<text class="empty-text">空空如也</text>
		</view>
		
		<!-- 搜索按钮 -->
		<view class="search-btn" @click="searchKtv">
			<text class="search-text">搜索附近的商K</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 0,
			userInfo: {},
			ktvList: [],
			userLocation: null, // 用户位置信息
			locationPermissionGranted: false // 定位权限状态
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
		
		// 检查登录状态
		this.checkLogin();
		
		// 获取用户位置（成功后会自动获取KTV列表）
		this.getUserLocation();
	},
	onShow() {
		// 每次显示页面时刷新用户信息
		this.getUserInfo();
	},
	methods: {
		checkLogin() {
			const userInfo = uni.getStorageSync('userInfo');
			if (!userInfo) {
				uni.redirectTo({
					url: '/pages/login/login'
				});
			} else {
				this.userInfo = userInfo;
			}
		},
		
		getUserInfo() {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo) {
				this.userInfo = userInfo;
			}
		},
		
		// 获取用户位置
		async getUserLocation() {
			try {
				console.log('开始获取用户位置...');
				
				// 显示定位提示
				uni.showToast({
					title: '正在定位...',
					icon: 'loading',
					duration: 2000
				});
				
				// App端直接尝试获取位置，系统会自动处理权限请求
				const locationResult = await uni.getLocation({
					type: 'gcj02', // 国测局坐标系
					isHighAccuracy: true,
					timeout: 10000, // 10秒超时
					geocode: false // 不需要地理编码
				});
				
				this.userLocation = {
					latitude: locationResult.latitude,
					longitude: locationResult.longitude,
					accuracy: locationResult.accuracy
				};
				
				this.locationPermissionGranted = true;
				console.log('用户位置获取成功:', this.userLocation);
				
				// 隐藏定位提示
				uni.hideToast();
				
				// 位置获取成功后重新加载KTV列表（按距离排序）
				this.getKtvList();
				
			} catch (error) {
				console.log('获取位置失败:', error);
				
				// 隐藏定位提示
				uni.hideToast();
				
				// 根据错误类型进行不同处理
				if (error.errCode === 2 || (error.errMsg && error.errMsg.includes('denied'))) {
					// 用户拒绝了定位权限
					uni.showModal({
						title: '定位权限',
						content: '为了为您推荐附近的KTV，请在系统设置中允许应用获取位置信息',
						confirmText: '去设置',
						cancelText: '稍后再说',
						success: (res) => {
							if (res.confirm) {
								// App端打开系统设置
								plus && plus.runtime.openURL('app-settings:');
							}
							// 无论用户选择什么，都加载默认KTV列表
							this.getKtvList();
						}
					});
				} else if (error.errCode === 3 || (error.errMsg && error.errMsg.includes('timeout'))) {
					// 定位超时
					uni.showToast({
						title: '定位超时，显示默认列表',
						icon: 'none',
						duration: 2000
					});
					this.getKtvList();
				} else {
					// 其他定位错误
					console.log('使用默认位置或不进行距离排序');
					uni.showToast({
						title: '定位失败，显示默认列表',
						icon: 'none',
						duration: 2000
					});
					this.getKtvList();
				}
			}
		},
		
		async getKtvList() {
			try {
				console.log('开始获取KTV列表...');
				
				// 构建请求参数
				let requestData = {};
				
				// 如果有用户位置信息，传递给后端用于距离计算
				if (this.userLocation) {
					requestData.latitude = this.userLocation.latitude;
					requestData.longitude = this.userLocation.longitude;
					console.log('使用用户位置信息:', this.userLocation);
				} else {
					console.log('没有用户位置信息，将获取默认KTV列表');
				}
				
				// 调用真实的KTV列表API
				const res = await uni.request({
					url: 'http://catdog.dachaonet.com/get_ktv_list.php',
					method: 'GET',
					data: requestData,
					header: {
						'Authorization': 'Bearer ' + uni.getStorageSync('token')
					}
				});
				
				if (res.data.success) {
					this.ktvList = res.data.data || [];
					console.log('KTV列表获取成功:', this.ktvList);
				} else {
					console.error('获取KTV列表失败:', res.data.message);
					// 降级到模拟数据
					this.ktvList = [
						{
							id: 1,
							name: '搜索附近的商K',
							distance: '500m',
							rating: 4.8,
							address: '北京市朝阳区三里屯路123号'
						},
						{
							id: 2,
							name: '星光KTV',
							distance: '800m',
							rating: 4.6,
							address: '北京市海淀区中关村大街456号'
						},
						{
							id: 3,
							name: '欢乐颂KTV',
							distance: '1.2km',
							rating: 4.9,
							address: '北京市西城区西单北大街789号'
						}
					];
				}
				
			} catch (error) {
				console.error('获取KTV列表失败:', error);
				// 网络错误时使用模拟数据
				this.ktvList = [
					{
						id: 1,
						name: '搜索附近的商K',
						distance: '500m',
						rating: 4.8,
						address: '北京市朝阳区三里屯路123号'
					},
					{
						id: 2,
						name: '星光KTV',
						distance: '800m',
						rating: 4.6,
						address: '北京市海淀区中关村大街456号'
					}
				];
			}
		},
		
		async getLocation() {
			return new Promise((resolve, reject) => {
				uni.getLocation({
					type: 'gcj02',
					success: resolve,
					fail: reject
				});
			});
		},
		
		searchKtv() {
			uni.showLoading({
				title: '搜索中...'
			});
			
			// 模拟搜索
			setTimeout(() => {
				uni.hideLoading();
				this.ktvList = [
					{
						id: 1,
						name: '搜索附近的商K',
						distance: 500,
						rating: 4.8,
						address: '北京市朝阳区xxx路xxx号'
					},
					{
						id: 2,
						name: '星光KTV',
						distance: 800,
						rating: 4.6,
						address: '北京市朝阳区xxx路xxx号'
					},
					{
						id: 3,
						name: '欢乐颂KTV',
						distance: 1200,
						rating: 4.9,
						address: '北京市朝阳区xxx路xxx号'
					}
				];
			}, 1500);
		},
		
		bookKtv(item) {
			uni.navigateTo({
				url: `/pages/booking/booking?id=${item.id}&name=${encodeURIComponent(item.name)}`
			});
		},
		
		upgradeVip() {
			uni.showToast({
				title: '会员功能开发中',
				icon: 'none'
			});
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: linear-gradient(135deg, #434343 0%, #2C2C2E 100%);
	color: white;
}

.status-bar {
	width: 100%;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 40rpx 60rpx;
	margin-bottom: 40rpx;
}

.user-info {
	display: flex;
	align-items: center;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	margin-right: 30rpx;
}

.user-details {
	flex: 1;
}

.username {
	display: block;
	font-size: 36rpx;
	font-weight: 500;
	margin-bottom: 10rpx;
}

.vip-info {
	display: flex;
	align-items: center;
}

.vip-icon {
	width: 40rpx;
	height: 20rpx;
	margin-right: 15rpx;
}

.vip-text {
	font-size: 28rpx;
	color: #FFD700;
}

.upgrade-btn {
	background: #7ED321;
	color: #2C2C2E;
	border: none;
	border-radius: 40rpx;
	padding: 20rpx 40rpx;
	font-size: 28rpx;
	font-weight: 500;
}

.section-title {
	padding: 0 60rpx;
	margin-bottom: 40rpx;
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

.ktv-list {
	padding: 0 60rpx;
	margin-bottom: 60rpx;
}

.ktv-item {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.ktv-card {
	flex: 1;
	display: flex;
	align-items: center;
}

.ktv-tag {
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

.ktv-info {
	flex: 1;
}

.ktv-name {
	font-size: 32rpx;
	font-weight: 500;
	margin-bottom: 10rpx;
}

.ktv-details {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 8rpx;
}

.ktv-distance {
	font-size: 24rpx;
	color: #7ED321;
	background: rgba(126, 211, 33, 0.15);
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
}

.ktv-rating {
	font-size: 24rpx;
	color: #FFD700;
}

.ktv-address {
	font-size: 24rpx;
	color: #CCCCCC;
	opacity: 0.8;
	line-height: 1.4;
}

.book-btn {
	background: #7ED321;
	color: #2C2C2E;
	border: none;
	border-radius: 50rpx;
	padding: 20rpx 60rpx;
	font-size: 28rpx;
	font-weight: 500;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 60rpx;
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

.search-btn {
	position: fixed;
	bottom: 120rpx;
	left: 60rpx;
	right: 60rpx;
	background: #7ED321;
	border-radius: 50rpx;
	padding: 30rpx;
	text-align: center;
}

.search-text {
	font-size: 32rpx;
	font-weight: 500;
	color: #2C2C2E;
}
</style>
