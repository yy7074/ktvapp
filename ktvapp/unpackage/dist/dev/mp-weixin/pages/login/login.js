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
      canGoBack: false,
      currentInputIndex: 0,
      // 当前激活的输入框索引
      isAutoSubmitting: false
      // 防止重复提交
    };
  },
  computed: {
    canSubmit() {
      if (!this.showCodeInput) {
        return this.phone.length === 11 && this.agreed;
      } else {
        return this.codeArray.every((code) => code !== "") && this.agreed;
      }
    },
    kLogoSrc() {
      return "/static/k-logo.jpg";
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
      common_vendor.index.__f__("log", "at pages/login/login.vue:142", "获取系统信息失败，使用默认值");
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
          this.codeArray = ["", "", "", ""];
          this.currentInputIndex = 0;
          this.$nextTick(() => {
            setTimeout(() => {
              this.focusInput(0);
            }, 100);
          });
          common_vendor.index.showToast({
            title: "验证码已发送",
            icon: "success"
          });
        } else {
          throw new Error(res.data.message || "发送失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:205", "发送验证码失败:", error);
        common_vendor.index.showToast({
          title: "网络错误",
          icon: "none"
        });
      }
    },
    async login() {
      try {
        const code = this.codeArray.join("");
        if (!code || code.length !== 4) {
          common_vendor.index.showToast({
            title: "请输入4位验证码",
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
        common_vendor.index.__f__("error", "at pages/login/login.vue:263", "登录失败:", error);
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
      let value = event.detail.value;
      if (!/^\d*$/.test(value)) {
        this.codeArray[index] = "";
        return;
      }
      if (value.length > 1) {
        value = value.slice(-1);
      }
      this.$set(this.codeArray, index, value);
      if (value) {
        if (index < 3) {
          this.moveToNextInput(index + 1);
        } else {
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
      const isComplete = this.codeArray.every((code) => code !== "");
      if (isComplete && !this.isAutoSubmitting) {
        this.isAutoSubmitting = true;
        setTimeout(() => {
          if (this.canSubmit) {
            this.handleLogin();
          }
          this.isAutoSubmitting = false;
        }, 300);
      }
    },
    focusInput(index) {
      try {
        this.currentInputIndex = index;
      } catch (error) {
        common_vendor.index.__f__("log", "at pages/login/login.vue:343", "聚焦失败:", error);
      }
    },
    onInputFocus(index) {
      this.currentInputIndex = index;
      this.$nextTick(() => {
        try {
          const inputRef = this.$refs[`codeInput${index}`];
          if (inputRef && inputRef[0]) {
            inputRef[0].select();
          }
        } catch (error) {
        }
      });
    },
    onInputBlur(index) {
    },
    // 清空验证码并重新开始
    clearCode() {
      this.codeArray = ["", "", "", ""];
      this.currentInputIndex = 0;
      this.isAutoSubmitting = false;
      this.$nextTick(() => {
        this.focusInput(0);
      });
    },
    // 处理删除操作
    onDeleteCode(index) {
      if (this.codeArray[index]) {
        this.$set(this.codeArray, index, "");
      } else if (index > 0) {
        this.$set(this.codeArray, index - 1, "");
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
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: $data.canGoBack
  }, $data.canGoBack ? {
    c: common_vendor.o((...args) => $options.goBack && $options.goBack(...args))
  } : {}, {
    d: $options.kLogoSrc,
    e: !$data.showCodeInput
  }, !$data.showCodeInput ? {} : {}, {
    f: !$data.showCodeInput
  }, !$data.showCodeInput ? {} : {}, {
    g: !$data.showCodeInput
  }, !$data.showCodeInput ? {} : {}, {
    h: !$data.showCodeInput
  }, !$data.showCodeInput ? {
    i: $data.phone,
    j: common_vendor.o(($event) => $data.phone = $event.detail.value)
  } : {}, {
    k: $data.showCodeInput
  }, $data.showCodeInput ? {
    l: common_vendor.t($data.phone),
    m: common_vendor.o((...args) => $options.resendCode && $options.resendCode(...args)),
    n: common_vendor.f($data.codeArray, (item, index, i0) => {
      return {
        a: index,
        b: `codeInput${index}`,
        c: common_vendor.n(`code-digit-${index}`),
        d: common_vendor.n({
          "active": $data.currentInputIndex === index,
          "filled": $data.codeArray[index]
        }),
        e: common_vendor.o([($event) => $data.codeArray[index] = $event.detail.value, ($event) => $options.onCodeInput(index, $event)], index),
        f: common_vendor.o(($event) => $options.onInputFocus(index), index),
        g: common_vendor.o(($event) => $options.onInputBlur(index), index),
        h: $data.currentInputIndex === index,
        i: $data.codeArray[index]
      };
    })
  } : {}, {
    o: common_vendor.t($data.showCodeInput ? "登录" : "获取验证码"),
    p: !$options.canSubmit ? 1 : "",
    q: common_vendor.o((...args) => $options.handleLogin && $options.handleLogin(...args)),
    r: !$options.canSubmit,
    s: !$data.showCodeInput
  }, !$data.showCodeInput ? common_vendor.e({
    t: $data.agreed
  }, $data.agreed ? {} : {}, {
    v: $data.agreed ? 1 : "",
    w: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args))
  }) : {}, {
    x: $data.showCodeInput ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
