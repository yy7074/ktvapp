"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      userInfo: {},
      ktvInfo: {},
      mode: "book",
      // book: 预约模式, view: 查看模式
      bookingData: null,
      // 预约表单数据
      timeIndex: [0, 0],
      timeRange: [
        ["今天", "明天", "后天"],
        ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"]
      ],
      selectedTime: "",
      roomTypeIndex: 0,
      roomTypes: [
        { name: "小包厢", capacity: "2-6人", price: 200 },
        { name: "中包厢", capacity: "6-12人", price: 400 },
        { name: "大包厢", capacity: "12-20人", price: 600 },
        { name: "VIP包厢", capacity: "20+人", price: 1e3 }
      ],
      selectedRoomType: "",
      peopleCountIndex: 0,
      peopleCounts: ["2人", "4人", "6人", "8人", "10人", "12人", "15人", "20人"],
      selectedPeopleCount: "",
      remark: "",
      showSuccess: false
    };
  },
  computed: {
    canSubmit() {
      return this.selectedTime && this.selectedRoomType && this.selectedPeopleCount;
    }
  },
  onLoad(options) {
    try {
      if (common_vendor.index.getWindowInfo) {
        const windowInfo = common_vendor.index.getWindowInfo();
        this.statusBarHeight = windowInfo.statusBarHeight;
      } else {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        this.statusBarHeight = systemInfo.statusBarHeight;
      }
    } catch (error) {
      common_vendor.index.__f__("log", "at pages/booking/booking.vue:174", "获取系统信息失败，使用默认值");
      this.statusBarHeight = 44;
    }
    if (options.id) {
      this.ktvInfo.id = options.id;
    }
    if (options.name) {
      this.ktvInfo.name = decodeURIComponent(options.name);
    }
    if (options.mode) {
      this.mode = options.mode;
    }
    this.getUserInfo();
    if (this.mode === "view" && options.id) {
      this.getBookingDetail(options.id);
    }
  },
  methods: {
    getUserInfo() {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (userInfo) {
        this.userInfo = userInfo;
      }
    },
    async getBookingDetail(id) {
      try {
        const res = await common_vendor.index.request({
          url: "http://localhost/ktv-api/get_booking_detail.php",
          method: "GET",
          data: { id }
        });
        if (res.data.success) {
          this.bookingData = res.data.data;
          this.ktvInfo = res.data.data.ktv_info || {};
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/booking/booking.vue:218", "获取预约详情失败:", error);
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
      if (!this.canSubmit)
        return;
      common_vendor.index.showLoading({
        title: "预约中..."
      });
      try {
        const bookingData = {
          id: Date.now(),
          // 使用时间戳作为ID
          ktv_id: this.ktvInfo.id,
          ktv_name: this.ktvInfo.name,
          user_id: this.userInfo.id,
          user_phone: this.userInfo.phone,
          booking_time: this.selectedTime,
          room_type: this.selectedRoomType,
          people_count: this.selectedPeopleCount,
          remark: this.remark,
          status: "pending",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        common_vendor.index.__f__("log", "at pages/booking/booking.vue:262", "模拟预约提交:", bookingData);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const mockBookings = common_vendor.index.getStorageSync("mockBookings") || [];
        mockBookings.push(bookingData);
        common_vendor.index.setStorageSync("mockBookings", mockBookings);
        common_vendor.index.hideLoading();
        this.showSuccess = true;
        setTimeout(() => {
          this.showSuccess = false;
          common_vendor.index.navigateBack();
        }, 2e3);
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/booking/booking.vue:283", "预约失败:", error);
        common_vendor.index.showToast({
          title: "网络错误",
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
    goBack() {
      common_vendor.index.navigateBack();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_assets._imports_0$1,
    c: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    d: common_assets._imports_1,
    e: common_vendor.t($data.userInfo.nickname || "柠檬水橘子"),
    f: common_assets._imports_0,
    g: common_vendor.t($data.ktvInfo.name || "搜索附近的商K"),
    h: $data.ktvInfo.address
  }, $data.ktvInfo.address ? {
    i: common_vendor.t($data.ktvInfo.address)
  } : {}, {
    j: $data.ktvInfo.distance
  }, $data.ktvInfo.distance ? {
    k: common_vendor.t($data.ktvInfo.distance)
  } : {}, {
    l: $data.mode !== "view"
  }, $data.mode !== "view" ? {
    m: common_vendor.t($data.selectedTime || "请选择预约时间"),
    n: $data.timeIndex,
    o: $data.timeRange,
    p: common_vendor.o((...args) => $options.onTimeChange && $options.onTimeChange(...args)),
    q: common_vendor.t($data.selectedRoomType || "请选择包厢类型"),
    r: $data.roomTypeIndex,
    s: $data.roomTypes,
    t: common_vendor.o((...args) => $options.onRoomTypeChange && $options.onRoomTypeChange(...args)),
    v: common_vendor.t($data.selectedPeopleCount || "请选择人数"),
    w: $data.peopleCountIndex,
    x: $data.peopleCounts,
    y: common_vendor.o((...args) => $options.onPeopleCountChange && $options.onPeopleCountChange(...args)),
    z: $data.remark,
    A: common_vendor.o(($event) => $data.remark = $event.detail.value)
  } : {}, {
    B: $data.mode === "view" && $data.bookingData
  }, $data.mode === "view" && $data.bookingData ? common_vendor.e({
    C: common_vendor.t($data.bookingData.booking_time),
    D: common_vendor.t($data.bookingData.room_type),
    E: common_vendor.t($data.bookingData.people_count),
    F: $data.bookingData.remark
  }, $data.bookingData.remark ? {
    G: common_vendor.t($data.bookingData.remark)
  } : {}, {
    H: common_vendor.t($options.getStatusText($data.bookingData.status)),
    I: common_vendor.n($data.bookingData.status)
  }) : {}, {
    J: $data.mode !== "view"
  }, $data.mode !== "view" ? {
    K: !$options.canSubmit ? 1 : "",
    L: common_vendor.o((...args) => $options.submitBooking && $options.submitBooking(...args)),
    M: !$options.canSubmit
  } : {}, {
    N: $data.showSuccess
  }, $data.showSuccess ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d331dabb"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/booking/booking.js.map
