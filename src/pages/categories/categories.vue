<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-icon" @click=" toggleDrawer ">
        <text>☰</text>
      </view>
      <view class="navbar-title">
        <text>{{ user.nickname }}的奇妙本</text>
      </view>
      <view></view>
      <!-- <view class="navbar-icon" @click=" goToBookEdit ">
        <text>+</text>
      </view> -->
    </view>

    <!-- 主体内容 -->
    <scroll-view scroll-y class="page-content">
      <!-- 添加新奇妙本按钮 -->
      <view class="add-category-section">
        <view class="add-category-btn shadow" @click=" goToBookEdit ">
          <view class="add-icon">
            <text>+</text>
          </view>
          <text class="add-text">添加新奇妙本</text>
        </view>
      </view>

      <!-- 分类列表 -->
      <view class="category-section">
        <view class="section-title">
          <text>全部奇妙本</text>
        </view>

        <!-- 全部分类卡片 -->
        <view class="category-card shadow" @click=" handleAllCategory ">
          <view class="category-card-left">
            <view class="category-icon" style="background-color: #1890ff;">
              <text>📋</text>
            </view>
            <view class="category-info">
              <text class="category-name">全部</text>
              <text class="category-desc">查看所有奇妙日</text>
            </view>
          </view>
          <view class="category-card-right">
            <text class="category-count">{{ getAllCountdownCount() }}</text>
            <text class="category-arrow">›</text>
          </view>
        </view>

        <!-- 分类卡片列表 -->
        <view v-for=" category in categories " :key=" category.id " class="category-card shadow"
          @click="handleCategoryClick( category )" @longpress="handleCategoryLongPress( category )"
          @contextmenu.prevent="handleCategoryLongPress( category )">
          <view class="category-card-left">
            <view class="category-icon" :style=" { backgroundColor: category.color } ">
              <text>{{ category.icon }}</text>
            </view>
            <view class="category-info">
              <text class="category-name">{{ category.name }}</text>
              <text class="category-desc">{{ getCategoryCountText( category.id ) }}</text>
            </view>
          </view>
          <view class="category-card-right">
            <text class="category-count">{{ getCategoryCount( category.id ) }}</text>
            <text class="category-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 底部空白 -->
      <view style="height: 40rpx;"></view>
    </scroll-view>

    <!-- 侧边抽屉 -->
    <view v-if=" drawerVisible " class="drawer-mask" @click=" toggleDrawer "></view>
    <view class="drawer" :class=" { 'drawer-open': drawerVisible } ">
      <view class="drawer-header">
        <text class="drawer-title">奇妙本</text>
        <view class="drawer-close" @click=" toggleDrawer ">
          <text>✕</text>
        </view>
      </view>
      <scroll-view scroll-y class="drawer-content">
        <view class="category-list">
          <view class="category-drawer-item" @click=" handleAllCategoryDrawer ">
            <view class="category-drawer-icon" style="background-color: #1890ff;">
              <text>📋</text>
            </view>
            <text class="category-drawer-name">全部</text>
            <text class="category-drawer-count">{{ getAllCountdownCount() }}</text>
          </view>
          <view v-for=" category in categories " :key=" category.id " class="category-drawer-item"
            @click="handleCategoryDrawerClick( category )">
            <view class="category-drawer-icon" :style=" { backgroundColor: category.color } ">
              <text>{{ category.icon }}</text>
            </view>
            <text class="category-drawer-name">{{ category.name }}</text>
            <text class="category-drawer-count">{{ getCategoryCount( category.id ) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 分类详情页面（奇妙日列表） -->
    <view v-if=" detailVisible " class="detail-mask" @click=" closeDetail ">
      <view class="detail-content" @click.stop>
        <view class="detail-header">
          <view class="detail-header-left">
            <view class="detail-icon"
              :style=" { backgroundColor: selectedCategory ? selectedCategory.color : '#1890ff' } ">
              <text>{{ selectedCategory ? selectedCategory.icon : '📋' }}</text>
            </view>
            <view class="detail-title-wrapper">
              <text class="detail-title">{{ selectedCategory ? selectedCategory.name : '全部' }}</text>
              <text class="detail-subtitle">{{ detailCountdowns?.length }}个奇妙日</text>
            </view>
          </view>
          <view class="detail-close" @click=" closeDetail ">
            <text>✕</text>
          </view>
        </view>

        <scroll-view scroll-y class="detail-body">
          <!-- 未来奇妙日 -->
          <view v-if=" ( futureCountdowns ?? [] ).length > 0 " class="countdown-group">
            <view class="group-title">
              <text>未来 ({{ ( futureCountdowns ?? [] ).length }})</text>
            </view>
            <view v-for=" countdown in futureCountdowns " :key=" countdown.id " class="countdown-card shadow"
              @click="handleCountdownClick( countdown )">
              <view class="countdown-number">
                <text>{{ getCountdownStatusText( countdown.date, countdown.time ) }}</text>
              </view>
              <view class="countdown-info">
                <text class="countdown-title">{{ countdown.title }}</text>
                <text class="countdown-date">{{ formatDate( countdown.date, countdown.time ) }}</text>
              </view>
            </view>
          </view>

          <!-- 已经奇妙日 -->
          <view v-if=" pastCountdowns!.length > 0 " class="countdown-group">
            <view class="group-title">
              <text>已经 ({{ pastCountdowns!.length }})</text>
            </view>
            <view v-for=" countdown in pastCountdowns " :key=" countdown.id " class="countdown-card shadow past-card"
              @click="handleCountdownClick( countdown )">
              <view class="countdown-number past-number">
                <text>{{ getCountdownStatusText( countdown.date, countdown.time ) }}</text>
              </view>
              <view class="countdown-info">
                <text class="countdown-title">{{ countdown.title }}</text>
                <text class="countdown-date">{{ formatDate( countdown.date, countdown.time ) }}</text>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if=" detailCountdowns!.length === 0 " class="empty-state">
            <text class="empty-icon">📋</text>
            <text class="empty-text">还没有奇妙日</text>
            <view class="btn btn-primary" @click=" showAddCountdown ">
              <text>添加第一个</text>
            </view>
          </view>

          <!-- 底部空白 -->
          <view style="height: 40rpx;"></view>
        </scroll-view>
      </view>
    </view>

    <!-- 添加奇妙日弹窗 -->
    <AddCountdown :visible=" addCountdownVisible " :countdownData=" editingCountdown || undefined "
      :defaultCategoryId=" selectedCategory?.id " @close=" closeAddCountdown " @success=" handleCountdownSuccess " />
  </view>

</template>

<script lang="ts">
import { User, Category, Countdown } from 'types';
import { calculateTimeDiff, formatDate, getCountdownStatusText } from '@/utils/countdownUtils';

import AddCountdown from '@/components/AddCountdown.vue';
import { defineComponent } from 'vue';
import apiService from '@/services/apiService';

interface CategoryPageData
{
  user: User,
  categories: Category[] | null,
  countdowns: Countdown[] | null,
  drawerVisible: boolean,
  addCountdownVisible: boolean,
  editingCountdown: Countdown | null,
  detailVisible: boolean,
  selectedCategory: Category | null,
  detailCountdowns: Countdown[] | null,
  categoryIdFromQuery: number
}

export default defineComponent( {
  name: 'Categories',
  components: {
    AddCountdown
  },
  data (): CategoryPageData
  {
    return {
      user: {
        id: 1,
        nickname: '张三',
        username: '',
        password: '',
        avatar: '',
        created_at: '',
        updated_at: ''
      },
      categories: [],
      countdowns: [],
      drawerVisible: false,
      addCountdownVisible: false,
      editingCountdown: null,
      detailVisible: false,
      selectedCategory: null,
      detailCountdowns: [],
      categoryIdFromQuery: 0
    };
  },

  computed: {
    futureCountdowns ()
    {
      return this.detailCountdowns
        ?.filter( cd => calculateTimeDiff( cd.date, cd.time ) > 0 )
        .sort( ( a, b ) => calculateTimeDiff( a.date, a.time ) - calculateTimeDiff( b.date, b.time ) );
    },
    pastCountdowns ()
    {
      return this.detailCountdowns
        ?.filter( cd => calculateTimeDiff( cd.date, cd.time ) <= 0 )
        .sort( ( a, b ) => calculateTimeDiff( b.date, b.time ) - calculateTimeDiff( a.date, a.time ) );
    }
  },

  onLoad ( options: any )
  {
    if ( options.categoryId )
    {
      this.categoryIdFromQuery = parseInt( options.categoryId );
    }
  },

  onShow ()
  {
    if ( !uni.getStorageSync( 'userid' ) )
    {
      uni.navigateTo( {
        url: '/subpackages/login/login'
      } );
      return;
    }

    this.loadUserData();
    this.loadCategories();
    this.loadCountdowns();

    if ( this.categoryIdFromQuery )
    {
      const category = this.categories?.find( c => c.id === this.categoryIdFromQuery );
      if ( category )
      {
        this.handleCategoryClick( category );
      }
      this.categoryIdFromQuery = 0;
    }
  },

  methods: {
    async loadUserData ()
    {
      const userid = uni.getStorageSync( 'userid' );
      const currentUser = await apiService.getCurrentUser( userid );
      this.user = currentUser;
    },
    async loadCategories ()
    {
      const userid = uni.getStorageSync( 'userid' );
      this.categories = await apiService.getCategories( userid );
    },
    async loadCountdowns ()
    {
      const userid = uni.getStorageSync( 'userid' );
      this.countdowns = await apiService.getCountdowns( { userid } );// eslint-disable-line no-undef
    },
    getCategoryCount ( categoryId: number )
    {
      return this.countdowns?.filter( cd => cd.category_id === categoryId ).length;
    },
    getAllCountdownCount ()
    {
      return this.countdowns?.length;
    },
    getCategoryCountText ( categoryId: number )
    {
      const count = this.getCategoryCount( categoryId );
      return `${ count }个奇妙日`;
    },
    toggleDrawer ()
    {
      this.drawerVisible = !this.drawerVisible;
    },
    goToBookEdit ()
    {
      uni.navigateTo( {
        url: '/subpackages/book-edit/book-edit'
      } );
    },
    showAddCountdown ()
    {
      this.editingCountdown = null;
      this.addCountdownVisible = true;
    },
    async closeAddCountdown ()
    {
      this.addCountdownVisible = false;
      this.editingCountdown = null;
      const userid = uni.getStorageSync( 'userid' );
      this.countdowns = await apiService.getCountdowns( { userid } );// eslint-disable-line no-undef
      this.detailCountdowns = this.countdowns?.filter( cd => cd.category_id === this.selectedCategory?.id ) ?? null;
    },
    handleAllCategory ()
    {
      this.selectedCategory = null;
      this.detailCountdowns = this.countdowns;
      this.detailVisible = true;
    },
    handleAllCategoryDrawer ()
    {
      this.drawerVisible = false;
      this.handleAllCategory();
    },
    handleCategoryClick ( category: Category )
    {
      this.selectedCategory = category;
      this.detailCountdowns = this.countdowns?.filter( cd => cd.category_id === category.id ) ?? null;
      this.detailVisible = true;
    },
    handleCategoryDrawerClick ( category: Category )
    {
      this.drawerVisible = false;
      this.selectedCategory = category;
      this.detailCountdowns = this.countdowns?.filter( cd => cd.category_id === category.id ) ?? null;
      this.detailVisible = true;
    },
    handleCategoryLongPress ( category: Category )
    {
      uni.showActionSheet( {
        itemList: [ '编辑', '删除' ],
        success: ( res ) =>
        {
          if ( res.tapIndex === 0 )
          {
            uni.navigateTo( {
              url: `/subpackages/book-edit/book-edit?id=${ category.id }`
            } );
          } else if ( res.tapIndex === 1 )
          {
            uni.showModal( {
              title: '确认删除',
              content: `确定要删除"${ category.name }"分类吗？该分类下的奇妙日也会被删除。`,
              success: async ( modalRes ) =>
              {
                if ( modalRes.confirm )
                {
                  await apiService.deleteCategory( category.id );
                  this.loadCategories();
                  this.loadCountdowns();
                  uni.showToast( {
                    title: '删除成功',
                    icon: 'success'
                  } );
                }
              }
            } );
          }
        }
      } );
    },
    closeDetail ()
    {
      this.detailVisible = false;
      this.selectedCategory = null;
      this.detailCountdowns = [];
    },
    handleCountdownClick ( countdown: Countdown )
    {
      uni.navigateTo( {
        url: `/subpackages/detail/detail?id=${ countdown.id }`
      } );
    },
    handleCountdownSuccess ()
    {
      this.loadCountdowns();
      if ( this.selectedCategory )
      {
        this.detailCountdowns = this.countdowns?.filter( cd => cd.category_id === this.selectedCategory?.id ) ?? null;
      } else
      {
        this.detailCountdowns = this.countdowns;
      }
    },
    formatDate ( dateStr: string, timeStr?: string )
    {
      return formatDate( dateStr, timeStr );
    },
    getCountdownStatusText ( dateStr: string, timeStr?: string )
    {
      return getCountdownStatusText( dateStr, timeStr );
    }
  }
} );
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
  z-index: 998;
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

.add-category-section {
  padding: 30rpx;
}

.add-category-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  gap: 20rpx;
}

.add-icon {
  width: 80rpx;
  height: 80rpx;
  background-color: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #ffffff;
}

.add-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.category-section {
  padding: 0 30rpx 30rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #666666;
  padding: 20rpx 0;
}

.category-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.category-card-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.category-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-right: 20rpx;
}

.category-info {
  display: flex;
  flex-direction: column;
}

.category-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 8rpx;
}

.category-desc {
  font-size: 24rpx;
  color: #666666;
}

.category-card-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.category-count {
  font-size: 40rpx;
  font-weight: bold;
  color: #1890ff;
}

.category-arrow {
  font-size: 48rpx;
  color: #aaaaaa;
}

.drawer {
  position: fixed;
  top: 0;
  left: -600rpx;
  width: 600rpx;
  height: 100vh;
  background-color: #ffffff;
  transition: left 0.3s ease;
  z-index: 997;
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
  z-index: 996;
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

.category-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 100%;
  box-sizing: border-box;
}

.category-drawer-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f5f9ff;
  border-radius: 12rpx;
  transition: all 0.3s;
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

.detail-mask {
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

.detail-content {
  width: 100%;
  height: 85vh;
  background-color: #f5f9ff;
  border-radius: 40rpx 40rpx 0 0;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx 20rpx;
  border-bottom: 2rpx solid #e8f4ff;
  background-color: #ffffff;
  border-radius: 40rpx 40rpx 0 0;
}

.detail-header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.detail-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-right: 20rpx;
}

.detail-title-wrapper {
  display: flex;
  flex-direction: column;
}

.detail-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 8rpx;
}

.detail-subtitle {
  font-size: 24rpx;
  color: #666666;
}

.detail-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #666666;
}

.detail-body {
  flex: 1;
  padding: 20rpx 30rpx;
}

.countdown-group {
  margin-bottom: 40rpx;
}

.group-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #666666;
  margin-bottom: 20rpx;
}

.countdown-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.past-card {
  opacity: 0.7;
}

.countdown-number {
  font-size: 80rpx;
  font-weight: bold;
  color: #1890ff;
  line-height: 1;
  min-width: 180rpx;
  text-align: center;
}

.past-number {
  color: #666666;
}

.countdown-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.countdown-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10rpx;
}

.countdown-date {
  font-size: 24rpx;
  color: #666666;
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

.shadow {
  box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.08);
}
</style>