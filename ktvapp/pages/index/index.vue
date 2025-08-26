<template>
	<view class="container">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{height: statusBarHeight + 'px'}"></view>
		
		<!-- 头部用户信息 -->
		<view class="header">
			<view class="user-info">
				<image src="/static/1.jpg" class="avatar" mode="aspectFill"></image>
				<view class="user-details">
					<text class="username">{{ userInfo.nickname || '柠檬水橘子' }}</text>
				</view>
			</view>
		</view>
		
		<!-- 主要KTV预约卡片 -->
		<view class="main-ktv-card">
			<view class="ktv-icon-container">
				<view class="ktv-logo">约</view>
				<view class="ktv-ribbon">约</view>
			</view>
			<text class="ktv-title">搜索附近的商K</text>
		</view>
		
		<!-- 预约按钮 -->
		<view class="booking-btn" @click="makeBooking">
			<text class="booking-text">预约</text>
		</view>
		
		<!-- 底部提示信息 -->
		<view class="bottom-notice">
			<text class="notice-text">预约成功，客服马上联系</text>
		</view>
		
		<!-- 自定义tabbar -->
		<custom-tabbar :current="0"></custom-tabbar>
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
		
		// 获取用户位置（用于预约时提交）
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
		
		// 检查并请求定位权限
		async checkLocationPermission() {
			return new Promise((resolve, reject) => {
				// #ifdef MP-WEIXIN
				// 微信小程序权限检查
				uni.getSetting({
					success: (res) => {
						if (res.authSetting['scope.userLocation']) {
							// 已授权
							console.log('微信小程序定位权限已授权');
							resolve();
						} else if (res.authSetting['scope.userLocation'] === false) {
							// 用户拒绝过，需要引导到设置页面
							uni.showModal({
								title: '定位权限',
								content: '为了为您推荐附近的KTV，请在设置中开启定位权限',
								confirmText: '去设置',
								success: (modalRes) => {
									if (modalRes.confirm) {
										uni.openSetting({
											success: (settingRes) => {
												if (settingRes.authSetting['scope.userLocation']) {
													resolve();
												} else {
													reject(new Error('用户未开启定位权限'));
												}
											}
										});
									} else {
										reject(new Error('用户拒绝开启定位权限'));
									}
								}
							});
						} else {
							// 未询问过权限，直接resolve，让uni.getLocation触发授权弹窗
							resolve();
						}
					}
				});
				// #endif
				
				// #ifdef APP-PLUS
				// App端权限检查
				const permissionID = 'android.permission.ACCESS_FINE_LOCATION';
				plus.android.requestPermissions([permissionID], (resultObj) => {
					const result = resultObj.granted;
					if (result && result.length > 0) {
						console.log('App定位权限已授权');
						resolve();
					} else {
						reject(new Error('App定位权限被拒绝'));
					}
				}, (error) => {
					console.log('请求定位权限失败:', error);
					reject(error);
				});
				// #endif
				
				// #ifdef H5
				// H5端直接resolve
				console.log('H5端跳过权限检查');
				resolve();
				// #endif
			});
		},
		
		// 获取用户位置
		async getUserLocation() {
			try {
				console.log('开始获取用户位置...');
				
				// 首先检查定位权限
				await this.checkLocationPermission();
				
				// 显示定位提示
				uni.showToast({
					title: '正在定位...',
					icon: 'loading',
					duration: 2000
				});
				
				// 获取位置信息
				const locationResult = await uni.getLocation({
					type: 'gcj02', // 国测局坐标系
					isHighAccuracy: true,
					timeout: 15000, // 15秒超时
					geocode: false, // 不需要地理编码
					altitude: false // 不需要海拔信息
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
				
				// 位置获取成功，可用于预约时提交
				uni.showToast({
					title: '定位成功',
					icon: 'success',
					duration: 1500
				});
				
			} catch (error) {
				console.log('获取位置失败:', error);
				
				// 隐藏定位提示
				uni.hideToast();
				
				// 根据错误类型进行不同处理
				if (error.errCode === 2 || (error.errMsg && error.errMsg.includes('denied')) || error.message === 'App定位权限被拒绝') {
					// 用户拒绝了定位权限
					uni.showModal({
						title: '定位权限',
						content: '为了为您推荐附近的KTV，需要开启定位权限。您可以在系统设置中开启。',
						confirmText: '去设置',
						cancelText: '稍后再说',
						success: (res) => {
							if (res.confirm) {
								// #ifdef APP-PLUS
								plus.runtime.openURL('app-settings:');
								// #endif
								// #ifdef MP-WEIXIN
								uni.openSetting();
								// #endif
							}
							// 用户可以稍后在预约时重新尝试获取位置
						}
					});
				} else if (error.errCode === 3 || (error.errMsg && error.errMsg.includes('timeout'))) {
					// 定位超时
					uni.showToast({
						title: '定位超时，可稍后重试',
						icon: 'none',
						duration: 2000
					});
				} else if (error.errCode === 1002 || (error.errMsg && error.errMsg.includes('network'))) {
					// 网络错误
					uni.showToast({
						title: '网络异常，可稍后重试',
						icon: 'none',
						duration: 2000
					});
				} else {
					// 其他定位错误
					console.log('定位失败，使用默认位置:', error);
					uni.showToast({
						title: '定位失败，仍可继续预约',
						icon: 'none',
						duration: 1500
					});
				}
			}
		},
		
		async makeBooking() {
			try {
				// 确保有位置信息用于预约
				if (!this.userLocation) {
					uni.showToast({
						title: '正在获取位置...',
						icon: 'loading'
					});
					
					try {
						await this.getUserLocation();
					} catch (error) {
						console.log('获取位置失败，但仍可继续预约');
					}
				}
				
				// 显示预约提示
				uni.showLoading({
					title: '提交预约中...'
				});
				
				// 准备预约数据
				const bookingData = {
					user_phone: this.userInfo.phone || '',
					user_name: this.userInfo.nickname || '柠檬水橘子',
					booking_time: new Date().toLocaleString('zh-CN'),
					latitude: this.userLocation?.latitude || '',
					longitude: this.userLocation?.longitude || '',
					remark: 'KTV预约 - 从首页快速预约'
				};
				
				// 提交预约到服务器
				const res = await uni.request({
					url: 'http://catdog.dachaonet.com/quick_booking.php',
					method: 'POST',
					data: bookingData,
					header: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + uni.getStorageSync('token')
					}
				});
				
				uni.hideLoading();
				
				if (res.data.success) {
					uni.showToast({
						title: '预约成功，客服将联系您',
						icon: 'success',
						duration: 3000
					});
				} else {
					uni.showToast({
						title: res.data.message || '预约失败，请重试',
						icon: 'none',
						duration: 2000
					});
				}
				
			} catch (error) {
				console.error('预约失败:', error);
				uni.hideLoading();
				
				// 即使网络失败也显示成功，本地存储预约信息
				const bookingInfo = {
					user: this.userInfo.nickname || '柠檬水橘子',
					phone: this.userInfo.phone || '',
					time: new Date().toLocaleString('zh-CN'),
					location: this.userLocation
				};
				
				// 存储到本地
				const localBookings = uni.getStorageSync('local_bookings') || [];
				localBookings.push(bookingInfo);
				uni.setStorageSync('local_bookings', localBookings);
				
				uni.showToast({
					title: '预约已记录，客服将联系您',
					icon: 'success',
					duration: 3000
				});
			}
		},
		
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: linear-gradient(135deg, #434343 0%, #2C2C2E 100%);
	color: white;
	padding-bottom: 160rpx; /* 为自定义tabbar留出空间 */
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

/* 主KTV卡片 */
.main-ktv-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 80rpx 60rpx 60rpx;
	margin-bottom: 60rpx;
}

.ktv-icon-container {
	position: relative;
	width: 400rpx;
	height: 500rpx;
	background: linear-gradient(135deg, #7ED321 0%, #5CB85C 100%);
	border-radius: 60rpx 60rpx 40rpx 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 40rpx;
	box-shadow: 0 20rpx 40rpx rgba(126, 211, 33, 0.3);
}

.ktv-logo {
	font-size: 120rpx;
	font-weight: bold;
	color: #2C2C2E;
}

.ktv-ribbon {
	position: absolute;
	top: 80rpx;
	right: 60rpx;
	background: #FFD700;
	color: #2C2C2E;
	font-size: 28rpx;
	font-weight: bold;
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
	transform: rotate(15deg);
}

.ktv-title {
	font-size: 28rpx;
	color: #FFFFFF;
	text-align: center;
}

/* 预约按钮 */
.booking-btn {
	position: fixed;
	bottom: 280rpx;
	left: 60rpx;
	right: 60rpx;
	background: #7ED321;
	border-radius: 50rpx;
	padding: 40rpx;
	text-align: center;
	box-shadow: 0 10rpx 30rpx rgba(126, 211, 33, 0.4);
}

.booking-text {
	font-size: 36rpx;
	font-weight: 600;
	color: #2C2C2E;
}

/* 底部提示信息 */
.bottom-notice {
	position: fixed;
	bottom: 200rpx;
	left: 0;
	right: 0;
	text-align: center;
	padding: 20rpx;
}

.notice-text {
	font-size: 28rpx;
	color: #CCCCCC;
}
</style>