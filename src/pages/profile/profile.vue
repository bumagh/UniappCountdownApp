<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-icon" @click="toggleDrawer">
        <text>☰</text>
      </view>
      <view class="navbar-title">
        <text>{{ user.nickname }}的个人中心</text>
      </view>
      <view class="navbar-icon"></view>
    </view>

    <!-- 主体内容 -->
    <scroll-view scroll-y class="page-content">
      <!-- 用户信息卡片 -->
      <view class="user-card shadow-lg">
        <view class="user-avatar-wrapper">
          <image 
            class="user-avatar" 
            :src="user.avatar" 
            mode="aspectFill"
            @click="handleAvatarClick"
          />
          <view class="avatar-edit-btn">
            <text>✎</text>
          </view>
        </view>
        <view class="user-info">
          <text class="user-nickname">{{ user.nickname }}</text>
          <view class="user-stats">
            <view class="stat-item">
              <text class="stat-number">{{ countdownStats.total }}</text>
              <text class="stat-label">倒数日</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-number">{{ countdownStats.future }}</text>
              <text class="stat-label">未来</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-number">{{ countdownStats.past }}</text>
              <text class="stat-label">已经</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="menu-section">
        <view class="menu-title">
          <text>个人设置</text>
        </view>
        <view class="menu-list">
          <view class="menu-item" @click="handleNicknameEdit">
            <view class="menu-item-left">
              <view class="menu-icon" style="background-color: #1890ff;">
                <text>👤</text>
              </view>
              <text class="menu-label">修改昵称</text>
            </view>
            <view class="menu-item-right">
              <text class="menu-value">{{ user.nickname }}</text>
              <text class="menu-arrow">›</text>
            </view>
          </view>

          <view class="menu-item" @click="handleEmailSetting">
            <view class="menu-item-left">
              <view class="menu-icon" style="background-color: #1cbbb4;">
                <text>📧</text>
              </view>
              <text class="menu-label">邮箱通知</text>
            </view>
            <view class="menu-item-right">
              <text class="menu-value">未设置</text>
              <text class="menu-arrow">›</text>
            </view>
          </view>

          <view class="menu-item">
            <view class="menu-item-left">
              <view class="menu-icon" style="background-color: #fbbd08;">
                <text>🔔</text>
              </view>
              <text class="menu-label">提醒功能</text>
            </view>
            <view class="menu-item-right">
              <switch 
                :checked="reminderEnabled" 
                @change="handleReminderToggle"
                color="#1890ff"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 归档管理 -->
      <view class="menu-section">
        <view class="menu-title">
          <text>数据管理</text>
        </view>
        <view class="menu-list">
          <view class="menu-item" @click="handleArchiveManagement">
            <view class="menu-item-left">
              <view class="menu-icon" style="background-color: #a463f2;">
                <text>📦</text>
              </view>
              <text class="menu-label">归档管理</text>
            </view>
            <view class="menu-item-right">
              <text class="menu-value">{{ archivedCount }}个</text>
              <text class="menu-arrow">›</text>
            </view>
          </view>

          <view class="menu-item" @click="handleDataManagement">
            <view class="menu-item-left">
              <view class="menu-icon" style="background-color: #39b54a;">
                <text>💾</text>
              </view>
              <text class="menu-label">数据管理</text>
            </view>
            <view class="menu-item-right">
              <text class="menu-arrow">›</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 应用设置 -->
      <view class="menu-section">
        <view class="menu-title">
          <text>应用设置</text>
        </view>
        <view class="menu-list">
          <view class="menu-item" @click="handleThemeSetting">
            <view class="menu-item-left">
              <view class="menu-icon" style="background-color: #52c4ff;">
                <text>🎨</text>
              </view>
              <text class="menu-label">主题设置</text>
            </view>
            <view class="menu-item-right">
              <text class="menu-value">蓝白系</text>
              <text class="menu-arrow">›</text>
            </view>
          </view>

          <view class="menu-item" @click="handleAbout">
            <view class="menu-item-left">
              <view class="menu-icon" style="background-color: #8799a3;">
                <text>ℹ️</text>
              </view>
              <text class="menu-label">关于我们</text>
            </view>
            <view class="menu-item-right">
              <text class="menu-arrow">›</text>
            </view>
          </view>
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

    <!-- 修改昵称弹窗 -->
    <view v-if="nicknameModalVisible" class="modal-mask" @click="closeNicknameModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">修改昵称</text>
          <view class="modal-close" @click="closeNicknameModal">
            <text class="close-icon">✕</text>
          </view>
        </view>
        <view class="modal-body">
          <input 
            class="nickname-input" 
            v-model="newNickname" 
            placeholder="请输入新昵称"
            maxlength="10"
          />
        </view>
        <view class="modal-footer">
          <view class="btn btn-ghost" @click="closeNicknameModal">
            <text>取消</text>
          </view>
          <view class="btn btn-primary" @click="saveNickname">
            <text>确定</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 归档管理页面 -->
    <view v-if="archiveVisible" class="archive-mask" @click="closeArchive">
      <view class="archive-content" @click.stop>
        <view class="archive-header">
          <text class="archive-title">归档管理</text>
          <view class="archive-close" @click="closeArchive">
            <text>✕</text>
          </view>
        </view>
        <scroll-view scroll-y class="archive-body">
          <view v-if="archivedCountdowns.length > 0" class="archived-list">
            <view 
              v-for="countdown in archivedCountdowns" 
              :key="countdown.id"
              class="archived-item shadow"
            >
              <view class="archived-item-content">
                <view class="archived-item-left">
                  <view class="archived-icon" :style="{ backgroundColor: getCategoryColor(countdown.categoryId) }">
                    <text>{{ getCategoryIcon(countdown.categoryId) }}</text>
                  </view>
                  <view class="archived-info">
                    <text class="archived-title">{{ countdown.title }}</text>
                    <text class="archived-date">{{ formatDate(countdown.date) }}</text>
                    <text class="archived-category">{{ getCategoryName(countdown.categoryId) }}</text>
                  </view>
                </view>
                <view class="archived-item-right">
                  <view class="archived-btn" @click.stop="handleUnarchive(countdown)">
                    <text>恢复</text>
                  </view>
                  <view class="archived-btn delete-btn" @click.stop="handleDeleteArchived(countdown)">
                    <text>删除</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view v-else class="empty-state">
            <text class="empty-icon">📦</text>
            <text class="empty-text">不想在主页显示的日程可以归档哦</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import db from '../../utils/db.js';

export default {
  name: 'Profile',
  data() {
    return {
      user: {
        id: 1,
        nickname: '张三',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'
      },
      countdownStats: {
        total: 0,
        future: 0,
        past: 0
      },
      reminderEnabled: true,
      drawerVisible: false,
      categories: [],
      nicknameModalVisible: false,
      newNickname: '',
      archiveVisible: false,
      archivedCountdowns: [],
      archivedCount: 0
    };
  },
  onShow() {
    this.loadUserData();
    this.loadCategories();
    this.calculateStats();
    this.loadArchivedCountdowns();
  },
  methods: {
    loadUserData() {
      const currentUser = db.getCurrentUser();
      if (currentUser) {
        // 从本地存储加载头像
        const savedAvatar = uni.getStorageSync('user_avatar');
        if (savedAvatar) {
          currentUser.avatar = savedAvatar;
        }
        this.user = currentUser;
      }
    },
    loadCategories() {
      if (this.user.id) {
        this.categories = db.getCategories(this.user.id);
      }
    },
    calculateStats() {
      if (!this.user.id) return;
      
      const countdowns = db.getCountdowns(this.user.id);
      this.countdownStats.total = countdowns.length;
      
      let future = 0;
      let past = 0;
      
      countdowns.forEach(countdown => {
        const days = db.calculateDays(countdown.date);
        if (days >= 0) {
          future++;
        } else {
          past++;
        }
      });
      
      this.countdownStats.future = future;
      this.countdownStats.past = past;
    },
    loadArchivedCountdowns() {
      if (!this.user.id) return;
      this.archivedCountdowns = db.getArchivedCountdowns(this.user.id);
      this.archivedCount = this.archivedCountdowns.length;
    },
    getCategoryCount(categoryId) {
      const countdowns = db.getCountdowns(this.user.id, categoryId);
      return countdowns.length;
    },
    getCategoryColor(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.color : '#1890ff';
    },
    getCategoryIcon(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.icon : '📋';
    },
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : '未分类';
    },
    formatDate(dateStr) {
      return db.formatDate(dateStr);
    },
    toggleDrawer() {
      this.drawerVisible = !this.drawerVisible;
    },
    handleCategoryClick(category) {
      this.drawerVisible = false;
      uni.navigateTo({
        url: `/pages/categories/categories?categoryId=${category.id}`
      });
    },
    handleAvatarClick() {
      uni.showActionSheet({
        itemList: ['从相册选择', '拍照', '恢复默认'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.chooseFromAlbum();
          } else if (res.tapIndex === 1) {
            this.takePhoto();
          } else if (res.tapIndex === 2) {
            this.resetAvatar();
          }
        }
      });
    },
    chooseFromAlbum() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: (res) => {
          this.updateAvatar(res.tempFilePaths[0]);
        },
        fail: (err) => {
          uni.showToast({
            title: '选择失败',
            icon: 'none'
          });
        }
      });
    },
    takePhoto() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera'],
        success: (res) => {
          this.updateAvatar(res.tempFilePaths[0]);
        },
        fail: (err) => {
          uni.showToast({
            title: '拍照失败',
            icon: 'none'
          });
        }
      });
    },
    updateAvatar(tempPath) {
      // 保存到本地存储
      uni.saveFile({
        tempFilePath: tempPath,
        success: (res) => {
          const savedPath = res.savedFilePath;
          // 保存路径到本地存储
          uni.setStorageSync('user_avatar', savedPath);
          // 更新显示
          this.user.avatar = savedPath;
          // 更新数据库中的用户信息
          db.updateUser(this.user.id, { avatar: savedPath });
          uni.showToast({
            title: '头像更新成功',
            icon: 'success'
          });
        },
        fail: (err) => {
          // 如果保存失败，直接使用临时路径
          uni.setStorageSync('user_avatar', tempPath);
          this.user.avatar = tempPath;
          db.updateUser(this.user.id, { avatar: tempPath });
          uni.showToast({
            title: '头像更新成功',
            icon: 'success'
          });
        }
      });
    },
    resetAvatar() {
      const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';
      // 清除本地存储的头像
      uni.removeStorageSync('user_avatar');
      // 恢复默认头像
      this.user.avatar = defaultAvatar;
      db.updateUser(this.user.id, { avatar: defaultAvatar });
      uni.showToast({
        title: '已恢复默认头像',
        icon: 'success'
      });
    },
    handleNicknameEdit() {
      this.newNickname = this.user.nickname;
      this.nicknameModalVisible = true;
    },
    closeNicknameModal() {
      this.nicknameModalVisible = false;
      this.newNickname = '';
    },
    saveNickname() {
      if (!this.newNickname.trim()) {
        uni.showToast({
          title: '昵称不能为空',
          icon: 'none'
        });
        return;
      }
      
      const updated = db.updateUser(this.user.id, { nickname: this.newNickname });
      if (updated) {
        this.user.nickname = this.newNickname;
        uni.showToast({
          title: '修改成功',
          icon: 'success'
        });
        this.closeNicknameModal();
      } else {
        uni.showToast({
          title: '修改失败',
          icon: 'none'
        });
      }
    },
    handleEmailSetting() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    },
    handleReminderToggle(e) {
      this.reminderEnabled = e.detail.value;
      uni.showToast({
        title: this.reminderEnabled ? '已开启提醒' : '已关闭提醒',
        icon: 'none'
      });
    },
    handleArchiveManagement() {
      this.archiveVisible = true;
      this.loadArchivedCountdowns();
    },
    closeArchive() {
      this.archiveVisible = false;
    },
    handleUnarchive(countdown) {
      uni.showModal({
        title: '确认恢复',
        content: `确定要恢复「${countdown.title}」吗？`,
        success: (res) => {
          if (res.confirm) {
            const updated = db.unarchiveCountdown(countdown.id);
            if (updated) {
              uni.showToast({
                title: '恢复成功',
                icon: 'success'
              });
              this.loadArchivedCountdowns();
              this.calculateStats();
            }
          }
        }
      });
    },
    handleDeleteArchived(countdown) {
      uni.showModal({
        title: '确认删除',
        content: `确定要永久删除「${countdown.title}」吗？此操作不可恢复！`,
        confirmColor: '#e54d42',
        success: (res) => {
          if (res.confirm) {
            const success = db.deleteCountdown(countdown.id);
            if (success) {
              uni.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadArchivedCountdowns();
            } else {
              uni.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          }
        }
      });
    },
    handleThemeSetting() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    },
    handleDataManagement() {
      uni.showActionSheet({
        itemList: ['导出数据', '导入数据', '清空数据'],
        success: (res) => {
          if (res.tapIndex === 2) {
            uni.showModal({
              title: '警告',
              content: '确定要清空所有数据吗？此操作不可恢复！',
              confirmColor: '#e54d42',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  db.clearAll();
                  db.initDefaultData();
                  this.loadUserData();
                  this.loadCategories();
                  this.calculateStats();
                  this.loadArchivedCountdowns();
                  uni.showToast({
                    title: '数据已清空',
                    icon: 'success'
                  });
                }
              }
            });
          } else {
            uni.showToast({
              title: '功能开发中',
              icon: 'none'
            });
          }
        }
      });
    },
    handleAbout() {
      uni.showModal({
        title: '关于时光倒数',
        content: '时光倒数 v1.0.0\n一款简洁优雅的倒数日管理工具\n\nBy HAISNAP',
        showCancel: false
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

.page-content {
  height: calc(100vh - 88rpx - 100rpx);
  padding-top: 88rpx;
  padding-bottom: 100rpx;
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

.user-card {
  margin: 30rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-avatar-wrapper {
  position: relative;
  margin-bottom: 20rpx;
}

.user-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 4rpx solid #1890ff;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 50rpx;
  height: 50rpx;
  background-color: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.user-nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
}

.user-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-number {
  font-size: 40rpx;
  font-weight: bold;
  color: #1890ff;
}

.stat-label {
  font-size: 24rpx;
  color: #666666;
  margin-top: 8rpx;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background-color: #e8f4ff;
}

.menu-section {
  margin: 20rpx 30rpx;
}

.menu-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #666666;
  padding: 20rpx 0;
}

.menu-list {
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.08);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 2rpx solid #e8f4ff;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-label {
  font-size: 28rpx;
  color: #333333;
}

.menu-item-right {
  display: flex;
  align-items: center;
}

.menu-value {
  font-size: 24rpx;
  color: #666666;
  margin-right: 10rpx;
}

.menu-arrow {
  font-size: 40rpx;
  color: #aaaaaa;
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
  color: #333333;
}

.category-drawer-count {
  font-size: 24rpx;
  color: #666666;
  background-color: #e8f4ff;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
}

.nickname-input {
  width: 100%;
  height: 80rpx;
  background-color: #f5f9ff;
  border: 2rpx solid #e8f4ff;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.archive-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
}

.archive-content {
  width: 100%;
  height: 85vh;
  background-color: #f5f9ff;
  border-radius: 40rpx 40rpx 0 0;
  display: flex;
  flex-direction: column;
}

.archive-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx 20rpx;
  border-bottom: 2rpx solid #e8f4ff;
}

.archive-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
}

.archive-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #666666;
}

.archive-body {
  flex: 1;
  padding: 20rpx 30rpx;
}

.archived-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.archived-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.archived-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
}

.archived-item-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.archived-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
}

.archived-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.archived-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 8rpx;
}

.archived-date {
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 4rpx;
}

.archived-category {
  font-size: 22rpx;
  color: #999999;
}

.archived-item-right {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.archived-btn {
  padding: 10rpx 24rpx;
  background-color: #1890ff;
  color: #ffffff;
  border-radius: 8rpx;
  font-size: 24rpx;
  text-align: center;
}

.delete-btn {
  background-color: #e54d42;
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
}

.shadow-lg {
  box-shadow: 0 8rpx 32rpx rgba(24, 144, 255, 0.12);
}

.shadow {
  box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.08);
}
</style>