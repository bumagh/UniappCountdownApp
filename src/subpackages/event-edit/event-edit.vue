<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-icon" @click="goBack">
        <text>‹</text>
      </view>
      <view class="navbar-title">
        <text>{{ isEdit ? '编辑倒数日' : '添加倒数日' }}</text>
      </view>
      <view class="navbar-icon" @click="handleSubmit">
        <text>✓</text>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view scroll-y class="page-content">
      <view class="form-container">
        <view class="form-item">
          <text class="form-label">日程名称</text>
          <input 
            class="form-input" 
            v-model="formData.title" 
            placeholder="请输入日程名称"
            maxlength="20"
          />
        </view>

        <view class="form-item">
          <text class="form-label">选择日期</text>
          <view class="date-picker-container">
            <picker 
              mode="date" 
              :value="formData.date" 
              @change="onDateChange" 
              :start="minDate" 
              :end="maxDate"
              class="date-picker"
            >
              <view class="date-input">
                <text v-if="formData.date" class="date-text">{{ formatDateDisplay(formData.date) }}</text>
                <text v-else class="date-placeholder">请选择日期</text>
                <text class="date-icon">📅</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">选择分类</text>
          <view class="category-list">
            <view 
              v-for="category in categories" 
              :key="category.id"
              class="category-item"
              :class="{ 'category-active': formData.categoryId === category.id }"
              @click="selectCategory(category.id)"
            >
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
            <switch 
              :checked="formData.isPinned" 
              @change="onPinnedChange"
              color="#1890ff"
            />
          </view>
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">重复设置</text>
            <switch 
              :checked="isRepeatEnabled" 
              @change="toggleRepeat"
              color="#1890ff"
            />
          </view>
        </view>

        <!-- 重复设置选择器（弹出选项框版本） -->
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

      <!-- 底部空白 -->
      <view style="height: 40rpx;"></view>
    </scroll-view>

    <!-- 删除/归档按钮（仅在编辑模式下显示） -->
    <view v-if="isEdit" class="danger-section">
      <view class="btn btn-danger" @click="handleDelete">
        <text>删除/归档</text>
      </view>
    </view>
  </view>
</template>

<script>
import db from '../../utils/db.js';

export default {
  name: 'EventEdit',
  data() {
    return {
      countdownId: null,
      isEdit: false,
      formData: {
        title: '',
        date: this.getCurrentDate(),
        categoryId: null,
        isPinned: false,
        repeatCycle: 0,
        repeatFrequency: '不重复'
      },
      categories: [],
      repeatOptions: ['不重复', '每天', '每周', '每月', '每年', '每2天', '每3天', '每4天', '每5天', '每6天', '每7天', '每2周', '每3周', '每2月', '每3月', '每6月', '每2年', '每3年', '每5年'],
      repeatOption: '',
      isRepeatEnabled: false
    };
  },
  computed: {
    minDate() {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 10);
      return date.toISOString().split('T')[0];
    },
    maxDate() {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 10);
      return date.toISOString().split('T')[0];
    }
  },
  onLoad(options) {
    if (options.id) {
      this.countdownId = parseInt(options.id);
      this.isEdit = true;
      this.loadCountdownData();
    } else {
      this.loadCategories();
    }
  },
  methods: {
    getCurrentDate() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    loadCountdownData() {
      const countdown = db.getCountdown(this.countdownId);
      if (countdown) {
        this.formData = {
          title: countdown.title,
          date: countdown.date,
          categoryId: countdown.categoryId,
          isPinned: countdown.isPinned || false,
          repeatCycle: countdown.repeatCycle || 0,
          repeatFrequency: countdown.repeatFrequency || '不重复'
        };
        this.checkRepeatEnabled();
        this.setRepeatOption();
      }
      this.loadCategories();
    },
    loadCategories() {
      const user = db.getCurrentUser();
      if (user) {
        this.categories = db.getCategories(user.id);
        if (this.categories.length > 0 && !this.formData.categoryId) {
          this.formData.categoryId = this.categories[0].id;
        }
      }
    },
    checkRepeatEnabled() {
      this.isRepeatEnabled = this.formData.repeatCycle > 0 && this.formData.repeatFrequency !== '不重复';
    },
    setRepeatOption() {
      if (this.formData.repeatCycle === 0 || this.formData.repeatFrequency === '不重复') {
        this.repeatOption = '不重复';
      } else {
        this.repeatOption = db.getRepeatText(this.formData.repeatCycle, this.formData.repeatFrequency);
      }
    },
    onDateChange(e) {
      this.formData.date = e.detail.value;
    },
    selectCategory(categoryId) {
      this.formData.categoryId = categoryId;
    },
    onPinnedChange(e) {
      this.formData.isPinned = e.detail.value;
    },
    toggleRepeat(e) {
      this.isRepeatEnabled = e.detail.value;
      if (this.isRepeatEnabled) {
        // 开启重复，设置默认值
        this.repeatOption = '每天';
        this.formData.repeatCycle = 1;
        this.formData.repeatFrequency = '天重复';
      } else {
        // 关闭重复，重置为不重复
        this.repeatOption = '不重复';
        this.formData.repeatCycle = 0;
        this.formData.repeatFrequency = '不重复';
      }
    },
    showRepeatOptions() {
      uni.showActionSheet({
        itemList: this.repeatOptions,
        success: (res) => {
          this.repeatOption = this.repeatOptions[res.tapIndex];
          this.parseRepeatOption(this.repeatOption);
        }
      });
    },
    parseRepeatOption(option) {
      if (option === '不重复') {
        this.formData.repeatCycle = 0;
        this.formData.repeatFrequency = '不重复';
      } else if (option === '每天') {
        this.formData.repeatCycle = 1;
        this.formData.repeatFrequency = '天重复';
      } else if (option === '每周') {
        this.formData.repeatCycle = 1;
        this.formData.repeatFrequency = '周重复';
      } else if (option === '每月') {
        this.formData.repeatCycle = 1;
        this.formData.repeatFrequency = '月重复';
      } else if (option === '每年') {
        this.formData.repeatCycle = 1;
        this.formData.repeatFrequency = '年重复';
      } else if (option.includes('每')) {
        const match = option.match(/每(\d+)(天|周|月|年)/);
        if (match) {
          this.formData.repeatCycle = parseInt(match[1]);
          this.formData.repeatFrequency = match[2] + '重复';
        }
      }
    },
    getRepeatText() {
      if (this.repeatOption === '不重复') {
        return '不重复';
      }
      return this.repeatOption;
    },
    formatDateDisplay(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekDay = weekDays[date.getDay()];
      return `${year}年${month}月${day}日 星期${weekDay}`;
    },
    goBack() {
      uni.navigateBack({
        delta: 1
      });
    },
    handleDelete() {
      uni.showActionSheet({
        itemList: ['删除', '归档'],
        success: (res) => {
          if (res.tapIndex === 0) {
            uni.showModal({
              title: '确认删除',
              content: '确定要删除这个倒数日吗？',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  try {
                    db.deleteCountdown(this.countdownId);
                    uni.showToast({
                      title: '删除成功',
                      icon: 'success'
                    });
                    this.goBack();
                  } catch (e) {
                    uni.showToast({
                      title: '删除失败',
                      icon: 'none'
                    });
                  }
                }
              }
            });
          } else if (res.tapIndex === 1) {
            uni.showModal({
              title: '确认归档',
              content: '确定要归档这个倒数日吗？归档后可在\"我的\"模块中查看。',
              confirmText: '归档',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  try {
                    db.archiveCountdown(this.countdownId);
                    uni.showToast({
                      title: '归档成功',
                      icon: 'success'
                    });
                    this.goBack();
                  } catch (e) {
                    uni.showToast({
                      title: '归档失败',
                      icon: 'none'
                    });
                  }
                }
              }
            });
          }
        }
      });
    },
    handleSubmit() {
      if (!this.formData.title.trim()) {
        uni.showToast({
          title: '请输入日程名称',
          icon: 'none'
        });
        return;
      }

      if (!this.formData.date) {
        uni.showToast({
          title: '请选择日期',
          icon: 'none'
        });
        return;
      }

      if (!this.formData.categoryId) {
        uni.showToast({
          title: '请选择分类',
          icon: 'none'
        });
        return;
      }

      const user = db.getCurrentUser();
      if (!user) {
        uni.showToast({
          title: '用户信息获取失败',
          icon: 'none'
        });
        return;
      }

      try {
        if (this.isEdit) {
          db.updateCountdown(this.countdownId, {
            title: this.formData.title,
            date: this.formData.date,
            categoryId: this.formData.categoryId,
            isPinned: this.formData.isPinned,
            repeatCycle: this.formData.repeatCycle,
            repeatFrequency: this.formData.repeatFrequency
          });
          uni.showToast({
            title: '修改成功',
            icon: 'success'
          });
        } else {
          db.addCountdown({
            title: this.formData.title,
            date: this.formData.date,
            categoryId: this.formData.categoryId,
            userId: user.id,
            isPinned: this.formData.isPinned,
            repeatCycle: this.formData.repeatCycle,
            repeatFrequency: this.formData.repeatFrequency
          });
          uni.showToast({
            title: '添加成功',
            icon: 'success'
          });
        }
        setTimeout(() => {
          this.goBack();
        }, 1000);
      } catch (e) {
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
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
  height: calc(100vh - 88rpx);
  padding-top: 88rpx;
  padding-bottom: 160rpx;
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

.danger-section {
  padding: 30rpx;
  position: fixed;
  bottom: 120rpx;
  left: 0;
  right: 0;
}

.btn {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 28rpx;
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