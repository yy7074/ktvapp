"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      phone: "",
      codeArray: ["", "", "", ""],
      showCodeInput: false,
      agreed: true,
      countdown: 0,
      timer: null,
      canGoBack: false
    };
  },
  computed: {
    canSubmit() {
      if (!this.showCodeInput) {
        return this.phone.length === 11 && this.agreed;
      } else {
        return this.codeArray.every((code) => code !== "") && this.agreed;
      }
    }
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
      common_vendor.index.__f__("log", "at pages/login/login.vue:127", "获取系统信息失败，使用默认值");
      this.statusBarHeight = 44;
    }
    const pages = getCurrentPages();
    this.canGoBack = pages.length > 1;
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    async handleLogin() {
      if (!this.canSubmit)
        return;
      if (!this.showCodeInput) {
        await this.sendCode();
      } else {
        await this.login();
      }
    },
    async sendCode() {
      try {
        const res = await common_vendor.index.request({
          url: "http://catdog.dachaonet.com/send_code.php",
          method: "POST",
          header: {
            "Content-Type": "application/json"
          },
          data: {
            phone: this.phone
          }
        });
        if (res.data.success) {
          this.showCodeInput = true;
          this.startCountdown();
          common_vendor.index.showToast({
            title: "验证码已发送",
            icon: "success"
          });
        } else {
          throw new Error(res.data.message || "发送失败");
        }
        setTimeout(() => {
          common_vendor.index.showToast({
            title: "测试验证码：1234",
            icon: "none",
            duration: 3e3
          });
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:188", "发送验证码失败:", error);
        common_vendor.index.showToast({
          title: "网络错误",
          icon: "none"
        });
      }
    },
    async login() {
      try {
        const code = this.codeArray.join("");
        if (!code || code.length !== 6) {
          common_vendor.index.showToast({
            title: "请输入6位验证码",
            icon: "none"
          });
          return;
        }
        const res = await common_vendor.index.request({
          url: "http://catdog.dachaonet.com/login.php",
          method: "POST",
          header: {
            "Content-Type": "application/json"
          },
          data: {
            phone: this.phone,
            code
          }
        });
        if (res.data.success) {
          common_vendor.index.setStorageSync("userInfo", res.data.data.user);
          common_vendor.index.setStorageSync("token", res.data.data.token);
        } else {
          common_vendor.index.showToast({
            title: res.data.message || "登录失败",
            icon: "none"
          });
          return;
        }
        common_vendor.index.showToast({
          title: "登录成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.switchTab({
            url: "/pages/index/index"
          });
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:246", "登录失败:", error);
        common_vendor.index.showToast({
          title: "网络错误",
          icon: "none"
        });
      }
    },
    resendCode() {
      if (this.countdown > 0)
        return;
      this.sendCode();
    },
    startCountdown() {
      this.countdown = 60;
      this.timer = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(this.timer);
        }
      }, 1e3);
    },
    onCodeInput(index, event) {
      const value = event.detail.value;
      this.codeArray[index] = value;
      if (value && index < 3) {
        const nextInput = document.querySelectorAll(".code-digit")[index + 1];
        if (nextInput) {
          nextInput.focus();
        }
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
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: $data.canGoBack
  }, $data.canGoBack ? {
    c: common_vendor.o((...args) => $options.goBack && $options.goBack(...args))
  } : {}, {
    d: $data.phone,
    e: common_vendor.o(($event) => $data.phone = $event.detail.value),
    f: $data.showCodeInput
  }, $data.showCodeInput ? {
    g: common_vendor.t($data.phone),
    h: common_vendor.o((...args) => $options.resendCode && $options.resendCode(...args)),
    i: common_vendor.f($data.codeArray, (item, index, i0) => {
      return {
        a: index,
        b: common_vendor.o([($event) => $data.codeArray[index] = $event.detail.value, ($event) => $options.onCodeInput(index, $event)], index),
        c: $data.codeArray[index]
      };
    })
  } : {}, {
    j: common_vendor.t($data.showCodeInput ? "登录" : "获取验证码"),
    k: !$options.canSubmit ? 1 : "",
    l: common_vendor.o((...args) => $options.handleLogin && $options.handleLogin(...args)),
    m: !$options.canSubmit,
    n: $data.agreed
  }, $data.agreed ? {} : {}, {
    o: $data.agreed ? 1 : "",
    p: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
