<template>
	<view class="container">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{height: statusBarHeight + 'px'}"></view>
		
		<!-- 头部导航 -->
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="header-title">我的预约</text>
		</view>
		
		<!-- 预约列表 -->
		<view class="booking-list" v-if="bookingList.length > 0">
			<view 
				class="booking-item" 
				v-for="(item, index) in bookingList" 
				:key="index"
				@click="viewBooking(item)"
			>
				<view class="booking-header">
					<view class="ktv-info">
						<text class="ktv-name">{{ item.ktv_name }}</text>
						<text class="booking-id">#{{ item.id }}</text>
					</view>
					<view class="status-badge" :class="item.status">
						<text class="status-text">{{ getStatusText(item.status) }}</text>
					</view>
				</view>
				
				<view class="booking-details">
					<view class="detail-row">
						<text class="detail-label">预约时间:</text>
						<text class="detail-value">{{ item.booking_time }}</text>
					</view>
					<view class="detail-row">
						<text class="detail-label">包厢类型:</text>
						<text class="detail-value">{{ item.room_type }}</text>
					</view>
					<view class="detail-row">
						<text class="detail-label">人数:</text>
						<text class="detail-value">{{ item.people_count }}</text>
					</view>
					<view class="detail-row" v-if="item.remark">
						<text class="detail-label">备注:</text>
						<text class="detail-value">{{ item.remark }}</text>
					</view>
				</view>
				
				<view class="booking-footer">
					<text class="create-time">{{ formatDate(item.created_at) }}</text>
					<view class="booking-actions">
						<button 
							v-if="item.status === 'pending'" 
							class="cancel-btn" 
							@click.stop="cancelBooking(item)"
						>
							取消预约
						</button>
						<button 
							v-if="item.status === 'confirmed'" 
							class="contact-btn" 
							@click.stop="contactService"
						>
							联系客服
						</button>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<image src="/static/yue.jpg" class="empty-icon" mode="aspectFit"></image>
			<text class="empty-text">暂无预约记录</text>
			<button class="goto-booking-btn" @click="goToHome">去预约</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 0,
			bookingList: []
		}
	},
	onLoad() {
		// 获取状态栏高度
		try {
			if (uni.getWindowInfo) {
				const windowInfo = uni.getWindowInfo();
				this.statusBarHeight = windowInfo.statusBarHeight;
			} else {
				const systemInfo = uni.getSystemInfoSync();
				this.statusBarHeight = systemInfo.statusBarHeight;
			}
		} catch (error) {
			console.log('获取系统信息失败，使用默认值');
			this.statusBarHeight = 44;
		}
		
		this.getBookingList();
	},
	methods: {
		async getBookingList() {
			try {
				// 获取用户信息
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo || !userInfo.phone) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}

				uni.showLoading({
					title: '加载中...'
				});

				// 调用后台API获取预约列表
				const response = await uni.request({
					url: `http://catdog.dachaonet.com/get_user_bookings.php?user_phone=${userInfo.phone}`,
					method: 'GET'
				});

				console.log('预约列表API响应:', response);

				if (response.statusCode === 200 && response.data.success) {
					// 使用后台数据
					this.bookingList = response.data.data.bookings || [];
				} else {
					// API失败时使用本地数据
					console.warn('API获取失败，使用本地数据');
					const mockBookings = uni.getStorageSync('mockBookings') || [];
					this.bookingList = mockBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				}

				uni.hideLoading();

			} catch (error) {
				console.error('获取预约列表失败:', error);
				uni.hideLoading();
				
				// 网络错误时使用本地数据
				const mockBookings = uni.getStorageSync('mockBookings') || [];
				this.bookingList = mockBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				
				uni.showToast({
					title: '网络异常，显示本地数据',
					icon: 'none'
				});
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
		
		formatDate(dateString) {
			const date = new Date(dateString);
			return date.toLocaleString('zh-CN');
		},
		
		viewBooking(item) {
			uni.navigateTo({
				url: `/pages/booking/booking?id=${item.id}&mode=view`
			});
		},
		
		cancelBooking(item) {
			uni.showModal({
				title: '确认取消',
				content: '确定要取消这个预约吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							// 获取用户信息
							const userInfo = uni.getStorageSync('userInfo');
							if (!userInfo || !userInfo.phone) {
								uni.showToast({
									title: '请先登录',
									icon: 'none'
								});
								return;
							}

							uni.showLoading({
								title: '取消中...'
							});

							// 调用后台API取消预约
							const response = await uni.request({
								url: 'http://catdog.dachaonet.com/cancel_booking.php',
								method: 'POST',
								header: {
									'Content-Type': 'application/json'
								},
								data: {
									booking_id: item.id,
									user_phone: userInfo.phone
								}
							});

							console.log('取消预约API响应:', response);

							if (response.statusCode === 200 && response.data.success) {
								// 取消成功
								uni.hideLoading();
								uni.showToast({
									title: '预约已取消',
									icon: 'success'
								});
								
								// 刷新预约列表
								this.getBookingList();
								
								// 同时更新本地存储
								const mockBookings = uni.getStorageSync('mockBookings') || [];
								const index = mockBookings.findIndex(booking => booking.id === item.id);
								if (index !== -1) {
									mockBookings[index].status = 'cancelled';
									uni.setStorageSync('mockBookings', mockBookings);
								}
								
							} else {
								// 取消失败
								uni.hideLoading();
								uni.showToast({
									title: response.data?.message || '取消失败',
									icon: 'none'
								});
							}

						} catch (error) {
							console.error('取消预约失败:', error);
							uni.hideLoading();
							
							// 网络错误时的降级处理 - 更新本地数据
							const mockBookings = uni.getStorageSync('mockBookings') || [];
							const index = mockBookings.findIndex(booking => booking.id === item.id);
							if (index !== -1) {
								mockBookings[index].status = 'cancelled';
								mockBookings[index].is_local_cancelled = true; // 标记为本地取消
								uni.setStorageSync('mockBookings', mockBookings);
								this.getBookingList();
								
								uni.showToast({
									title: '网络异常，已本地取消',
									icon: 'none'
								});
							} else {
								uni.showToast({
									title: '取消失败',
									icon: 'none'
								});
							}
						}
					}
				}
			});
		},
		
		contactService() {
			uni.showModal({
				title: '联系客服',
				content: '客服电话：400-123-4567\n工作时间：9:00-22:00',
				showCancel: false,
				confirmText: '知道了'
			});
		},
		
		goToHome() {
			uni.switchTab({
				url: '/pages/index/index'
			});
		},
		
		goBack() {
			uni.navigateBack();
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #323641;
	color: white;
}

.status-bar {
	width: 100%;
}

.header {
	display: flex;
	align-items: center;
	padding: 20rpx 40rpx;
	position: relative;
	background: #21212A;
}

.back-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.back-icon {
	font-size: 40rpx;
	color: white;
	font-weight: 200;
}

.header-title {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	font-size: 36rpx;
	font-weight: 500;
}

.booking-list {
	padding: 30rpx;
}

.booking-item {
	background: #21212A;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.booking-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 20rpx;
}

.ktv-info {
	flex: 1;
}

.ktv-name {
	font-size: 32rpx;
	font-weight: 500;
	color: white;
	display: block;
	margin-bottom: 8rpx;
}

.booking-id {
	font-size: 24rpx;
	color: #999999;
}

.status-badge {
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
}

.status-badge.pending {
	background: rgba(255, 149, 0, 0.2);
}

.status-badge.confirmed {
	background: rgba(126, 211, 33, 0.2);
}

.status-badge.completed {
	background: rgba(153, 153, 153, 0.2);
}

.status-badge.cancelled {
	background: rgba(255, 59, 48, 0.2);
}

.status-text {
	font-size: 24rpx;
	font-weight: 500;
}

.status-badge.pending .status-text {
	color: #FF9500;
}

.status-badge.confirmed .status-text {
	color: #7ED321;
}

.status-badge.completed .status-text {
	color: #999999;
}

.status-badge.cancelled .status-text {
	color: #FF3B30;
}

.booking-details {
	margin-bottom: 20rpx;
}

.detail-row {
	display: flex;
	justify-content: space-between;
	margin-bottom: 12rpx;
}

.detail-label {
	font-size: 28rpx;
	color: #CCCCCC;
}

.detail-value {
	font-size: 28rpx;
	color: white;
	font-weight: 500;
}

.booking-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 20rpx;
	border-top: 1rpx solid rgba(255, 255, 255, 0.1);
}

.create-time {
	font-size: 24rpx;
	color: #999999;
}

.booking-actions {
	display: flex;
	gap: 20rpx;
}

.cancel-btn {
	background: transparent;
	border: 1rpx solid #FF3B30;
	color: #FF3B30;
	font-size: 24rpx;
	padding: 12rpx 24rpx;
	border-radius: 20rpx;
}

.contact-btn {
	background: #7ED321;
	color: #1C1C1E;
	font-size: 24rpx;
	padding: 12rpx 24rpx;
	border-radius: 20rpx;
	border: none;
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
	margin-bottom: 40rpx;
}

.goto-booking-btn {
	background: #7ED321;
	color: #1C1C1E;
	font-size: 28rpx;
	padding: 20rpx 60rpx;
	border-radius: 50rpx;
	border: none;
}
</style> 