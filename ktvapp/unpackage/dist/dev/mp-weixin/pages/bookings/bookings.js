"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      bookingList: []
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
      common_vendor.index.__f__("log", "at pages/bookings/bookings.vue:101", "获取系统信息失败，使用默认值");
      this.statusBarHeight = 44;
    }
    this.getBookingList();
  },
  methods: {
    getBookingList() {
      const mockBookings = common_vendor.index.getStorageSync("mockBookings") || [];
      this.bookingList = mockBookings.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
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
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString("zh-CN");
    },
    viewBooking(item) {
      common_vendor.index.navigateTo({
        url: `/pages/booking/booking?id=${item.id}&mode=view`
      });
    },
    cancelBooking(item) {
      common_vendor.index.showModal({
        title: "确认取消",
        content: "确定要取消这个预约吗？",
        success: (res) => {
          if (res.confirm) {
            const mockBookings = common_vendor.index.getStorageSync("mockBookings") || [];
            const index = mockBookings.findIndex((booking) => booking.id === item.id);
            if (index !== -1) {
              mockBookings[index].status = "cancelled";
              common_vendor.index.setStorageSync("mockBookings", mockBookings);
              this.getBookingList();
              common_vendor.index.showToast({
                title: "预约已取消",
                icon: "success"
              });
            }
          }
        }
      });
    },
    contactService() {
      common_vendor.index.showModal({
        title: "联系客服",
        content: "客服电话：400-123-4567\n工作时间：9:00-22:00",
        showCancel: false,
        confirmText: "知道了"
      });
    },
    goToHome() {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    },
    goBack() {
      common_vendor.index.navigateBack();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.bookingList.length > 0
  }, $data.bookingList.length > 0 ? {
    d: common_vendor.f($data.bookingList, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.ktv_name),
        b: common_vendor.t(item.id),
        c: common_vendor.t($options.getStatusText(item.status)),
        d: common_vendor.n(item.status),
        e: common_vendor.t(item.booking_time),
        f: common_vendor.t(item.room_type),
        g: common_vendor.t(item.people_count),
        h: item.remark
      }, item.remark ? {
        i: common_vendor.t(item.remark)
      } : {}, {
        j: common_vendor.t($options.formatDate(item.created_at)),
        k: item.status === "pending"
      }, item.status === "pending" ? {
        l: common_vendor.o(($event) => $options.cancelBooking(item), index)
      } : {}, {
        m: item.status === "confirmed"
      }, item.status === "confirmed" ? {
        n: common_vendor.o((...args) => $options.contactService && $options.contactService(...args), index)
      } : {}, {
        o: index,
        p: common_vendor.o(($event) => $options.viewBooking(item), index)
      });
    })
  } : {
    e: common_assets._imports_0,
    f: common_vendor.o((...args) => $options.goToHome && $options.goToHome(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-8e81932b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/bookings/bookings.js.map
