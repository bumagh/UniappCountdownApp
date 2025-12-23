<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-icon" @click=" goBack ">
        <text>‹</text>
      </view>
      <view class="navbar-title">
        <text>{{ isEdit ? '编辑倒数日' : '添加倒数日' }}</text>
      </view>
      <view class="navbar-icon" @click=" handleSubmit ">
        <text>✓</text>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view scroll-y class="page-content">
      <view class="form-container">
        <view class="form-item">
          <text class="form-label">日程名称</text>
          <input class="form-input" v-model=" formData.title " placeholder="请输入日程名称" maxlength="20" />
        </view>

        <view class="form-item">
          <text class="form-label">选择日期</text>
          <view class="date-picker-container">
            <picker mode="date" :value=" formData.date " @change=" onDateChange " :start=" minDate " :end=" maxDate "
              class="date-picker">
              <view class="date-input">
                <text v-if=" formData.date " class="date-text">{{ formatDateDisplay( formData.date ) }}</text>
                <text v-else class="date-placeholder">请选择日期</text>
                <text class="date-icon">📅</text>
              </view>
            </picker>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">选择分类</text>
          <view class="category-list">
            <view v-for=" category in categories " :key=" category.id " class="category-item"
              :class=" { 'category-active': formData.category_id === category.id } "
              @click="selectCategory( category.id )">
              <view class="category-icon" :style=" { backgroundColor: category.color } ">
                <text class="icon-text">{{ category.icon }}</text>
              </view>
              <text class="category-name">{{ category.name }}</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">置顶显示</text>
            <switch :checked=" formData.is_pinned " @change=" onPinnedChange " color="#1890ff" />
          </view>
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">重复设置</text>
            <switch :checked=" isRepeatEnabled " @change=" toggleRepeat " color="#1890ff" />
          </view>
        </view>

        <!-- 重复设置选择器（弹出选项框版本） -->
        <view v-if=" isRepeatEnabled " class="repeat-selector-section">
          <view class="repeat-button-wrapper">
            <button class="repeat-button" @click=" showRepeatOptions ">
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
    <view v-if=" isEdit " class="danger-section">
      <view class="danger-actions">
        <view class="btn btn-archive" @click=" handleArchive ">
          <text>归档</text>
        </view>
        <view class="btn btn-danger" @click=" handleDelete ">
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
import { Category, Countdown, CountdownForm } from 'types';

interface EditPageData
{
  countdownId: number | null;
  isEdit: boolean;
  formData: CountdownForm & {
    is_pinned: boolean;
  };
  categories: Category[];
  repeatOptions: string[];
  repeatOption: string;
  isRepeatEnabled: boolean;
}

export default defineComponent( {
  name: 'Edit',

  data (): EditPageData
  {
    return {
      countdownId: null,
      isEdit: false,
      formData: {
        title: '',
        date: this.getCurrentDate(),
        category_id: 0,
        is_pinned: false,
        repeat_cycle: 0,
        repeat_frequency: '不重复' as const
      },
      categories: [],
      repeatOptions: [ '不重复', '每天', '每周', '每月', '每年', '每2天', '每3天', '每4天', '每5天', '每6天', '每7天', '每2周', '每3周', '每2月', '每3月', '每6月', '每2年', '每3年', '每5年' ],
      repeatOption: '不重复',
      isRepeatEnabled: false
    };
  },

  computed: {
    minDate (): string
    {
      const date = new Date();
      date.setFullYear( date.getFullYear() - 10 );
      return date.toISOString().split( 'T' )[ 0 ];
    },

    maxDate (): string
    {
      const date = new Date();
      date.setFullYear( date.getFullYear() + 10 );
      return date.toISOString().split( 'T' )[ 0 ];
    }
  },

  onLoad ( options: any ): void
  {
    if ( options.date )
    {
      this.formData.date = options.date;
    }
    if ( options.id )
    {
      this.countdownId = parseInt( options.id );
      this.isEdit = true;
      this.loadCountdownData();
    } else
    {
      this.loadCategories();
    }
  },

  methods: {
    getCurrentDate (): string
    {
      const date = new Date();
      const year = date.getFullYear();
      const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
      const day = String( date.getDate() ).padStart( 2, '0' );
      return `${ year }-${ month }-${ day }`;
    },

    async loadCountdownData (): Promise<void>
    {
      if ( !this.countdownId ) return;

      try
      {
        const countdown = await apiService.getCountdown( this.countdownId );
        if ( countdown )
        {
          this.formData = {
            title: countdown.title,
            date: countdown.date,
            category_id: countdown.category_id,
            is_pinned: countdown.is_pinned || false,
            repeat_cycle: countdown.repeat_cycle || 0,
            repeat_frequency: countdown.repeat_frequency || '不重复'
          };
          this.checkRepeatEnabled();
          this.setRepeatOption();
        }
        this.loadCategories();
      } catch ( error )
      {
        console.error( '加载倒数日数据失败:', error );
        uni.showToast( {
          title: '加载数据失败',
          icon: 'none'
        } );
      }
    },

    async loadCategories (): Promise<void>
    {
      try
      {
        const userid = uni.getStorageSync( 'userid' );
        const categories = await apiService.getCategories( userid );
        this.categories = categories;
        if ( this.categories.length > 0 && !this.formData.category_id )
        {
          this.formData.category_id = this.categories[ 0 ].id;
        }
      } catch ( error )
      {
        console.error( '加载分类失败:', error );
        uni.showToast( {
          title: '加载分类失败',
          icon: 'none'
        } );
      }
    },

    checkRepeatEnabled (): void
    {
      this.isRepeatEnabled = this.formData.repeat_cycle > 0 && this.formData.repeat_frequency !== '不重复';
    },

    setRepeatOption (): void
    {
      if ( this.formData.repeat_cycle === 0 || this.formData.repeat_frequency === '不重复' )
      {
        this.repeatOption = '不重复';
      } else
      {
        this.repeatOption = getRepeatText( this.formData.repeat_cycle, this.formData.repeat_frequency );
      }
    },

    onDateChange ( e: any ): void
    {
      this.formData.date = e.detail.value;
    },

    selectCategory ( category_id: number ): void
    {
      this.formData.category_id = category_id;
    },

    onPinnedChange ( e: any ): void
    {
      this.formData.is_pinned = e.detail.value;
    },

    toggleRepeat ( e: any ): void
    {
      this.isRepeatEnabled = e.detail.value;
      if ( this.isRepeatEnabled )
      {
        // 开启重复，设置默认值
        this.repeatOption = '每天';
        this.formData.repeat_cycle = 1;
        this.formData.repeat_frequency = '天重复';
      } else
      {
        // 关闭重复，重置为不重复
        this.repeatOption = '不重复';
        this.formData.repeat_cycle = 0;
        this.formData.repeat_frequency = '不重复';
      }
    },

    showRepeatOptions (): void
    {
      uni.showActionSheet( {
        itemList: this.repeatOptions,
        success: ( res ) =>
        {
          this.repeatOption = this.repeatOptions[ res.tapIndex ];
          this.parseRepeatOption( this.repeatOption );
        }
      } );
    },

    parseRepeatOption ( option: string ): void
    {
      if ( option === '不重复' )
      {
        this.formData.repeat_cycle = 0;
        this.formData.repeat_frequency = '不重复';
      } else if ( option === '每天' )
      {
        this.formData.repeat_cycle = 1;
        this.formData.repeat_frequency = '天重复';
      } else if ( option === '每周' )
      {
        this.formData.repeat_cycle = 1;
        this.formData.repeat_frequency = '周重复';
      } else if ( option === '每月' )
      {
        this.formData.repeat_cycle = 1;
        this.formData.repeat_frequency = '月重复';
      } else if ( option === '每年' )
      {
        this.formData.repeat_cycle = 1;
        this.formData.repeat_frequency = '年重复';
      } else if ( option.includes( '每' ) )
      {
        const match = option.match( /每(\d+)(天|周|月|年)/ );
        if ( match )
        {
          this.formData.repeat_cycle = parseInt( match[ 1 ] );
          const frequencyMap = {
            '天': '天重复',
            '周': '周重复',
            '月': '月重复',
            '年': '年重复'
          } as const;
          this.formData.repeat_frequency = frequencyMap[ match[ 2 ] as keyof typeof frequencyMap ];
        }
      }
    },

    getRepeatText (): string
    {
      if ( this.repeatOption === '不重复' )
      {
        return '不重复';
      }
      return this.repeatOption;
    },

    formatDateDisplay ( dateStr: string ): string
    {
      return formatDate( dateStr );
    },

    goBack ( deltas: number = 1 ): void
    {
      uni.navigateBack( {
        delta: deltas
      } );
    },

    async handleArchive (): Promise<void>
    {
      if ( !this.countdownId ) return;

      uni.showModal( {
        title: '确认归档',
        content: `确定要归档「${ this.formData.title }」吗？归档后可在"我的"模块中查看。`,
        confirmText: '归档',
        success: async ( res ) =>
        {
          if ( res.confirm )
          {
            try
            {
              await apiService.archiveCountdown( this.countdownId! );
              uni.showToast( {
                title: '归档成功',
                icon: 'success'
              } );
              setTimeout( () =>
              {
                this.goBack();
              }, 1000 );
            } catch ( error )
            {
              console.error( '归档失败:', error );
              uni.showToast( {
                title: '归档失败',
                icon: 'none'
              } );
            }
          }
        }
      } );
    },

    async handleDelete (): Promise<void>
    {
      if ( !this.countdownId ) return;

      uni.showModal( {
        title: '确认删除',
        content: '确定要删除这个倒数日吗？',
        success: async ( res ) =>
        {
          if ( res.confirm )
          {
            try
            {
              await apiService.deleteCountdown( this.countdownId! );
              uni.showToast( {
                title: '删除成功',
                icon: 'success'
              } );
              this.goBack( 2 );
            } catch ( error )
            {
              console.error( '删除失败:', error );
              uni.showToast( {
                title: '删除失败',
                icon: 'none'
              } );
            }
          }
        }
      } );
    },

    async handleSubmit (): Promise<void>
    {
      if ( !this.formData.title.trim() )
      {
        uni.showToast( {
          title: '请输入日程名称',
          icon: 'none'
        } );
        return;
      }

      if ( !this.formData.date )
      {
        uni.showToast( {
          title: '请选择日期',
          icon: 'none'
        } );
        return;
      }

      if ( !this.formData.category_id )
      {
        uni.showToast( {
          title: '请选择分类',
          icon: 'none'
        } );
        return;
      }

      try
      {
        if ( this.isEdit && this.countdownId )
        {
          await apiService.updateCountdown( this.countdownId, {
            title: this.formData.title,
            date: this.formData.date,
            category_id: this.formData.category_id,
            is_pinned: this.formData.is_pinned,
            repeat_cycle: this.formData.repeat_cycle,
            repeat_frequency: this.formData.repeat_frequency
          } );
          uni.showToast( {
            title: '修改成功',
            icon: 'success'
          } );
        } else
        {
          await apiService.createCountdown( {
            user_id: uni.getStorageSync( 'userid' ),
            is_archived: false,
            is_pinned: this.formData.is_pinned,
            title: this.formData.title,
            date: this.formData.date,
            category_id: this.formData.category_id,
            repeat_cycle: this.formData.repeat_cycle,
            repeat_frequency: this.formData.repeat_frequency
          } );
          uni.showToast( {
            title: '添加成功',
            icon: 'success'
          } );
        }

        setTimeout( () =>
        {
          this.goBack();
        }, 1000 );
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