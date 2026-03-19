<template>
  <!-- 默认布局 -->
  <view v-if="!isGridLayout" class="countdown-card shadow" :class="cardClass" @click=" handleClick ">
    <view v-if=" countdown.is_pinned " class="pin-badge">
      <!-- <text>📌</text> -->
    </view>

    <view class="countdown-left" :class="{ 'pinned-left': countdown.is_pinned }">
      <view class="category-pill" :style=" { borderColor: categoryColor } ">
        <view class="category-dot" :style=" { backgroundColor: categoryColor } "></view>
        <text class="category-name">{{ categoryName }}</text>
      </view>
      <view class="title-date-wrap" :class="{ 'title-date-wrap-default': !countdown.is_pinned }">
        <view class="countdown-title" :class="{ 'pinned-title': countdown.is_pinned }">
          <text>{{ displayTitle.text }}</text>
        </view>
        <text class="countdown-date-text" :class="{ 'pinned-date': countdown.is_pinned }">{{ displayDateText }}</text>
      </view>
    </view>

    <view class="countdown-right" :class="{ 'pinned-right': countdown.is_pinned }">
      <view class="countdown-status-pill" :class="[ daysClass, mainClass ]">
        <text class="countdown-status-text" :class="{ 'pinned-number': countdown.is_pinned }">{{ statusText }}</text>
      </view>
    </view>
  </view>

  <!-- 格子布局 -->
  <view v-else class="countdown-card grid-card shadow" :class="cardClass" @click=" handleClick ">
    <view v-if=" countdown.is_pinned " class="grid-pin-badge">
      <!-- <text>📌</text> -->
    </view>

    <view class="grid-content">
      <view class="grid-header">
        <view class="grid-category" :style=" { borderColor: categoryColor } ">
          <view class="grid-category-dot" :style=" { backgroundColor: categoryColor } "></view>
          <text class="grid-category-name">{{ categoryName }}</text>
        </view>
      </view>

      <view class="grid-body">
        <view class="grid-title">
          <text class="grid-text">{{ gridTitle }}</text>
        </view>

        <view class="grid-footer">
          <text class="grid-date">{{ displayDateText }}</text>
          <view class="grid-days" :class="[ daysClass ]">
            <text class="grid-days-suffix">{{ statusText }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { Category, Countdown } from 'types';
import { calculateDays, formatDate, getCountdownStatusText } from '@/utils/countdownUtils';

interface CountdownWithDisplayDate extends Countdown
{
  displayDate: string;
}

export default defineComponent( {
  name: 'CountdownCard',
  props: {
    countdown: { type: Object as PropType<CountdownWithDisplayDate>, required: true },
    categories: { type: Array as PropType<Category[]>, default: () => [] },
    compact: { type: Boolean as PropType<boolean>, default: true },
    layout: { type: String as PropType<'default' | 'grid'>, default: 'default' },
    careMode: { type: Boolean as PropType<boolean>, default: false }
  },
  emits: [ 'click' ],
  setup ( props, { emit } )
  {
    const days = computed( () => calculateDays( props.countdown.displayDate ) );

    // 计算显示标题
    const displayTitle = computed( () => {
      return { text: props.countdown.title };
    } );

    const displayDateText = computed( () => formatDate( props.countdown.displayDate, props.countdown.time ) );

    const statusText = computed( () => getCountdownStatusText( props.countdown.displayDate, props.countdown.time ) );

    const category = computed( () => props.categories.find( c => c.id === props.countdown.category_id ) );
    const categoryColor = computed( () => category.value ? category.value.color : '#1890ff' );
    const categoryName = computed( () => category.value ? category.value.name : '未分类' );

    const isPast = computed( () => days.value < 0 );

    const mainClass = computed( () => ( {
      'past-main': isPast.value
    } ) );

    const daysClass = computed( () => ( {
      'days-future': days.value > 0,
      'days-today': days.value === 0,
      'days-past': days.value < 0
    } ) );

    // 布局相关的计算属性
    const isGridLayout = computed( () => props.layout === 'grid' );

    const cardClass = computed( () => ( {
      'pinned-card': !!props.countdown.is_pinned,
      'past-card': isPast.value,
      'compact-card': !!props.compact,
      'grid-card': isGridLayout.value,
      'care-mode': !!props.careMode
    } ) );

    const gridTitle = computed( () => {
      const text = props.countdown.title;
      return text.length > 7 ? text.slice( 0, 7 ) + '.' : text;
    } );

    const handleClick = () =>
    {
      emit( 'click', props.countdown );
    };

    return {
      displayTitle,
      displayDateText,
      statusText,
      categoryColor,
      categoryName,
      cardClass,
      mainClass,
      daysClass,
      handleClick,
      isGridLayout,
      gridTitle
    };
  }
} );
</script>

<style scoped>
.countdown-card {
  background-color: #ffffff;
  padding: 2rpx 2rpx;
  margin-bottom: 2rpx;
  display: flex;
  align-items: center; /* 整体垂直居中 */
  justify-content: space-between;
  gap: 14rpx;
  position: relative;
  transition: all 0.3s ease;
}

/* 紧凑模式：整体压缩显示 */
.compact-card {
  padding: 4rpx 4rpx;
  gap: 2rpx;
}

.pinned-card {
  border: 3rpx solid #1890ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%);
  box-shadow: 0 8rpx 32rpx rgba(24, 144, 255, 0.18);
  min-height: 160rpx;
  padding: 16rpx 16rpx;
}

.pin-badge {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  font-size: 32rpx;
  background-color: rgba(255, 149, 0, 0.1);
  padding: 8rpx;
  border-radius: 8rpx;
}

.past-card {
  opacity: 0.82;
  background-color: #f5f5f5 !important;
}

.past-card.pinned-card {
  border-color: #999999;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%) !important;
  border-left: 6rpx solid #999999;
}

.countdown-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 12rpx;
}

/* 分类放最前，尽量短 */
.category-pill {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
  border: 2rpx solid #e8e8e8;
  background-color: rgba(255, 255, 255, 0.65);
  max-width: 180rpx;
}

.category-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  flex: 0 0 auto;
}

.category-name {
  font-size: 20rpx;
  color: #666666;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-card .category-name {
  font-size: 18rpx;
}
.countdown-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  line-height: 1.2;
  align-items: flex-start;
}

.pinned-left {
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.title-date-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 0;
  min-width: 0;
  flex: 1;
  gap: 6rpx;
}

.title-date-wrap-default {
  padding-top: 4rpx;
}

.pinned-title {
  font-size: 32rpx !important;
  font-weight: 700;
  color: #1d39c4;
  margin-bottom: 2rpx;
  padding-bottom: 0;
}

.pinned-date {
  font-size: 22rpx;
  color: #888;
  margin: 0;
  padding: 0;
}

.countdown-date-text {
  font-size: 20rpx;
  color: #8c8c8c;
  line-height: 1.3;
}

.compact-card .countdown-title {
  font-size: 26rpx;
}

.countdown-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  flex: 0 0 auto;
  max-width: 260rpx;
}

.days-future {
  background-color: #1890ff;
}

.days-today {
  background-color: #f5222d;
}

.days-past {
  background-color: #fa8c16;
}

.countdown-status-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 72rpx;
  padding: 12rpx 18rpx;
  border-radius: 18rpx;
  max-width: 100%;
  box-sizing: border-box;
}

.pinned-right {
  width: 270rpx !important;
  min-width: 270rpx !important;
}

.countdown-status-text {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.35;
  text-align: center;
  word-break: break-all;
}

.pinned-number {
  font-size: 26rpx !important;
  font-weight: 900;
}

.compact-card .countdown-right {
  max-width: 220rpx;
}

.care-mode .category-name {
  font-size: 30rpx;
}

.care-mode .countdown-title {
  font-size: 38rpx;
}

.care-mode .countdown-status-text {
  font-size: 32rpx;
}

/* 格子布局样式 */
.grid-card {
  padding: 20rpx;
  margin-bottom: 16rpx;
  border-radius: 16rpx;
  min-height: 200rpx;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.care-mode.grid-card {
  padding: 24rpx;
  min-height: 240rpx;
}

.grid-pin-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  font-size: 28rpx;
  background-color: rgba(255, 149, 0, 0.1);
  padding: 6rpx;
  border-radius: 6rpx;
}

.grid-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.grid-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.grid-category {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  border: 1rpx solid #e8e8e8;
  background-color: rgba(255, 255, 255, 0.8);
}

.grid-category-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
}

.grid-category-name {
  font-size: 26rpx;
  color: #666666;
  line-height: 1;
}

.care-mode .grid-category-name {
  font-size: 34rpx;
}

.grid-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8rpx;
}

.grid-title {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.grid-text {
  font-size: 44rpx;
  font-weight: bold;
  color: #333333;
  line-height: 1.2;
}

.care-mode .grid-text {
  font-size: 54rpx;
}

.grid-footer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8rpx;
  margin-top: auto;
}

.grid-date {
  font-size: 30rpx;
  color: #888888;
}

.care-mode .grid-date {
  font-size: 38rpx;
}

.grid-days {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 10rpx 20rpx;
  border-radius: 14rpx;
  max-width: 100%;
  justify-content: center;
  align-self: flex-start;
}

.grid-days-suffix {
  font-size: 26rpx;
  color: #ffffff;
  line-height: 1.35;
  text-align: center;
  word-break: break-all;
}

.care-mode .grid-days-suffix {
  font-size: 34rpx;
}

/* 格子布局的置顶样式 */
.grid-card.pinned-card {
  border: 2rpx solid #1890ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%);
  box-shadow: 0 6rpx 24rpx rgba(24, 144, 255, 0.15);
}

/* 格子布局的过期样式 */
.grid-card.past-card {
  opacity: 0.85;
  background-color: #f8f8f8 !important;
}

.grid-card.past-card.pinned-card {
  border-color: #999999;
  background: linear-gradient(135deg, #f8f8f8 0%, #eeeeee 100%) !important;
}
</style>
