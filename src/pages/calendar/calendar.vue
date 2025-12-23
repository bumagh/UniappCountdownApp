<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-icon" @click=" toggleDrawer ">
        <text>☰</text>
      </view>
      <view class="navbar-title">
        <text>{{ user.nickname }}的日历</text>
      </view>
      <view class="navbar-icon" @click=" goToEventEdit ">
        <text>+</text>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view scroll-y class="page-content">
      <!-- 年月选择器 -->
      <view class="calendar-header">
        <view class="month-selector">
          <view class="month-btn" @click=" prevMonth ">
            <text>‹</text>
          </view>
          <view class="month-display" @click=" showMonthPicker ">
            <text class="month-text">{{ currentYear }}年{{ currentMonth }}月</text>
          </view>
          <view class="month-btn" @click=" nextMonth ">
            <text>›</text>
          </view>
        </view>
        <view class="today-btn" @click=" goToday ">
          <text>今天</text>
        </view>
      </view>

      <!-- 星期标题 -->
      <view class="calendar-weekdays">
        <view v-for=" ( day, index ) in weekDays " :key=" index " class="weekday-item">
          <text>{{ day }}</text>
        </view>
      </view>

      <!-- 日历网格 -->
      <view class="calendar-grid">
        <view v-for=" ( day, index ) in calendarDays " :key=" index " class="calendar-day-wrapper"
          @click="handleDayClick( day )">
          <view class="calendar-day" :class=" {
            'day-other-month': !day.isCurrentMonth,
            'day-today': day.isToday,
            'day-selected': day.isSelected,
            'day-has-countdown': day.hasCountdown
          } ">
            <text class="day-number">{{ day.day }}</text>
            <view v-if=" day.hasCountdown " class="day-dots">
              <view v-for=" ( color, idx ) in day.colors " :key=" idx " class="day-dot"
                :style=" { backgroundColor: color } ">
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 当天奇妙日列表 -->
      <view v-if=" selectedCountdowns.length > 0 " class="countdown-list-section">
        <view class="section-title">
          <text>{{ selectedDateDisplay }}的奇妙日</text>
        </view>
        <view class="countdown-list">
          <view v-for=" countdown in selectedCountdowns " :key=" countdown.id " class="countdown-item shadow"
            @click="handleCountdownClick( countdown )">
            <view class="countdown-color-bar" :style=" { backgroundColor: getCategoryColor( countdown.category_id ) } ">
            </view>
            <view class="countdown-content">
              <view class="countdown-left">
                <view class="countdown-icon" :style=" { backgroundColor: getCategoryColor( countdown.category_id ) } ">
                  <text>{{ getCategoryIcon( countdown.category_id ) }}</text>
                </view>
                <view class="countdown-info">
                  <text class="countdown-title">{{ countdown.title }}</text>
                  <text class="countdown-category">{{ getCategoryName( countdown.category_id ) }}</text>
                </view>
              </view>
              <view class="countdown-right">
                <text class="countdown-days">{{ calculateDays( countdown.date ) }}</text>
                <text class="countdown-unit">天</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if=" selectedDate " class="empty-state">
        <text class="empty-icon">📅</text>
        <text class="empty-text">这天还没有奇妙日</text>
        <view class="btn btn-primary" @click=" goToEventEdit ">
          <text>添加奇妙日</text>
        </view>
      </view>

      <!-- 底部空白 -->
      <view style="height: 40rpx;"></view>
    </scroll-view>

    <!-- 侧边抽屉 -->
    <view v-if=" drawerVisible " class="drawer-mask" @click=" toggleDrawer "></view>
    <view class="drawer" :class=" { 'drawer-open': drawerVisible } ">
      <view class="drawer-header">
        <text class="drawer-title">倒数本</text>
        <view class="drawer-close" @click=" toggleDrawer ">
          <text>✕</text>
        </view>
      </view>
      <scroll-view scroll-y class="drawer-content">
        <view class="category-list">
          <view class="category-drawer-item" @click=" handleAllCategoryClick ">
            <view class="category-drawer-icon" style="background-color: #ff6b9d;">
              <text>📋</text>
            </view>
            <text class="category-drawer-name">全部</text>
            <text class="category-drawer-count">{{ getAllCountdownCount() }}</text>
          </view>
          <view v-for=" category in categories " :key=" category.id " class="category-drawer-item"
            @click="handleCategoryClick( category )">
            <view class="category-drawer-icon" :style=" { backgroundColor: category.color } ">
              <text>{{ category.icon }}</text>
            </view>
            <text class="category-drawer-name">{{ category.name }}</text>
            <text class="category-drawer-count">{{ getCategoryCount( category.id ) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 月份选择器 -->
    <view v-if=" monthPickerVisible " class="modal-mask" @click="monthPickerVisible = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择年月</text>
          <view class="picker-close" @click="monthPickerVisible = false">
            <text>✕</text>
          </view>
        </view>
        <view class="picker-body">
          <picker-view :value=" pickerValue " @change=" onPickerChange " class="picker-view">
            <picker-view-column>
              <view v-for=" ( year, index ) in years " :key=" index " class="picker-item">
                <text>{{ year }}年</text>
              </view>
            </picker-view-column>
            <picker-view-column>
              <view v-for=" ( month, index ) in months " :key=" index " class="picker-item">
                <text>{{ month }}月</text>
              </view>
            </picker-view-column>
          </picker-view>
        </view>
        <view class="picker-footer">
          <view class="btn btn-ghost" @click="monthPickerVisible = false">
            <text>取消</text>
          </view>
          <view class="btn btn-primary" @click=" confirmMonthPicker ">
            <text>确定</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
<script lang="ts">
export interface CalendarDay
{
  day: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasCountdown: boolean;
  colors: string[];
}
import { defineComponent } from 'vue';
import db from '../../utils/db.js';
import { Category, Countdown, User } from 'types';
import apiService from '@/services/apiService';

export default defineComponent( {
  name: 'Calendar',
  // Props 定义
  props: {},

  // Emits 定义
  emits: {
    dateSelect: ( date: string ) => true,
    countdownSelect: ( countdown: Countdown ) => true
  },

  data ()
  {
    return {
      // 用户信息
      user: {} as User,

      // 日历相关状态
      currentYear: 2025,
      currentMonth: 1,
      selectedDate: null as string | null,

      // UI 状态
      weekDays: [ '日', '一', '二', '三', '四', '五', '六' ] as string[],
      calendarDays: [] as CalendarDay[],
      drawerVisible: false,
      monthPickerVisible: false,
      pickerValue: [ 0, 0 ] as number[],

      // 数据
      countdowns: [] as Countdown[],
      categories: [] as Category[],
      selectedCountdowns: [] as Countdown[],

      // 选择器数据
      years: [] as number[],
      months: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ] as number[]
    };
  },

  computed: {
    // 当前选中的日期显示
    selectedDateDisplay (): string
    {
      if ( !this.selectedDate ) return '';

      const date = new Date( this.selectedDate );
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDay = this.weekDays[ date.getDay() ];

      return `${ year }年${ month }月${ day }日 星期${ weekDay }`;
    },

    // 当前月份显示
    currentMonthDisplay (): string
    {
      return `${ this.currentYear }年${ this.currentMonth }月`;
    }
  },

  onShow ()
  {
    this.initData();
  },

  onLoad ()
  {
    // 页面加载时的初始化
    this.initData();
  },

  methods: {
    /**
     * 初始化数据
     */
    async initData ()
    {
      // 获取当前用户
      const userid = uni.getStorageSync( 'userid' );
      const currentUser = await apiService.getCurrentUser( userid );
      if ( currentUser != null )
      {
        this.user = currentUser;
      }

      // 设置当前日期
      const today = new Date();
      this.currentYear = today.getFullYear();
      this.currentMonth = today.getMonth() + 1;

      // 初始化年份选择器
      this.initYears();

      // 加载数据
      await this.loadCategories();
      await this.loadCountdowns();

      // 生成日历
      this.generateCalendar();
    },

    /**
     * 初始化年份列表
     */
    initYears (): void
    {
      const currentYear = new Date().getFullYear();
      this.years = [];

      // 生成最近20年的年份
      for ( let i = currentYear - 10; i <= currentYear + 10; i++ )
      {
        this.years.push( i );
      }

      // 设置选择器默认值
      const yearIndex = this.years.indexOf( this.currentYear );
      if ( yearIndex !== -1 )
      {
        this.pickerValue = [ yearIndex, this.currentMonth - 1 ];
      }
    },

    /**
     * 加载分类数据
     */
    async loadCategories ()
    {
      const userid = uni.getStorageSync( 'userid' );
      this.categories = await apiService.getCategories( userid );
    },

    /**
     * 加载奇妙日数据
     */
    async loadCountdowns ()
    {
      const userid = uni.getStorageSync( 'userid' );
      this.countdowns = await apiService.getCountdowns( { userid } );
    },

    /**
     * 生成日历
     */
    generateCalendar (): void
    {
      const year = this.currentYear;
      const month = this.currentMonth;

      // 获取月份的第一天和最后一天
      const firstDay = new Date( year, month - 1, 1 );
      const lastDay = new Date( year, month, 0 );
      const daysInMonth = lastDay.getDate();
      const startWeekDay = firstDay.getDay();

      // 获取上个月的最后一天
      const prevMonthLastDay = new Date( year, month - 1, 0 ).getDate();

      const days: CalendarDay[] = [];

      // 添加上个月的日期
      for ( let i = startWeekDay - 1; i >= 0; i-- )
      {
        const day = prevMonthLastDay - i;
        const dateStr = this.formatDate( year, month - 1, day );
        days.push( this.createCalendarDay( day, dateStr, false ) );
      }

      // 添加本月日期
      const today = new Date();
      const todayStr = this.formatDate(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );

      for ( let i = 1; i <= daysInMonth; i++ )
      {
        const dateStr = this.formatDate( year, month, i );
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === this.selectedDate;

        days.push( this.createCalendarDay( i, dateStr, true, isToday, isSelected ) );
      }

      // 添加下个月的日期，补足42个格（6行×7列）
      const remainingDays = 42 - days.length;
      for ( let i = 1; i <= remainingDays; i++ )
      {
        const dateStr = this.formatDate( year, month + 1, i );
        days.push( this.createCalendarDay( i, dateStr, false ) );
      }

      this.calendarDays = days;
    },

    /**
     * 创建日历日期对象
     */
    createCalendarDay (
      day: number,
      dateStr: string,
      isCurrentMonth: boolean,
      isToday: boolean = false,
      isSelected: boolean = false
    ): CalendarDay
    {
      return {
        day,
        dateStr,
        isCurrentMonth,
        isToday,
        isSelected,
        hasCountdown: this.hasCountdownOnDate( dateStr ),
        colors: this.getCountdownColors( dateStr )
      };
    },

    /**
     * 格式化日期字符串
     */
    formatDate ( year: number, month: number, day: number ): string
    {
      // 处理月份溢出
      let actualYear = year;
      let actualMonth = month;

      if ( month === 0 )
      {
        actualYear -= 1;
        actualMonth = 12;
      } else if ( month === 13 )
      {
        actualYear += 1;
        actualMonth = 1;
      }

      // 格式化为 YYYY-MM-DD
      return `${ actualYear }-${ String( actualMonth ).padStart( 2, '0' ) }-${ String( day ).padStart( 2, '0' ) }`;
    },

    /**
     * 检查指定日期是否有奇妙日
     */
    hasCountdownOnDate ( dateStr: string ): boolean
    {
      // return this.countdowns.some( ( cd: Countdown ) => cd.date === dateStr );
      return true;
    },

    /**
     * 获取指定日期的奇妙日颜色
     */
    getCountdownColors ( dateStr: string ): string[]
    {
      const countdownsOnDate = this.countdowns.filter( ( cd: Countdown ) => cd.date === dateStr );
      const colors: string[] = [];

      countdownsOnDate.forEach( ( cd: Countdown ) =>
      {
        const category = this.categories.find( ( c: Category ) => c.id === cd.category_id );
        if ( category && colors.length < 3 )
        {
          colors.push( category.color );
        }
      } );

      return colors;
    },

    /**
     * 处理日期点击
     */
    handleDayClick ( day: CalendarDay ): void
    {
      if ( !day.isCurrentMonth )
      {
        // 如果不是当前月份的日期，可以跳转到对应的月份
        const date = new Date( day.dateStr );
        this.currentYear = date.getFullYear();
        this.currentMonth = date.getMonth() + 1;
        this.selectedDate = day.dateStr;
        this.generateCalendar();
        this.loadSelectedCountdowns();
        return;
      }

      this.selectedDate = day.dateStr;
      this.generateCalendar();
      this.loadSelectedCountdowns();

      // 触发事件
      this.$emit( 'dateSelect', day.dateStr );
    },

    /**
     * 加载选中日期的奇妙日
     */
    loadSelectedCountdowns (): void
    {
      if ( !this.selectedDate )
      {
        this.selectedCountdowns = [];
        return;
      }

      this.selectedCountdowns = this.countdowns.filter(
        ( cd: Countdown ) => cd.date === this.selectedDate
      );
    },

    /**
     * 上一个月
     */
    prevMonth (): void
    {
      if ( this.currentMonth === 1 )
      {
        this.currentYear -= 1;
        this.currentMonth = 12;
      } else
      {
        this.currentMonth -= 1;
      }
      this.generateCalendar();
    },

    /**
     * 下一个月
     */
    nextMonth (): void
    {
      if ( this.currentMonth === 12 )
      {
        this.currentYear += 1;
        this.currentMonth = 1;
      } else
      {
        this.currentMonth += 1;
      }
      this.generateCalendar();
    },

    /**
     * 跳转到今天
     */
    goToday (): void
    {
      const today = new Date();
      this.currentYear = today.getFullYear();
      this.currentMonth = today.getMonth() + 1;
      this.selectedDate = this.formatDate(
        this.currentYear,
        this.currentMonth,
        today.getDate()
      );
      this.generateCalendar();
      this.loadSelectedCountdowns();
    },

    /**
     * 显示月份选择器
     */
    showMonthPicker (): void
    {
      const yearIndex = this.years.indexOf( this.currentYear );
      if ( yearIndex !== -1 )
      {
        this.pickerValue = [ yearIndex, this.currentMonth - 1 ];
      }
      this.monthPickerVisible = true;
    },

    /**
     * 月份选择器变化
     */
    onPickerChange ( e: any ): void
    {
      this.pickerValue = e.detail.value;
    },

    /**
     * 确认月份选择
     */
    confirmMonthPicker (): void
    {
      this.currentYear = this.years[ this.pickerValue[ 0 ] ];
      this.currentMonth = this.months[ this.pickerValue[ 1 ] ];
      this.monthPickerVisible = false;
      this.generateCalendar();
    },

    /**
     * 计算奇妙日天数
     */
    calculateDays ( targetDate: string ): string
    {
      const days = db.calculateDays( targetDate );

      if ( days > 0 )
      {
        return `还有 ${ days } 天`;
      } else if ( days < 0 )
      {
        return `已过 ${ Math.abs( days ) } 天`;
      } else
      {
        return '今天';
      }
    },

    /**
     * 获取分类颜色
     */
    getCategoryColor ( categoryId: number ): string
    {
      const category = this.categories.find( ( c: Category ) => c.id === categoryId );
      return category ? category.color : '#ff6b9d';
    },

    /**
     * 获取分类图标
     */
    getCategoryIcon ( categoryId: number ): string
    {
      const category = this.categories.find( ( c: Category ) => c.id === categoryId );
      return category ? category.icon : '📋';
    },

    /**
     * 获取分类名称
     */
    getCategoryName ( categoryId: number ): string
    {
      const category = this.categories.find( ( c: Category ) => c.id === categoryId );
      return category ? category.name : '未分类';
    },

    /**
     * 获取分类下的奇妙日数量
     */
    getCategoryCount ( categoryId: number ): number
    {
      return this.countdowns.filter( ( cd: Countdown ) => cd.category_id === categoryId ).length;
    },

    /**
     * 获取所有奇妙日数量
     */
    getAllCountdownCount (): number
    {
      return this.countdowns.length;
    },

    /**
     * 切换侧边抽屉
     */
    toggleDrawer (): void
    {
      this.drawerVisible = !this.drawerVisible;
    },

    /**
     * 处理分类点击
     */
    handleCategoryClick ( category: Category ): void
    {
      this.drawerVisible = false;
      uni.switchTab( {
        url: '/pages/categories/categories'
      } );

      setTimeout( () =>
      {
        uni.$emit( 'selectCategory', { categoryId: category.id } );
      }, 100 );
    },

    /**
     * 处理全部分类点击
     */
    handleAllCategoryClick (): void
    {
      this.drawerVisible = false;
      uni.switchTab( {
        url: '/pages/index/index'
      } );
    },

    /**
     * 跳转到事件编辑页面
     */
    goToEventEdit (): void
    {
      const selectedDate = this.selectedDate ||
        this.formatDate(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          new Date().getDate()
        );

      uni.navigateTo( {
        url: `/subpackages/edit/edit${ this.selectedDate ? '?date=' + selectedDate : '' }`
      } );
    },

    /**
     * 处理奇妙日点击
     */
    handleCountdownClick ( countdown: Countdown ): void
    {
      uni.navigateTo( {
        url: `/subpackages/detail/detail?id=${ countdown.id }`
      } );

      // 触发事件
      this.$emit( 'countdownSelect', countdown );
    },

    /**
     * 刷新数据
     */
    refreshData (): void
    {
      this.loadCategories();
      this.loadCountdowns();
      this.generateCalendar();

      if ( this.selectedDate )
      {
        this.loadSelectedCountdowns();
      }
    },

    /**
     * 跳转到指定日期
     */
    goToDate ( dateStr: string ): void
    {
      const date = new Date( dateStr );
      this.currentYear = date.getFullYear();
      this.currentMonth = date.getMonth() + 1;
      this.selectedDate = dateStr;
      this.generateCalendar();
      this.loadSelectedCountdowns();
    }
  }
} );
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