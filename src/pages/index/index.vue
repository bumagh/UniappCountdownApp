<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-left">
        <view class="navbar-icon" @click="toggleDrawer">
          <text>☰</text>
        </view>
        <view class="navbar-icon" @click="toggleLayout" :title="currentLayout === 'grid' ? '切换到列表布局' : '切换到格子布局'">
          <text>{{ currentLayout === 'grid' ? '📋' : '⊞' }}</text>
          <text class="icon-hint">{{ currentLayout === 'grid' ? '列表' : '格子' }}</text>
        </view>
        <view class="navbar-icon" @click="toggleCareMode" :title="careMode ? '关闭关怀模式' : '开启关怀模式'">
          <text>{{ careMode ? '👓' : 'Aa' }}</text>
          <text class="icon-hint">{{ careMode ? '关怀' : '普通' }}</text>
        </view>
      </view>
      <view class="navbar-title">
        <text>{{ user.nickname }}的奇妙日</text>
      </view>
      <view class="navbar-icons">
        <view class="navbar-icon" @click="showAddCountdown">
          <text style="white-space: nowrap;">+添加</text>
        </view>
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
        <view v-if="currentLayout === 'grid'" class="grid-container"
          style="display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx;">
          <CountdownCard v-for="countdown in pinnedCountdowns" :key="countdown.id" ref="countdownCard"
            :countdown="countdown" :categories="categories" :compact="true" layout="grid" :careMode="careMode"
            @click="handleCountdownClick" />
        </view>
        <view v-else>
          <CountdownCard v-for="countdown in pinnedCountdowns" :key="countdown.id" ref="countdownCard"
            :countdown="countdown" :categories="categories" :compact="true" :careMode="careMode"
            @click="handleCountdownClick" />
        </view>
      </view>

      <!-- 未来奇妙日（包含置顶的） -->
      <view v-if="futureCountdowns.length > 0" class="countdown-section">
        <view class="section-header">
          <text class="section-title">未来</text>
          <text class="section-count">{{ futureCountdowns.length }}个</text>
        </view>
        <view v-if="currentLayout === 'grid'" class="grid-container"
          style="display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx;">
          <CountdownCard v-for="countdown in futureCountdowns" :key="countdown.id" ref="countdownCard"
            :countdown="countdown" :categories="categories" :compact="true" layout="grid" :careMode="careMode"
            @click="handleCountdownClick" />
        </view>
        <view v-else>
          <CountdownCard v-for="countdown in futureCountdowns" :key="countdown.id" ref="countdownCard"
            :countdown="countdown" :categories="categories" :compact="true" :careMode="careMode"
            @click="handleCountdownClick" />
        </view>
      </view>

      <!-- 已经奇妙日（包含置顶的） -->
      <view v-if="pastCountdowns.length > 0" class="countdown-section">
        <view class="section-header">
          <text class="section-title">已经</text>
          <text class="section-count">{{ pastCountdowns.length }}个</text>
        </view>
        <view v-if="currentLayout === 'grid'" class="grid-container"
          style="display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx;">
          <CountdownCard v-for="countdown in pastCountdowns" :key="countdown.id" ref="countdownCard"
            :countdown="countdown" :categories="categories" :compact="true" layout="grid" :careMode="careMode"
            @click="handleCountdownClick" />
        </view>
        <view v-else>
          <CountdownCard v-for="countdown in pastCountdowns" :key="countdown.id" ref="countdownCard"
            :countdown="countdown" :categories="categories" :compact="true" :careMode="careMode"
            @click="handleCountdownClick" />
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="allCountdowns.length === 0" class="empty-state">
        <text class="empty-icon">📅</text>
        <text class="empty-text">还没有奇妙日</text>
        <view class="btn btn-primary" @click="showAddCountdown">
          <text>添加第一个奇妙日</text>
        </view>
      </view>

      <!-- 底部空白 -->
      <view style="height: 40rpx;"></view>
    </scroll-view>
    <!-- 未登录浮动按钮 -->
    <FloatWechatLogin :show="!isLoggedIn" :firstLoginUrlBuilder="buildFirstLoginUrl" @success="onWechatLoginSuccess" />
    <!-- 侧边抽屉 -->
    <view v-if="drawerVisible" class="drawer-mask" @click="toggleDrawer"></view>
    <view v-if="drawerVisible" class="drawer" :class="{ 'drawer-open': drawerVisible }">
      <view class="drawer-header">
        <text class="drawer-title">奇妙本</text>
        <view class="drawer-close" @click="toggleDrawer">
          <text>✕</text>
        </view>
      </view>
      <scroll-view scroll-y class="drawer-content" show-scrollbar="false">
        <view class="category-list">
          <view class="category-drawer-item" @click="handleAllCategory">
            <view class="category-drawer-icon" style="background-color: #1890ff;">
              <text>📋</text>
            </view>
            <text class="category-drawer-name">全部</text>
            <text class="category-drawer-count">{{ allCountdowns.length }}</text>
          </view>
          <view v-for="category in categories" :key="category.id" class="category-drawer-item"
            @click="handleCategoryClick(category)">
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
<script lang="ts">
import { defineComponent } from 'vue';
import apiService from '@/services/apiService';
import { calculateTimeDiff } from '@/utils/countdownUtils';

import { Category, Countdown } from 'types';
import FloatWechatLogin from '@/components/FloatWechatLogin.vue';
import CountdownCard from '@/components/CountdownCard.vue';

import { getDataUrl } from '@/utils/common';

interface CountdownWithDisplayDate extends Countdown {
  displayDate: string;
  timeDiff: number;
}

interface IndexPageData {
  user: any;
  isLoadingData: boolean;
  isLoggedIn: boolean;
  allCountdowns: Countdown[];

  categories: Category[];
  drawerVisible: boolean;
  currentLayout: 'default' | 'grid';
  careMode: boolean;
}

export default defineComponent({
  name: 'Index',

  components: {
    FloatWechatLogin,
    CountdownCard
  },

  data(): IndexPageData {
    return {
      user: {
        id: 1,
        nickname: '未登录用户',
        avatar: '',
        created_at: '',
        updated_at: ''
      },
      isLoggedIn: false,
      isLoadingData: false,
      allCountdowns: [],
      categories: [],
      drawerVisible: false,
      currentLayout: 'default',
      careMode: !!uni.getStorageSync('careMode')
    };
  },

  computed: {
    // 单次遍历完成 displayDate 计算、timeDiff 计算和分组，避免三次重复过滤
    partitionedCountdowns(): { pinned: CountdownWithDisplayDate[]; future: CountdownWithDisplayDate[]; past: CountdownWithDisplayDate[] } {
      const pinned: CountdownWithDisplayDate[] = [];
      const future: CountdownWithDisplayDate[] = [];
      const past: CountdownWithDisplayDate[] = [];

      for (const countdown of this.allCountdowns) {
        let displayDate = countdown.date;
        if (countdown.repeat_cycle > 0 && countdown.repeat_frequency !== '不重复') {
          displayDate = this.getNextRepeatDate(countdown.date, countdown.repeat_cycle, countdown.repeat_frequency);
        }
        const timeDiff = calculateTimeDiff(displayDate, countdown.time);
        const item = { ...countdown, displayDate, timeDiff };

        if (countdown.is_pinned) {
          pinned.push(item);
        } else if (timeDiff > 0) {
          future.push(item);
        } else {
          past.push(item);
        }
      }

      pinned.sort((a, b) => new Date(b.updated_at as string).getTime() - new Date(a.updated_at as string).getTime());
      future.sort((a, b) => a.timeDiff - b.timeDiff);
      past.sort((a, b) => b.timeDiff - a.timeDiff);

      return { pinned, future, past };
    },

    pinnedCountdowns(): CountdownWithDisplayDate[] {
      return this.partitionedCountdowns.pinned;
    },

    futureCountdowns(): CountdownWithDisplayDate[] {
      return this.partitionedCountdowns.future;
    },

    pastCountdowns(): CountdownWithDisplayDate[] {
      return this.partitionedCountdowns.past;
    }
  },

  async onShow(): Promise<void> {
    const token = uni.getStorageSync('token');
    this.isLoggedIn = !!token;
    if (this.isLoggedIn && token) {
      try {
        const res = await apiService.incrementLoginDays();
        uni.setStorageSync('loginDays', res.login_days);
        this.refreshAllCountdownCards();
      } catch (error) {
        console.error('更新登录天数失败:', error);
      }
    }
    await this.loadData();
    this.careMode = !!uni.getStorageSync('careMode');
    await this.initWechatShare();
  },

  methods: {
    buildFirstLoginUrl(u: { id: any; nickname: any; sex?: any; gender?: any }): string {
      const gender = u.gender ?? u.sex ?? '';
      console.log('buildFirstLoginUrl' + gender);
      return `/subpackages/register/reginfo?id=${u.id}&nickname=${u.nickname}&gender=${gender}`;
    },

    async loadData(): Promise<void> {
      this.isLoadingData = true;
      const token = uni.getStorageSync('token');
      this.isLoggedIn = !!token;

      if (!this.isLoggedIn) {
        this.user = {
          id: 1,
          nickname: '未登录用户',
          avatar: '',
          created_at: '',
          updated_at: ''
        };
        this.allCountdowns = [];
        this.categories = [];
        this.isLoadingData = false;
        return;
      }

      try {
        const userid = uni.getStorageSync('userid');

        const [currentUser, countdownsRes, categoriesRes] = await Promise.all([
          apiService.getCurrentUser(userid || '1').catch(() => null),
          apiService.getCountdowns({ userid }),
          apiService.getCategories(userid || '1')
        ]);

        this.allCountdowns = countdownsRes;
        this.categories = categoriesRes;

        if (currentUser != null) {
          const cachedUserInfo = uni.getStorageSync('userInfo');
          let localUserInfo: Record<string, any> = {};
          if (cachedUserInfo) {
            try {
              localUserInfo = typeof cachedUserInfo === 'string' ? JSON.parse(cachedUserInfo) : cachedUserInfo;
            } catch (e) {
              localUserInfo = {};
            }
          }

          const mergedUser = {
            ...localUserInfo,
            ...currentUser,
            nickname: currentUser.nickname || localUserInfo?.nickname,
            avatar: currentUser.avatar || localUserInfo?.avatar
          };

          this.user = mergedUser;
          if (mergedUser.birthday == '' || mergedUser.birthday == null || mergedUser.birthday == undefined) {
            uni.showModal({
              title: '提示',
              content: '您的信息还不完整，是否现在去补全？（为了您更好的使用体验，请尽快补全个人信息）',
              confirmText: '去补全',
              cancelText: '稍后再说',
              success: (res) => {
                if (res.confirm) {
                  uni.setStorageSync('gender', mergedUser.gender);
                  uni.setStorageSync('loginDays', mergedUser.login_days);
                  console.log('currentUser.gender:', mergedUser.gender);
                  uni.navigateTo({
                    url: this.buildFirstLoginUrl(mergedUser)
                  });
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        uni.showToast({
          title: '加载失败' + error,
          icon: 'none'
        });
      } finally {
        this.isLoadingData = false;
      }
    },

    async onWechatLoginSuccess(params: any): Promise<void> {
      console.log('onWechatLoginSuccess', params);
      this.isLoggedIn = true;
      const token = uni.getStorageSync('token');
      this.isLoggedIn = !!token;

      if (this.isLoggedIn && token) {
        try {
          const res = await apiService.incrementLoginDays();
          uni.setStorageSync('loginDays', res.login_days);
          this.refreshAllCountdownCards();
        } catch (error) {
          console.error('更新登录天数失败:', error);
        }
      }
      await this.loadData();
    },

    getCategoryColor(category_id: number): string {
      const category = this.categories.find(c => c.id === category_id);
      return category ? category.color : '#1890ff';
    },

    getCategoryName(category_id: number): string {
      const category = this.categories.find(c => c.id === category_id);
      return category ? category.name : '未分类';
    },

    getCategoryCount(category_id: number): number {
      return this.allCountdowns.filter(cd => cd.category_id === category_id).length;
    },

    toggleDrawer(): void {
      this.drawerVisible = !this.drawerVisible;
    },

    toggleLayout(): void {
      this.currentLayout = this.currentLayout === 'grid' ? 'default' : 'grid';
    },

    toggleCareMode(): void {
      this.careMode = !this.careMode;
      uni.setStorageSync('careMode', this.careMode);
    },

    showAddCountdown(): void {
      if (!uni.getStorageSync('userid')) {
        uni.navigateTo({
          url: '/subpackages/login/login'
        });
        return;
      }
      uni.navigateTo({
        url: '/subpackages/edit/edit'
      });
    },

    handleCountdownClick(countdown: CountdownWithDisplayDate): void {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      uni.navigateTo({
        url: `/subpackages/detail/detail?id=${countdown.id}`
      });
    },

    handleAllCategory(): void {
      this.drawerVisible = false;
    },

    handleCategoryClick(category: Category): void {
      this.drawerVisible = false;
      uni.navigateTo({
        url: `/subpackages/categories/categories?category_id=${category.id}`
      });
    },

    getNextRepeatDate(
      originalDate: string,
      repeatCycle: number,
      repeatFrequency: '不重复' | '天重复' | '周重复' | '月重复' | '年重复'
    ): string {
      if (repeatCycle === 0 || repeatFrequency === '不重复') {
        return originalDate;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let nextDate = new Date(originalDate);
      nextDate.setHours(0, 0, 0, 0);

      if (nextDate > today) {
        return originalDate;
      }

      while (nextDate <= today) {
        switch (repeatFrequency) {
          case '天重复':
            nextDate.setDate(nextDate.getDate() + repeatCycle);
            break;
          case '周重复':
            nextDate.setDate(nextDate.getDate() + repeatCycle * 7);
            break;
          case '月重复':
            nextDate.setMonth(nextDate.getMonth() + repeatCycle);
            break;
          case '年重复':
            nextDate.setFullYear(nextDate.getFullYear() + repeatCycle);
            break;
        }
      }

      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    refreshAllCountdownCards(): void {
      this.$nextTick(() => {
        const countdownCards = this.$refs.countdownCard as any[];
        if (countdownCards && Array.isArray(countdownCards)) {
          countdownCards.forEach((card: any) => {
            if (card && card.refreshLoginDays) {
              card.refreshLoginDays();
            }
          });
        }
      });
    },

    async handleTogglePin(countdown: CountdownWithDisplayDate): Promise<void> {
      try {
        await apiService.togglePinCountdown(countdown.id as number);

        const index = this.allCountdowns.findIndex(cd => cd.id === countdown.id);
        if (index !== -1) {
          this.allCountdowns[index].is_pinned = !this.allCountdowns[index].is_pinned;
          this.allCountdowns[index].updated_at = new Date().toISOString();
        }

        uni.showToast({
          title: countdown.is_pinned ? '已取消置顶' : '已置顶',
          icon: 'success'
        });
      } catch (error) {
        console.error('操作失败:', error);
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    },

    async initWechatShare() {
      // #ifndef H5
      return;
      // #endif

      try {
        // #ifdef H5
        const wechatModule = require('@/utils/wechat');
        const wechatJSSDK = wechatModule.default || wechatModule;
        if (!wechatJSSDK.isInWx()) {
          console.log('当前不在微信环境中，跳过微信JSSDK初始化');
          return;
        }

        const shareConfig = {
          title: '长寿奇妙日',
          desc: '快来使用长寿奇妙日，记录生活中的重要时刻！',
          link: window.location.href,
          imgUrl: await getDataUrl('logo', 'jpg')
        };

        await wechatJSSDK.initAndSetShare(shareConfig);
        console.log('微信JSSDK分享初始化成功');
        // #endif
      } catch (error) {
        console.error('微信JSSDK分享初始化失败:', error);
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
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 30rpx;
  background-color: #1890ff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.navbar-left {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 46rpx;
}

.navbar-title {
  flex: 1;
  min-width: 0;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
}

.navbar-icons {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.navbar-icon {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #ffffff;
  position: relative;
}

.navbar-left .navbar-icon,
.navbar-icons .navbar-icon {
  margin-right: 0;
}

.icon-hint {
  position: absolute;
  bottom: -8rpx;
  right: -8rpx;
  font-size: 16rpx;
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 2rpx 4rpx;
  border-radius: 4rpx;
  line-height: 1;
  white-space: nowrap;
}

.page-content {
  height: calc(100vh - 88rpx - 100rpx);
  padding-top: 88rpx;
  padding-bottom: 100rpx;
}

.countdown-section {
  padding: 6rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4rpx;
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
  box-sizing: border-box;
  overflow: hidden;
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

.category-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 100%;
  box-sizing: border-box;
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
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.category-drawer-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f5f9ff;
  border-radius: 12rpx;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
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
  flex-shrink: 0;
}

.category-drawer-name {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-drawer-count {
  font-size: 24rpx;
  color: #666666;
  background-color: #e8f4ff;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  flex-shrink: 0;
}
</style>