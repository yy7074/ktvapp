<template>
	<view class="login-container" :class="{ 'code-mode': showCodeInput }">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{height: statusBarHeight + 'px'}"></view>
		
		<!-- 返回按钮 -->
		<view class="back-btn" @click="goBack" v-if="canGoBack">
			<text class="back-icon">‹</text>
		</view>
		
		<!-- Logo与标题区域（根据状态切换装饰图） -->
		<view class="logo-section">
			<view class="logo-container">
				<!-- 使用设计图替换K标识 -->
				<image class="k-logo-img" :src="kLogoSrc" mode="widthFix" />
			</view>
			<view class="welcome-text" v-if="!showCodeInput">嗨，我是商K预约</view>
			<view class="welcome-title" v-else>欢迎登录</view>
			<view class="description-container" v-if="!showCodeInput">
				<text class="description">在这里你可以搜索附近的商K</text>
				<text class="description">并由客服按照你的喜好预约</text>
			</view>
		</view>
		
		<!-- 登录表单卡片 -->
		<view class="login-card">
			<view class="login-form">
				<view class="form-title" v-if="!showCodeInput">验证码登录</view>
				<view class="form-title" v-else>请输入验证码</view>
				
				<view class="input-container" v-if="!showCodeInput">
					<view class="phone-input-wrapper">
						<view class="phone-icon">📱</view>
						<input 
							class="phone-input" 
							v-model="phone" 
							placeholder="请输入你的手机号" 
							type="number"
							maxlength="11"
						/>
					</view>
				</view>
				
				<view class="code-input-group" v-if="showCodeInput">
					<text class="code-sent">验证码已通过短信发送至:</text>
					<text class="phone-display">+ 86 {{ phone }}</text>
					<button class="resend-btn" @click="resendCode">重新获取</button>
					
					<view class="code-inputs">
						<input 
							v-for="(item, index) in codeArray" 
							:key="index"
							:ref="`codeInput${index}`"
							:class="['code-digit', `code-digit-${index}`, { 'active': currentInputIndex === index, 'filled': codeArray[index] }]"
							v-model="codeArray[index]" 
							type="number" 
							maxlength="1"
							@input="onCodeInput(index, $event)"
							@focus="onInputFocus(index)"
							@blur="onInputBlur(index)"
							:focus="currentInputIndex === index"
							:cursor-spacing="0"
							:selection-start="0"
							:selection-end="1"
						/>
					</view>
				</view>
				
				<button 
					class="main-btn" 
					:class="{ 'disabled': !canSubmit }" 
					@click="handleLogin"
					:disabled="!canSubmit"
				>
					{{ showCodeInput ? '登录' : '获取验证码' }}
				</button>
			</view>
			
			<!-- 协议（仅手机号页显示） -->
			<view class="agreement" v-if="!showCodeInput">
				<view class="agreement-item" @click="toggleAgreement">
					<view class="checkbox" :class="{ 'checked': agreed }">
						<text class="checkmark" v-if="agreed">✓</text>
					</view>
					<text class="agreement-text">我已阅读并同意《用户协议》和《隐私政策》</text>
				</view>
			</view>
			
			<!-- 底部 -->
			<view class="footer">
				<text class="footer-text">安全 透明 有保障</text>
				<view class="apple-logo">
					<text class="apple-icon"></text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 0,
			phone: '',
			codeArray: ['', '', '', ''],
			showCodeInput: false,
			agreed: true,
			countdown: 0,
			timer: null,
			canGoBack: false,
			currentInputIndex: 0, // 当前激活的输入框索引
			isAutoSubmitting: false // 防止重复提交
		}
	},
	computed: {
		canSubmit() {
			if (!this.showCodeInput) {
				return this.phone.length === 11 && this.agreed;
			} else {
				return this.codeArray.every(code => code !== '') && this.agreed;
			}
		},
		kLogoSrc() {
			// 统一使用项目静态资源中的K图标
			return '/static/k-logo.jpg';
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
		
		// 检查是否可以返回
		const pages = getCurrentPages();
		this.canGoBack = pages.length > 1;
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},
		
		async handleLogin() {
			if (!this.canSubmit) return;
			
			if (!this.showCodeInput) {
				// 发送验证码
				await this.sendCode();
			} else {
				// 验证登录
				await this.login();
			}
		},
		
		async sendCode() {
			try {
				// 调用真实的短信API（可替换为本地地址）
				const res = await uni.request({
					url: 'http://catdog.dachaonet.com/send_code.php',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: {
						phone: this.phone
					}
				});
				
				if (res.data.success) {
					this.showCodeInput = true;
					this.startCountdown();
					
					// 清空之前的验证码
					this.codeArray = ['', '', '', ''];
					this.currentInputIndex = 0;
					
					// 延迟聚焦到第一个输入框
					this.$nextTick(() => {
						setTimeout(() => {
							this.focusInput(0);
						}, 100);
					});
					
					uni.showToast({
						title: '验证码已发送',
						icon: 'success'
					});
				} else {
					throw new Error(res.data.message || '发送失败');
				}
				
			} catch (error) {
				console.error('发送验证码失败:', error);
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				});
			}
		},
		
		async login() {
			try {
				const code = this.codeArray.join('');
				
				if (!code || code.length !== 4) {
					uni.showToast({
						title: '请输入4位验证码',
						icon: 'none'
					});
					return;
				}
				
				// 调用真实的登录API（可替换为本地地址）
				const res = await uni.request({
					url: 'http://catdog.dachaonet.com/login.php',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: {
						phone: this.phone,
						code: code
					}
				});
				
				if (res.data.success) {
					// 保存用户信息和token
					uni.setStorageSync('userInfo', res.data.data.user);
					uni.setStorageSync('token', res.data.data.token);
				} else {
					uni.showToast({
						title: res.data.message || '登录失败',
						icon: 'none'
					});
					return;
				}
				
				uni.showToast({
					title: '登录成功',
					icon: 'success'
				});
				
				// 跳转到首页
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/index/index'
					});
				}, 1500);
				
			} catch (error) {
				console.error('登录失败:', error);
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				});
			}
		},
		
		resendCode() {
			if (this.countdown > 0) return;
			this.sendCode();
		},
		
		startCountdown() {
			this.countdown = 60;
			this.timer = setInterval(() => {
				this.countdown--;
				if (this.countdown <= 0) {
					clearInterval(this.timer);
				}
			}, 1000);
		},
		
		onCodeInput(index, event) {
			let value = event.detail.value;
			
			// 只允许输入数字
			if (!/^\d*$/.test(value)) {
				this.codeArray[index] = '';
				return;
			}
			
			// 如果输入多位数字，只取最后一位
			if (value.length > 1) {
				value = value.slice(-1);
			}
			
			// 更新当前位置的值
			this.$set(this.codeArray, index, value);
			
			// 如果有输入值，自动移动到下一个输入框
			if (value) {
				if (index < 3) {
					this.moveToNextInput(index + 1);
				} else {
					// 最后一位输入完成，检查是否所有位都已填写
					this.checkAutoSubmit();
				}
			}
		},
		
		moveToNextInput(nextIndex) {
			this.currentInputIndex = nextIndex;
			this.$nextTick(() => {
				this.focusInput(nextIndex);
			});
		},
		
		checkAutoSubmit() {
			// 检查是否所有验证码都已输入
			const isComplete = this.codeArray.every(code => code !== '');
			if (isComplete && !this.isAutoSubmitting) {
				this.isAutoSubmitting = true;
				
				// 给用户一点时间看到完整的验证码
				setTimeout(() => {
					if (this.canSubmit) {
						this.handleLogin();
					}
					this.isAutoSubmitting = false;
				}, 300);
			}
		},
		
		focusInput(index) {
			// 聚焦到指定的输入框
			try {
				// 在App端，使用uni-app的focus属性
				this.currentInputIndex = index;
			} catch (error) {
				console.log('聚焦失败:', error);
			}
		},
		
		onInputFocus(index) {
			// 当输入框获得焦点时
			this.currentInputIndex = index;
			
			// 如果当前输入框已有内容，选中它
			this.$nextTick(() => {
				try {
					const inputRef = this.$refs[`codeInput${index}`];
					if (inputRef && inputRef[0]) {
						inputRef[0].select();
					}
				} catch (error) {
					// 忽略选中失败的错误
				}
			});
		},
		
		onInputBlur(index) {
			// 输入框失去焦点时的处理
			// 这里可以添加一些失焦的逻辑
		},
		
		// 清空验证码并重新开始
		clearCode() {
			this.codeArray = ['', '', '', ''];
			this.currentInputIndex = 0;
			this.isAutoSubmitting = false;
			this.$nextTick(() => {
				this.focusInput(0);
			});
		},
		
		// 处理删除操作
		onDeleteCode(index) {
			if (this.codeArray[index]) {
				// 如果当前位置有值，清除当前位置
				this.$set(this.codeArray, index, '');
			} else if (index > 0) {
				// 如果当前位置没有值，清除前一位并跳转到前一位
				this.$set(this.codeArray, index - 1, '');
				this.moveToNextInput(index - 1);
			}
		},
		
		toggleAgreement() {
			this.agreed = !this.agreed;
		}
	},
	
	onUnload() {
		if (this.timer) {
			clearInterval(this.timer);
		}
	}
}
</script>

<style scoped>
.login-container {
	min-height: 100vh;
	background: #323641;
	color: white;
	position: relative;
	display: flex;
	flex-direction: column;
	padding: 0;
}

/* 验证码页：顶部右侧小K装饰，整体更紧凑 */
.login-container.code-mode .logo-section {
	padding-top: 80rpx;
	margin-bottom: 40rpx;
}

.status-bar {
	width: 100%;
}

.back-btn {
	position: absolute;
	top: 100rpx;
	left: 40rpx;
	width: 50rpx;
	height: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
}

.back-icon {
	font-size: 40rpx;
	color: white;
	font-weight: 200;
}

.logo-section {
	text-align: center;
	padding-top: 150rpx;
	margin-bottom: 120rpx;
	position: relative;
}

.logo-container {
	display: inline-block;
	margin-bottom: 60rpx;
	position: relative;
}

/* 使用设计图的K图形替代 */
.k-logo-img {
	width: 180rpx;
	display: block;
	margin: 0 auto;
}

/* 验证码页的小K放到右上角 */
.login-container.code-mode .k-logo-img {
	width: 150rpx;
	position: absolute;
	right: 60rpx;
	top: 0;
	transform: translateY(-40rpx);
}

.welcome-text {
	font-size: 36rpx;
	font-weight: 500;
	margin-bottom: 40rpx;
	color: #FFFFFF;
	letter-spacing: 1rpx;
}

.welcome-title {
	font-size: 48rpx;
	font-weight: 700;
	color: #FFFFFF;
	text-align: left;
	padding: 0 40rpx;
}

.description-container {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	padding: 0 40rpx;
}

.description {
	font-size: 28rpx;
	color: #CCCCCC;
	line-height: 1.4;
	font-weight: 400;
}

.login-card {
	flex: 1;
	background: #21212A;
	border-radius: 50rpx 50rpx 0 0;
	padding-bottom: 0;
	margin-top: 40rpx;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.3);
	display: flex;
	flex-direction: column;
	min-height: 0;
}

.login-form {
	padding: 50rpx 40rpx 40rpx 40rpx;
	background: transparent;
	margin: 0;
	border-radius: 0;
	backdrop-filter: none;
	border: none;
	box-shadow: none;
}

.form-title {
	font-size: 32rpx;
	font-weight: 600;
	margin-bottom: 50rpx;
	position: relative;
	color: #FFFFFF;
	padding-left: 0;
}

.form-title::after {
	content: '';
	position: absolute;
	left: 0;
	bottom: -12rpx;
	width: 50rpx;
	height: 6rpx;
	background: #7ED321;
	border-radius: 3rpx;
}

/* 验证码页标题与按钮间距更接近视觉 */
.login-container.code-mode .form-title {
	margin-bottom: 30rpx;
}

.input-container {
	margin-bottom: 50rpx;
}

.phone-input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 50rpx;
	padding: 0 30rpx;
	height: 100rpx;
	border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.phone-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
	opacity: 0.6;
}

.phone-input {
	flex: 1;
	height: 100%;
	background: transparent;
	font-size: 32rpx;
	color: white;
	border: none;
	font-weight: 400;
}

.phone-input::placeholder {
	color: #999999;
	font-weight: 300;
}

.code-input-group {
	margin-bottom: 30rpx;
	padding: 0 20rpx;
	position: relative;
}

.code-sent {
	font-size: 28rpx;
	color: #B8B8B8;
	display: block;
	margin-bottom: 10rpx;
	font-weight: 300;
}

.phone-display {
	font-size: 44rpx;
	font-weight: 600;
	display: block;
	margin-bottom: 20rpx;
	color: #FFFFFF;
	letter-spacing: 2rpx;
}

.resend-btn {
	position: absolute;
	right: 20rpx;
	top: 0;
	background: #7ED321;
	color: #1C1C1E;
	border: none;
	font-size: 26rpx;
	padding: 14rpx 28rpx;
	border-radius: 40rpx;
	font-weight: 600;
}

.code-inputs {
	display: flex;
	justify-content: center;
	gap: 20rpx;
	margin-top: 40rpx;
}

.code-digit {
	width: 120rpx;
	height: 120rpx;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 24rpx;
	text-align: center;
	font-size: 48rpx;
	color: white;
	border: 1.5rpx solid rgba(255, 255, 255, 0.15);
	font-weight: 600;
	box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;
	caret-color: #7ED321;
}

.code-digit.active {
	border-color: #7ED321;
	background: rgba(126, 211, 33, 0.1);
	box-shadow: 
		inset 0 2rpx 8rpx rgba(0, 0, 0, 0.1),
		0 0 0 4rpx rgba(126, 211, 33, 0.2);
	transform: scale(1.05);
}

.code-digit.filled {
	background: rgba(126, 211, 33, 0.15);
	border-color: #7ED321;
	color: #7ED321;
}

.code-digit:focus {
	outline: none;
}

.main-btn {
	width: 100%;
	height: 100rpx;
	background: linear-gradient(135deg, #7ED321 0%, #5CB85C 100%);
	border-radius: 50rpx;
	color: #1C1C1E;
	font-size: 32rpx;
	font-weight: 700;
	border: none;
	margin-bottom: 40rpx;
	box-shadow: 0 6rpx 20rpx rgba(126, 211, 33, 0.4);
	letter-spacing: 1rpx;
}

.main-btn.disabled {
	background: rgba(255, 255, 255, 0.2);
	color: #666666;
	box-shadow: none;
}

.agreement {
	padding: 0 50rpx;
	margin: 40rpx 0 60rpx 0;
}

.agreement-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	cursor: pointer;
}

.checkbox {
	width: 40rpx;
	height: 40rpx;
	border: 3rpx solid #7ED321;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	flex-shrink: 0;
}

.checkbox.checked {
	background: #7ED321;
}

.checkmark {
	color: white;
	font-size: 24rpx;
	font-weight: bold;
}

.agreement-text {
	font-size: 28rpx;
	color: #DDDDDD;
	line-height: 1.5;
	flex: 1;
	font-weight: 400;
}

.footer {
	text-align: center;
	padding-bottom: 80rpx;
	margin-top: auto;
	padding-top: 40rpx;
}

.footer-text {
	font-size: 28rpx;
	color: #999999;
	margin-bottom: 40rpx;
	font-weight: 400;
	letter-spacing: 2rpx;
}

.apple-logo {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 80rpx;
	height: 80rpx;
	margin: 0 auto;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 40rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.15);
}

.apple-icon {
	width: 40rpx;
	height: 40rpx;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z'/%3E%3C/svg%3E");
	background-size: contain;
	background-repeat: no-repeat;
	background-position: center;
	opacity: 0.8;
}
</style> 