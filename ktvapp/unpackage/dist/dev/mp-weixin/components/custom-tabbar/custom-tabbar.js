"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "CustomTabbar",
  props: {
    current: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      tabList: [
        {
          text: "首页",
          pagePath: "/pages/index/index",
          iconPath: "/static/tabbar/home.png",
          selectedIconPath: "/static/tabbar/home-active.png"
        },
        {
          text: "我的",
          pagePath: "/pages/mine/mine",
          iconPath: "/static/tabbar/mine.png",
          selectedIconPath: "/static/tabbar/mine-active.png"
        }
      ],
      safeAreaBottom: 0
    };
  },
  created() {
    var _a;
    try {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.safeAreaBottom = ((_a = systemInfo.safeAreaInsets) == null ? void 0 : _a.bottom) || 0;
    } catch (error) {
      common_vendor.index.__f__("log", "at components/custom-tabbar/custom-tabbar.vue:63", "获取安全区域失败");
      this.safeAreaBottom = 0;
    }
  },
  methods: {
    switchTab(index) {
      if (index === this.current)
        return;
      const url = this.tabList[index].pagePath;
      common_vendor.index.switchTab({ url });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.tabList, (item, index, i0) => {
      return {
        a: $props.current === index ? item.selectedIconPath : item.iconPath,
        b: common_vendor.t(item.text),
        c: $props.current === index ? 1 : "",
        d: index,
        e: common_vendor.o(($event) => $options.switchTab(index), index),
        f: $props.current === index ? 1 : ""
      };
    }),
    b: $data.safeAreaBottom + "px"
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-51c48e3c"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/custom-tabbar/custom-tabbar.js.map
