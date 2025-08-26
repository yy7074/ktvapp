<template>
	<view class="custom-tabbar">
		<!-- 圆角背景容器 -->
		<view class="tabbar-container">
			<view 
				class="tabbar-item" 
				v-for="(item, index) in tabList" 
				:key="index"
				@click="switchTab(index)"
				:class="{ 'active': current === index }"
			>
				<!-- 图标 -->
				<image 
					:src="current === index ? item.selectedIconPath : item.iconPath" 
					class="tabbar-icon"
					mode="aspectFit"
				></image>
				<!-- 文字 -->
				<text class="tabbar-text" :class="{ 'active': current === index }">
					{{ item.text }}
				</text>
			</view>
		</view>
		<!-- 底部安全区域 -->
		<view class="safe-area-bottom" :style="{ height: safeAreaBottom + 'px' }"></view>
	</view>
</template>

<script>
export default {
	name: 'CustomTabbar',
	props: {
		current: {
			type: Number,
			default: 0
		}
	},
	data() {
		return {
			tabList: [
				{
					text: '首页',
					pagePath: '/pages/index/index',
					iconPath: '/static/tabbar/home.png',
					selectedIconPath: '/static/tabbar/home-active.png'
				},
				{
					text: '我的',
					pagePath: '/pages/mine/mine',
					iconPath: '/static/tabbar/mine.png',
					selectedIconPath: '/static/tabbar/mine-active.png'
				}
			],
			safeAreaBottom: 0
		}
	},
	created() {
		// 获取底部安全区域高度
		try {
			const systemInfo = uni.getSystemInfoSync();
			this.safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
		} catch (error) {
			console.log('获取安全区域失败');
			this.safeAreaBottom = 0;
		}
	},
	methods: {
		switchTab(index) {
			if (index === this.current) return;
			
			const url = this.tabList[index].pagePath;
			uni.switchTab({ url });
		}
	}
}
</script>

<style scoped>
.custom-tabbar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 1000;
}

/* 圆角背景容器 - 全屏宽度但保持圆角 */
.tabbar-container {
	background: #1C1C1E;
	margin: 0;
	border-radius: 40rpx 40rpx 0 0;
	display: flex;
	padding: 20rpx 0 28rpx 0;
	box-shadow: 0 -6rpx 24rpx rgba(0, 0, 0, 0.4);
	position: relative;
	width: 100%;
}

/* tabbar项目 */
.tabbar-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 8rpx 0;
}

/* 图标样式 */
.tabbar-icon {
	width: 48rpx;
	height: 48rpx;
	margin-bottom: 8rpx;
}

/* 文字样式 */
.tabbar-text {
	font-size: 20rpx;
	color: #8E8E93;
	line-height: 1.2;
	transition: color 0.2s ease;
}

.tabbar-text.active {
	color: #FF9500;
	font-weight: 500;
}

/* 底部安全区域 */
.safe-area-bottom {
	background: #1C1C1E;
	margin: 0;
	width: 100%;
}
</style>