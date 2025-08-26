<template>
	<view class="container">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{height: statusBarHeight + 'px'}"></view>
		
		<!-- 头部导航 -->
		<view class="header">
			<view class="back-btn" @click="goBack">
				<image src="/static/返 回@1x.png" class="back-icon" mode="aspectFit"></image>
			</view>
			<text class="header-title">预约详情</text>
		</view>
		
		<!-- 用户信息 -->
		<view class="user-section">
							<image src="/static/yue.jpg" class="user-avatar" mode="aspectFill"></image>
			<text class="user-name">{{ userInfo.nickname || '柠檬水橘子' }}</text>
		</view>
		
		<!-- KTV信息卡片 -->
		<view class="ktv-card">
			<view class="ktv-tag">
				<image src="/static/yue.jpg" class="tag-bg" mode="aspectFit"></image>
				<text class="tag-text">约</text>
			</view>
			<view class="ktv-info">
				<text class="ktv-name">{{ ktvInfo.name || '搜索附近的商K' }}</text>
				<text class="ktv-address" v-if="ktvInfo.address">{{ ktvInfo.address }}</text>
				<text class="ktv-distance" v-if="ktvInfo.distance">距离: {{ ktvInfo.distance }}m</text>
			</view>
		</view>
		
		<!-- 预约表单 -->
		<view class="booking-form" v-if="mode !== 'view'">
			<view class="form-item">
				<text class="form-label">预约时间</text>
				<picker mode="multiSelector" :value="timeIndex" :range="timeRange" @change="onTimeChange">
					<view class="picker-input">
						{{ selectedTime || '请选择预约时间' }}
					</view>
				</picker>
			</view>
			
			<view class="form-item">
				<text class="form-label">包厢类型</text>
				<picker :value="roomTypeIndex" :range="roomTypes" range-key="name" @change="onRoomTypeChange">
					<view class="picker-input">
						{{ selectedRoomType || '请选择包厢类型' }}
					</view>
				</picker>
			</view>
			
			<view class="form-item">
				<text class="form-label">人数</text>
				<picker :value="peopleCountIndex" :range="peopleCounts" @change="onPeopleCountChange">
					<view class="picker-input">
						{{ selectedPeopleCount || '请选择人数' }}
					</view>
				</picker>
			</view>
			
			<view class="form-item">
				<text class="form-label">备注</text>
				<textarea 
					v-model="remark" 
					placeholder="请输入特殊要求或备注信息"
					class="remark-input"
					maxlength="200"
				></textarea>
			</view>
		</view>
		
		<!-- 预约信息展示（查看模式） -->
		<view class="booking-info" v-if="mode === 'view' && bookingData">
			<view class="info-item">
				<text class="info-label">预约时间:</text>
				<text class="info-value">{{ bookingData.booking_time }}</text>
			</view>
			<view class="info-item">
				<text class="info-label">包厢类型:</text>
				<text class="info-value">{{ bookingData.room_type }}</text>
			</view>
			<view class="info-item">
				<text class="info-label">人数:</text>
				<text class="info-value">{{ bookingData.people_count }}人</text>
			</view>
			<view class="info-item" v-if="bookingData.remark">
				<text class="info-label">备注:</text>
				<text class="info-value">{{ bookingData.remark }}</text>
			</view>
			<view class="info-item">
				<text class="info-label">状态:</text>
				<text class="info-value" :class="bookingData.status">{{ getStatusText(bookingData.status) }}</text>
			</view>
		</view>
		
		<!-- 预约按钮 -->
		<view class="booking-btn-container" v-if="mode !== 'view'">
			<button 
				class="booking-btn" 
				:class="{ 'disabled': !canSubmit }"
				@click="submitBooking"
				:disabled="!canSubmit"
			>
				预约
			</button>
			<text class="booking-tip">预约成功，客服马上联系</text>
		</view>
		
		<!-- 预约成功提示 -->
		<view class="success-modal" v-if="showSuccess">
			<view class="success-content">
				<view class="success-icon">✓</view>
				<text class="success-title">预约成功</text>
				<text class="success-desc">客服马上联系</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 0,
			userInfo: {},
			ktvInfo: {},
			mode: 'book', // book: 预约模式, view: 查看模式
			bookingData: null,
			
			// 预约表单数据
			timeIndex: [0, 0],
			timeRange: [
				['今天', '明天', '后天'],
				['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
			],
			selectedTime: '',
			
			roomTypeIndex: 0,
			roomTypes: [
				{ name: '小包厢', capacity: '2-6人', price: 200 },
				{ name: '中包厢', capacity: '6-12人', price: 400 },
				{ name: '大包厢', capacity: '12-20人', price: 600 },
				{ name: 'VIP包厢', capacity: '20+人', price: 1000 }
			],
			selectedRoomType: '',
			
			peopleCountIndex: 0,
			peopleCounts: ['2人', '4人', '6人', '8人', '10人', '12人', '15人', '20人'],
			selectedPeopleCount: '',
			
			remark: '',
			showSuccess: false
		}
	},
	computed: {
		canSubmit() {
			return this.selectedTime && this.selectedRoomType && this.selectedPeopleCount;
		}
	},
	onLoad(options) {
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
		
		// 获取参数
		if (options.id) {
			this.ktvInfo.id = options.id;
		}
		if (options.name) {
			this.ktvInfo.name = decodeURIComponent(options.name);
		}
		if (options.mode) {
			this.mode = options.mode;
		}
		
		// 获取用户信息
		this.getUserInfo();
		
		// 如果是查看模式，获取预约详情
		if (this.mode === 'view' && options.id) {
			this.getBookingDetail(options.id);
		}
	},
	methods: {
		getUserInfo() {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo) {
				this.userInfo = userInfo;
			}
		},
		
		async getBookingDetail(id) {
			try {
				const res = await uni.request({
					url: 'http://catdog.dachaonet.com/get_booking_detail.php',
					method: 'GET',
					data: { id }
				});
				
				if (res.data.success) {
					this.bookingData = res.data.data;
					this.ktvInfo = res.data.data.ktv_info || {};
				}
			} catch (error) {
				console.error('获取预约详情失败:', error);
			}
		},
		
		onTimeChange(e) {
			this.timeIndex = e.detail.value;
			const day = this.timeRange[0][this.timeIndex[0]];
			const time = this.timeRange[1][this.timeIndex[1]];
			this.selectedTime = `${day} ${time}`;
		},
		
		onRoomTypeChange(e) {
			this.roomTypeIndex = e.detail.value;
			this.selectedRoomType = this.roomTypes[this.roomTypeIndex].name;
		},
		
		onPeopleCountChange(e) {
			this.peopleCountIndex = e.detail.value;
			this.selectedPeopleCount = this.peopleCounts[this.peopleCountIndex];
		},
		
		async submitBooking() {
			if (!this.canSubmit) return;
			
			uni.showLoading({
				title: '预约中...'
			});
			
			try {
				// 创建预约记录
				const bookingData = {
					ktv_id: this.ktvInfo.id,
					ktv_name: this.ktvInfo.name,
					user_id: this.userInfo.id,
					user_phone: this.userInfo.phone,
					booking_time: this.selectedTime,
					room_type: this.selectedRoomType,
					people_count: this.selectedPeopleCount,
					remark: this.remark
				};
				
				console.log('提交预约数据:', bookingData);
				
				// 调用后台API创建预约
				const response = await uni.request({
					url: 'http://catdog.dachaonet.com/create_booking.php',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: bookingData
				});
				
				console.log('预约API响应:', response);
				
				if (response.statusCode === 200 && response.data.success) {
					// 预约成功
					uni.hideLoading();
					
					// 显示预约成功
					this.showSuccess = true;
					setTimeout(() => {
						this.showSuccess = false;
						uni.navigateBack();
					}, 2000);
					
					// 同时保存到本地存储作为备份
					const localBooking = {
						id: response.data.data.booking_id,
						...bookingData,
						status: 'pending',
						created_at: new Date().toISOString()
					};
					const mockBookings = uni.getStorageSync('mockBookings') || [];
					mockBookings.push(localBooking);
					uni.setStorageSync('mockBookings', mockBookings);
					
				} else {
					// 预约失败
					uni.hideLoading();
					uni.showToast({
						title: response.data?.message || '预约失败',
						icon: 'none',
						duration: 3000
					});
				}
				
			} catch (error) {
				uni.hideLoading();
				console.error('预约失败:', error);
				
				// 网络错误时的降级处理 - 保存到本地
				const fallbackData = {
					id: Date.now(),
					ktv_id: this.ktvInfo.id,
					ktv_name: this.ktvInfo.name,
					user_id: this.userInfo.id,
					user_phone: this.userInfo.phone,
					booking_time: this.selectedTime,
					room_type: this.selectedRoomType,
					people_count: this.selectedPeopleCount,
					remark: this.remark,
					status: 'pending',
					created_at: new Date().toISOString(),
					is_local_only: true // 标记为仅本地数据
				};
				
				const mockBookings = uni.getStorageSync('mockBookings') || [];
				mockBookings.push(fallbackData);
				uni.setStorageSync('mockBookings', mockBookings);
				
				uni.showToast({
					title: '网络异常，已保存到本地',
					icon: 'none',
					duration: 3000
				});
				
				// 显示预约成功（降级模式）
				this.showSuccess = true;
				setTimeout(() => {
					this.showSuccess = false;
					uni.navigateBack();
				}, 2000);
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
		
		goBack() {
			uni.navigateBack();
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
	align-items: center;
	padding: 20rpx 60rpx;
	position: relative;
}

.back-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.back-icon {
	width: 40rpx;
	height: 40rpx;
}

.header-title {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	font-size: 36rpx;
	font-weight: 500;
}

.user-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 60rpx;
}

.user-avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	margin-bottom: 20rpx;
}

.user-name {
	font-size: 32rpx;
	font-weight: 500;
}

.ktv-card {
	margin: 40rpx 60rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 20rpx;
	padding: 40rpx;
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
	display: block;
	font-size: 32rpx;
	font-weight: 500;
	margin-bottom: 10rpx;
}

.ktv-address {
	display: block;
	font-size: 24rpx;
	color: #CCCCCC;
	margin-bottom: 5rpx;
}

.ktv-distance {
	display: block;
	font-size: 24rpx;
	color: #7ED321;
}

.booking-form {
	padding: 0 60rpx;
}

.form-item {
	margin-bottom: 40rpx;
}

.form-label {
	display: block;
	font-size: 28rpx;
	margin-bottom: 20rpx;
	color: #CCCCCC;
}

.picker-input {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 10rpx;
	padding: 30rpx;
	font-size: 32rpx;
	color: white;
}

.remark-input {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 10rpx;
	padding: 30rpx;
	font-size: 32rpx;
	color: white;
	min-height: 120rpx;
	width: 100%;
	box-sizing: border-box;
}

.remark-input::placeholder {
	color: #999999;
}

.booking-info {
	padding: 0 60rpx;
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx 0;
	border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.info-item:last-child {
	border-bottom: none;
}

.info-label {
	font-size: 28rpx;
	color: #CCCCCC;
}

.info-value {
	font-size: 32rpx;
}

.info-value.pending {
	color: #FF9500;
}

.info-value.confirmed {
	color: #7ED321;
}

.info-value.completed {
	color: #999999;
}

.info-value.cancelled {
	color: #FF3B30;
}

.booking-btn-container {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 40rpx 60rpx;
	background: linear-gradient(to top, #2C2C2E, rgba(44, 44, 46, 0.9));
	text-align: center;
}

.booking-btn {
	width: 100%;
	height: 100rpx;
	background: #7ED321;
	border-radius: 50rpx;
	color: #2C2C2E;
	font-size: 32rpx;
	font-weight: 500;
	border: none;
	margin-bottom: 20rpx;
}

.booking-btn.disabled {
	background: #666666;
	color: #999999;
}

.booking-tip {
	font-size: 24rpx;
	color: #999999;
}

.success-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.success-content {
	background: #2C2C2E;
	border-radius: 20rpx;
	padding: 80rpx;
	text-align: center;
}

.success-icon {
	width: 120rpx;
	height: 120rpx;
	background: #7ED321;
	border-radius: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 60rpx;
	color: white;
	margin: 0 auto 40rpx;
}

.success-title {
	display: block;
	font-size: 36rpx;
	font-weight: 500;
	margin-bottom: 20rpx;
}

.success-desc {
	display: block;
	font-size: 28rpx;
	color: #CCCCCC;
}
</style> 