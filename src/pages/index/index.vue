<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-icon" @click="toggleDrawer">
        <text>☰</text>
      </view>
      <view class="navbar-title">
        <text>{{ user.nickname }}的倒数日</text>
      </view>
      <view class="navbar-icon" @click="showAddCountdown">
        <text>+</text>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view scroll-y class="page-content">
      <!-- 置顶日程容器（独立显示在最上方） -->
      <view v-if="pinnedCountdowns.length > 0" class="countdown-section">
        <view class="section-header">
          <text class="section-title">置顶</text>
          <text class="section-count">{{ pinnedCountdowns.length }}个</text>
        </view>
        <view 
          v-for="countdown in pinnedCountdowns" 
          :key="countdown.id"
          class="countdown-card shadow pinned-card"
          :class="{ 'past-card': calculateDays(countdown.displayDate) < 0 }"
          @click="handleCountdownClick(countdown)"
        >
          <view class="pin-badge">
            <text>📌</text>
          </view>
          <view class="countdown-main" :class="{ 'past-main': calculateDays(countdown.displayDate) < 0 }">
            <text class="countdown-number">{{ getAbsoluteDays(countdown.displayDate) }}</text>
            <text class="countdown-unit">天</text>
          </view>
          <view class="countdown-info">
            <text class="countdown-title">{{ countdown.title }}</text>
            <text class="countdown-date">{{ formatDate(countdown.displayDate) }}</text>
            <view class="countdown-category">
              <view 
                class="category-dot" 
                :style="{ backgroundColor: getCategoryColor(countdown.categoryId) }"
              ></view>
              <text class="category-name">{{ getCategoryName(countdown.categoryId) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 未来倒数日（包含置顶的） -->
      <view v-if="futureCountdowns.length > 0" class="countdown-section">
        <view class="section-header">
          <text class="section-title">未来</text>
          <text class="section-count">{{ futureCountdowns.length }}个</text>
        </view>
        <view 
          v-for="countdown in futureCountdowns" 
          :key="countdown.id"
          class="countdown-card shadow"
          :class="{ 
            'pinned-card': countdown.isPinned,
            'past-card': calculateDays(countdown.displayDate) < 0 
          }"
          @click="handleCountdownClick(countdown)"
        >
          <view v-if="countdown.isPinned" class="pin-badge">
            <text>📌</text>
          </view>
          <view class="countdown-main" :class="{ 'past-main': calculateDays(countdown.displayDate) < 0 }">
            <text class="countdown-number">{{ getAbsoluteDays(countdown.displayDate) }}</text>
            <text class="countdown-unit">天</text>
          </view>
          <view class="countdown-info">
            <text class="countdown-title">{{ countdown.title }}</text>
            <text class="countdown-date">{{ formatDate(countdown.displayDate) }}</text>
            <view class="countdown-category">
              <view 
                class="category-dot" 
                :style="{ backgroundColor: getCategoryColor(countdown.categoryId) }"
              ></view>
              <text class="category-name">{{ getCategoryName(countdown.categoryId) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 已经倒数日（包含置顶的） -->
      <view v-if="pastCountdowns.length > 0" class="countdown-section">
        <view class="section-header">
          <text class="section-title">已经</text>
          <text class="section-count">{{ pastCountdowns.length }}个</text>
        </view>
        <view 
          v-for="countdown in pastCountdowns" 
          :key="countdown.id"
          class="countdown-card shadow past-card"
          :class="{ 'pinned-card': countdown.isPinned }"
          @click="handleCountdownClick(countdown)"
        >
          <view v-if="countdown.isPinned" class="pin-badge">
            <text>📌</text>
          </view>
          <view class="countdown-main past-main">
            <text class="countdown-number">{{ getAbsoluteDays(countdown.displayDate) }}</text>
            <text class="countdown-unit">天</text>
          </view>
          <view class="countdown-info">
            <text class="countdown-title">{{ countdown.title }}</text>
            <text class="countdown-date">{{ formatDate(countdown.displayDate) }}</text>
            <view class="countdown-category">
              <view 
                class="category-dot" 
                :style="{ backgroundColor: getCategoryColor(countdown.categoryId) }"
              ></view>
              <text class="category-name">{{ getCategoryName(countdown.categoryId) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="allCountdowns.length === 0" class="empty-state">
        <text class="empty-icon">📅</text>
        <text class="empty-text">还没有倒数日</text>
        <view class="btn btn-primary" @click="showAddCountdown">
          <text>添加第一个倒数日</text>
        </view>
      </view>

      <!-- 底部空白 -->
      <view style="height: 40rpx;"></view>
    </scroll-view>

    <!-- 侧边抽屉 -->
    <view v-if="drawerVisible" class="drawer-mask" @click="toggleDrawer"></view>
    <view class="drawer" :class="{ 'drawer-open': drawerVisible }">
      <view class="drawer-header">
        <text class="drawer-title">倒数本</text>
        <view class="drawer-close" @click="toggleDrawer">
          <text>✕</text>
        </view>
      </view>
      <scroll-view scroll-y class="drawer-content">
        <view class="category-list">
          <view 
            class="category-drawer-item"
            @click="handleAllCategory"
          >
            <view class="category-drawer-icon" style="background-color: #1890ff;">
              <text>📋</text>
            </view>
            <text class="category-drawer-name">全部</text>
            <text class="category-drawer-count">{{ allCountdowns.length }}</text>
          </view>
          <view 
            v-for="category in categories" 
            :key="category.id"
            class="category-drawer-item"
            @click="handleCategoryClick(category)"
          >
            <view class="category-drawer-icon" :style="{ backgroundColor: category.color }">
              <text>{{ category.icon }}</text>
            </view>
            <text class="category-drawer-name">{{ category.name }}</text>
            <text class="category-drawer-count">{{ getCategoryCount(category.id) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

  </view>
</template>

<script>
import db from '../../utils/db.js';

export default {
  name: 'Index',
  components: {},

  data() {
    return {
      user: {
        id: 1,
        nickname: '张三'
      },
      allCountdowns: [],
      categories: [],
      drawerVisible: false
    };
  },
  computed: {
    // 为每个倒数日计算显示日期（考虑重复日程的未来最近日期）
    countdownsWithDisplayDate() {
      return this.allCountdowns.map(countdown => {
        let displayDate = countdown.date;
        
        // 如果是重复日程，计算未来最近的日期
        if (countdown.repeatCycle > 0 && countdown.repeatFrequency !== '不重复') {
          displayDate = db.getNextRepeatDate(countdown.date, countdown.repeatCycle, countdown.repeatFrequency);
        }
        
        return {
          ...countdown,
          displayDate
        };
      });
    },
    // 置顶日程（独立的置顶容器）- 按编辑时间排序，最新编辑的在前
    pinnedCountdowns() {
      return this.countdownsWithDisplayDate
        .filter(cd => cd.isPinned)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
    // 未来倒数日（包含置顶的）- 按日期排序
    futureCountdowns() {
      const future = this.countdownsWithDisplayDate.filter(cd => db.calculateDays(cd.displayDate) >= 0);
      return future.sort((a, b) => db.calculateDays(a.displayDate) - db.calculateDays(b.displayDate));
    },
    // 已经倒数日（包含置顶的）- 按日期排序
    pastCountdowns() {
      const past = this.countdownsWithDisplayDate.filter(cd => db.calculateDays(cd.displayDate) < 0);
      return past.sort((a, b) => db.calculateDays(b.displayDate) - db.calculateDays(a.displayDate));
    }
  },
  onShow() {
    this.loadData();
  },
  methods: {
    loadData() {
      const currentUser = db.getCurrentUser();
      if (currentUser) {
        this.user = currentUser;
        this.allCountdowns = db.getCountdowns(currentUser.id);
        this.categories = db.getCategories(currentUser.id);
      }
    },
    calculateDays(targetDate) {
      return db.calculateDays(targetDate);
    },
    getAbsoluteDays(targetDate) {
      return Math.abs(db.calculateDays(targetDate));
    },
    formatDate(dateStr) {
      return db.formatDate(dateStr);
    },
    getCategoryColor(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.color : '#1890ff';
    },
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : '未分类';
    },
    getCategoryCount(categoryId) {
      return this.allCountdowns.filter(cd => cd.categoryId === categoryId).length;
    },
    toggleDrawer() {
      this.drawerVisible = !this.drawerVisible;
    },
    showAddCountdown() {
      uni.navigateTo({
        url: '/pages/edit/edit'
      });
    },

    handleCountdownClick(countdown) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${countdown.id}`
      });
    },

    handleAllCategory() {
      this.drawerVisible = false;
    },
    handleCategoryClick(category) {
      this.drawerVisible = false;
      uni.navigateTo({
        url: `/pages/categories/categories?categoryId=${category.id}`
      });
    }
  }
};
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
  height: calc(100vh - 88rpx - 100rpx);
  padding-top: 88rpx;
  padding-bottom: 100rpx;
}

.countdown-section {
  padding: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.section-count {
  font-size: 24rpx;
  color: #666666;
}

.countdown-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
  position: relative;
  transition: all 0.3s ease;
}

.pinned-card {
  border: 2rpx solid #1890ff;
  background: linear-gradient(135deg, #ffffff 0%, #e8f4ff 100%);
  box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.15);
}

.pin-badge {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  font-size: 32rpx;
  background-color: rgba(255, 149, 0, 0.1);
  padding: 8rpx;
  border-radius: 8rpx;
}

.past-card {
  opacity: 0.8;
  background-color: #f5f5f5 !important;
}

.past-card.pinned-card {
  border-color: #999999;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%) !important;
  border-left: 6rpx solid #999999;
}

.countdown-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 160rpx;
}

.countdown-number {
  font-size: 80rpx;
  font-weight: bold;
  color: #1890ff;
  line-height: 1;
}

.past-main .countdown-number {
  color: #666666;
}

.countdown-unit {
  font-size: 24rpx;
  color: #666666;
  margin-top: 8rpx;
}

.countdown-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.countdown-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.countdown-date {
  font-size: 24rpx;
  color: #666666;
}

.countdown-category {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 4rpx;
}

.category-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
}

.category-name {
  font-size: 22rpx;
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
}

.btn-primary {
  background-color: #1890ff;
  color: #ffffff;
}

.drawer {
  position: fixed;
  top: 0;
  left: -600rpx;
  width: 600rpx;
  height: 100vh;
  background-color: #ffffff;
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
  border-bottom: 2rpx solid #e8f4ff;
}

.drawer-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.drawer-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #666666;
}

.drawer-content {
  flex: 1;
  padding: 20rpx;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.category-drawer-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f5f9ff;
  border-radius: 12rpx;
}

.category-drawer-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-right: 20rpx;
}

.category-drawer-name {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.category-drawer-count {
  font-size: 24rpx;
  color: #666666;
  background-color: #e8f4ff;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
}

.shadow {
  box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.08);
}
</style>