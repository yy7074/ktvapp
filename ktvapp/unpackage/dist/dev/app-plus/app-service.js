if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$5 = {
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
      }
    },
    onLoad() {
      try {
        if (uni.getWindowInfo) {
          const windowInfo = uni.getWindowInfo();
          this.statusBarHeight = windowInfo.statusBarHeight;
        } else {
          const systemInfo = uni.getSystemInfoSync();
          this.statusBarHeight = systemInfo.statusBarHeight;
        }
      } catch (error) {
        formatAppLog("log", "at pages/login/login.vue:136", "获取系统信息失败，使用默认值");
        this.statusBarHeight = 44;
      }
      const pages = getCurrentPages();
      this.canGoBack = pages.length > 1;
    },
    methods: {
      goBack() {
        uni.navigateBack();
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
          const res = await uni.request({
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
            uni.showToast({
              title: "验证码已发送",
              icon: "success"
            });
          } else {
            throw new Error(res.data.message || "发送失败");
          }
        } catch (error) {
          formatAppLog("error", "at pages/login/login.vue:201", "发送验证码失败:", error);
          uni.showToast({
            title: "网络错误",
            icon: "none"
          });
        }
      },
      async login() {
        try {
          const code = this.codeArray.join("");
          if (!code || code.length !== 4) {
            uni.showToast({
              title: "请输入4位验证码",
              icon: "none"
            });
            return;
          }
          const res = await uni.request({
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
            uni.setStorageSync("userInfo", res.data.data.user);
            uni.setStorageSync("token", res.data.data.token);
          } else {
            uni.showToast({
              title: res.data.message || "登录失败",
              icon: "none"
            });
            return;
          }
          uni.showToast({
            title: "登录成功",
            icon: "success"
          });
          setTimeout(() => {
            uni.switchTab({
              url: "/pages/index/index"
            });
          }, 1500);
        } catch (error) {
          formatAppLog("error", "at pages/login/login.vue:259", "登录失败:", error);
          uni.showToast({
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
          formatAppLog("log", "at pages/login/login.vue:339", "聚焦失败:", error);
        }
      },
      onInputFocus(index) {
        this.currentInputIndex = index;
        if (this.codeArray[index]) {
          this.$nextTick(() => {
            try {
              const inputRef = this.$refs[`codeInput${index}`];
              if (inputRef && inputRef[0]) {
                inputRef[0].select();
              }
            } catch (error) {
            }
          });
        }
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
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "login-container" }, [
      vue.createCommentVNode(" 状态栏占位 "),
      vue.createElementVNode(
        "view",
        {
          class: "status-bar",
          style: vue.normalizeStyle({ height: $data.statusBarHeight + "px" })
        },
        null,
        4
        /* STYLE */
      ),
      vue.createCommentVNode(" 返回按钮 "),
      $data.canGoBack ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "back-btn",
        onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
      }, [
        vue.createElementVNode("text", { class: "back-icon" }, "‹")
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" Logo区域 "),
      vue.createElementVNode("view", { class: "logo-section" }, [
        vue.createElementVNode("view", { class: "logo-container" }, [
          vue.createElementVNode("view", { class: "k-logo" }, "K")
        ]),
        vue.createElementVNode("view", { class: "welcome-text" }, "嗨，我是商K预约"),
        vue.createElementVNode("view", { class: "description-container" }, [
          vue.createElementVNode("text", { class: "description" }, "在这里你可以搜索附近的商K"),
          vue.createElementVNode("text", { class: "description" }, "并由客服按照你的喜好预约")
        ])
      ]),
      vue.createCommentVNode(" 登录表单卡片 "),
      vue.createElementVNode("view", { class: "login-card" }, [
        vue.createElementVNode("view", { class: "login-form" }, [
          vue.createElementVNode("view", { class: "form-title" }, "验证码登录"),
          vue.createElementVNode("view", { class: "input-container" }, [
            vue.createElementVNode("view", { class: "phone-input-wrapper" }, [
              vue.createElementVNode("view", { class: "phone-icon" }, "📱"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "phone-input",
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.phone = $event),
                  placeholder: "请输入你的手机号",
                  type: "number",
                  maxlength: "11"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $data.phone]
              ])
            ])
          ]),
          $data.showCodeInput ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "code-input-group"
          }, [
            vue.createElementVNode("text", { class: "code-label" }, "请输入验证码"),
            vue.createElementVNode("text", { class: "code-sent" }, "验证码已通过短信发送至："),
            vue.createElementVNode(
              "text",
              { class: "phone-display" },
              "+86 " + vue.toDisplayString($data.phone),
              1
              /* TEXT */
            ),
            vue.createElementVNode("button", {
              class: "resend-btn",
              onClick: _cache[2] || (_cache[2] = (...args) => $options.resendCode && $options.resendCode(...args))
            }, "重新获取"),
            vue.createElementVNode("view", { class: "code-inputs" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($data.codeArray, (item, index) => {
                  return vue.withDirectives((vue.openBlock(), vue.createElementBlock("input", {
                    key: index,
                    ref_for: true,
                    ref: `codeInput${index}`,
                    class: vue.normalizeClass(["code-digit", `code-digit-${index}`, { "active": $data.currentInputIndex === index, "filled": $data.codeArray[index] }]),
                    "onUpdate:modelValue": ($event) => $data.codeArray[index] = $event,
                    type: "number",
                    maxlength: "1",
                    onInput: ($event) => $options.onCodeInput(index, $event),
                    onFocus: ($event) => $options.onInputFocus(index),
                    onBlur: ($event) => $options.onInputBlur(index),
                    focus: $data.currentInputIndex === index,
                    "cursor-spacing": 0,
                    "selection-start": 0,
                    "selection-end": 1
                  }, null, 42, ["onUpdate:modelValue", "onInput", "onFocus", "onBlur", "focus"])), [
                    [vue.vModelText, $data.codeArray[index]]
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("button", {
            class: vue.normalizeClass(["main-btn", { "disabled": !$options.canSubmit }]),
            onClick: _cache[3] || (_cache[3] = (...args) => $options.handleLogin && $options.handleLogin(...args)),
            disabled: !$options.canSubmit
          }, vue.toDisplayString($data.showCodeInput ? "登录" : "获取验证码"), 11, ["disabled"])
        ]),
        vue.createCommentVNode(" 协议 "),
        vue.createElementVNode("view", { class: "agreement" }, [
          vue.createElementVNode("view", {
            class: "agreement-item",
            onClick: _cache[4] || (_cache[4] = (...args) => $options.toggleAgreement && $options.toggleAgreement(...args))
          }, [
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["checkbox", { "checked": $data.agreed }])
              },
              [
                $data.agreed ? (vue.openBlock(), vue.createElementBlock("text", {
                  key: 0,
                  class: "checkmark"
                }, "✓")) : vue.createCommentVNode("v-if", true)
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode("text", { class: "agreement-text" }, "我已阅读并同意《用户协议》和《隐私政策》")
          ])
        ]),
        vue.createCommentVNode(" 底部 "),
        vue.createElementVNode("view", { class: "footer" }, [
          vue.createElementVNode("text", { class: "footer-text" }, "安全 透明 有保障"),
          vue.createElementVNode("view", { class: "apple-logo" }, [
            vue.createElementVNode("text", { class: "apple-icon" })
          ])
        ])
      ])
    ]);
  }
  const PagesLoginLogin = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-e4e4508d"], ["__file", "/Users/yy/Documents/GitHub/ktvapp/ktvapp/pages/login/login.vue"]]);
  const _imports_0$1 = "/static/yue.jpg";
  const _imports_1 = "/static/矩形@1x.png";
  const _sfc_main$4 = {
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
        if (uni.getWindowInfo) {
          const windowInfo = uni.getWindowInfo();
          this.statusBarHeight = windowInfo.statusBarHeight;
        } else {
          const systemInfo = uni.getSystemInfoSync();
          this.statusBarHeight = systemInfo.statusBarHeight;
        }
      } catch (error) {
        formatAppLog("log", "at pages/index/index.vue:89", "获取系统信息失败，使用默认值");
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
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo) {
          uni.redirectTo({
            url: "/pages/login/login"
          });
        } else {
          this.userInfo = userInfo;
        }
      },
      getUserInfo() {
        const userInfo = uni.getStorageSync("userInfo");
        if (userInfo) {
          this.userInfo = userInfo;
        }
      },
      // 获取用户位置
      async getUserLocation() {
        try {
          formatAppLog("log", "at pages/index/index.vue:125", "开始获取用户位置...");
          uni.showToast({
            title: "正在定位...",
            icon: "loading",
            duration: 2e3
          });
          const locationResult = await uni.getLocation({
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
          formatAppLog("log", "at pages/index/index.vue:149", "用户位置获取成功:", this.userLocation);
          uni.hideToast();
          this.getKtvList();
        } catch (error) {
          formatAppLog("log", "at pages/index/index.vue:158", "获取位置失败:", error);
          uni.hideToast();
          if (error.errCode === 2 || error.errMsg && error.errMsg.includes("denied")) {
            uni.showModal({
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
            uni.showToast({
              title: "定位超时，显示默认列表",
              icon: "none",
              duration: 2e3
            });
            this.getKtvList();
          } else {
            formatAppLog("log", "at pages/index/index.vue:190", "使用默认位置或不进行距离排序");
            uni.showToast({
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
          formatAppLog("log", "at pages/index/index.vue:203", "开始获取KTV列表...");
          let requestData = {};
          if (this.userLocation) {
            requestData.latitude = this.userLocation.latitude;
            requestData.longitude = this.userLocation.longitude;
            formatAppLog("log", "at pages/index/index.vue:212", "使用用户位置信息:", this.userLocation);
          } else {
            formatAppLog("log", "at pages/index/index.vue:214", "没有用户位置信息，将获取默认KTV列表");
          }
          const res = await uni.request({
            url: "http://catdog.dachaonet.com/get_ktv_list.php",
            method: "GET",
            data: requestData,
            header: {
              "Authorization": "Bearer " + uni.getStorageSync("token")
            }
          });
          if (res.data.success) {
            this.ktvList = res.data.data || [];
            formatAppLog("log", "at pages/index/index.vue:229", "KTV列表获取成功:", this.ktvList);
          } else {
            formatAppLog("error", "at pages/index/index.vue:231", "获取KTV列表失败:", res.data.message);
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
          formatAppLog("error", "at pages/index/index.vue:259", "获取KTV列表失败:", error);
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
          uni.getLocation({
            type: "gcj02",
            success: resolve,
            fail: reject
          });
        });
      },
      searchKtv() {
        uni.showLoading({
          title: "搜索中..."
        });
        setTimeout(() => {
          uni.hideLoading();
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
        uni.navigateTo({
          url: `/pages/booking/booking?id=${item.id}&name=${encodeURIComponent(item.name)}`
        });
      },
      upgradeVip() {
        uni.showToast({
          title: "会员功能开发中",
          icon: "none"
        });
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 状态栏占位 "),
      vue.createElementVNode(
        "view",
        {
          class: "status-bar",
          style: vue.normalizeStyle({ height: $data.statusBarHeight + "px" })
        },
        null,
        4
        /* STYLE */
      ),
      vue.createCommentVNode(" 头部用户信息 "),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", { class: "user-info" }, [
          vue.createElementVNode("image", {
            src: _imports_0$1,
            class: "avatar",
            mode: "aspectFill"
          }),
          vue.createElementVNode("view", { class: "user-details" }, [
            vue.createElementVNode(
              "text",
              { class: "username" },
              vue.toDisplayString($data.userInfo.nickname || "柠檬水橘子"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "vip-info" }, [
              vue.createElementVNode("image", {
                src: _imports_1,
                class: "vip-icon",
                mode: "aspectFit"
              }),
              vue.createElementVNode("text", { class: "vip-text" }, "KTV会员")
            ])
          ])
        ]),
        vue.createElementVNode("button", {
          class: "upgrade-btn",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.upgradeVip && $options.upgradeVip(...args))
        }, "订阅会员")
      ]),
      vue.createCommentVNode(" 包厢卡片标题 "),
      vue.createElementVNode("view", { class: "section-title" }, [
        vue.createElementVNode("text", { class: "title-text" }, "包厢卡")
      ]),
      vue.createCommentVNode(" KTV列表 "),
      $data.ktvList.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "ktv-list"
      }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.ktvList, (item, index) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "ktv-item",
              key: index,
              onClick: ($event) => $options.bookKtv(item)
            }, [
              vue.createElementVNode("view", { class: "ktv-card" }, [
                vue.createElementVNode("view", { class: "ktv-tag" }, [
                  vue.createElementVNode("image", {
                    src: _imports_0$1,
                    class: "tag-bg",
                    mode: "aspectFit"
                  }),
                  vue.createElementVNode("text", { class: "tag-text" }, "约")
                ]),
                vue.createElementVNode("view", { class: "ktv-info" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "ktv-name" },
                    vue.toDisplayString(item.name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "ktv-details" }, [
                    item.distance ? (vue.openBlock(), vue.createElementBlock(
                      "text",
                      {
                        key: 0,
                        class: "ktv-distance"
                      },
                      vue.toDisplayString(item.distance),
                      1
                      /* TEXT */
                    )) : vue.createCommentVNode("v-if", true),
                    item.rating ? (vue.openBlock(), vue.createElementBlock(
                      "text",
                      {
                        key: 1,
                        class: "ktv-rating"
                      },
                      "★" + vue.toDisplayString(item.rating),
                      1
                      /* TEXT */
                    )) : vue.createCommentVNode("v-if", true)
                  ]),
                  item.address ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 0,
                      class: "ktv-address"
                    },
                    vue.toDisplayString(item.address),
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true)
                ])
              ]),
              vue.createElementVNode("button", {
                class: "book-btn",
                onClick: vue.withModifiers(($event) => $options.bookKtv(item), ["stop"])
              }, "预约", 8, ["onClick"])
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])) : (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 1 },
        [
          vue.createCommentVNode(" 空状态 "),
          vue.createElementVNode("view", { class: "empty-state" }, [
            vue.createElementVNode("image", {
              src: _imports_0$1,
              class: "empty-icon",
              mode: "aspectFit"
            }),
            vue.createElementVNode("text", { class: "empty-text" }, "空空如也")
          ])
        ],
        2112
        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
      )),
      vue.createCommentVNode(" 搜索按钮 "),
      vue.createElementVNode("view", {
        class: "search-btn",
        onClick: _cache[1] || (_cache[1] = (...args) => $options.searchKtv && $options.searchKtv(...args))
      }, [
        vue.createElementVNode("text", { class: "search-text" }, "搜索附近的商K")
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-1cf27b2a"], ["__file", "/Users/yy/Documents/GitHub/ktvapp/ktvapp/pages/index/index.vue"]]);
  const _imports_0 = "/static/返 回@1x.png";
  const _sfc_main$3 = {
    data() {
      return {
        statusBarHeight: 0,
        userInfo: {},
        cardList: []
      };
    },
    onLoad() {
      try {
        if (uni.getWindowInfo) {
          const windowInfo = uni.getWindowInfo();
          this.statusBarHeight = windowInfo.statusBarHeight;
        } else {
          const systemInfo = uni.getSystemInfoSync();
          this.statusBarHeight = systemInfo.statusBarHeight;
        }
      } catch (error) {
        formatAppLog("log", "at pages/mine/mine.vue:93", "获取系统信息失败，使用默认值");
        this.statusBarHeight = 44;
      }
    },
    onShow() {
      this.getUserInfo();
      this.getCardList();
    },
    methods: {
      getUserInfo() {
        const userInfo = uni.getStorageSync("userInfo");
        if (userInfo) {
          this.userInfo = userInfo;
        }
      },
      async getCardList() {
        try {
          formatAppLog("log", "at pages/mine/mine.vue:113", "模拟获取包厢卡列表");
          await new Promise((resolve) => setTimeout(resolve, 500));
          const userInfo = uni.getStorageSync("userInfo");
          const mockBookings = uni.getStorageSync("mockBookings") || [];
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
          formatAppLog("error", "at pages/mine/mine.vue:133", "获取包厢卡列表失败:", error);
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
        uni.navigateTo({
          url: `/pages/booking/booking?id=${item.id}&mode=view`
        });
      },
      upgradeVip() {
        uni.showToast({
          title: "会员功能开发中",
          icon: "none"
        });
      },
      goToBookings() {
        uni.navigateTo({
          url: "/pages/bookings/bookings"
        });
      },
      goToSettings() {
        uni.showToast({
          title: "设置功能开发中",
          icon: "none"
        });
      },
      logout() {
        uni.showModal({
          title: "提示",
          content: "确定要退出登录吗？",
          success: (res) => {
            if (res.confirm) {
              uni.removeStorageSync("userInfo");
              uni.removeStorageSync("token");
              uni.redirectTo({
                url: "/pages/login/login"
              });
            }
          }
        });
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 状态栏占位 "),
      vue.createElementVNode(
        "view",
        {
          class: "status-bar",
          style: vue.normalizeStyle({ height: $data.statusBarHeight + "px" })
        },
        null,
        4
        /* STYLE */
      ),
      vue.createCommentVNode(" 头部用户信息 "),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", { class: "user-info" }, [
          vue.createElementVNode("image", {
            src: _imports_0$1,
            class: "avatar",
            mode: "aspectFill"
          }),
          vue.createElementVNode("view", { class: "user-details" }, [
            vue.createElementVNode(
              "text",
              { class: "username" },
              vue.toDisplayString($data.userInfo.nickname || "柠檬水橘子"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "vip-info" }, [
              vue.createElementVNode("image", {
                src: _imports_1,
                class: "vip-icon",
                mode: "aspectFit"
              }),
              vue.createElementVNode("text", { class: "vip-text" }, "KTV会员")
            ])
          ])
        ]),
        vue.createElementVNode("button", {
          class: "upgrade-btn",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.upgradeVip && $options.upgradeVip(...args))
        }, "订阅会员")
      ]),
      vue.createCommentVNode(" 包厢卡片标题 "),
      vue.createElementVNode("view", { class: "section-title" }, [
        vue.createElementVNode("text", { class: "title-text" }, "包厢卡")
      ]),
      vue.createCommentVNode(" 包厢卡片列表 "),
      $data.cardList.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "card-list"
      }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.cardList, (item, index) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "card-item",
              key: index,
              onClick: ($event) => $options.viewCard(item)
            }, [
              vue.createElementVNode("view", { class: "card-content" }, [
                vue.createElementVNode("view", { class: "card-tag" }, [
                  vue.createElementVNode("image", {
                    src: _imports_0$1,
                    class: "tag-bg",
                    mode: "aspectFit"
                  }),
                  vue.createElementVNode("text", { class: "tag-text" }, "约")
                ]),
                vue.createElementVNode(
                  "text",
                  { class: "card-name" },
                  vue.toDisplayString(item.name),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "card-status" }, [
                vue.createElementVNode(
                  "text",
                  {
                    class: vue.normalizeClass(["status-text", item.status])
                  },
                  vue.toDisplayString($options.getStatusText(item.status)),
                  3
                  /* TEXT, CLASS */
                )
              ])
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])) : (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 1 },
        [
          vue.createCommentVNode(" 空状态 "),
          vue.createElementVNode("view", { class: "empty-state" }, [
            vue.createElementVNode("image", {
              src: _imports_0$1,
              class: "empty-icon",
              mode: "aspectFit"
            }),
            vue.createElementVNode("text", { class: "empty-text" }, "空空如也")
          ])
        ],
        2112
        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
      )),
      vue.createCommentVNode(" 菜单列表 "),
      vue.createElementVNode("view", { class: "menu-list" }, [
        vue.createElementVNode("view", {
          class: "menu-item",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.goToBookings && $options.goToBookings(...args))
        }, [
          vue.createElementVNode("text", { class: "menu-text" }, "我的预约"),
          vue.createElementVNode("image", {
            src: _imports_0,
            class: "menu-arrow",
            mode: "aspectFit"
          })
        ]),
        vue.createElementVNode("view", {
          class: "menu-item",
          onClick: _cache[2] || (_cache[2] = (...args) => $options.goToSettings && $options.goToSettings(...args))
        }, [
          vue.createElementVNode("text", { class: "menu-text" }, "设置"),
          vue.createElementVNode("image", {
            src: _imports_0,
            class: "menu-arrow",
            mode: "aspectFit"
          })
        ]),
        vue.createElementVNode("view", {
          class: "menu-item",
          onClick: _cache[3] || (_cache[3] = (...args) => $options.logout && $options.logout(...args))
        }, [
          vue.createElementVNode("text", { class: "menu-text" }, "退出登录"),
          vue.createElementVNode("image", {
            src: _imports_0,
            class: "menu-arrow",
            mode: "aspectFit"
          })
        ])
      ])
    ]);
  }
  const PagesMineMine = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-7c2ebfa5"], ["__file", "/Users/yy/Documents/GitHub/ktvapp/ktvapp/pages/mine/mine.vue"]]);
  const _sfc_main$2 = {
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
        if (uni.getWindowInfo) {
          const windowInfo = uni.getWindowInfo();
          this.statusBarHeight = windowInfo.statusBarHeight;
        } else {
          const systemInfo = uni.getSystemInfoSync();
          this.statusBarHeight = systemInfo.statusBarHeight;
        }
      } catch (error) {
        formatAppLog("log", "at pages/booking/booking.vue:174", "获取系统信息失败，使用默认值");
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
        const userInfo = uni.getStorageSync("userInfo");
        if (userInfo) {
          this.userInfo = userInfo;
        }
      },
      async getBookingDetail(id) {
        try {
          const res = await uni.request({
            url: "http://localhost/ktv-api/get_booking_detail.php",
            method: "GET",
            data: { id }
          });
          if (res.data.success) {
            this.bookingData = res.data.data;
            this.ktvInfo = res.data.data.ktv_info || {};
          }
        } catch (error) {
          formatAppLog("error", "at pages/booking/booking.vue:218", "获取预约详情失败:", error);
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
        var _a;
        if (!this.canSubmit)
          return;
        uni.showLoading({
          title: "预约中..."
        });
        try {
          const bookingData = {
            ktv_id: this.ktvInfo.id,
            ktv_name: this.ktvInfo.name,
            user_id: this.userInfo.id,
            user_phone: this.userInfo.phone,
            booking_time: this.selectedTime,
            room_type: this.selectedRoomType,
            people_count: this.selectedPeopleCount,
            remark: this.remark
          };
          formatAppLog("log", "at pages/booking/booking.vue:259", "提交预约数据:", bookingData);
          const response = await uni.request({
            url: "http://catdog.dachaonet.com/create_booking.php",
            method: "POST",
            header: {
              "Content-Type": "application/json"
            },
            data: bookingData
          });
          formatAppLog("log", "at pages/booking/booking.vue:271", "预约API响应:", response);
          if (response.statusCode === 200 && response.data.success) {
            uni.hideLoading();
            this.showSuccess = true;
            setTimeout(() => {
              this.showSuccess = false;
              uni.navigateBack();
            }, 2e3);
            const localBooking = {
              id: response.data.data.booking_id,
              ...bookingData,
              status: "pending",
              created_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            const mockBookings = uni.getStorageSync("mockBookings") || [];
            mockBookings.push(localBooking);
            uni.setStorageSync("mockBookings", mockBookings);
          } else {
            uni.hideLoading();
            uni.showToast({
              title: ((_a = response.data) == null ? void 0 : _a.message) || "预约失败",
              icon: "none",
              duration: 3e3
            });
          }
        } catch (error) {
          uni.hideLoading();
          formatAppLog("error", "at pages/booking/booking.vue:307", "预约失败:", error);
          const fallbackData = {
            id: Date.now(),
            ktv_id: this.ktvInfo.id,
            ktv_name: this.ktvInfo.name,
            user_id: this.userInfo.id,
            user_phone: this.userInfo.phone,
            booking_time: this.selectedTime,
            room_type: this.selectedRoomType,
            people_count: this.selectedPeopleCount,
            remark: this.remark,
            status: "pending",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            is_local_only: true
            // 标记为仅本地数据
          };
          const mockBookings = uni.getStorageSync("mockBookings") || [];
          mockBookings.push(fallbackData);
          uni.setStorageSync("mockBookings", mockBookings);
          uni.showToast({
            title: "网络异常，已保存到本地",
            icon: "none",
            duration: 3e3
          });
          this.showSuccess = true;
          setTimeout(() => {
            this.showSuccess = false;
            uni.navigateBack();
          }, 2e3);
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
        uni.navigateBack();
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 状态栏占位 "),
      vue.createElementVNode(
        "view",
        {
          class: "status-bar",
          style: vue.normalizeStyle({ height: $data.statusBarHeight + "px" })
        },
        null,
        4
        /* STYLE */
      ),
      vue.createCommentVNode(" 头部导航 "),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", {
          class: "back-btn",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
        }, [
          vue.createElementVNode("image", {
            src: _imports_0,
            class: "back-icon",
            mode: "aspectFit"
          })
        ]),
        vue.createElementVNode("text", { class: "header-title" }, "预约详情")
      ]),
      vue.createCommentVNode(" 用户信息 "),
      vue.createElementVNode("view", { class: "user-section" }, [
        vue.createElementVNode("image", {
          src: _imports_0$1,
          class: "user-avatar",
          mode: "aspectFill"
        }),
        vue.createElementVNode(
          "text",
          { class: "user-name" },
          vue.toDisplayString($data.userInfo.nickname || "柠檬水橘子"),
          1
          /* TEXT */
        )
      ]),
      vue.createCommentVNode(" KTV信息卡片 "),
      vue.createElementVNode("view", { class: "ktv-card" }, [
        vue.createElementVNode("view", { class: "ktv-tag" }, [
          vue.createElementVNode("image", {
            src: _imports_0$1,
            class: "tag-bg",
            mode: "aspectFit"
          }),
          vue.createElementVNode("text", { class: "tag-text" }, "约")
        ]),
        vue.createElementVNode("view", { class: "ktv-info" }, [
          vue.createElementVNode(
            "text",
            { class: "ktv-name" },
            vue.toDisplayString($data.ktvInfo.name || "搜索附近的商K"),
            1
            /* TEXT */
          ),
          $data.ktvInfo.address ? (vue.openBlock(), vue.createElementBlock(
            "text",
            {
              key: 0,
              class: "ktv-address"
            },
            vue.toDisplayString($data.ktvInfo.address),
            1
            /* TEXT */
          )) : vue.createCommentVNode("v-if", true),
          $data.ktvInfo.distance ? (vue.openBlock(), vue.createElementBlock(
            "text",
            {
              key: 1,
              class: "ktv-distance"
            },
            "距离: " + vue.toDisplayString($data.ktvInfo.distance) + "m",
            1
            /* TEXT */
          )) : vue.createCommentVNode("v-if", true)
        ])
      ]),
      vue.createCommentVNode(" 预约表单 "),
      $data.mode !== "view" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "booking-form"
      }, [
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "form-label" }, "预约时间"),
          vue.createElementVNode("picker", {
            mode: "multiSelector",
            value: $data.timeIndex,
            range: $data.timeRange,
            onChange: _cache[1] || (_cache[1] = (...args) => $options.onTimeChange && $options.onTimeChange(...args))
          }, [
            vue.createElementVNode(
              "view",
              { class: "picker-input" },
              vue.toDisplayString($data.selectedTime || "请选择预约时间"),
              1
              /* TEXT */
            )
          ], 40, ["value", "range"])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "form-label" }, "包厢类型"),
          vue.createElementVNode("picker", {
            value: $data.roomTypeIndex,
            range: $data.roomTypes,
            "range-key": "name",
            onChange: _cache[2] || (_cache[2] = (...args) => $options.onRoomTypeChange && $options.onRoomTypeChange(...args))
          }, [
            vue.createElementVNode(
              "view",
              { class: "picker-input" },
              vue.toDisplayString($data.selectedRoomType || "请选择包厢类型"),
              1
              /* TEXT */
            )
          ], 40, ["value", "range"])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "form-label" }, "人数"),
          vue.createElementVNode("picker", {
            value: $data.peopleCountIndex,
            range: $data.peopleCounts,
            onChange: _cache[3] || (_cache[3] = (...args) => $options.onPeopleCountChange && $options.onPeopleCountChange(...args))
          }, [
            vue.createElementVNode(
              "view",
              { class: "picker-input" },
              vue.toDisplayString($data.selectedPeopleCount || "请选择人数"),
              1
              /* TEXT */
            )
          ], 40, ["value", "range"])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "form-label" }, "备注"),
          vue.withDirectives(vue.createElementVNode(
            "textarea",
            {
              "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.remark = $event),
              placeholder: "请输入特殊要求或备注信息",
              class: "remark-input",
              maxlength: "200"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.remark]
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 预约信息展示（查看模式） "),
      $data.mode === "view" && $data.bookingData ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "booking-info"
      }, [
        vue.createElementVNode("view", { class: "info-item" }, [
          vue.createElementVNode("text", { class: "info-label" }, "预约时间:"),
          vue.createElementVNode(
            "text",
            { class: "info-value" },
            vue.toDisplayString($data.bookingData.booking_time),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "info-item" }, [
          vue.createElementVNode("text", { class: "info-label" }, "包厢类型:"),
          vue.createElementVNode(
            "text",
            { class: "info-value" },
            vue.toDisplayString($data.bookingData.room_type),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "info-item" }, [
          vue.createElementVNode("text", { class: "info-label" }, "人数:"),
          vue.createElementVNode(
            "text",
            { class: "info-value" },
            vue.toDisplayString($data.bookingData.people_count) + "人",
            1
            /* TEXT */
          )
        ]),
        $data.bookingData.remark ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "info-item"
        }, [
          vue.createElementVNode("text", { class: "info-label" }, "备注:"),
          vue.createElementVNode(
            "text",
            { class: "info-value" },
            vue.toDisplayString($data.bookingData.remark),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "info-item" }, [
          vue.createElementVNode("text", { class: "info-label" }, "状态:"),
          vue.createElementVNode(
            "text",
            {
              class: vue.normalizeClass(["info-value", $data.bookingData.status])
            },
            vue.toDisplayString($options.getStatusText($data.bookingData.status)),
            3
            /* TEXT, CLASS */
          )
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 预约按钮 "),
      $data.mode !== "view" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "booking-btn-container"
      }, [
        vue.createElementVNode("button", {
          class: vue.normalizeClass(["booking-btn", { "disabled": !$options.canSubmit }]),
          onClick: _cache[5] || (_cache[5] = (...args) => $options.submitBooking && $options.submitBooking(...args)),
          disabled: !$options.canSubmit
        }, " 预约 ", 10, ["disabled"]),
        vue.createElementVNode("text", { class: "booking-tip" }, "预约成功，客服马上联系")
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 预约成功提示 "),
      $data.showSuccess ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "success-modal"
      }, [
        vue.createElementVNode("view", { class: "success-content" }, [
          vue.createElementVNode("view", { class: "success-icon" }, "✓"),
          vue.createElementVNode("text", { class: "success-title" }, "预约成功"),
          vue.createElementVNode("text", { class: "success-desc" }, "客服马上联系")
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesBookingBooking = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-d331dabb"], ["__file", "/Users/yy/Documents/GitHub/ktvapp/ktvapp/pages/booking/booking.vue"]]);
  const _sfc_main$1 = {
    data() {
      return {
        statusBarHeight: 0,
        bookingList: []
      };
    },
    onLoad() {
      try {
        if (uni.getWindowInfo) {
          const windowInfo = uni.getWindowInfo();
          this.statusBarHeight = windowInfo.statusBarHeight;
        } else {
          const systemInfo = uni.getSystemInfoSync();
          this.statusBarHeight = systemInfo.statusBarHeight;
        }
      } catch (error) {
        formatAppLog("log", "at pages/bookings/bookings.vue:101", "获取系统信息失败，使用默认值");
        this.statusBarHeight = 44;
      }
      this.getBookingList();
    },
    methods: {
      async getBookingList() {
        try {
          const userInfo = uni.getStorageSync("userInfo");
          if (!userInfo || !userInfo.phone) {
            uni.showToast({
              title: "请先登录",
              icon: "none"
            });
            return;
          }
          uni.showLoading({
            title: "加载中..."
          });
          const response = await uni.request({
            url: `http://catdog.dachaonet.com/get_user_bookings.php?user_phone=${userInfo.phone}`,
            method: "GET"
          });
          formatAppLog("log", "at pages/bookings/bookings.vue:130", "预约列表API响应:", response);
          if (response.statusCode === 200 && response.data.success) {
            this.bookingList = response.data.data.bookings || [];
          } else {
            formatAppLog("warn", "at pages/bookings/bookings.vue:137", "API获取失败，使用本地数据");
            const mockBookings = uni.getStorageSync("mockBookings") || [];
            this.bookingList = mockBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          }
          uni.hideLoading();
        } catch (error) {
          formatAppLog("error", "at pages/bookings/bookings.vue:145", "获取预约列表失败:", error);
          uni.hideLoading();
          const mockBookings = uni.getStorageSync("mockBookings") || [];
          this.bookingList = mockBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          uni.showToast({
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
        uni.navigateTo({
          url: `/pages/booking/booking?id=${item.id}&mode=view`
        });
      },
      cancelBooking(item) {
        uni.showModal({
          title: "确认取消",
          content: "确定要取消这个预约吗？",
          success: async (res) => {
            var _a;
            if (res.confirm) {
              try {
                const userInfo = uni.getStorageSync("userInfo");
                if (!userInfo || !userInfo.phone) {
                  uni.showToast({
                    title: "请先登录",
                    icon: "none"
                  });
                  return;
                }
                uni.showLoading({
                  title: "取消中..."
                });
                const response = await uni.request({
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
                formatAppLog("log", "at pages/bookings/bookings.vue:214", "取消预约API响应:", response);
                if (response.statusCode === 200 && response.data.success) {
                  uni.hideLoading();
                  uni.showToast({
                    title: "预约已取消",
                    icon: "success"
                  });
                  this.getBookingList();
                  const mockBookings = uni.getStorageSync("mockBookings") || [];
                  const index = mockBookings.findIndex((booking) => booking.id === item.id);
                  if (index !== -1) {
                    mockBookings[index].status = "cancelled";
                    uni.setStorageSync("mockBookings", mockBookings);
                  }
                } else {
                  uni.hideLoading();
                  uni.showToast({
                    title: ((_a = response.data) == null ? void 0 : _a.message) || "取消失败",
                    icon: "none"
                  });
                }
              } catch (error) {
                formatAppLog("error", "at pages/bookings/bookings.vue:245", "取消预约失败:", error);
                uni.hideLoading();
                const mockBookings = uni.getStorageSync("mockBookings") || [];
                const index = mockBookings.findIndex((booking) => booking.id === item.id);
                if (index !== -1) {
                  mockBookings[index].status = "cancelled";
                  mockBookings[index].is_local_cancelled = true;
                  uni.setStorageSync("mockBookings", mockBookings);
                  this.getBookingList();
                  uni.showToast({
                    title: "网络异常，已本地取消",
                    icon: "none"
                  });
                } else {
                  uni.showToast({
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
        uni.showModal({
          title: "联系客服",
          content: "客服电话：400-123-4567\n工作时间：9:00-22:00",
          showCancel: false,
          confirmText: "知道了"
        });
      },
      goToHome() {
        uni.switchTab({
          url: "/pages/index/index"
        });
      },
      goBack() {
        uni.navigateBack();
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 状态栏占位 "),
      vue.createElementVNode(
        "view",
        {
          class: "status-bar",
          style: vue.normalizeStyle({ height: $data.statusBarHeight + "px" })
        },
        null,
        4
        /* STYLE */
      ),
      vue.createCommentVNode(" 头部导航 "),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", {
          class: "back-btn",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
        }, [
          vue.createElementVNode("text", { class: "back-icon" }, "‹")
        ]),
        vue.createElementVNode("text", { class: "header-title" }, "我的预约")
      ]),
      vue.createCommentVNode(" 预约列表 "),
      $data.bookingList.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "booking-list"
      }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.bookingList, (item, index) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "booking-item",
              key: index,
              onClick: ($event) => $options.viewBooking(item)
            }, [
              vue.createElementVNode("view", { class: "booking-header" }, [
                vue.createElementVNode("view", { class: "ktv-info" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "ktv-name" },
                    vue.toDisplayString(item.ktv_name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "booking-id" },
                    "#" + vue.toDisplayString(item.id),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["status-badge", item.status])
                  },
                  [
                    vue.createElementVNode(
                      "text",
                      { class: "status-text" },
                      vue.toDisplayString($options.getStatusText(item.status)),
                      1
                      /* TEXT */
                    )
                  ],
                  2
                  /* CLASS */
                )
              ]),
              vue.createElementVNode("view", { class: "booking-details" }, [
                vue.createElementVNode("view", { class: "detail-row" }, [
                  vue.createElementVNode("text", { class: "detail-label" }, "预约时间:"),
                  vue.createElementVNode(
                    "text",
                    { class: "detail-value" },
                    vue.toDisplayString(item.booking_time),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "detail-row" }, [
                  vue.createElementVNode("text", { class: "detail-label" }, "包厢类型:"),
                  vue.createElementVNode(
                    "text",
                    { class: "detail-value" },
                    vue.toDisplayString(item.room_type),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "detail-row" }, [
                  vue.createElementVNode("text", { class: "detail-label" }, "人数:"),
                  vue.createElementVNode(
                    "text",
                    { class: "detail-value" },
                    vue.toDisplayString(item.people_count),
                    1
                    /* TEXT */
                  )
                ]),
                item.remark ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "detail-row"
                }, [
                  vue.createElementVNode("text", { class: "detail-label" }, "备注:"),
                  vue.createElementVNode(
                    "text",
                    { class: "detail-value" },
                    vue.toDisplayString(item.remark),
                    1
                    /* TEXT */
                  )
                ])) : vue.createCommentVNode("v-if", true)
              ]),
              vue.createElementVNode("view", { class: "booking-footer" }, [
                vue.createElementVNode(
                  "text",
                  { class: "create-time" },
                  vue.toDisplayString($options.formatDate(item.created_at)),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "booking-actions" }, [
                  item.status === "pending" ? (vue.openBlock(), vue.createElementBlock("button", {
                    key: 0,
                    class: "cancel-btn",
                    onClick: vue.withModifiers(($event) => $options.cancelBooking(item), ["stop"])
                  }, " 取消预约 ", 8, ["onClick"])) : vue.createCommentVNode("v-if", true),
                  item.status === "confirmed" ? (vue.openBlock(), vue.createElementBlock("button", {
                    key: 1,
                    class: "contact-btn",
                    onClick: _cache[1] || (_cache[1] = vue.withModifiers((...args) => $options.contactService && $options.contactService(...args), ["stop"]))
                  }, " 联系客服 ")) : vue.createCommentVNode("v-if", true)
                ])
              ])
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])) : (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 1 },
        [
          vue.createCommentVNode(" 空状态 "),
          vue.createElementVNode("view", { class: "empty-state" }, [
            vue.createElementVNode("image", {
              src: _imports_0$1,
              class: "empty-icon",
              mode: "aspectFit"
            }),
            vue.createElementVNode("text", { class: "empty-text" }, "暂无预约记录"),
            vue.createElementVNode("button", {
              class: "goto-booking-btn",
              onClick: _cache[2] || (_cache[2] = (...args) => $options.goToHome && $options.goToHome(...args))
            }, "去预约")
          ])
        ],
        2112
        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
      ))
    ]);
  }
  const PagesBookingsBookings = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-8e81932b"], ["__file", "/Users/yy/Documents/GitHub/ktvapp/ktvapp/pages/bookings/bookings.vue"]]);
  __definePage("pages/login/login", PagesLoginLogin);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/mine/mine", PagesMineMine);
  __definePage("pages/booking/booking", PagesBookingBooking);
  __definePage("pages/bookings/bookings", PagesBookingsBookings);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:7", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:10", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "/Users/yy/Documents/GitHub/ktvapp/ktvapp/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
