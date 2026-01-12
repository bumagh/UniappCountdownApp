<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-icon" @click=" toggleDrawer ">
        <text>☰</text>
      </view>
      <view class="navbar-title">
        <text>{{ user.nickname }}的奇妙日</text>
      </view>
      <view class="navbar-icon" @click=" showAddCountdown ">
        <text style="white-space: nowrap;">+添加</text>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view scroll-y class="page-content">
      <!-- 置顶日程容器（独立显示在最上方） -->
      <view v-if=" pinnedCountdowns.length > 0 " class="countdown-section">
        <view class="section-header">
          <text class="section-title">置顶</text>
          <text class="section-count">{{ pinnedCountdowns.length }}个</text>
        </view>
        <CountdownCard v-for=" countdown in pinnedCountdowns " :key=" countdown.id " :countdown=" countdown "
          :categories=" categories " :compact=" true " @click=" handleCountdownClick " />
      </view>

      <!-- 未来奇妙日（包含置顶的） -->
      <view v-if=" futureCountdowns.length > 0 " class="countdown-section">
        <view class="section-header">
          <text class="section-title">未来</text>
          <text class="section-count">{{ futureCountdowns.length }}个</text>
        </view>
        <CountdownCard v-for=" countdown in futureCountdowns " :key=" countdown.id " :countdown=" countdown "
          :categories=" categories " :compact=" true " @click=" handleCountdownClick " />
      </view>

      <!-- 已经奇妙日（包含置顶的） -->
      <view v-if=" pastCountdowns.length > 0 " class="countdown-section">
        <view class="section-header">
          <text class="section-title">已经</text>
          <text class="section-count">{{ pastCountdowns.length }}个</text>
        </view>
        <CountdownCard v-for=" countdown in pastCountdowns " :key=" countdown.id " :countdown=" countdown "
          :categories=" categories " :compact=" true " @click=" handleCountdownClick " />
      </view>

      <!-- 空状态 -->
      <view v-if=" allCountdowns.length === 0 " class="empty-state">
        <text class="empty-icon">📅</text>
        <text class="empty-text">还没有奇妙日</text>
        <view class="btn btn-primary" @click=" showAddCountdown ">
          <text>添加第一个奇妙日</text>
        </view>
      </view>

      <!-- 底部空白 -->
      <view style="height: 40rpx;"></view>
    </scroll-view>
    <!-- 未登录浮动按钮 -->
    <FloatWechatLogin :show=" !isLoggedIn " :firstLoginUrlBuilder=" buildFirstLoginUrl "
      @success=" onWechatLoginSuccess " />
    <!-- 侧边抽屉 -->
    <view v-if=" drawerVisible " class="drawer-mask" @click=" toggleDrawer "></view>
    <view class="drawer" :class=" { 'drawer-open': drawerVisible } ">
      <view class="drawer-header">
        <text class="drawer-title">奇妙本</text>
        <view class="drawer-close" @click=" toggleDrawer ">
          <text>✕</text>
        </view>
      </view>
      <scroll-view scroll-y class="drawer-content" show-scrollbar="false">
        <view class="category-list">
          <view class="category-drawer-item" @click=" handleAllCategory ">
            <view class="category-drawer-icon" style="background-color: #1890ff;">
              <text>📋</text>
            </view>
            <text class="category-drawer-name">全部</text>
            <text class="category-drawer-count">{{ allCountdowns.length }}</text>
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

  </view>
</template>
<script lang="ts">

import { defineComponent } from 'vue';
import apiService from '@/services/apiService';
import { calculateDays, getAbsoluteDays, formatDate, getRepeatText } from '@/utils/countdownUtils';
import { Category, Countdown } from 'types';
import FloatWechatLogin from '@/components/FloatWechatLogin.vue';
import CountdownCard from '@/components/CountdownCard.vue';
import { sassTrue } from 'sass';
// 扩展 Countdown 接口，添加 displayDate 字段
interface CountdownWithDisplayDate extends Countdown
{
  displayDate: string;
}

interface IndexPageData
{
  user: any;
  isLoggedIn: boolean;
  isLoadingData: boolean;
  allCountdowns: Countdown[];
  categories: Category[];
  drawerVisible: boolean;
}

export default defineComponent(
  {
    name: 'Index',

    components: {
      FloatWechatLogin,
      CountdownCard
    },

    data (): IndexPageData
    {
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
        allCountdowns: [
          {
            id: 1,
            title: 'Countdown 1',
            date: '2023-10-01',
            is_pinned: false,
            repeat_cycle: 1,
            repeat_frequency: '不重复',
            created_at: '',
            updated_at: '',
            category_id: 0,
            user_id: 0
          },
          {
            id: 2,
            title: 'Countdown 2',
            date: '2023-10-02',
            is_pinned: true,
            repeat_cycle: 1,
            repeat_frequency: '不重复',
            created_at: '',
            updated_at: '',
            category_id: 0,
            user_id: 0
          }
        ],
        categories: [],
        drawerVisible: false
      };
    },

    computed: {
      // 为每个奇妙日计算显示日期（考虑重复日程的未来最近日期）
      countdownsWithDisplayDate (): CountdownWithDisplayDate[]
      {
        return this.allCountdowns.map( countdown =>
        {
          let displayDate = countdown.date;

          // 如果是重复日程，计算未来最近的日期
          if ( countdown.repeat_cycle > 0 && countdown.repeat_frequency !== '不重复' )
          {
            displayDate = this.getNextRepeatDate( countdown.date, countdown.repeat_cycle, countdown.repeat_frequency );
          }

          return {
            ...countdown,
            displayDate
          };
        } );
      },

      // 置顶日程（独立的置顶容器）- 按编辑时间排序，最新编辑的在前
      pinnedCountdowns (): CountdownWithDisplayDate[]
      {
        return this.countdownsWithDisplayDate
          .filter( cd => cd.is_pinned )
          .sort( ( a, b ) => new Date( b.updated_at as string ).getTime() - new Date( a.updated_at as string ).getTime() );
      },

      // 未来奇妙日（不包含置顶的）- 按日期排序
      futureCountdowns (): CountdownWithDisplayDate[]
      {
        const future = this.countdownsWithDisplayDate
          .filter( cd => !cd.is_pinned && calculateDays( cd.displayDate ) >= 0 );
        return future.sort( ( a, b ) => calculateDays( a.displayDate ) - calculateDays( b.displayDate ) );
      },

      // 已经奇妙日（不包含置顶的）- 按日期排序
      pastCountdowns (): CountdownWithDisplayDate[]
      {
        const past = this.countdownsWithDisplayDate
          .filter( cd => !cd.is_pinned && calculateDays( cd.displayDate ) < 0 );
        return past.sort( ( a, b ) => calculateDays( b.displayDate ) - calculateDays( a.displayDate ) );
      }
    },

    async onShow (): Promise<void>
    {
      // 简单以token判断登录态
      const token = uni.getStorageSync( 'token' );
      this.isLoggedIn = token==undefined? false:true;

      await this.loadData();
    },

    methods: {
      buildFirstLoginUrl ( u: { id: any; nickname: any; sex: any } ): string
      {
      console.log('buildFirstLoginUrl'+u.sex)
        return `/subpackages/register/reginfo?id=${ u.id }&nickname=${ u.nickname }&gender=${ u.sex }`;
      },

      async loadData (): Promise<void>
      {
        if(this.isLoadingData) return;
        this.isLoadingData = true;
        try
        {
          // 未登录时：展示本地测试数据（用于空态预览）
          if ( !this.isLoggedIn )
          {
            const today = new Date();
            const toYmd = ( d: Date ) =>
            {
              const y = d.getFullYear();
              const m = String( d.getMonth() + 1 ).padStart( 2, '0' );
              const day = String( d.getDate() ).padStart( 2, '0' );
              return `${ y }-${ m }-${ day }`;
            };
            this.categories = [
              { id: 1, name: '健康', color: '#1890ff', icon: '💪', user_id: 0, created_at: '', updated_at: '' },
              { id: 2, name: '计划', color: '#52c41a', icon: '🗓️', user_id: 0, created_at: '', updated_at: '' },
              { id: 3, name: '纪念', color: '#fa8c16', icon: '🎉', user_id: 0, created_at: '', updated_at: '' }
            ];
            // 未来
            const d1 = new Date( today ); d1.setDate( d1.getDate() + 2 );
            const d2 = new Date( today ); d2.setDate( d2.getDate() + 7 );
            const d3 = new Date( today ); d3.setDate( d3.getDate() + 18 );
            const d4 = new Date( today ); d4.setDate( d4.getDate() + 22 );
            const d5 = new Date( today ); d5.setDate( d5.getDate() + 22873 );
            // 已过
            const d6 = new Date( today ); d6.setDate( d6.getDate() - 60 );
            const d7 = new Date( today ); d7.setDate( d7.getDate() - 82 );
            const d8 = new Date( today ); d8.setDate( d8.getDate() - 129 );
            const d9 = new Date( today ); d9.setDate( d9.getDate() - 949 );
            const d10 = new Date( today ); d10.setDate( d10.getDate() - 992 );
            const d11 = new Date( today ); d11.setDate( d11.getDate() - 1243 );
            const d12 = new Date( today ); d12.setDate( d12.getDate() - 2653 );
            this.allCountdowns = [
              {
                id: 1001,
                title: '荷尔蒙注射(半月)',
                date: toYmd( d1 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 1,
                user_id: 0
              },
              {
                id: 1002,
                title: 'NK/CIK免疫细胞回输(每月)',
                date: toYmd( d2 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 1,
                user_id: 0
              },
              {
                id: 1003,
                title: '抽血检查(每月)',
                date: toYmd( d2 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 2,
                user_id: 0
              },
              {
                id: 1004,
                title: '长寿医学检测(每季度)',
                date: toYmd( d3 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 2,
                user_id: 0
              },
              {
                id: 1005,
                title: 'MSC间充质干细胞回输(每月)',
                date: toYmd( d4 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 1,
                user_id: 0
              },
              {
                id: 1006,
                title: '突破120岁',
                date: toYmd( d5 ),
                is_pinned: true,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 1,
                user_id: 0
              },
              // 已过
              {
                id: 1007,
                title: '外泌体面部抗衰老入组',
                date: toYmd( d6 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 3,
                user_id: 0
              },
              {
                id: 1008,
                title: '长寿修炼(空腹力半日断食法)',
                date: toYmd( d7 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 2,
                user_id: 0
              },
              {
                id: 1009,
                title: '荷尔蒙抗衰疗程开启',
                date: toYmd( d8 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 1,
                user_id: 0
              },
              {
                id: 1010,
                title: 'IPSC种子细胞存储',
                date: toYmd( d9 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 1,
                user_id: 0
              },
              {
                id: 1011,
                title: 'IPSC重编程采血',
                date: toYmd( d10 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 1,
                user_id: 0
              },
              {
                id: 1012,
                title: '细胞抗衰疗程正式启动',
                date: toYmd( d11 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 1,
                user_id: 0
              },
              {
                id: 1013,
                title: '口服NMN抗衰老',
                date: toYmd( d12 ),
                is_pinned: false,
                repeat_cycle: 0,
                repeat_frequency: '不重复',
                created_at: '',
                updated_at: new Date().toISOString(),
                category_id: 1,
                user_id: 0
              }
            ];
             this.allCountdowns=[];
            return;
          }

          // 获取当前用户信息
          const userid = uni.getStorageSync( 'userid' );
          const currentUser = await apiService.getCurrentUser( userid || '1' );
          if ( currentUser != null )
          {
            this.user = currentUser;
            if ( currentUser.birthday == "" || currentUser.birthday == null || currentUser.birthday == undefined )
            {
              //先弹窗询问是否要补全信息
              uni.showModal( {
                title: '提示',
                content: '您的信息还不完整，是否现在去补全？（为了您更好的使用体验，请尽快补全个人信息）',
                confirmText: '去补全',
                cancelText: '稍后再说',
                success: ( res ) =>
                {
                  if ( res.confirm )
                  {
                    uni.setStorageSync('gender',currentUser.gender);
                    console.log('currentUser.gender:', currentUser.gender);
                    uni.navigateTo( {
                      url: `/subpackages/register/reginfo?id=${ currentUser.id }&nickname=${ currentUser.nickname }&gender=${ currentUser.gender }`
                    } );
                  }
                }
              } );
            }
          }

          // 获取分类和奇妙日数据
          const [ countdownsRes, categoriesRes ] = await Promise.all( [
            apiService.getCountdowns( { userid } ),
            apiService.getCategories( userid || '1' )
          ] );
          this.allCountdowns = countdownsRes;
          this.categories = categoriesRes;
        } catch ( error )
        {
          console.error( '加载数据失败:', error );
          uni.showToast( {
            title: '加载失败',
            icon: 'none'
          } );
        }
        this.isLoadingData = false;
      },

      onWechatLoginSuccess (params:any): void
      {
        console.log('onWechatLoginSuccess',params);
        this.isLoggedIn = true;
        this.loadData();
      },

      calculateDays ( targetDate: string ): number
      {
        return calculateDays( targetDate );
      },

      getAbsoluteDays ( targetDate: string ): number
      {
        return getAbsoluteDays( targetDate );
      },

      formatDate ( dateStr: string ): string
      {
        return formatDate( dateStr );
      },

      getCategoryColor ( category_id: number ): string
      {
        const category = this.categories.find( c => c.id === category_id );
        return category ? category.color : '#1890ff';
      },

      getCategoryName ( category_id: number ): string
      {
        const category = this.categories.find( c => c.id === category_id );
        return category ? category.name : '未分类';
      },

      getCategoryCount ( category_id: number ): number
      {
        return this.allCountdowns.filter( cd => cd.category_id === category_id ).length;
      },

      toggleDrawer (): void
      {
        this.drawerVisible = !this.drawerVisible;
      },

      showAddCountdown (): void
      {
        if ( !uni.getStorageSync( 'userid' ) )
        {
          uni.navigateTo( {
            url: '/subpackages/login/login'
          } );
          return;
        }
        uni.navigateTo( {
          url: '/subpackages/edit/edit'
        } );
      },

      handleCountdownClick ( countdown: CountdownWithDisplayDate ): void
      {
        //需要判断是否登录
        if ( !this.isLoggedIn ){
          uni.showToast( {
            title: '请先登录',
            icon: 'none'
          } );
          return;
        }
        uni.navigateTo( {
          url: `/subpackages/detail/detail?id=${ countdown.id }`
        } );
      },

      handleAllCategory (): void
      {
        this.drawerVisible = false;
      },

      handleCategoryClick ( category: Category ): void
      {
        this.drawerVisible = false;
        uni.navigateTo( {
          url: `/subpackages/categories/categories?category_id=${ category.id }`
        } );
      },

      // 获取重复日程的未来最近日期
      getNextRepeatDate (
        originalDate: string,
        repeatCycle: number,
        repeatFrequency: '不重复' | '天重复' | '周重复' | '月重复' | '年重复'
      ): string
      {
        // 如果不是重复日程，返回原日期
        if ( repeatCycle === 0 || repeatFrequency === '不重复' )
        {
          return originalDate;
        }

        const today = new Date();
        today.setHours( 0, 0, 0, 0 );

        let nextDate = new Date( originalDate );
        nextDate.setHours( 0, 0, 0, 0 );

        // 如果起始日期在未来，直接返回
        if ( nextDate > today )
        {
          return originalDate;
        }

        // 循环计算下一个未来日期
        while ( nextDate <= today )
        {
          switch ( repeatFrequency )
          {
            case '天重复':
              nextDate.setDate( nextDate.getDate() + repeatCycle );
              break;
            case '周重复':
              nextDate.setDate( nextDate.getDate() + repeatCycle * 7 );
              break;
            case '月重复':
              nextDate.setMonth( nextDate.getMonth() + repeatCycle );
              break;
            case '年重复':
              nextDate.setFullYear( nextDate.getFullYear() + repeatCycle );
              break;
          }
        }

        // 格式化为 YYYY-MM-DD
        const year = nextDate.getFullYear();
        const month = String( nextDate.getMonth() + 1 ).padStart( 2, '0' );
        const day = String( nextDate.getDate() ).padStart( 2, '0' );
        return `${ year }-${ month }-${ day }`;
      },

      // 获取重复文本
      getRepeatText ( repeatCycle: number, repeatFrequency: string ): string
      {
        return getRepeatText( repeatCycle, repeatFrequency as any );
      },

      // 切换置顶状态
      async handleTogglePin ( countdown: CountdownWithDisplayDate ): Promise<void>
      {
        try
        {
          await apiService.togglePinCountdown( countdown.id as number );

          // 更新本地数据
          const index = this.allCountdowns.findIndex( cd => cd.id === countdown.id );
          if ( index !== -1 )
          {
            this.allCountdowns[ index ].is_pinned = !this.allCountdowns[ index ].is_pinned;
            this.allCountdowns[ index ].updated_at = new Date().toISOString();
          }

          uni.showToast( {
            title: countdown.is_pinned ? '已取消置顶' : '已置顶',
            icon: 'success'
          } );
        } catch ( error )
        {
          console.error( '操作失败:', error );
          uni.showToast( {
            title: '操作失败',
            icon: 'none'
          } );
        }
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
  margin-right: 20rpx;
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
</style>