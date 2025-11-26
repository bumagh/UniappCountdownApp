<template>
  <view id="app">
    <router-view v-if="isReady" />
  </view>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isReady: false
    };
  },
  onLaunch() {
    console.log('App Launch');
    this.initApp();
  },
  onShow() {
    console.log('App Show');
  },
  onHide() {
    console.log('App Hide');
  },
  methods: {
    initApp() {
      try {
        uni.getSystemInfo({
          success: (res) => {
            this.isReady = true;
            console.log('系统信息：', res);
          },
          fail: (err) => {
            console.error('获取系统信息失败：', err);
            this.isReady = true;
          }
        });
      } catch (e) {
        console.error('初始化失败：', e);
        this.isReady = true;
      }
    }
  }
};
</script>

<style lang="scss">
@import '@/uni.scss';

#app {
  width: 100%;
  min-height: 100vh;
  background-color: $colorBg;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

page {
  background-color: $colorBg;
  color: $colorText;
  font-size: 28rpx;
  line-height: 1.6;
}

.navbar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  background-color: $colorWhite;
  border-bottom: 2rpx solid $colorBorder;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.navbar-title {
  font-size: 32rpx;
  font-weight: bold;
  color: $colorText;
}

.navbar-icon {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: $colorText;
}

.drawer {
  position: fixed;
  top: 0;
  left: -600rpx;
  width: 600rpx;
  height: 100vh;
  background-color: $colorWhite;
  transition: left 0.3s ease;
  z-index: 9999;
  box-shadow: 4rpx 0 16rpx rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.drawer-open {
  left: 0;
}

.drawer-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 2rpx solid $colorBorder;
}

.drawer-title {
  font-size: 32rpx;
  font-weight: bold;
  color: $colorText;
}

.drawer-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: $colorTextLight;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  width: 640rpx;
  background-color: $colorWhite;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 2rpx solid $colorBorder;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: $colorText;
}

.modal-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 40rpx;
  color: $colorTextLight;
}

.modal-body {
  padding: 30rpx;
  max-height: 800rpx;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-top: 2rpx solid $colorBorder;
  gap: 20rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 40rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
  transition: all 0.3s;
}

.btn-primary {
  background-color: $colorPrimary;
  color: $colorWhite;
}

.btn-ghost {
  background-color: transparent;
  border: 2rpx solid $colorPrimary;
  color: $colorPrimary;
}

.btn-danger {
  background-color: $colorDanger;
  color: $colorWhite;
}

.btn-round {
  border-radius: 999rpx;
}

uni-input {
  height: auto !important;
  min-height: 0 !important;
  line-height: normal !important;
}
</style>