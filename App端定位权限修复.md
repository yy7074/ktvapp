# App端定位权限修复

## 🚨 发现的问题

用户在App端遇到错误：
```
TypeError: uni.authorize is not a function
```

## 🔍 问题分析

### 原因
`uni.authorize` API在App端的支持情况与小程序不同：
- **小程序端**: 支持 `uni.authorize` 预先请求权限
- **App端**: 不支持或表现不一致，需要直接调用功能API

### App端定位权限机制
在App端，定位权限的处理方式：
1. 直接调用 `uni.getLocation()`
2. 系统会自动弹出权限请求对话框
3. 用户同意/拒绝后，API返回相应结果或错误

## ✅ 修复方案

### 1. 移除 uni.authorize 调用
```javascript
// 修复前：App端不支持
const authResult = await uni.authorize({
    scope: 'scope.userLocation'
});

// 修复后：直接调用定位API
const locationResult = await uni.getLocation({
    type: 'gcj02',
    isHighAccuracy: true,
    timeout: 10000,
    geocode: false
});
```

### 2. 优化定位参数
```javascript
uni.getLocation({
    type: 'gcj02',           // 国测局坐标系，适合国内地图
    isHighAccuracy: true,    // 高精度定位
    timeout: 10000,          // 10秒超时，避免长时间等待
    geocode: false           // 不需要地理编码，提升性能
});
```

### 3. 完善错误处理
```javascript
catch (error) {
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
        uni.showToast({
            title: '定位失败，显示默认列表',
            icon: 'none',
            duration: 2000
        });
        this.getKtvList();
    }
}
```

## 🔄 修复后的流程

### App端定位流程
```
1. 页面加载
   ↓
2. 显示"正在定位..."提示
   ↓
3. 直接调用 uni.getLocation()
   ├── 系统自动弹出权限请求对话框
   ├── 用户同意 → 获取位置成功 → 按距离排序KTV
   └── 用户拒绝 → 捕获错误 → 显示权限说明 → 加载默认KTV列表
```

### 错误码对应
- `errCode: 2` - 用户拒绝权限
- `errCode: 3` - 定位超时
- 其他错误 - 网络问题、GPS信号差等

## 📱 App端特殊处理

### 1. 权限设置跳转
```javascript
// App端打开系统设置
plus && plus.runtime.openURL('app-settings:');
```

### 2. 用户体验优化
- ✅ 明确的加载提示
- ✅ 详细的权限说明
- ✅ 友好的错误提示
- ✅ 降级处理方案

### 3. 超时处理
- ✅ 10秒超时设置
- ✅ 超时后自动降级
- ✅ 避免用户长时间等待

## 🎯 兼容性说明

### 不同平台的权限处理
| 平台 | 权限预请求 | 定位调用 | 设置跳转 |
|------|------------|----------|----------|
| App端 | ❌ 不支持uni.authorize | ✅ 直接调用uni.getLocation | ✅ plus.runtime.openURL |
| 小程序 | ✅ 支持uni.authorize | ✅ uni.getLocation | ✅ uni.openSetting |
| H5端 | ❌ 不需要 | ✅ uni.getLocation | ❌ 不支持 |

### 统一处理方案
```javascript
// 可以根据平台进行不同处理
// #ifdef APP-PLUS
// App端特殊处理
// #endif

// #ifdef MP-WEIXIN
// 小程序特殊处理
// #endif

// #ifdef H5
// H5端特殊处理
// #endif
```

## ✅ 修复验证

### 测试结果
- ✅ App端不再报错 `uni.authorize is not a function`
- ✅ 系统正确弹出定位权限请求
- ✅ 用户同意后成功获取位置信息
- ✅ 用户拒绝后正确显示默认KTV列表
- ✅ 定位超时后自动降级处理

### 用户体验
- ✅ 流畅的权限请求流程
- ✅ 清晰的状态提示
- ✅ 友好的错误处理
- ✅ 完善的降级方案

---

**修复时间**: 2025年8月15日  
**问题**: App端uni.authorize不支持  
**解决方案**: 直接调用uni.getLocation + 完善错误处理  
**状态**: ✅ 修复完成 