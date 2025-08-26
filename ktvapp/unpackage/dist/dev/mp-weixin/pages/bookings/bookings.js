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
    async getBookingList() {
      try {
        const userInfo = common_vendor.index.getStorageSync("userInfo");
        if (!userInfo || !userInfo.phone) {
          common_vendor.index.showToast({
            title: "请先登录",
            icon: "none"
          });
          return;
        }
        common_vendor.index.showLoading({
          title: "加载中..."
        });
        const response = await common_vendor.index.request({
          url: `http://catdog.dachaonet.com/get_user_bookings.php?user_phone=${userInfo.phone}`,
          method: "GET"
        });
        common_vendor.index.__f__("log", "at pages/bookings/bookings.vue:130", "预约列表API响应:", response);
        if (response.statusCode === 200 && response.data.success) {
          this.bookingList = response.data.data.bookings || [];
        } else {
          common_vendor.index.__f__("warn", "at pages/bookings/bookings.vue:137", "API获取失败，使用本地数据");
          const mockBookings = common_vendor.index.getStorageSync("mockBookings") || [];
          this.bookingList = mockBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        common_vendor.index.hideLoading();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/bookings/bookings.vue:145", "获取预约列表失败:", error);
        common_vendor.index.hideLoading();
        const mockBookings = common_vendor.index.getStorageSync("mockBookings") || [];
        this.bookingList = mockBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        common_vendor.index.showToast({
          title: "网络异常，显示本地数据",
          icon: "none"
        });
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
        success: async (res) => {
          var _a;
          if (res.confirm) {
            try {
              const userInfo = common_vendor.index.getStorageSync("userInfo");
              if (!userInfo || !userInfo.phone) {
                common_vendor.index.showToast({
                  title: "请先登录",
                  icon: "none"
                });
                return;
              }
              common_vendor.index.showLoading({
                title: "取消中..."
              });
              const response = await common_vendor.index.request({
                url: "http://catdog.dachaonet.com/cancel_booking.php",
                method: "POST",
                header: {
                  "Content-Type": "application/json"
                },
                data: {
                  booking_id: item.id,
                  user_phone: userInfo.phone
                }
              });
              common_vendor.index.__f__("log", "at pages/bookings/bookings.vue:214", "取消预约API响应:", response);
              if (response.statusCode === 200 && response.data.success) {
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({
                  title: "预约已取消",
                  icon: "success"
                });
                this.getBookingList();
                const mockBookings = common_vendor.index.getStorageSync("mockBookings") || [];
                const index = mockBookings.findIndex((booking) => booking.id === item.id);
                if (index !== -1) {
                  mockBookings[index].status = "cancelled";
                  common_vendor.index.setStorageSync("mockBookings", mockBookings);
                }
              } else {
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({
                  title: ((_a = response.data) == null ? void 0 : _a.message) || "取消失败",
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/bookings/bookings.vue:245", "取消预约失败:", error);
              common_vendor.index.hideLoading();
              const mockBookings = common_vendor.index.getStorageSync("mockBookings") || [];
              const index = mockBookings.findIndex((booking) => booking.id === item.id);
              if (index !== -1) {
                mockBookings[index].status = "cancelled";
                mockBookings[index].is_local_cancelled = true;
                common_vendor.index.setStorageSync("mockBookings", mockBookings);
                this.getBookingList();
                common_vendor.index.showToast({
                  title: "网络异常，已本地取消",
                  icon: "none"
                });
              } else {
                common_vendor.index.showToast({
                  title: "取消失败",
                  icon: "none"
                });
              }
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
