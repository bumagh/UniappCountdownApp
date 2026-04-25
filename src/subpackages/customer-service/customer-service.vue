<template>
  <view class="page-container">
    <!-- 内容区 -->
    <scroll-view scroll-y class="content">
      <!-- 客服卡片 -->
      <view class="kf-card">
        <view class="kf-avatar">
          <text class="kf-avatar-icon">👩‍💼</text>
        </view>
        <text class="kf-name">奇妙日客服</text>
        <text class="kf-desc">有问题随时联系我们</text>
      </view>

      <!-- 联系方式 -->
      <view class="contact-section">
        <view class="section-title">联系方式</view>

        <view class="contact-list">
          <!-- 微信号 -->
          <view class="contact-item" @click="copyWechatId">
            <view class="contact-left">
              <view class="contact-icon green">
                <text>💬</text>
              </view>
              <view class="contact-info">
                <text class="contact-label">客服微信号</text>
                <text class="contact-value">{{ kfWechatId }}</text>
              </view>
            </view>
            <text class="contact-action">复制</text>
          </view>

          <!-- 邮箱 -->
          <view class="contact-item" @click="copyEmail">
            <view class="contact-left">
              <view class="contact-icon blue">
                <text>📧</text>
              </view>
              <view class="contact-info">
                <text class="contact-label">客服邮箱</text>
                <text class="contact-value">{{ kfEmail }}</text>
              </view>
            </view>
            <text class="contact-action">复制</text>
          </view>

          <!-- 公众号 -->
          <view class="contact-item" @click="copyOfficialAccount">
            <view class="contact-left">
              <view class="contact-icon orange">
                <text>📱</text>
              </view>
              <view class="contact-info">
                <text class="contact-label">公众号</text>
                <text class="contact-value">{{ officialAccount }}</text>
              </view>
            </view>
            <text class="contact-action">复制</text>
          </view>
        </view>
      </view>

      <!-- 二维码区域 -->
      <view class="qr-section">
        <view class="section-title">扫码添加</view>
        <view class="qr-card">
          <view class="qr-placeholder">
            <text class="qr-icon">📷</text>
            <text class="qr-tip">请上传客服微信二维码</text>
            <text class="qr-path">路径: static/kf-qr.png</text>
          </view>
          <!-- 有二维码图片后使用下面代码 -->
          <!-- <image class="qr-image" src="/static/kf-qr.png" mode="aspectFit" @longpress="saveQrCode" /> -->
        </view>
        <text class="qr-hint">长按二维码保存到相册</text>
      </view>

      <!-- 工作时间 -->
      <view class="time-section">
        <view class="section-title">服务时间</view>
        <view class="time-card">
          <view class="time-item">
            <text class="time-label">工作日</text>
            <text class="time-value">9:00 - 18:00</text>
          </view>
          <view class="time-item">
            <text class="time-label">周末/节假日</text>
            <text class="time-value">留言回复</text>
          </view>
        </view>
      </view>

      <!-- 温馨提示 -->
      <view class="tips-section">
        <view class="section-title">温馨提示</view>
        <view class="tips-card">
          <text class="tip-item">1. 客服工作时间：周一至周五 9:00-18:00</text>
          <text class="tip-item">2. 非工作时间请留言，我们会尽快回复</text>
          <text class="tip-item">3. 添加客服微信请备注「奇妙日用户」</text>
          <text class="tip-item">4. 紧急情况请发送邮件至客服邮箱</text>
        </view>
      </view>

      <!-- 底部空白 -->
      <view style="height: 40rpx;"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const kfWechatId = ref('RealCongfu');
const kfEmail = ref('support@tutlab.tech');
const officialAccount = ref('奇妙日倒计时');

const goBack = () => {
  uni.navigateBack({
    fail: () => {
      uni.switchTab({ url: '/pages/profile/profile' });
    }
  });
};

const copyWechatId = () => {
  uni.setClipboardData({
    data: kfWechatId.value,
    success: () => {
      uni.showToast({ title: '微信号已复制', icon: 'success' });
    }
  });
};

const copyEmail = () => {
  uni.setClipboardData({
    data: kfEmail.value,
    success: () => {
      uni.showToast({ title: '邮箱已复制', icon: 'success' });
    }
  });
};

const copyOfficialAccount = () => {
  uni.setClipboardData({
    data: officialAccount.value,
    success: () => {
      uni.showToast({ title: '公众号已复制', icon: 'success' });
    }
  });
};

const saveQrCode = () => {
  // #ifdef MP-WEIXIN
  uni.saveImageToPhotosAlbum({
    filePath: '/static/kf-qr.png',
    success: () => {
      uni.showToast({ title: '保存成功', icon: 'success' });
    },
    fail: () => {
      uni.showToast({ title: '保存失败', icon: 'none' });
    }
  });
  // #endif

  // #ifdef H5
  uni.showToast({ title: '请长按图片保存', icon: 'none' });
  // #endif
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.content {
  padding: 20rpx;
}

/* 客服卡片 */
.kf-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}

.kf-avatar {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #07c160 0%, #05a350 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.kf-avatar-icon {
  font-size: 60rpx;
}

.kf-name {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 10rpx;
}

.kf-desc {
  font-size: 28rpx;
  color: #999;
}

/* 分区标题 */
.section-title {
  font-size: 28rpx;
  color: #666;
  margin: 30rpx 20rpx 20rpx;
}

/* 联系方式 */
.contact-section {
  margin-bottom: 20rpx;
}

.contact-list {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-item:active {
  background: #f9f9f9;
}

.contact-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.contact-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.contact-icon.green {
  background: #e6f7ed;
}

.contact-icon.blue {
  background: #e6f4ff;
}

.contact-icon.orange {
  background: #fff2e8;
}

.contact-icon text {
  font-size: 40rpx;
}

.contact-info {
  flex: 1;
}

.contact-label {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}

.contact-value {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  display: block;
}

.contact-action {
  font-size: 28rpx;
  color: #07c160;
  padding: 10rpx 20rpx;
  background: #e6f7ed;
  border-radius: 8rpx;
}

/* 二维码 */
.qr-section {
  margin-bottom: 20rpx;
}

.qr-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-placeholder {
  width: 400rpx;
  height: 400rpx;
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.qr-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.qr-tip {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.qr-path {
  font-size: 24rpx;
  color: #bbb;
}

.qr-image {
  width: 400rpx;
  height: 400rpx;
  border-radius: 16rpx;
}

.qr-hint {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  margin-top: 20rpx;
  display: block;
}

/* 服务时间 */
.time-section {
  margin-bottom: 20rpx;
}

.time-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 30rpx;
}

.time-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.time-item:last-child {
  border-bottom: none;
}

.time-label {
  font-size: 30rpx;
  color: #666;
}

.time-value {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

/* 温馨提示 */
.tips-section {
  margin-bottom: 20rpx;
}

.tips-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.tip-item {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  display: block;
  margin-bottom: 10rpx;
}

.tip-item:last-child {
  margin-bottom: 0;
}
</style>
