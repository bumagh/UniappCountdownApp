<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-icon" @click="goBack">
        <text>‹</text>
      </view>
      <view class="navbar-title">
        <text>倒数日详情</text>
      </view>
      <view class="navbar-icon" @click="handleEdit">
        <text>✎</text>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view scroll-y class="page-content">
      <view v-if="countdown" class="detail-container">
        <!-- 倒数日主体信息 -->
        <view class="countdown-main-card shadow-lg">
          <view class="countdown-header">
            <view class="category-badge" :style="{ backgroundColor: categoryColor }">
              <text class="category-icon">{{ categoryIcon }}</text>
              <text class="category-name">{{ categoryName }}</text>
            </view>
            <view v-if="countdown.is_pinned" class="pin-badge">
              <text>📌 已置顶</text>
            </view>
          </view>

          <view class="countdown-title-section">
            <text class="countdown-title">{{ countdown.title }}</text>
          </view>

          <view class="countdown-days-section">
            <view class="days-wrapper">
              <text class="days-label">{{ daysLabel }}</text>
              <text class="days-number">{{ Math.abs(daysCount) }}</text>
              <text class="days-unit">天</text>
            </view>
          </view>

          <view class="countdown-date-section">
            <text class="date-text">{{ formatFullDate(countdown.date) }}</text>
          </view>
        </view>

        <!-- 详细信息卡片 -->
        <view class="info-card shfadow">
          <view class="info-header">
            <text class="info-title">详细信息</text>
          </view>

          <view class="info-list">
            <view class="info-item">
              <view class="info-item-label">
                <text class="info-icon">📅</text>
                <text>目标日期</text>
              </view>
              <text class="info-item-value">{{ countdown.date }}</text>
            </view>

            <view class="info-item">
              <view class="info-item-label">
                <text class="info-icon">📂</text>
                <text>所属分类</text>
              </view>
              <text class="info-item-value">{{ categoryName }}</text>
            </view>

            <view class="info-item">
              <view class="info-item-label">
                <text class="info-icon">🔄</text>
                <text>重复设置</text>
              </view>
              <text class="info-item-value">{{ repeatText }}</text>
            </view>

            <view class="info-item">
              <view class="info-item-label">
                <text class="info-icon">📌</text>
                <text>置顶状态</text>
              </view>
              <text class="info-item-value">{{ countdown.is_pinned ? '已置顶' : '未置顶' }}</text>
            </view>

            <view class="info-item">
              <view class="info-item-label">
                <text class="info-icon">🗂️</text>
                <text>归档状态</text>
              </view>
              <text class="info-item-value">{{ countdown.is_archived ? '已归档' : '未归档' }}</text>
            </view>

            <view class="info-item">
              <view class="info-item-label">
                <text class="info-icon">⏰</text>
                <text>创建时间</text>
              </view>
              <text class="info-item-value">{{ formatCreateTime(countdown.created_at) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">倒数日不存在</text>
        <view class="btn btn-primary" @click="goBack">
          <text>返回</text>
        </view>
      </view>

      <!-- 底部空白 -->
      <view style="height: 40rpx;"></view>
    </scroll-view>


  </view>
</template>

<script lang="ts">
import apiService from '@/services/apiService';
import { defineComponent } from 'vue';
import db from '../../utils/db.js';
import { Category, Countdown } from '../../../types/index';
interface DetailPageData {
  countdownId: number,
  countdown: Countdown |null,
  categories: Category[]
}
export default defineComponent( {
  name: 'Detail',
  data() :DetailPageData{
    return {
      countdownId: 1,
      countdown:  null,
      categories: []
    };
  },
  computed: {
    daysCount() {
      if (!this.countdown) return 0;
      return db.calculateDays(this.countdown.date);
    },
    daysLabel() {
      if (this.daysCount > 0) {
        return '距离目标还有';
      } else if (this.daysCount < 0) {
        return '距离目标已经';
      } else {
        return '就是今天';
      }
    },
    categoryColor() {
      if (!this.countdown) return '#1890ff';
      const category = this.categories.find(c => c.id === this.countdown?.category_id);
      return category ? category.color : '#1890ff';
    },
    categoryIcon() {
      if (!this.countdown) return '📋';
      const category = this.categories.find(c => c.id === this.countdown?.category_id);
      return category ? category.icon : '📋';
    },
    categoryName() {
      if (!this.countdown) return '未分类';
      const category = this.categories.find(c => c.id === this.countdown?.category_id);
      return category ? category.name : '未分类';
    },
    repeatText() {
      if (!this.countdown) return '不重复';
      return db.getRepeatText(this.countdown.repeat_cycle, this.countdown.repeat_frequency);
    }
  },
  onLoad(options:any) {
    if (options.id) {
      this.countdownId = options.id;
      this.loadData();
    }
  },
  onShow() {
    if (this.countdownId) {
      this.loadData();
    }
  },
  methods: {
    async loadData() {
      try {
        const userid = uni.getStorageSync('userid');
        this.countdown = await apiService.getCountdown(this.countdownId);
        if (this.countdown) {
          this.categories = await apiService.getCategories(userid);
        }
      } catch (error) {
        console.error('数据库初始化失败:', error);
      }

    },
    formatFullDate(dateStr:any) {
      return db.formatDate(dateStr);
    },
    formatCreateTime(isoString:any) {
      if (!isoString) return '未知';
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    goBack() {
      uni.navigateBack({
        delta: 1
      });
    },
    handleEdit() {
      uni.navigateTo({
        url: `/subpackages/edit/edit?id=${this.countdownId}`
      });
    },


  }
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f9ff;
}

.navbar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  background-color: #1890ff;
  border-bottom: 2rpx solid #0d7de0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.navbar-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.navbar-icon {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #ffffff;
}

.page-content {
  height: calc(100vh - 88rpx);
  padding-top: 88rpx;
}

.detail-container {
  padding: 30rpx;
}

.countdown-main-card {
  background: linear-gradient(135deg, #1890ff 0%, #52c4ff 100%);
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 30rpx;
  color: #ffffff;
}

.countdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.category-badge {
  display: flex;
  align-items: center;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10rpx);
}

.category-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.category-name {
  font-size: 24rpx;
  color: #ffffff;
}

.pin-badge {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10rpx);
  font-size: 22rpx;
  color: #ffffff;
}

.countdown-title-section {
  margin-bottom: 40rpx;
}

.countdown-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 1.4;
}

.countdown-days-section {
  margin-bottom: 30rpx;
}

.days-wrapper {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12rpx;
}

.days-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

.days-number {
  font-size: 100rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 1;
}

.days-unit {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.9);
}

.countdown-date-section {
  text-align: center;
}

.date-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.info-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.info-header {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #e8f4ff;
}

.info-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1890ff;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background-color: #f5f9ff;
  border-radius: 12rpx;
}

.info-item-label {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333333;
}

.info-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.info-item-value {
  font-size: 26rpx;
  color: #666666;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 150rpx 0;
  color: #aaaaaa;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  margin-bottom: 40rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 40rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #1890ff;
  color: #ffffff;
}

.shadow {
  box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.1);
}

.shadow-lg {
  box-shadow: 0 8rpx 32rpx rgba(24, 144, 255, 0.15);
}
</style>