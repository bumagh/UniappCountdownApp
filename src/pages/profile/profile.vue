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
          <image class="user-avatar" :src="user.avatar" mode="aspectFill" @click="handleAvatarClick" />
          <view class="avatar-edit-btn">
            <text>✎</text>
          </view>
        </view>
        <view class="user-info">
          <text class="user-nickname">{{ user.nickname }}</text>
          <view class="user-stats">
            <view class="stat-item">
              <text class="stat-number">{{ countdownStats.total }}</text>
              <text class="stat-label">奇妙日</text>
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
          <view class="menu-item">
            <view class="menu-item-left">
              <view class="menu-icon" style="background-color: #1890ff;">
                <text>🎂</text>
              </view>
              <text class="menu-label">修改生日</text>
            </view>
            <view class="menu-item-right birthday-right">
              <picker class="picker-birthday" mode="date" :value="user.birthday" fields="year-month" start="1900-01-01"
                :end="today" @change="onBirthdayChange">
                <view class="birthday-content">
                  <text class="menu-value">{{ user.birthday || '请选择出生年月' }}</text>
                </view>
              </picker>
              <text class="menu-arrow">›</text>
            </view>
          </view>
          <!-- <view class="menu-item" @click="handleEmailSetting">
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
          </view> -->

          <view class="menu-item">
            <view class="menu-item-left">
              <view class="menu-icon" style="background-color: #fbbd08;">
                <text>🔔</text>
              </view>
              <text class="menu-label">服务号提醒</text>
            </view>
            <view class="menu-item-right">
              <switch :checked="reminderEnabled" @change="handleReminderToggle" color="#1890ff" />
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
              <text class="menu-value">{{ themeManager.getThemeName() }}</text>
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

          <view class="menu-item" @click="handleLogout">
            <view class="menu-item-left">
              <view class="menu-icon" style="background-color: #8799a3;">
                <svg t="1765798759622" class="icon" viewBox="0 0 1024 1024" version="1.1"
                  xmlns="http://www.w3.org/2000/svg" p-id="5673" width="200" height="200">
                  <path
                    d="M874.666667 855.744a19.093333 19.093333 0 0 1-19.136 18.922667H168.469333A19.2 19.2 0 0 1 149.333333 855.530667V168.469333A19.2 19.2 0 0 1 168.469333 149.333333h687.061334c10.581333 0 19.136 8.533333 19.136 18.922667V320h42.666666V168.256A61.717333 61.717333 0 0 0 855.530667 106.666667H168.469333A61.866667 61.866667 0 0 0 106.666667 168.469333v687.061334A61.866667 61.866667 0 0 0 168.469333 917.333333h687.061334A61.76 61.76 0 0 0 917.333333 855.744V704h-42.666666v151.744zM851.84 533.333333l-131.797333 131.754667a21.141333 21.141333 0 0 0 0.213333 29.973333 21.141333 21.141333 0 0 0 29.973333 0.192l165.589334-165.589333a20.821333 20.821333 0 0 0 6.122666-14.976 21.44 21.44 0 0 0-6.314666-14.997333l-168.533334-168.533334a21.141333 21.141333 0 0 0-29.952-0.213333 21.141333 21.141333 0 0 0 0.213334 29.973333L847.296 490.666667H469.333333v42.666666h382.506667z"
                    fill="#3D3D3D" p-id="5674"></path>
                </svg>

              </view>
              <text class="menu-label">退出登录</text>
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
        <text class="drawer-title">奇妙本</text>
        <view class="drawer-close" @click="toggleDrawer">
          <text>✕</text>
        </view>
      </view>
      <scroll-view scroll-y class="drawer-content">
        <view class="category-list">
          <view v-for="category in categories" :key="category.id" class="category-drawer-item"
            @click="handleCategoryClick(category)">
            <view class="category-drawer-icon" :style="{ backgroundColor: category.color }">
              <text>{{ category.icon }}</text>
            </view>
            <text class="category-drawer-name">{{ category.name }}</text>
            <!-- 模板中不要直接调用异步方法：读取已预取缓存 -->
            <text class="category-drawer-count">{{ categoryCounts[category.id] ?? 0 }}</text>
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
          <input class="nickname-input" v-model="newNickname" placeholder="请输入新昵称" maxlength="10" />
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
            <view v-for="countdown in archivedCountdowns" :key="countdown.id" class="archived-item shadow">
              <view class="archived-item-content">
                <view class="archived-item-left">
                  <view class="archived-icon"
                    :style="{ backgroundColor: getCategoryColor(countdown.category_id.toString()) }">
                    <text>{{ getCategoryIcon(countdown.category_id.toString()) }}</text>
                  </view>
                  <view class="archived-info">
                    <text class="archived-title">{{ countdown.title }}</text>
                    <text class="archived-date">{{ formatDate(countdown.date) }}</text>
                    <text class="archived-category">{{ getCategoryName(countdown.category_id.toString()) }}</text>
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

<script lang="ts">
import apiService from '@/services/apiService';
import db from '../../utils/db.js';
import { defineComponent } from 'vue';
import { Category, Countdown } from 'types';
import wechatJSSDK from '@/utils/wechat';
import { getDataUrl } from '@/utils/common';
interface ProfilePageData {
  user: {
    id: number;
    nickname: string;
    avatar: string;
    birthday: string;
  };
  countdownStats: {
    total: number;
    future: number;
    past: number;
  };
  today: string;

  reminderEnabled: boolean;
  drawerVisible: boolean;
  categories: Array<Category>;
  nicknameModalVisible: boolean;
  newNickname: string;
  archiveVisible: boolean;
  archivedCountdowns: Array<Countdown>;
  archivedCount: number;
  // 分类数量缓存（key=categoryId）
  categoryCounts: Record<number, number>;
}
export default defineComponent({
  name: 'Profile',
  data(): ProfilePageData {
    return {
      user: {
        id: 1,
        nickname: '张三',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
        birthday: '1980-01-01'
      },
      today: new Date().toISOString().split('T')[0],
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
      archivedCount: 0,
      categoryCounts: {}
    };
  },
  async onShow() {
    console.log(getDataUrl('qr'));
    await this.loadUserData();
    await this.loadCategories();
    await this.calculateStats();
    await this.loadArchivedCountdowns();
    // 初始化微信JSSDK分享
    this.initWechatShare();
    
  },
  methods: {
    // 出生日期变化
    async onBirthdayChange(e: any) {
      this.user.birthday = e.detail.value;
      const updated = await apiService.updateUser({ id: this.user.id, birthday: this.user.birthday });
      if (updated.code == 200) {
        this.user.nickname = this.newNickname;
        uni.showToast({
          title: '修改成功',
          icon: 'success'
        });
      } else {
        uni.showToast({
          title: '修改失败',
          icon: 'none'
        });
      }
    },
    async loadUserData() {
      try {
        if (!uni.getStorageSync('userid')) {
          // uni.navigateTo({
          //   url: '/subpackages/login/login'
          // });
          return;
        }
        // 获取当前用户信息
        const userid = uni.getStorageSync('userid');
        const currentUser = await apiService.getCurrentUser(userid || '1');

        this.user = currentUser as any;
        if (currentUser != null) {
          // 从本地存储加载头像
          const savedAvatar = uni.getStorageSync('user_avatar');
          if (savedAvatar) {
            currentUser.avatar = savedAvatar;
          }
        }
      } catch (error) {
        console.error('操作失败:', error);
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }

    },
    async loadCategories() {
      if (this.user.id) {
        this.categories = await apiService.getCategories(this.user.id.toString());
        // 加载分类后预取每个分类下的数量，避免模板里 await
        await this.prefetchCategoryCounts();
      }
    },

    async prefetchCategoryCounts() {
      if (!this.user.id || !this.categories?.length) {
        this.categoryCounts = {};
        return;
      }

      const userid = this.user.id.toString();

      const results = await Promise.all(
        this.categories
          .filter(c => c?.id != null)
          .map(async (c) => {
            try {
              const countdowns = await apiService.getCountdowns({
                userid,
                category_id: Number(c.id)
              });
              return [Number(c.id), countdowns.length] as const;
            } catch (e) {
              console.error('获取分类数量失败：', c, e);
              return [Number(c.id), 0] as const;
            }
          })
      );

      const map: Record<number, number> = {};
      for (const [id, count] of results) {
        map[id] = count;
      }
      this.categoryCounts = map;
    },

    async calculateStats() {
      if (!this.user.id) return;

      const countdowns = await apiService.getCountdowns({ userid: this.user.id.toString() });
      this.countdownStats.total = countdowns.length;

      this.calculateStatsCountdowns(countdowns);
    },
     calculateStatsCountdowns(countdowns:Countdown[]) {
      this.countdownStats.total = countdowns.length;

      const today = new Date();
      today.setHours(0, 0, 0, 0); // 标准化为当天开始时间

      let future = 0;
      let past = 0;

      countdowns.forEach(countdown => {
        let targetDate;

        // 判断是否为重复事件
        const isRepeating = countdown.repeat_cycle && countdown.repeat_cycle > 0
          && countdown.repeat_frequency && countdown.repeat_frequency !== '不重复';

        if (isRepeating) {
          // 对于重复事件，获取最近的下一个未来日期
          const nextRepeatDate = db.getNextRepeatDate(
            countdown.date,
            countdown.repeat_cycle,
            countdown.repeat_frequency
          );
          targetDate = new Date(nextRepeatDate);
        } else {
          // 非重复事件，使用原日期
          targetDate = new Date(countdown.date);
        }

        // 标准化目标日期为当天开始时间
        targetDate.setHours(0, 0, 0, 0);

        // 计算天数差
        const timeDiff = targetDate.getTime() - today.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
        if (daysDiff >= 0) {
          future++;
        } else {
          // 对于重复事件，理论上不应该有过去的状态
          // 除非 getNextRepeatDate 逻辑有问题
          past++;
        }
      });

      this.countdownStats.future = future;
      this.countdownStats.past = past;
    },
    async loadArchivedCountdowns() {
      if (!this.user.id) return;
      this.archivedCountdowns = await apiService.getArchivedCountdowns(this.user.id.toString());
      this.archivedCount = this.archivedCountdowns.length;
    },
    // 保留该方法给其它地方调用（模板不再直接用）
    async getCategoryCount(categoryId: string): Promise<number> {
      const countdowns = await apiService.getCountdowns({ userid: this.user.id.toString(), category_id: parseInt(categoryId) });
      return countdowns.length;
    },
    getCategoryColor(categoryId: string) {
      const category = this.categories.find(c => c.id === parseInt(categoryId));
      return category ? category.color : '#1890ff';
    },
    getCategoryIcon(categoryId: string) {
      const category = this.categories.find(c => c.id === parseInt(categoryId));
      return category ? category.icon : '📋';
    },
    getCategoryName(categoryId: string) {
      const category = this.categories.find(c => c.id === parseInt(categoryId));
      return category ? category.name : '未分类';
    },
    formatDate(dateStr: string) {
      return db.formatDate(dateStr);
    },
    toggleDrawer() {
      this.drawerVisible = !this.drawerVisible;
    },
    handleCategoryClick(category: Category) {
      this.drawerVisible = false;
      uni.navigateTo({
        url: `/pages/categories/categories?categoryId=${category.id}`
      });
    },
    handleAvatarClick() {
      uni.showModal({
        title: '提示',
        content: '功能未开放',
        showCancel: false,
        confirmText: '确定',
        success: (res) => {

        }
      });
      return;
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
    updateAvatar(tempPath: string) {
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
          // 如果保存失败直接使用临时路径
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
    async saveNickname() {
      if (!this.newNickname.trim()) {
        uni.showToast({
          title: '昵称不能为空',
          icon: 'none'
        });
        return;
      }
      const updated = await apiService.updateUser({ id: this.user.id, nickname: this.newNickname });
      if (updated.code == 200) {
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
    async handleReminderToggle(e: any) {
      this.reminderEnabled = e.detail.value;
      const updated = await apiService.updateUser({ id: this.user.id, serviceno_notice: this.reminderEnabled ? 1 : 0 });
      if (updated.code == 200) {

        this.user.nickname = this.newNickname;
        uni.showToast({
          title: this.reminderEnabled ? '已开启提醒' : '已关闭提醒',

          icon: 'success'
        });
      } else {
        uni.showToast({
          title: this.reminderEnabled ? '已开启提醒' : '已关闭提醒',

          icon: 'none'
        });
      }

    },
    handleArchiveManagement() {
      this.archiveVisible = true;
      this.loadArchivedCountdowns();
    },
    closeArchive() {
      this.archiveVisible = false;
    },
    async handleUnarchive(countdown: Countdown) {
      uni.showModal({
        title: '确认恢复',
        content: `确定要恢复「${countdown.title}」吗？`,
        success: async (res) => {
          if (res.confirm) {
            const updated = await apiService.unarchiveCountdown(countdown.id ?? 0);
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
    handleDeleteArchived(countdown: Countdown) {
      uni.showModal({
        title: '确认删除',
        content: `确定要永久删除「${countdown.title}」吗？此操作不可恢复！`,
        confirmColor: '#e54d42',
        success: async (res) => {
          if (res.confirm) {
            const success = await apiService.deleteCountdown(countdown.id ?? 0);
            if (success?.code === 200) {
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
        // itemList: ['导出数据', '导入数据', '清空数据'],
        itemList: ['导出数据', '导入数据'],
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
            if (res.tapIndex === 0) {
              this.simpleExport();
            } else if (res.tapIndex === 1) {
              this.simpleImport();
            }
          }
        }
      });
    },
    // 简单导入
    async simpleImport() {
      uni.getClipboardData({
        success: async (res) => {
          try {
            const data = JSON.parse(res.data) as {
              countdowns: Countdown[];
              categories: Category[];
            };
            const userid = this.user.id.toString();

            if (!data.countdowns || !data.categories) {
              uni.showToast({ title: '数据格式错误', icon: 'none' });
              return;
            }

            uni.showModal({
              title: '导入确认',
              content: `发现 ${data.countdowns.length} 个倒计时，是否导入？`,
              success: async (modalRes) => {
                if (modalRes.confirm) {
                  uni.showLoading({ title: '导入中...' });

                  // 导入分类
                  for (const cat of data.categories) {
                    try {
                      await apiService.createCategory({
                        user_id: parseInt(userid),
                        name: cat.name,
                        icon: cat.icon,
                        color: cat.color
                      });
                    } catch (e) {
                      // 分类可能已存在，忽略
                    }
                  }

                  // 导入倒计时
                  const categories = await apiService.getCategories(userid);
                  for (const item of data.countdowns) {
                    try {
                      await apiService.createCountdown({
                        user_id: parseInt(userid),
                        title: item.title,
                        date: item.date,
                        category_id: item.category_id,
                        is_pinned: item.is_pinned,
                        is_archived: item.is_archived,
                        repeat_cycle: item.repeat_cycle,
                        repeat_frequency: item.repeat_frequency
                      });
                    } catch (e) {
                      // 跳过重复项
                    }
                  }

                  uni.hideLoading();
                  uni.showToast({
                    title: '导入成功',
                    icon: 'success'
                  });

                  // 刷新页面
                  this.loadCategories();
                  this.calculateStats();
                }
              }
            });
          } catch (error) {
            uni.showToast({
              title: '解析数据失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          uni.showToast({
            title: '读取剪贴板失败',
            icon: 'none'
          });
        }
      });
    },
    // 简单导出
    async simpleExport() {
      uni.showLoading({ title: '导出中...' });

      try {
        const userid = this.user.id.toString();
        const countdowns = await apiService.getCountdowns({ userid });
        const categories = await apiService.getCategories(userid);

        const data = {
          countdowns: countdowns,
          categories: categories
        };

        uni.setClipboardData({
          data: JSON.stringify(data),
          success: () => {
            uni.hideLoading();
            uni.showToast({
              title: '已复制到剪贴板',
              icon: 'success'
            });
          }
        });
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: '导出失败',
          icon: 'none'
        });
      }
    },
    handleAbout() {
      uni.showModal({
        title: '关于时光奇妙',
        content: '时光奇妙 v1.0.0\n一款简洁优雅的奇妙日管理工具\n\n© 2024 奇妙本团队',
        showCancel: false
      });
    }
    ,
    handleLogout() {
      uni.showModal({
        title: '退出登录',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 1. 清除本地存储
            uni.clearStorageSync();

            // 2. 清除数据库中的登录状态（如果需要）
            // db.logout();

            // 3. 跳转到登录页
            uni.reLaunch({
              url: '/subpackages/login/login',
              success: () => {
                uni.showToast({
                  title: '已退出登录',
                  icon: 'success'
                });
              },
              fail: (err) => {
                uni.showToast({
                  title: '跳转失败',
                  icon: 'none'
                });
                console.error('跳转到登录页失败:', err);
              }
            });
          }
        }
      });
    },
    // 初始化微信JSSDK分享
    async initWechatShare() {
      if (!wechatJSSDK.isInWx()) {
        console.log('当前不在微信环境中，跳过微信JSSDK初始化');
        return;
      }

      try {
        // 构建分享配置
        const shareConfig = {
          title: `${this.user.nickname}的奇妙本 - 记录了${this.countdownStats.total}个重要日子，还有${this.countdownStats.future}个即将到来`,
          desc: `快来使用奇妙日，记录生活中的重要时刻！我已经记录了${this.countdownStats.total}个重要日子。`,
          link: window.location.href,
          imgUrl: getDataUrl('qr')
        };

        // 初始化并设置分享
        await wechatJSSDK.initAndSetShare(shareConfig);
        console.log('微信JSSDK分享初始化成功');
      } catch (error) {
        console.error('微信JSSDK分享初始化失败:', error);
        // 不显示错误提示给用户，静默失败
        // 在非微信环境或微信JSSDK加载失败时，不应该影响正常功能
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
  z-index: 999;
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

.birthday-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.birthday-content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.picker-birthday {
  display: flex;
  align-items: center;
}
</style>