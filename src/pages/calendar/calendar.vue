<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-icon" @click="toggleDrawer">
        <text>☰</text>
      </view>
      <view class="navbar-title">
        <text>{{ user.nickname }}的日历</text>
      </view>
      <view class="navbar-icon" @click="goToEventEdit">
        <text>+</text>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view scroll-y class="page-content">
      <!-- 年月选择器 -->
      <view class="calendar-header">
        <view class="month-selector">
          <view class="month-btn" @click="prevMonth">
            <text>‹</text>
          </view>
          <view class="month-display" @click="showMonthPicker">
            <text class="month-text">{{ currentYear }}年{{ currentMonth }}月</text>
          </view>
          <view class="month-btn" @click="nextMonth">
            <text>›</text>
          </view>
        </view>
        <view class="today-btn" @click="goToday">
          <text>今天</text>
        </view>
      </view>

      <!-- 星期标题 -->
      <view class="calendar-weekdays">
        <view 
          v-for="(day, index) in weekDays" 
          :key="index"
          class="weekday-item"
        >
          <text>{{ day }}</text>
        </view>
      </view>

      <!-- 日历网格 -->
      <view class="calendar-grid">
        <view 
          v-for="(day, index) in calendarDays" 
          :key="index"
          class="calendar-day-wrapper"
          @click="handleDayClick(day)"
        >
          <view 
            class="calendar-day"
            :class="{
              'day-other-month': !day.isCurrentMonth,
              'day-today': day.isToday,
              'day-selected': day.isSelected,
              'day-has-countdown': day.hasCountdown
            }"
          >
            <text class="day-number">{{ day.day }}</text>
            <view v-if="day.hasCountdown" class="day-dots">
              <view 
                v-for="(color, idx) in day.colors" 
                :key="idx"
                class="day-dot"
                :style="{ backgroundColor: color }"
              ></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 当天倒数日列表 -->
      <view v-if="selectedCountdowns.length > 0" class="countdown-list-section">
        <view class="section-title">
          <text>{{ selectedDateDisplay }}的倒数日</text>
        </view>
        <view class="countdown-list">
          <view 
            v-for="countdown in selectedCountdowns" 
            :key="countdown.id"
            class="countdown-item shadow"
            @click="handleCountdownClick(countdown)"
          >
            <view 
              class="countdown-color-bar"
              :style="{ backgroundColor: getCategoryColor(countdown.categoryId) }"
            ></view>
            <view class="countdown-content">
              <view class="countdown-left">
                <view class="countdown-icon" :style="{ backgroundColor: getCategoryColor(countdown.categoryId) }">
                  <text>{{ getCategoryIcon(countdown.categoryId) }}</text>
                </view>
                <view class="countdown-info">
                  <text class="countdown-title">{{ countdown.title }}</text>
                  <text class="countdown-category">{{ getCategoryName(countdown.categoryId) }}</text>
                </view>
              </view>
              <view class="countdown-right">
                <text class="countdown-days">{{ calculateDays(countdown.date) }}</text>
                <text class="countdown-unit">天</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="selectedDate" class="empty-state">
        <text class="empty-icon">📅</text>
        <text class="empty-text">这天还没有倒数日</text>
        <view class="btn btn-primary" @click="goToEventEdit">
          <text>添加倒数日</text>
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
            @click="handleAllCategoryClick"
          >
            <view class="category-drawer-icon" style="background-color: #ff6b9d;">
              <text>📋</text>
            </view>
            <text class="category-drawer-name">全部</text>
            <text class="category-drawer-count">{{ getAllCountdownCount() }}</text>
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

    <!-- 月份选择器 -->
    <view v-if="monthPickerVisible" class="modal-mask" @click="monthPickerVisible = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择年月</text>
          <view class="picker-close" @click="monthPickerVisible = false">
            <text>✕</text>
          </view>
        </view>
        <view class="picker-body">
          <picker-view 
            :value="pickerValue" 
            @change="onPickerChange"
            class="picker-view"
          >
            <picker-view-column>
              <view v-for="(year, index) in years" :key="index" class="picker-item">
                <text>{{ year }}年</text>
              </view>
            </picker-view-column>
            <picker-view-column>
              <view v-for="(month, index) in months" :key="index" class="picker-item">
                <text>{{ month }}月</text>
              </view>
            </picker-view-column>
          </picker-view>
        </view>
        <view class="picker-footer">
          <view class="btn btn-ghost" @click="monthPickerVisible = false">
            <text>取消</text>
          </view>
          <view class="btn btn-primary" @click="confirmMonthPicker">
            <text>确定</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import db from '../../utils/db.js';

export default {
  name: 'Calendar',
  data() {
    return {
      user: {
        id: 1,
        nickname: '张三'
      },
      currentYear: 2025,
      currentMonth: 1,
      selectedDate: null,
      weekDays: ['日', '一', '二', '三', '四', '五', '六'],
      calendarDays: [],
      countdowns: [],
      categories: [],
      selectedCountdowns: [],
      drawerVisible: false,
      monthPickerVisible: false,
      pickerValue: [0, 0],
      years: [],
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };
  },
  computed: {
    selectedDateDisplay() {
      if (!this.selectedDate) return '';
      const date = new Date(this.selectedDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekDay = weekDays[date.getDay()];
      return `${year}年${month}月${day}日 星期${weekDay}`;
    }
  },
  onShow() {
    this.initData();
  },
  methods: {
    initData() {
      const currentUser = db.getCurrentUser();
      if (currentUser) {
        this.user = currentUser;
      }
      
      const today = new Date();
      this.currentYear = today.getFullYear();
      this.currentMonth = today.getMonth() + 1;
      
      this.initYears();
      this.loadCategories();
      this.loadCountdowns();
      this.generateCalendar();
    },
    initYears() {
      const currentYear = new Date().getFullYear();
      for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        this.years.push(i);
      }
      this.pickerValue = [10, this.currentMonth - 1];
    },
    loadCategories() {
      if (this.user.id) {
        this.categories = db.getCategories(this.user.id);
      }
    },
    loadCountdowns() {
      if (this.user.id) {
        this.countdowns = db.getCountdowns(this.user.id);
      }
    },
    generateCalendar() {
      const year = this.currentYear;
      const month = this.currentMonth;
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const daysInMonth = lastDay.getDate();
      const startWeekDay = firstDay.getDay();
      
      const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
      
      const days = [];
      
      for (let i = startWeekDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dateStr = this.formatDate(year, month - 1, day);
        days.push({
          day,
          dateStr,
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          hasCountdown: this.hasCountdownOnDate(dateStr),
          colors: this.getCountdownColors(dateStr)
        });
      }
      
      const today = new Date();
      const todayStr = this.formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = this.formatDate(year, month, i);
        days.push({
          day: i,
          dateStr,
          isCurrentMonth: true,
          isToday: dateStr === todayStr,
          isSelected: dateStr === this.selectedDate,
          hasCountdown: this.hasCountdownOnDate(dateStr),
          colors: this.getCountdownColors(dateStr)
        });
      }
      
      const remainingDays = 42 - days.length;
      for (let i = 1; i <= remainingDays; i++) {
        const dateStr = this.formatDate(year, month + 1, i);
        days.push({
          day: i,
          dateStr,
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          hasCountdown: this.hasCountdownOnDate(dateStr),
          colors: this.getCountdownColors(dateStr)
        });
      }
      
      this.calendarDays = days;
    },
    formatDate(year, month, day) {
      if (month === 0) {
        year -= 1;
        month = 12;
      } else if (month === 13) {
        year += 1;
        month = 1;
      }
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    },
    hasCountdownOnDate(dateStr) {
      return this.countdowns.some(cd => cd.date === dateStr);
    },
    getCountdownColors(dateStr) {
      const countdownsOnDate = this.countdowns.filter(cd => cd.date === dateStr);
      const colors = [];
      countdownsOnDate.forEach(cd => {
        const category = this.categories.find(c => c.id === cd.categoryId);
        if (category && colors.length < 3) {
          colors.push(category.color);
        }
      });
      return colors;
    },
    handleDayClick(day) {
      if (!day.isCurrentMonth) {
        return;
      }
      this.selectedDate = day.dateStr;
      this.generateCalendar();
      this.loadSelectedCountdowns();
    },
    loadSelectedCountdowns() {
      if (!this.selectedDate) {
        this.selectedCountdowns = [];
        return;
      }
      this.selectedCountdowns = this.countdowns.filter(cd => cd.date === this.selectedDate);
    },
    prevMonth() {
      if (this.currentMonth === 1) {
        this.currentYear -= 1;
        this.currentMonth = 12;
      } else {
        this.currentMonth -= 1;
      }
      this.generateCalendar();
    },
    nextMonth() {
      if (this.currentMonth === 12) {
        this.currentYear += 1;
        this.currentMonth = 1;
      } else {
        this.currentMonth += 1;
      }
      this.generateCalendar();
    },
    goToday() {
      const today = new Date();
      this.currentYear = today.getFullYear();
      this.currentMonth = today.getMonth() + 1;
      this.selectedDate = this.formatDate(this.currentYear, this.currentMonth, today.getDate());
      this.generateCalendar();
      this.loadSelectedCountdowns();
    },
    showMonthPicker() {
      const yearIndex = this.years.indexOf(this.currentYear);
      this.pickerValue = [yearIndex, this.currentMonth - 1];
      this.monthPickerVisible = true;
    },
    onPickerChange(e) {
      this.pickerValue = e.detail.value;
    },
    confirmMonthPicker() {
      this.currentYear = this.years[this.pickerValue[0]];
      this.currentMonth = this.months[this.pickerValue[1]];
      this.monthPickerVisible = false;
      this.generateCalendar();
    },
    calculateDays(targetDate) {
      const days = db.calculateDays(targetDate);
      if (days > 0) {
        return `还有 ${days}`;
      } else if (days < 0) {
        return `已过 ${Math.abs(days)}`;
      } else {
        return '今天';
      }
    },
    getCategoryColor(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.color : '#ff6b9d';
    },
    getCategoryIcon(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.icon : '📋';
    },
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : '未分类';
    },
    getCategoryCount(categoryId) {
      return this.countdowns.filter(cd => cd.categoryId === categoryId).length;
    },
    getAllCountdownCount() {
      return this.countdowns.length;
    },
    toggleDrawer() {
      this.drawerVisible = !this.drawerVisible;
    },
    handleCategoryClick(category) {
      this.drawerVisible = false;
      uni.switchTab({
        url: '/pages/categories/categories'
      });
      setTimeout(() => {
        uni.$emit('selectCategory', { categoryId: category.id });
      }, 100);
    },
    handleAllCategoryClick() {
      this.drawerVisible = false;
      uni.switchTab({
        url: '/pages/index/index'
      });
    },
    goToEventEdit() {
      const selectedDate = this.selectedDate || this.formatDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
      uni.navigateTo({
        url: `/pages/event-edit/event-edit${this.selectedDate ? '?date=' + selectedDate : ''}`
      });
    },
    handleCountdownClick(countdown) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${countdown.id}`
      });
    }
  }
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #fffef9;
}

.page-content {
  height: calc(100vh - 88rpx - 100rpx);
  padding-top: 88rpx;
  padding-bottom: 100rpx;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  background-color: #ffffff;
  border-bottom: 2rpx solid #f0ebe6;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.month-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fffef9;
  border-radius: 50%;
  font-size: 40rpx;
  color: #5c4033;
}

.month-display {
  padding: 10rpx 30rpx;
  background-color: #fffef9;
  border-radius: 999rpx;
  border: 2rpx solid #f0ebe6;
}

.month-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #5c4033;
}

.today-btn {
  padding: 10rpx 30rpx;
  background-color: #ff6b9d;
  border-radius: 999rpx;
  color: #ffffff;
  font-size: 24rpx;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #ffffff;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f0ebe6;
}

.weekday-item {
  text-align: center;
  font-size: 24rpx;
  color: #8f7a66;
  font-weight: bold;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #ffffff;
  padding: 10rpx 0;
}

.calendar-day-wrapper {
  aspect-ratio: 1;
  padding: 4rpx;
}

.calendar-day {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  position: relative;
  transition: all 0.3s;
}

.day-number {
  font-size: 28rpx;
  color: #5c4033;
}

.day-other-month .day-number {
  color: #cccccc;
}

.day-today {
  background-color: #ff6b9d;
}

.day-today .day-number {
  color: #ffffff;
}

.day-selected {
  background-color: #fff0f5;
  border: 2rpx solid #ff6b9d;
}

.day-has-countdown {
  font-weight: bold;
}

.day-dots {
  position: absolute;
  bottom: 4rpx;
  display: flex;
  gap: 4rpx;
}

.day-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
}

.countdown-list-section {
  padding: 30rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #5c4033;
  margin-bottom: 20rpx;
}

.countdown-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.countdown-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  position: relative;
}

.countdown-color-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8rpx;
}

.countdown-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  padding-left: 38rpx;
}

.countdown-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.countdown-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
}

.countdown-info {
  display: flex;
  flex-direction: column;
}

.countdown-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #5c4033;
  margin-bottom: 8rpx;
}

.countdown-category {
  font-size: 24rpx;
  color: #8f7a66;
}

.countdown-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.countdown-days {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff6b9d;
}

.countdown-unit {
  font-size: 20rpx;
  color: #8f7a66;
  margin-top: 4rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
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
  background-color: #fffef9;
  border-radius: 12rpx;
  transition: all 0.3s;
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
  color: #5c4033;
}

.category-drawer-count {
  font-size: 24rpx;
  color: #8f7a66;
  background-color: #f0ebe6;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
}

.picker-content {
  width: 640rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 2rpx solid #f0ebe6;
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #5c4033;
}

.picker-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #8f7a66;
}

.picker-body {
  padding: 30rpx;
}

.picker-view {
  width: 100%;
  height: 400rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  font-size: 28rpx;
  color: #5c4033;
}

.picker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-top: 2rpx solid #f0ebe6;
  gap: 20rpx;
}
</style>