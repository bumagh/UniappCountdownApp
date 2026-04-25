<template>
  <view class="cs-container">
    <!-- #ifdef H5 -->
    <view class="cs-card" @click="openService">
      <view class="cs-icon">💬</view>
      <view class="cs-info">
        <text class="cs-title">联系客服</text>
        <text class="cs-desc">工作时间: 9:00-18:00</text>
      </view>
      <text class="cs-arrow">›</text>
    </view>

    <!-- 客服弹窗 -->
    <view v-if="showModal" class="cs-modal" @click="showModal = false">
      <view class="cs-modal-content" @click.stop>
        <view class="cs-modal-header">
          <text>联系客服</text>
          <text class="cs-close" @click="showModal = false">✕</text>
        </view>
        <view class="cs-modal-body">
          <view class="cs-option" @click="copyWechatId">
            <text class="cs-opt-icon">📋</text>
            <view class="cs-opt-text">
              <text class="cs-opt-title">复制微信号</text>
              <text class="cs-opt-value">{{ wechatId }}</text>
            </view>
          </view>
          <view class="cs-option" @click="openCustomerServicePage">
            <text class="cs-opt-icon">👆</text>
            <view class="cs-opt-text">
              <text class="cs-opt-title">更多联系方式</text>
              <text class="cs-opt-desc">查看二维码和详细联系方式</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <!-- #endif -->

    <!-- #ifdef MP-WEIXIN -->
    <button class="cs-btn" open-type="contact" session-from="profile_service">
      <view class="cs-card">
        <view class="cs-icon">💬</view>
        <view class="cs-info">
          <text class="cs-title">联系客服</text>
          <text class="cs-desc">点击咨询在线客服</text>
        </view>
        <text class="cs-arrow">›</text>
      </view>
    </button>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const showModal = ref(false);
const wechatId = ref('RealCongfu');

const openService = () => {
  showModal.value = true;
};

const copyWechatId = () => {
  uni.setClipboardData({
    data: wechatId.value,
    success: () => {
      uni.showToast({ title: '已复制微信号', icon: 'success' });
      showModal.value = false;
    },
    fail: () => {
      uni.showToast({ title: '复制失败', icon: 'none' });
    }
  });
};

const openCustomerServicePage = () => {
  showModal.value = false;
  uni.navigateTo({
    url: '/subpackages/customer-service/customer-service'
  });
};
</script>

<style scoped>
.cs-card {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: #fff;
  border-radius: 16rpx;
  margin: 20rpx 0;
}

.cs-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.cs-info {
  flex: 1;
}

.cs-title {
  font-size: 32rpx;
  font-weight: 500;
  display: block;
}

.cs-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.cs-arrow {
  font-size: 40rpx;
  color: #999;
}

.cs-btn {
  padding: 0;
  margin: 0;
  background: transparent;
  line-height: normal;
  border: none;
  text-align: left;
}

.cs-btn::after {
  border: none;
}

/* 弹窗样式 */
.cs-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cs-modal-content {
  width: 80%;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.cs-modal-header {
  padding: 30rpx;
  text-align: center;
  font-size: 34rpx;
  font-weight: 500;
  border-bottom: 1rpx solid #eee;
  position: relative;
}

.cs-close {
  position: absolute;
  right: 30rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32rpx;
  color: #999;
}

.cs-option {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.cs-option:active {
  background: #f5f5f5;
}

.cs-opt-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.cs-opt-text {
  flex: 1;
}

.cs-opt-title {
  font-size: 30rpx;
  display: block;
}

.cs-opt-value,
.cs-opt-desc {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
  display: block;
}
</style>
