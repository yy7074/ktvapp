"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const CustomTabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
const _sfc_main = {
  components: {
    CustomTabbar
  },
  data() {
    return {
      statusBarHeight: 0,
      userInfo: {},
      userLocation: null,
      // 用户位置信息
      locationPermissionGranted: false
      // 定位权限状态
    };
  },
  onLoad() {
    try {
      if (common_vendor.index.getWindowInfo) {
        const windowInfo = common_vendor.index.getWindowInfo();
        this.statusBarHeight = windowInfo.statusBarHeight;
      } else {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        this.statusBarHeight = systemInfo.statusBarHeight;
      }
    } catch (error) {
      common_vendor.index.__f__("log", "at pages/index/index.vue:68", "获取系统信息失败，使用默认值");
      this.statusBarHeight = 44;
    }
    this.checkLogin();
    this.getUserLocation();
  },
  onShow() {
    this.getUserInfo();
  },
  methods: {
    checkLogin() {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (!userInfo) {
        common_vendor.index.redirectTo({
          url: "/pages/login/login"
        });
      } else {
        this.userInfo = userInfo;
      }
    },
    getUserInfo() {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (userInfo) {
        this.userInfo = userInfo;
      }
    },
    // 检查并请求定位权限
    async checkLocationPermission() {
      return new Promise((resolve, reject) => {
        common_vendor.index.getSetting({
          success: (res) => {
            if (res.authSetting["scope.userLocation"]) {
              common_vendor.index.__f__("log", "at pages/index/index.vue:110", "微信小程序定位权限已授权");
              resolve();
            } else if (res.authSetting["scope.userLocation"] === false) {
              common_vendor.index.showModal({
                title: "定位权限",
                content: "为了为您推荐附近的KTV，请在设置中开启定位权限",
                confirmText: "去设置",
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    common_vendor.index.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting["scope.userLocation"]) {
                          resolve();
                        } else {
                          reject(new Error("用户未开启定位权限"));
                        }
                      }
                    });
                  } else {
                    reject(new Error("用户拒绝开启定位权限"));
                  }
                }
              });
            } else {
              resolve();
            }
          }
        });
      });
    },
    // 获取用户位置
    async getUserLocation() {
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:170", "开始获取用户位置...");
        await this.checkLocationPermission();
        common_vendor.index.showToast({
          title: "正在定位...",
          icon: "loading",
          duration: 2e3
        });
        const locationResult = await common_vendor.index.getLocation({
          type: "gcj02",
          // 国测局坐标系
          isHighAccuracy: true,
          timeout: 15e3,
          // 15秒超时
          geocode: false,
          // 不需要地理编码
          altitude: false
          // 不需要海拔信息
        });
        this.userLocation = {
          latitude: locationResult.latitude,
          longitude: locationResult.longitude,
          accuracy: locationResult.accuracy
        };
        this.locationPermissionGranted = true;
        common_vendor.index.__f__("log", "at pages/index/index.vue:198", "用户位置获取成功:", this.userLocation);
        common_vendor.index.hideToast();
        common_vendor.index.showToast({
          title: "定位成功",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:211", "获取位置失败:", error);
        common_vendor.index.hideToast();
        if (error.errCode === 2 || error.errMsg && error.errMsg.includes("denied") || error.message === "App定位权限被拒绝") {
          common_vendor.index.showModal({
            title: "定位权限",
            content: "为了为您推荐附近的KTV，需要开启定位权限。您可以在系统设置中开启。",
            confirmText: "去设置",
            cancelText: "稍后再说",
            success: (res) => {
              if (res.confirm) {
                common_vendor.index.openSetting();
              }
            }
          });
        } else if (error.errCode === 3 || error.errMsg && error.errMsg.includes("timeout")) {
          common_vendor.index.showToast({
            title: "定位超时，可稍后重试",
            icon: "none",
            duration: 2e3
          });
        } else if (error.errCode === 1002 || error.errMsg && error.errMsg.includes("network")) {
          common_vendor.index.showToast({
            title: "网络异常，可稍后重试",
            icon: "none",
            duration: 2e3
          });
        } else {
          common_vendor.index.__f__("log", "at pages/index/index.vue:252", "定位失败，使用默认位置:", error);
          common_vendor.index.showToast({
            title: "定位失败，仍可继续预约",
            icon: "none",
            duration: 1500
          });
        }
      }
    },
    async makeBooking() {
      var _a, _b;
      try {
        if (!this.userLocation) {
          common_vendor.index.showToast({
            title: "正在获取位置...",
            icon: "loading"
          });
          try {
            await this.getUserLocation();
          } catch (error) {
            common_vendor.index.__f__("log", "at pages/index/index.vue:274", "获取位置失败，但仍可继续预约");
          }
        }
        common_vendor.index.showLoading({
          title: "提交预约中..."
        });
        const bookingData = {
          user_phone: this.userInfo.phone || "",
          user_name: this.userInfo.nickname || "柠檬水橘子",
          booking_time: (/* @__PURE__ */ new Date()).toLocaleString("zh-CN"),
          latitude: ((_a = this.userLocation) == null ? void 0 : _a.latitude) || "",
          longitude: ((_b = this.userLocation) == null ? void 0 : _b.longitude) || "",
          remark: "KTV预约 - 从首页快速预约"
        };
        const res = await common_vendor.index.request({
          url: "http://catdog.dachaonet.com/quick_booking.php",
          method: "POST",
          data: bookingData,
          header: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + common_vendor.index.getStorageSync("token")
          }
        });
        common_vendor.index.hideLoading();
        if (res.data.success) {
          common_vendor.index.showToast({
            title: "预约成功，客服将联系您",
            icon: "success",
            duration: 3e3
          });
        } else {
          common_vendor.index.showToast({
            title: res.data.message || "预约失败，请重试",
            icon: "none",
            duration: 2e3
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:321", "预约失败:", error);
        common_vendor.index.hideLoading();
        const bookingInfo = {
          user: this.userInfo.nickname || "柠檬水橘子",
          phone: this.userInfo.phone || "",
          time: (/* @__PURE__ */ new Date()).toLocaleString("zh-CN"),
          location: this.userLocation
        };
        const localBookings = common_vendor.index.getStorageSync("local_bookings") || [];
        localBookings.push(bookingInfo);
        common_vendor.index.setStorageSync("local_bookings", localBookings);
        common_vendor.index.showToast({
          title: "预约已记录，客服将联系您",
          icon: "success",
          duration: 3e3
        });
      }
    }
  }
};
if (!Array) {
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  _easycom_custom_tabbar2();
}
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
if (!Math) {
  _easycom_custom_tabbar();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: common_assets._imports_0,
    c: common_vendor.t($data.userInfo.nickname || "柠檬水橘子"),
    d: common_vendor.o((...args) => $options.makeBooking && $options.makeBooking(...args)),
    e: common_vendor.p({
      current: 0
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
