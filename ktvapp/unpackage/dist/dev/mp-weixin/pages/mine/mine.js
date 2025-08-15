"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      userInfo: {},
      cardList: []
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
      common_vendor.index.__f__("log", "at pages/mine/mine.vue:93", "获取系统信息失败，使用默认值");
      this.statusBarHeight = 44;
    }
  },
  onShow() {
    this.getUserInfo();
    this.getCardList();
  },
  methods: {
    getUserInfo() {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (userInfo) {
        this.userInfo = userInfo;
      }
    },
    async getCardList() {
      try {
        common_vendor.index.__f__("log", "at pages/mine/mine.vue:113", "模拟获取包厢卡列表");
        await new Promise((resolve) => setTimeout(resolve, 500));
        const userInfo = common_vendor.index.getStorageSync("userInfo");
        const mockBookings = common_vendor.index.getStorageSync("mockBookings") || [];
        this.cardList = mockBookings.map((booking) => ({
          id: booking.id,
          name: booking.ktv_name,
          status: booking.status,
          booking_time: booking.booking_time,
          room_type: booking.room_type,
          people_count: booking.people_count,
          created_at: booking.created_at
        }));
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/mine/mine.vue:133", "获取包厢卡列表失败:", error);
        this.cardList = [];
      }
    },
    getStatusText(status) {
      const statusMap = {
        "pending": "待确认",
        "confirmed": "已确认",
        "completed": "已完成",
        "cancelled": "已取消"
      };
      return statusMap[status] || "未知";
    },
    viewCard(item) {
      common_vendor.index.navigateTo({
        url: `/pages/booking/booking?id=${item.id}&mode=view`
      });
    },
    upgradeVip() {
      common_vendor.index.showToast({
        title: "会员功能开发中",
        icon: "none"
      });
    },
    goToBookings() {
      common_vendor.index.navigateTo({
        url: "/pages/bookings/bookings"
      });
    },
    goToSettings() {
      common_vendor.index.showToast({
        title: "设置功能开发中",
        icon: "none"
      });
    },
    logout() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.removeStorageSync("userInfo");
            common_vendor.index.removeStorageSync("token");
            common_vendor.index.redirectTo({
              url: "/pages/login/login"
            });
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_assets._imports_0$2,
    c: common_vendor.t($data.userInfo.nickname || "柠檬水橘子"),
    d: common_assets._imports_1$1,
    e: common_vendor.o((...args) => $options.upgradeVip && $options.upgradeVip(...args)),
    f: $data.cardList.length > 0
  }, $data.cardList.length > 0 ? {
    g: common_vendor.f($data.cardList, (item, index, i0) => {
      return {
        a: common_vendor.t(item.name),
        b: common_vendor.t($options.getStatusText(item.status)),
        c: common_vendor.n(item.status),
        d: index,
        e: common_vendor.o(($event) => $options.viewCard(item), index)
      };
    }),
    h: common_assets._imports_0
  } : {
    i: common_assets._imports_0
  }, {
    j: common_assets._imports_0$1,
    k: common_vendor.o((...args) => $options.goToBookings && $options.goToBookings(...args)),
    l: common_assets._imports_0$1,
    m: common_vendor.o((...args) => $options.goToSettings && $options.goToSettings(...args)),
    n: common_assets._imports_0$1,
    o: common_vendor.o((...args) => $options.logout && $options.logout(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7c2ebfa5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/mine/mine.js.map
