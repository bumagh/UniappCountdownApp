<template>
  <view class="page-container">
    <view class="navbar" :style="navbarStyle">
      <view class="navbar-content" :style="navbarContentStyle">
        <view class="navbar-icon" @click="handleGoBack">
          <text>‹</text>
        </view>
        <view class="navbar-title">
          <text>{{ isEdit ? '编辑奇妙日' : '添加奇妙日' }}</text>
        </view>
        <view class="navbar-actions">
          <view class="navbar-action" @click="handleSubmit">
            <text style="white-space: nowrap;">✓ 保存</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="page-content" :style="pageContentStyle">
      <view class="form-container">
        <view class="form-item">
          <text class="form-label">日程名称</text>
          <input class="form-input" v-model="formData.title" placeholder="请输入日程名称" maxlength="20" />
        </view>

        <view class="form-item">
          <text class="form-label">选择日期</text>
          <view class="date-picker-container">
            <picker mode="date" :value="formData.date" @change="onDateChange" :start="minDate" :end="maxDate" class="date-picker">
              <view class="date-input">
                <text v-if="formData.date" class="date-text">{{ formatDateDisplay(formData.date) }}</text>
                <text v-else class="date-placeholder">请选择日期</text>
                <text class="date-icon">📅</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">选择时间</text>
          <view class="date-picker-container">
            <picker mode="time" :value="formData.time || '06:00'" @change="onTimeChange" class="date-picker">
              <view class="date-input">
                <text v-if="formData.time" class="date-text">{{ formData.time }}</text>
                <text v-else class="date-placeholder">请选择时间</text>
                <text class="date-icon">⏰</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">选择分类</text>
          <view class="category-list">
            <view v-for="category in categories" :key="category.id" class="category-item" :class="{ 'category-active': formData.category_id === category.id }" @click="selectCategory(category.id)">
              <view class="category-icon" :style="{ backgroundColor: category.color }">
                <text class="icon-text">{{ category.icon }}</text>
              </view>
              <text class="category-name">{{ category.name }}</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">置顶显示</text>
            <switch :checked="formData.is_pinned" @change="onPinnedChange" color="#1890ff" />
          </view>
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">开启日历提醒</text>
            <switch :checked="calendarReminderEnabled" @change="onCalendarReminderChange" color="#1890ff" />
          </view>
          <text class="form-tip">默认关闭，开启后执行添加日历功能（此功能只适配小程序）</text>
        </view>

        <repeat-selector v-model="repeatData" @change="onRepeatChange" />

        <view v-if="isRepeatEnabled" class="repeat-selector-section">
          <view class="repeat-button-wrapper">
            <button class="repeat-button" @click="showRepeatOptions">
              {{ repeatOption || '请选择重复频率' }}
            </button>
          </view>
          <view class="repeat-hint">
            <text>当前设置：{{ getRepeatText() }}</text>
          </view>
        </view>
      </view>

      <view style="height: 40rpx;"></view>
    </scroll-view>

    <view v-if="isEdit" class="danger-section" style="position: fixed; bottom: 0; left: 0; right: 0;">
      <view class="danger-actions">
        <view class="btn btn-archive" @click="handleArchive">
          <text>归档</text>
        </view>
        <view class="btn btn-danger" @click="handleDelete">
          <text>删除</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import apiService from '@/services/apiService';
import { formatDate, getRepeatText } from '@/utils/countdownUtils';
import { Category, CountdownForm } from 'types';
import RepeatSelector, { type RepeatData } from '@/components/RepeatSelector.vue';

declare const wx: any;

interface EditPageData {
  countdownId: number | null;
  isEdit: boolean;
  statusBarHeight: number;
  navBarHeight: number;
  navContentHeight: number;
  formData: CountdownForm & {
    is_pinned: boolean;
  };
  categories: Category[];
  repeatOptions: string[];
  repeatOption: string;
  isRepeatEnabled: boolean;
  repeatData: RepeatData;
  calendarReminderEnabled: boolean;
}

export default defineComponent({
  name: 'Edit',
  components: {
    RepeatSelector
  },
  data(): EditPageData {
    return {
      countdownId: null,
      isEdit: false,
      statusBarHeight: 0,
      navBarHeight: 44,
      navContentHeight: 44,
      formData: {
        title: '',
        date: this.getCurrentDate(),
        time: '06:00',
        category_id: 0,
        is_pinned: false,
        repeat_cycle: 0,
        repeat_frequency: '不重复' as const
      },
      categories: [],
      repeatOptions: ['不重复', '每天', '每周', '每月', '每年', '每2天', '每3天', '每4天', '每5天', '每6天', '每7天', '每2周', '每3周', '每2月', '每3月', '每6月', '每2年', '每3年', '每5年'],
      repeatOption: '不重复',
      isRepeatEnabled: false,
      repeatData: {
        repeat_cycle: 0,
        repeat_frequency: '不重复'
      } as RepeatData,
      calendarReminderEnabled: false
    };
  },
  computed: {
    navbarStyle(): Record<string, string> {
      return {
        height: `${this.navBarHeight}px`,
        paddingTop: `${this.statusBarHeight}px`
      };
    },
    navbarContentStyle(): Record<string, string> {
      return {
        height: `${this.navContentHeight}px`
      };
    },
    pageContentStyle(): Record<string, string> {
      return {
        height: `calc(100vh - ${this.navBarHeight}px)`
      };
    },
    minDate(): string {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 100);
      return date.toISOString().split('T')[0];
    },
    maxDate(): string {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1000);
      return date.toISOString().split('T')[0];
    }
  },
  onLoad(options: any): void {
    this.initNavbarMetrics();
    if (options.date) {
      this.formData.date = options.date;
    }
    if (options.id) {
      this.countdownId = parseInt(options.id);
      this.isEdit = true;
      this.loadCountdownData();
    } else {
      this.loadCategories();
    }
  },
  methods: {
    initNavbarMetrics(): void {
      const systemInfo = uni.getSystemInfoSync();
      const statusBarHeight = systemInfo.statusBarHeight || 0;
      let navContentHeight = 44;

      // #ifdef MP-WEIXIN
      try {
        const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
        if (menuButtonInfo && menuButtonInfo.height) {
          const verticalPadding = Math.max(menuButtonInfo.top - statusBarHeight, 0);
          navContentHeight = menuButtonInfo.height + verticalPadding * 2;
        }
      } catch (error) {
        console.error('获取胶囊按钮位置失败:', error);
      }
      // #endif

      this.statusBarHeight = statusBarHeight;
      this.navContentHeight = navContentHeight;
      this.navBarHeight = statusBarHeight + navContentHeight;
    },
    onRepeatChange(newData: RepeatData): void {
      this.processRepeatData(newData);
    },
    processRepeatData(data: RepeatData): void {
      if (data.repeat_cycle > 0) {
        this.formData.repeat_cycle = data.repeat_cycle;
        this.formData.repeat_frequency = data.repeat_frequency as any;
        this.isRepeatEnabled = true;
        this.repeatOption = getRepeatText(data.repeat_cycle, data.repeat_frequency as any);
      } else {
        this.formData.repeat_cycle = 0;
        this.formData.repeat_frequency = '不重复';
        this.isRepeatEnabled = false;
        this.repeatOption = '不重复';
      }
    },
    getCurrentDate(): string {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    async loadCountdownData(): Promise<void> {
      if (!this.countdownId) return;
      try {
        const countdown = await apiService.getCountdown(this.countdownId);
        if (countdown) {
          this.formData = {
            title: countdown.title,
            date: countdown.date,
            time: countdown.time || '06:00',
            category_id: countdown.category_id,
            is_pinned: countdown.is_pinned || false,
            repeat_cycle: countdown.repeat_cycle || 0,
            repeat_frequency: countdown.repeat_frequency || '不重复'
          };
          this.checkRepeatEnabled();
          this.setRepeatOption();
        }
        this.loadCategories();
      } catch (error) {
        console.error('加载奇妙日数据失败:', error);
        uni.showToast({ title: '加载数据失败', icon: 'none' });
      }
    },
    async loadCategories(): Promise<void> {
      try {
        const userid = uni.getStorageSync('userid');
        const categories = await apiService.getCategories(userid);
        this.categories = categories;
        if (this.categories.length > 0 && !this.formData.category_id) {
          this.formData.category_id = this.categories[0].id;
        }
      } catch (error) {
        console.error('加载分类失败:', error);
        uni.showToast({ title: '加载分类失败', icon: 'none' });
      }
    },
    checkRepeatEnabled(): void {
      this.isRepeatEnabled = this.formData.repeat_cycle > 0 && this.formData.repeat_frequency !== '不重复';
    },
    setRepeatOption(): void {
      if (this.formData.repeat_cycle === 0 || this.formData.repeat_frequency === '不重复') {
        this.repeatOption = '不重复';
      } else {
        this.repeatOption = getRepeatText(this.formData.repeat_cycle, this.formData.repeat_frequency);
      }
    },
    onDateChange(e: any): void {
      this.formData.date = e.detail.value;
    },
    onTimeChange(e: any): void {
      this.formData.time = e.detail.value;
    },
    selectCategory(category_id: number): void {
      this.formData.category_id = category_id;
    },
    onPinnedChange(e: any): void {
      this.formData.is_pinned = e.detail.value;
    },
    onCalendarReminderChange(e: any): void {
      const enabled = e.detail.value;
      this.calendarReminderEnabled = enabled;

      if (!enabled) {
        uni.showModal({
          title: '已关闭日历提醒',
          content: '已关闭应用内开关。若你之前已经添加到系统日历，请前往系统日历手动删除该提醒。',
          showCancel: false
        });
        return;
      }

      if (!this.formData.title.trim()) {
        this.calendarReminderEnabled = false;
        uni.showToast({ title: '请先输入日程名称', icon: 'none' });
        return;
      }

      if (!this.formData.date) {
        this.calendarReminderEnabled = false;
        uni.showToast({ title: '请先选择日期', icon: 'none' });
        return;
      }

      if (!this.formData.time) {
        this.calendarReminderEnabled = false;
        uni.showToast({ title: '请先选择时间', icon: 'none' });
        return;
      }

      this.triggerCalendarReminder();
    },
    showRepeatOptions(): void {
      uni.showActionSheet({
        itemList: this.repeatOptions,
        success: (res) => {
          this.repeatOption = this.repeatOptions[res.tapIndex];
          this.parseRepeatOption(this.repeatOption);
        }
      });
    },
    parseRepeatOption(option: string): void {
      if (option === '不重复') {
        this.formData.repeat_cycle = 0;
        this.formData.repeat_frequency = '不重复';
      } else if (option === '每天') {
        this.formData.repeat_cycle = 1;
        this.formData.repeat_frequency = '天重复';
      } else if (option === '每周') {
        this.formData.repeat_cycle = 1;
        this.formData.repeat_frequency = '周重复';
      } else if (option === '每月') {
        this.formData.repeat_cycle = 1;
        this.formData.repeat_frequency = '月重复';
      } else if (option === '每年') {
        this.formData.repeat_cycle = 1;
        this.formData.repeat_frequency = '年重复';
      } else if (option.includes('每')) {
        const match = option.match(/每(\d+)(天|周|月|年)/);
        if (match) {
          this.formData.repeat_cycle = parseInt(match[1]);
          const frequencyMap = {
            '天': '天重复',
            '周': '周重复',
            '月': '月重复',
            '年': '年重复'
          } as const;
          this.formData.repeat_frequency = frequencyMap[match[2] as keyof typeof frequencyMap];
        }
      }
      this.checkRepeatEnabled();
    },
    getRepeatText(): string {
      if (this.repeatOption === '不重复') {
        return '不重复';
      }
      return this.repeatOption;
    },
    formatDateDisplay(dateStr: string): string {
      return formatDate(dateStr);
    },
    checkPhoneCalendarSupport(): boolean {
      // #ifdef MP-WEIXIN
      const wxAny = wx as any;
      if (!wxAny || typeof wxAny.addPhoneCalendar !== 'function') {
        return false;
      }
      return true;
      // #endif

      // #ifndef MP-WEIXIN
      return false;
      // #endif
    },
    ensurePhoneCalendarAuth(): Promise<boolean> {
      return new Promise((resolve) => {
        // #ifdef MP-WEIXIN
        uni.getSetting({
          success: (settingRes) => {
            const authSetting = ((settingRes.authSetting || {}) as unknown) as Record<string, boolean>;
            if (authSetting['scope.addPhoneCalendar'] === true) {
              resolve(true);
              return;
            }
            uni.authorize({
              scope: 'scope.addPhoneCalendar' as any,
              success: () => resolve(true),
              fail: () => resolve(false)
            });
          },
          fail: () => resolve(false)
        });
        // #endif

        // #ifndef MP-WEIXIN
        resolve(false);
        // #endif
      });
    },
    addPhoneCalendarEvent(options: Record<string, any>): Promise<void> {
      return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        const wxAny = wx as any;
        this.ensurePhoneCalendarAuth().then((authorized) => {
          if (!authorized) {
            reject(new Error('未获得系统日历权限'));
            return;
          }
          wxAny.addPhoneCalendar({
            ...options,
            success: () => resolve(),
            fail: (error: any) => reject(error)
          });
        }).catch(reject);
        // #endif

        // #ifndef MP-WEIXIN
        reject(new Error('仅支持微信小程序'));
        // #endif
      });
    },
    handlePhoneCalendarError(error: any): void {
      console.error('系统日历处理失败：', error);
      uni.showToast({
        title: error?.errMsg || '日历提醒处理失败',
        icon: 'none'
      });
    },
    async triggerCalendarReminder(): Promise<void> {
      // #ifndef MP-WEIXIN
      uni.showToast({ title: '仅支持微信小程序', icon: 'none' });
      return;
      // #endif

      // #ifdef MP-WEIXIN
      if (!this.checkPhoneCalendarSupport()) {
        uni.showModal({
          title: '当前版本不支持',
          content: '当前微信基础库版本过低，请升级微信后再试。',
          showCancel: false
        });
        return;
      }

      const startTime = Math.floor(new Date(`${this.formData.date} ${this.formData.time}:00`).getTime() / 1000);
      const endTime = startTime + 30 * 60;

      try {
        await this.addPhoneCalendarEvent({
          title: this.formData.title,
          startTime,
          endTime,
          allDay: false,
          description: `奇妙日提醒：${this.formData.title}`,
          location: '奇妙日小程序',
          alarm: true,
          alarmOffset: 0
        });
        uni.showToast({ title: '已添加到系统日历', icon: 'success' });
      } catch (error: any) {
        this.handlePhoneCalendarError(error);
      }
      // #endif
    },
    handleGoBack(): void {
      uni.navigateBack();
    },
    goBack(deltas: number = 1): void {
      uni.navigateBack({ delta: deltas ?? 1 });
    },
    async handleArchive(): Promise<void> {
      if (!this.countdownId) return;
      uni.showModal({
        title: '确认归档',
        content: `确定要归档「${this.formData.title}」吗？归档后可在"我的"模块中查看。`,
        confirmText: '归档',
        success: async (res) => {
          if (res.confirm) {
            try {
              await apiService.archiveCountdown(this.countdownId!);
              uni.showToast({ title: '归档成功', icon: 'success' });
              setTimeout(() => {
                this.goBack();
              }, 1000);
            } catch (error) {
              uni.showToast({ title: '归档失败', icon: 'none' });
            }
          }
        }
      });
    },
    async handleDelete(): Promise<void> {
      if (!this.countdownId) return;
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个奇妙日吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await apiService.deleteCountdown(this.countdownId!);
              uni.showToast({ title: '删除成功', icon: 'success' });
              this.goBack(2);
            } catch (error) {
              uni.showToast({ title: '删除失败', icon: 'none' });
            }
          }
        }
      });
    },
    async handleSubmit(): Promise<void> {
      if (!this.formData.title.trim()) {
        uni.showToast({ title: '请输入日程名称', icon: 'none' });
        return;
      }
      if (!this.formData.date) {
        uni.showToast({ title: '请选择日期', icon: 'none' });
        return;
      }
      if (!this.formData.time) {
        uni.showToast({ title: '请选择时间', icon: 'none' });
        return;
      }
      if (!this.formData.category_id) {
        uni.showToast({ title: '请选择分类', icon: 'none' });
        return;
      }

      try {
        if (this.isEdit && this.countdownId) {
          await apiService.updateCountdown(this.countdownId, {
            title: this.formData.title,
            date: this.formData.date,
            time: this.formData.time,
            category_id: this.formData.category_id,
            is_pinned: this.formData.is_pinned,
            repeat_cycle: this.formData.repeat_cycle,
            repeat_frequency: this.formData.repeat_frequency
          });
          uni.showToast({ title: '修改成功', icon: 'success' });
        } else {
          await apiService.createCountdown({
            user_id: uni.getStorageSync('userid'),
            is_archived: false,
            is_pinned: this.formData.is_pinned,
            title: this.formData.title,
            date: this.formData.date,
            time: this.formData.time,
            category_id: this.formData.category_id,
            repeat_cycle: this.formData.repeat_cycle,
            repeat_frequency: this.formData.repeat_frequency
          });
          uni.showToast({ title: '添加成功', icon: 'success' });
        }

        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' });
        }, 1000);
      } catch (error) {
        console.error('操作失败:', error);
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    }
  }
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f9ff;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background-color: #1890ff;
  box-sizing: border-box;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 20rpx 0 30rpx;
  box-sizing: border-box;
  border-bottom: 2rpx solid #0d7de0;
}

.navbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 96rpx;
  gap: 16rpx;
}

.navbar-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.navbar-action {
  width: auto;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #ffffff;
}

.navbar-icon {
  width: 80rpx;
  height: 44rpx;
  display: inline;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #ffffff;
}

.page-content {
  box-sizing: border-box;
}

.form-container {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 40rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 20rpx;
  font-weight: bold;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
}

.form-tip {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #999999;
  line-height: 1.6;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background-color: #ffffff;
  border: 2rpx solid #e8f4ff;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.date-picker-container {
  width: 100%;
}

.date-picker {
  width: 100%;
}

.date-input {
  width: 100%;
  height: 80rpx;
  background-color: #ffffff;
  border: 2rpx solid #e8f4ff;
  border-radius: 12rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.date-text {
  font-size: 28rpx;
  color: #333333;
}

.date-placeholder {
  font-size: 28rpx;
  color: #aaaaaa;
}

.date-icon {
  font-size: 32rpx;
  color: #1890ff;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background-color: #ffffff;
  border: 2rpx solid #e8f4ff;
  border-radius: 12rpx;
  transition: all 0.3s;
  min-width: 120rpx;
}

.category-active {
  border-color: #1890ff;
  background-color: #e8f4ff;
}

.category-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}

.icon-text {
  font-size: 32rpx;
}

.category-name {
  font-size: 24rpx;
  color: #333333;
}

/* 重复设置选择器样式（弹出选项框版本） */
.repeat-selector-section {
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #f5f9ff;
  border-radius: 12rpx;
  border: 2rpx solid #e8f4ff;
}

.repeat-button-wrapper {
  margin-bottom: 20rpx;
}

.repeat-button {
  width: 100%;
  height: 80rpx;
  background-color: #ffffff;
  border: 2rpx solid #e8f4ff;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333333;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.repeat-button::after {
  content: '▼';
  font-size: 24rpx;
  color: #999999;
}

.repeat-hint {
  padding: 16rpx;
  background-color: #e8f4ff;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #1890ff;
  text-align: center;
}

/* 危险操作按钮区域 */
.danger-section {
  position: fixed;
  bottom: 100rpx;
  left: 0;
  right: 0;
  padding: 0 30rpx;
  background-color: #f5f9ff;
  z-index: 998;
}

.danger-actions {
  display: flex;
  gap: 20rpx;
}

.btn {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 28rpx;
  flex: 1;
}

.btn-primary {
  background-color: #1890ff;
  color: #ffffff;
}

.btn-archive {
  background-color: #ff9500;
  color: #ffffff;
}

.btn-danger {
  background-color: #e54d42;
  color: #ffffff;
}

/* 修复uni-input高度问题 */
uni-input {
  height: auto !important;
  min-height: 0 !important;
  line-height: normal !important;
}
</style>