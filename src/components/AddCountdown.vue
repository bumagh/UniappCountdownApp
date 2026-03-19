<template>
  <view v-if=" visible " class="modal-mask" @click=" handleClose ">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">{{ countdownData ? '编辑奇妙日' : '添加奇妙日' }}</text>
        <view class="modal-close" @click=" handleClose ">
          <text class="close-icon">✕</text>
        </view>
      </view>

      <scroll-view scroll-y class="modal-body">
        <view class="form-item">
          <text class="form-label">日程名称</text>
          <input class="form-input" v-model=" formData.title " placeholder="请输入日程名称" maxlength="20" />
        </view>

        <view class="form-item">
          <text class="form-label">选择日期</text>
          <picker mode="date" :value=" formData.date " @change=" onDateChange " :start=" minDate " :end=" maxDate ">
            <view class="picker-input">
              <text v-if=" formData.date " class="picker-text">{{ formatDateDisplay( formData.date ) }}</text>
              <text v-else class="picker-placeholder">请选择日期</text>
              <text class="picker-icon">📅</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">选择时间</text>
          <picker mode="time" :value=" formData.time " @change=" onTimeChange ">
            <view class="picker-input">
              <text v-if=" formData.time " class="picker-text">{{ formData.time }}</text>
              <text v-else class="picker-placeholder">请选择时间</text>
              <text class="picker-icon">⏰</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">选择分类</text>
          <view class="category-list">
            <view v-for=" category in categories " :key=" category.id " class="category-item"
              :class=" { 'category-active': formData.categoryId === category.id } "
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
            <switch :checked=" formData.isPinned " @change=" onPinnedChange " color="#1890ff" />
          </view>
        </view>

        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">重复设置</text>
            <switch :checked=" isRepeatEnabled " @change=" toggleRepeat " color="#1890ff" />
          </view>
        </view>

        <!-- 重复设置选择器（直接显示） -->
        <view v-if=" isRepeatEnabled " class="repeat-selector-section">
          <view class="repeat-selector">
            <view class="repeat-picker-wrapper">
              <text class="repeat-label">周期</text>
              <picker-view :value=" [ cycleIndex ] " @change=" onCycleChange " class="repeat-picker-view">
                <picker-view-column>
                  <view v-for=" ( item, index ) in cycleOptions " :key=" index " class="picker-view-item">
                    <text>{{ item }}</text>
                  </view>
                </picker-view-column>
              </picker-view>
            </view>

            <view class="repeat-picker-wrapper">
              <text class="repeat-label">频次</text>
              <picker-view :value=" [ frequencyIndex ] " @change=" onFrequencyChange " class="repeat-picker-view">
                <picker-view-column>
                  <view v-for=" ( item, index ) in frequencyOptions " :key=" index " class="picker-view-item">
                    <text>{{ item }}</text>
                  </view>
                </picker-view-column>
              </picker-view>
            </view>
          </view>
          <view class="repeat-hint">
            <text>当前设置：{{ getRepeatText() }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="modal-footer">
        <view v-if=" countdownData " class="btn btn-danger" @click=" handleDelete ">
          <text>删除/归档</text>
        </view>
        <view class="btn btn-ghost" @click=" handleClose ">
          <text>取消</text>
        </view>
        <view class="btn btn-primary" @click=" handleSubmit ">
          <text>确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
export interface AddCountdownProps
{
  visible: boolean;
  countdownData?: {
    type: Object,
    default: null
  } | null;
  defaultCategoryId?: number | null;  // 新增：默认分类ID
}
interface AddCountdownPageData
{
  formData: {
    title: string;
    date: string;
    time: string;
    categoryId: number | null;
    isPinned: boolean;
    repeatCycle: number;
    repeatFrequency: any;
    is_archived: boolean;

  };
  categories: Array<{
    id: number;
    name: string;
    icon: string;
    color: string;
  }>;
  cycleOptions: string[];
  frequencyOptions: string[];
  cycleIndex: number;
  frequencyIndex: number;
  isRepeatEnabled: boolean;
}
import apiService from '@/services/apiService';
import { defineComponent, PropType } from 'vue';

export default defineComponent( {
  name: 'AddCountdown',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    countdownData: {
      type: Object,
      default: null
    },  // 新增：默认分类ID属性
    defaultCategoryId: {
      type: Number as PropType<number | null>,
      default: null
    }
  },
  data (): AddCountdownPageData
  {
    return {
      formData: {
        title: '',
        date: this.getCurrentDate(),
        time: this.getCurrentTime(),
        categoryId: this.defaultCategoryId || null,
        isPinned: false,
        repeatCycle: 0,
        repeatFrequency: '不重复',
        is_archived: false
      },
      categories: [],
      cycleOptions: [ '每1', '每2', '每3', '每4', '每5', '每6', '每7', '每8', '每9', '每10' ],
      frequencyOptions: [ '天重复', '周重复', '月重复', '年重复' ],
      cycleIndex: 0,
      frequencyIndex: 0,
      isRepeatEnabled: false
    };
  },
  computed: {
    minDate ()
    {
      const date = new Date();
      date.setFullYear( date.getFullYear() - 10 );
      return date.toISOString().split( 'T' )[ 0 ];
    },
    maxDate ()
    {
      const date = new Date();
      date.setFullYear( date.getFullYear() + 10 );
      return date.toISOString().split( 'T' )[ 0 ];
    }
  },
  watch: {
    visible ( val )
    {
      if ( val )
      {
        this.loadCategories();
        if ( this.countdownData )
        {
          this.formData = {
            title: this.countdownData.title,
            date: this.countdownData.date,
            time: this.countdownData.time || '',
            categoryId: this.countdownData.categoryId,
            isPinned: this.countdownData.isPinned || false,
            repeatCycle: this.countdownData.repeatCycle || 0,
            repeatFrequency: this.countdownData.repeatFrequency || '不重复',
            is_archived: this.countdownData.is_archived || false
          };
          this.checkRepeatEnabled();
          this.syncRepeatIndexes();
        } else
        {
          this.resetForm();
        }
      }
    },
    // 监听 defaultCategoryId 变化，更新表单
    defaultCategoryId ( newVal )
    {
      if ( newVal && !this.formData.categoryId && !this.countdownData )
      {
        // 只有在添加模式且当前没有选中分类时才设置默认分类
        this.formData.categoryId = newVal;
      }
    }
  },
  methods: {
    getCurrentDate ()
    {
      const date = new Date();
      const year = date.getFullYear();
      const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
      const day = String( date.getDate() ).padStart( 2, '0' );
      return `${ year }-${ month }-${ day }`;
    },
    getCurrentTime ()
    {
      const date = new Date();
      const hours = String( date.getHours() ).padStart( 2, '0' );
      const minutes = String( date.getMinutes() ).padStart( 2, '0' );
      return `${ hours }:${ minutes }`;
    },
    async loadCategories ()
    {
      const userid = uni.getStorageSync( 'userid' );
      const user = await apiService.getCurrentUser( userid );
      if ( user )
      {
        this.categories = await apiService.getCategories( user.id.toString() );
        if ( this.categories.length > 0 && !this.formData.categoryId )
        {
          this.formData.categoryId = this.categories[ 0 ].id;
        }
      }
    },
    checkRepeatEnabled ()
    {
      this.isRepeatEnabled = this.formData.repeatCycle > 0 && this.formData.repeatFrequency !== '不重复';
    },
    onDateChange ( e: any )
    {
      this.formData.date = e.detail.value;
    },
    onTimeChange ( e: any )
    {
      this.formData.time = e.detail.value;
    },
    selectCategory ( categoryId: number )
    {
      this.formData.categoryId = categoryId;
    },
    onPinnedChange ( e: any )
    {
      this.formData.isPinned = e.detail.value;
    },
    toggleRepeat ( e: any )
    {
      this.isRepeatEnabled = e.detail.value;
      if ( this.isRepeatEnabled )
      {
        // 开启重复，设置默认值
        this.cycleIndex = 0; // 每1
        this.frequencyIndex = 0; // 天重复
        this.formData.repeatCycle = 1;
        this.formData.repeatFrequency = '天重复';
      } else
      {
        // 关闭重复，重置为不重复
        this.cycleIndex = 0;
        this.frequencyIndex = 0;
        this.formData.repeatCycle = 0;
        this.formData.repeatFrequency = '不重复';
      }
    },
    onCycleChange ( e: any )
    {
      this.cycleIndex = e.detail.value[ 0 ];
      this.formData.repeatCycle = parseInt( this.cycleOptions[ this.cycleIndex ].replace( '每', '' ) );
    },
    onFrequencyChange ( e: any )
    {
      this.frequencyIndex = e.detail.value[ 0 ];
      this.formData.repeatFrequency = this.frequencyOptions[ this.frequencyIndex ];
    },
    syncRepeatIndexes ()
    {
      if ( this.formData.repeatCycle === 0 || this.formData.repeatFrequency === '不重复' )
      {
        this.cycleIndex = 0;
        this.frequencyIndex = 0;
      } else
      {
        this.cycleIndex = this.cycleOptions.findIndex( opt => opt === `每${ this.formData.repeatCycle }` );
        this.frequencyIndex = this.frequencyOptions.findIndex( opt => opt === this.formData.repeatFrequency );
        if ( this.cycleIndex === -1 ) this.cycleIndex = 0;
        if ( this.frequencyIndex === -1 ) this.frequencyIndex = 0;
      }
    },
    getRepeatText ()
    {
      const cycle = this.cycleOptions[ this.cycleIndex ];
      const frequency = this.frequencyOptions[ this.frequencyIndex ];
      return `${ cycle }${ frequency }`;
    },
    formatDateDisplay ( dateStr: string )
    {
      if ( !dateStr ) return '';
      const date = new Date( dateStr );
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDays = [ '日', '一', '二', '三', '四', '五', '六' ];
      const weekDay = weekDays[ date.getDay() ];
      return `${ year }年${ month }月${ day }日 星期${ weekDay }`;
    },
    handleClose ()
    {
      this.$emit( 'close' );
      this.resetForm();
    },
    handleDelete ()
    {
      uni.showActionSheet( {
        itemList: [ '删除', '归档' ],
        success: ( res ) =>
        {
          if ( res.tapIndex === 0 )
          {
            uni.showModal( {
              title: '确认删除',
              content: '确定要删除这个奇妙日吗？',
              success: async ( modalRes ) =>
              {
                if ( modalRes.confirm )
                {
                  try
                  {
                    await apiService.deleteCountdown( this.countdownData.id );
                    uni.showToast( {
                      title: '删除成功',
                      icon: 'success'
                    } );
                    this.$emit( 'success' );
                    this.handleClose();
                  } catch ( e )
                  {
                    uni.showToast( {
                      title: '删除失败',
                      icon: 'none'
                    } );
                  }
                }
              }
            } );
          } else if ( res.tapIndex === 1 )
          {
            uni.showModal( {
              title: '确认归档',
              content: '确定要归档这个奇妙日吗？归档后可在"我的"模块中查看。',
              confirmText: '归档',
              success: async ( modalRes ) =>
              {
                if ( modalRes.confirm )
                {
                  try
                  {
                    await apiService.archiveCountdown( this.countdownData.id );
                    uni.showToast( {
                      title: '归档成功',
                      icon: 'success'
                    } );
                    this.$emit( 'success' );
                    this.handleClose();
                  } catch ( e )
                  {
                    uni.showToast( {
                      title: '归档失败',
                      icon: 'none'
                    } );
                  }
                }
              }
            } );
          }
        }
      } );
    },
    async handleSubmit ()
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

      if ( !this.formData.time )
      {
        uni.showToast( {
          title: '请选择时间',
          icon: 'none'
        } );
        return;
      }

      if ( !this.formData.categoryId )
      {
        uni.showToast( {
          title: '请选择分类',
          icon: 'none'
        } );
        return;
      }

      const user = await apiService.getCurrentUser( uni.getStorageSync( 'userid' ) );
      if ( !user )
      {
        uni.showToast( {
          title: '用户信息获取失败',
          icon: 'none'
        } );
        return;
      }

      try
      {
        if ( this.countdownData )
        {
          await apiService.updateCountdown( this.countdownData.id, {
            title: this.formData.title,
            date: this.formData.date,
            time: this.formData.time,
            category_id: this.formData.categoryId,
            is_pinned: this.formData.isPinned,
            repeat_cycle: this.formData.repeatCycle,
            repeat_frequency: this.formData.repeatFrequency
          } );
          uni.showToast( {
            title: '修改成功',
            icon: 'success'
          } );
        } else
        {
          await apiService.createCountdown( {
            user_id: user.id,
            title: this.formData.title,
            date: this.formData.date,
            time: this.formData.time,
            category_id: this.formData.categoryId,
            is_pinned: this.formData.isPinned,
            repeat_cycle: this.formData.repeatCycle,
            repeat_frequency: this.formData.repeatFrequency,
            is_archived: this.formData.is_archived,
          } );
          uni.showToast( {
            title: '添加成功',
            icon: 'success'
          } );
        }
        this.$emit( 'success' );
        this.handleClose();
      } catch ( e )
      {
        uni.showToast( {
          title: '操作失败',
          icon: 'none'
        } );
      }
    },
    resetForm ()
    {
      this.formData = {
        title: '',
        date: this.getCurrentDate(),
        time: this.getCurrentTime(),
        categoryId: this.defaultCategoryId || null,
        isPinned: false,
        repeatCycle: 0,
        repeatFrequency: '不重复',
        is_archived: false
      };
      this.cycleIndex = 0;
      this.frequencyIndex = 0;
      this.isRepeatEnabled = false;
    }
  }
} );
</script>

<style scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  width: 640rpx;
  max-height: 90vh;
  background-color: #ffffff;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  padding-top: calc(30rpx + env(safe-area-inset-top));
  padding-top: calc(30rpx + constant(safe-area-inset-top));
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  flex-shrink: 0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.modal-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 40rpx;
  color: #ffffff;
}

.modal-body {
  flex: 1;
  padding: 30rpx;
  padding-top: 24rpx;
  overflow-y: auto;
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
  background-color: #f5f9ff;
  border: 2rpx solid #e8f4ff;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.picker-input {
  width: 100%;
  height: 80rpx;
  background-color: #f5f9ff;
  border: 2rpx solid #e8f4ff;
  border-radius: 12rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  transition: all 0.3s;
}

.picker-input:active {
  background-color: #e8f4ff;
  border-color: #1890ff;
}

.picker-icon {
  font-size: 32rpx;
  color: #1890ff;
  margin-left: 10rpx;
}

.picker-text {
  font-size: 28rpx;
  color: #333333;
}

.picker-placeholder {
  font-size: 28rpx;
  color: #aaaaaa;
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
  background-color: #f5f9ff;
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

/* 重复设置选择器样式 */
.repeat-selector-section {
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #f5f9ff;
  border-radius: 12rpx;
  border: 2rpx solid #e8f4ff;
}

.repeat-selector {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.repeat-picker-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.repeat-label {
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 10rpx;
  text-align: center;
}

.repeat-picker-view {
  height: 200rpx;
  background-color: #ffffff;
  border: 2rpx solid #e8f4ff;
  border-radius: 12rpx;
}

.picker-view-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  font-size: 28rpx;
  color: #333333;
}

.repeat-hint {
  padding: 16rpx;
  background-color: #e8f4ff;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #1890ff;
  text-align: center;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 30rpx;
  border-top: 2rpx solid #e8f4ff;
  gap: 20rpx;
  flex-shrink: 0;
}

.btn {
  height: 80rpx;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.btn-ghost {
  background-color: transparent;
  border: 2rpx solid #1890ff;
  color: #1890ff;
}

.btn-primary {
  background-color: #1890ff;
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

/* 确保picker组件在最上层 */
picker,
picker-view {
  position: relative;
  z-index: 10000 !important;
}
</style>