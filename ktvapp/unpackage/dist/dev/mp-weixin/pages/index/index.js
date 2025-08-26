"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      userInfo: {},
      ktvList: [],
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
      common_vendor.index.__f__("log", "at pages/index/index.vue:89", "获取系统信息失败，使用默认值");
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
    // 获取用户位置
    async getUserLocation() {
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:125", "开始获取用户位置...");
        common_vendor.index.showToast({
          title: "正在定位...",
          icon: "loading",
          duration: 2e3
        });
        const locationResult = await common_vendor.index.getLocation({
          type: "gcj02",
          // 国测局坐标系
          isHighAccuracy: true,
          timeout: 1e4,
          // 10秒超时
          geocode: false
          // 不需要地理编码
        });
        this.userLocation = {
          latitude: locationResult.latitude,
          longitude: locationResult.longitude,
          accuracy: locationResult.accuracy
        };
        this.locationPermissionGranted = true;
        common_vendor.index.__f__("log", "at pages/index/index.vue:149", "用户位置获取成功:", this.userLocation);
        common_vendor.index.hideToast();
        this.getKtvList();
      } catch (error) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:158", "获取位置失败:", error);
        common_vendor.index.hideToast();
        if (error.errCode === 2 || error.errMsg && error.errMsg.includes("denied")) {
          common_vendor.index.showModal({
            title: "定位权限",
            content: "为了为您推荐附近的KTV，请在系统设置中允许应用获取位置信息",
            confirmText: "去设置",
            cancelText: "稍后再说",
            success: (res) => {
              if (res.confirm) {
                plus && plus.runtime.openURL("app-settings:");
              }
              this.getKtvList();
            }
          });
        } else if (error.errCode === 3 || error.errMsg && error.errMsg.includes("timeout")) {
          common_vendor.index.showToast({
            title: "定位超时，显示默认列表",
            icon: "none",
            duration: 2e3
          });
          this.getKtvList();
        } else {
          common_vendor.index.__f__("log", "at pages/index/index.vue:190", "使用默认位置或不进行距离排序");
          common_vendor.index.showToast({
            title: "定位失败，显示默认列表",
            icon: "none",
            duration: 2e3
          });
          this.getKtvList();
        }
      }
    },
    async getKtvList() {
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:203", "开始获取KTV列表...");
        let requestData = {};
        if (this.userLocation) {
          requestData.latitude = this.userLocation.latitude;
          requestData.longitude = this.userLocation.longitude;
          common_vendor.index.__f__("log", "at pages/index/index.vue:212", "使用用户位置信息:", this.userLocation);
        } else {
          common_vendor.index.__f__("log", "at pages/index/index.vue:214", "没有用户位置信息，将获取默认KTV列表");
        }
        const res = await common_vendor.index.request({
          url: "http://catdog.dachaonet.com/get_ktv_list.php",
          method: "GET",
          data: requestData,
          header: {
            "Authorization": "Bearer " + common_vendor.index.getStorageSync("token")
          }
        });
        if (res.data.success) {
          this.ktvList = res.data.data || [];
          common_vendor.index.__f__("log", "at pages/index/index.vue:229", "KTV列表获取成功:", this.ktvList);
        } else {
          common_vendor.index.__f__("error", "at pages/index/index.vue:231", "获取KTV列表失败:", res.data.message);
          this.ktvList = [
            {
              id: 1,
              name: "搜索附近的商K",
              distance: "500m",
              rating: 4.8,
              address: "北京市朝阳区三里屯路123号"
            },
            {
              id: 2,
              name: "星光KTV",
              distance: "800m",
              rating: 4.6,
              address: "北京市海淀区中关村大街456号"
            },
            {
              id: 3,
              name: "欢乐颂KTV",
              distance: "1.2km",
              rating: 4.9,
              address: "北京市西城区西单北大街789号"
            }
          ];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:259", "获取KTV列表失败:", error);
        this.ktvList = [
          {
            id: 1,
            name: "搜索附近的商K",
            distance: "500m",
            rating: 4.8,
            address: "北京市朝阳区三里屯路123号"
          },
          {
            id: 2,
            name: "星光KTV",
            distance: "800m",
            rating: 4.6,
            address: "北京市海淀区中关村大街456号"
          }
        ];
      }
    },
    async getLocation() {
      return new Promise((resolve, reject) => {
        common_vendor.index.getLocation({
          type: "gcj02",
          success: resolve,
          fail: reject
        });
      });
    },
    searchKtv() {
      common_vendor.index.showLoading({
        title: "搜索中..."
      });
      setTimeout(() => {
        common_vendor.index.hideLoading();
        this.ktvList = [
          {
            id: 1,
            name: "搜索附近的商K",
            distance: 500,
            rating: 4.8,
            address: "北京市朝阳区xxx路xxx号"
          },
          {
            id: 2,
            name: "星光KTV",
            distance: 800,
            rating: 4.6,
            address: "北京市朝阳区xxx路xxx号"
          },
          {
            id: 3,
            name: "欢乐颂KTV",
            distance: 1200,
            rating: 4.9,
            address: "北京市朝阳区xxx路xxx号"
          }
        ];
      }, 1500);
    },
    bookKtv(item) {
      common_vendor.index.navigateTo({
        url: `/pages/booking/booking?id=${item.id}&name=${encodeURIComponent(item.name)}`
      });
    },
    upgradeVip() {
      common_vendor.index.showToast({
        title: "会员功能开发中",
        icon: "none"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_assets._imports_0,
    c: common_vendor.t($data.userInfo.nickname || "柠檬水橘子"),
    d: common_assets._imports_1,
    e: common_vendor.o((...args) => $options.upgradeVip && $options.upgradeVip(...args)),
    f: $data.ktvList.length > 0
  }, $data.ktvList.length > 0 ? {
    g: common_vendor.f($data.ktvList, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.name),
        b: item.distance
      }, item.distance ? {
        c: common_vendor.t(item.distance)
      } : {}, {
        d: item.rating
      }, item.rating ? {
        e: common_vendor.t(item.rating)
      } : {}, {
        f: item.address
      }, item.address ? {
        g: common_vendor.t(item.address)
      } : {}, {
        h: common_vendor.o(($event) => $options.bookKtv(item), index),
        i: index,
        j: common_vendor.o(($event) => $options.bookKtv(item), index)
      });
    }),
    h: common_assets._imports_0
  } : {
    i: common_assets._imports_0
  }, {
    j: common_vendor.o((...args) => $options.searchKtv && $options.searchKtv(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
