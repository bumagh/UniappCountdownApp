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
      <view class="title-date-wrap" v-if="countdown.is_pinned">
        <view class="countdown-title pinned-title">
          <text>{{ displayTitle.text }}{{ titleSuffix }}</text>
        </view>
        <text class="pinned-date">{{ countdown.displayDate }}</text>
      </view>
      <view v-else class="countdown-title">
        <text>{{ displayTitle.text }}{{ titleSuffix }}</text>
      </view>
    </view>

    <view class="countdown-right" :class="[ mainClass, { 'pinned-right': countdown.is_pinned } ]">
      <text class="countdown-number" :class="[ daysClass, { 'pinned-number': countdown.is_pinned } ]">{{ displayDays }}</text>
      <text class="countdown-unit" :class="[ daysClass, { 'pinned-unit': countdown.is_pinned } ]">天</text>
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
          <text class="grid-date">{{ countdown.displayDate }}</text>
          <view class="grid-days" :class="[ daysClass ]">
            <text class="grid-days-suffix">{{ titleSuffix }}</text>
            <text v-if="displayDays !== 0" class="grid-days-number">{{ displayDays }}</text>
            <text v-if="displayDays !== 0" class="grid-days-unit">天</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { Category, Countdown } from 'types';
import { calculateDays, getAbsoluteDays } from '@/utils/countdownUtils';

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
    const absDays = computed( () => getAbsoluteDays( props.countdown.displayDate ) );

    // 计算显示标题
    const displayTitle = computed( () => {
      return { text: props.countdown.title };
    } );

    // 计算显示天数
    const displayDays = computed( () => {
      return absDays.value;
    } );

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

    const unitClass = computed( () => ( {
      'unit-future': days.value > 0,
      'unit-today': days.value === 0,
      'unit-past': days.value < 0
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

    const titleSuffix = computed( () => {
      if ( days.value > 0 ) return '还有';
      if ( days.value < 0 ) return '已经';
      return '就在今天';
    } );

    const handleClick = () =>
    {
      emit( 'click', props.countdown );
    };

    return {
      absDays,
      displayDays,
      displayTitle,
      categoryColor,
      categoryName,
      cardClass,
      mainClass,
      daysClass,
      unitClass,
      handleClick,
      titleSuffix,
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
  align-items: center; /* 分类/标题垂直居中 */
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
  padding-bottom: 13rpx;
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

.compact-card .countdown-title {
  font-size: 26rpx;
}

.countdown-right {
  display: flex;
  flex-direction: row;
  align-items: stretch; /* 子元素撑满高度 */
  justify-content: center;
  gap: 6rpx;
  flex: 0 0 auto;

  /* 固定可容纳 5 位数（含一些余量）的宽度，防止列表跳动 */
  width: 230rpx;
  min-width: 230rpx;

  padding: 0 14rpx; /* 让高度完全由卡片决定 */
  border-radius: 14rpx;
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

.countdown-number {
  font-size: 64rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 1;

  /* 让数字块与右侧容器同高，并居中 */
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: auto;
  padding: 0;
}

.pinned-right {
  width: 270rpx !important;
  min-width: 270rpx !important;
}

.pinned-number {
  font-size: 64rpx !important;
  font-weight: 900;
}

.compact-card .countdown-number {
  font-size: 58rpx;
}

/* “天”字：与数字同高，胶囊背景使用与 days 同色系的更深色（通过叠加黑色遮罩加深） */
.countdown-unit {
  font-size: 20rpx;
  color: rgba( 255, 255, 255, 1 );
  line-height: 1;

  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0 12rpx;
  border-radius: 0;

  /* days-future/today/past 提供“底色”，这里再叠一层更深效果 */
  position: relative;
  overflow: hidden;
}

.countdown-unit {
  /* 确保文字在遮罩之上 */
  z-index: 0;
}

/* .countdown-unit > * {
  z-index: 1;
} */

.countdown-unit > div,
.countdown-unit > span,
.countdown-unit > p,
.countdown-unit > section {
  z-index: 1;
}/* 直接给 text 用时，没有子节点，用伪元素遮罩即可；这里显式抬升文字层级 */
.countdown-unit {
  color: rgba( 255, 255, 255, 0.92 );
}

/* 根据状态微调加深程度（仍保持同色系：底色=days，叠加=黑色透明度） */
.countdown-unit.days-future::after {
  background-color: rgba( 0, 0, 0, 0.16 );
}

.countdown-unit.days-today::after {
  background-color: rgba( 0, 0, 0, 0.20 );
}

.countdown-unit.days-past::after {
  background-color: rgba( 0, 0, 0, 0.14 );
}

.compact-card .countdown-right {
  width: 220rpx;
  min-width: 220rpx;
}

.care-mode .category-name {
  font-size: 30rpx;
}

.care-mode .countdown-title {
  font-size: 38rpx;
}

.care-mode .countdown-number {
  font-size: 86rpx;
}

.care-mode .countdown-unit {
  font-size: 36rpx;
}

/* 剩余天数高亮样式 */
.remaining-days-highlight {
  color: #ff6b6b !important;
  font-weight: bold !important;
  font-size: 110% !important;
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

.grid-age {
  font-size: 44rpx;
  font-weight: bold;
  color: #333333;
  line-height: 1.2;
}

.care-mode .grid-age {
  font-size: 54rpx;
}

.grid-remaining {
  font-size: 38rpx;
  color: #ff6b6b;
  font-weight: 600;
}

.care-mode .grid-remaining {
  font-size: 48rpx;
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
  min-width: 90rpx;
  justify-content: center;
  align-self: flex-end;
}

.grid-days-number {
  font-size: 42rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 1;
}

.care-mode .grid-days-number {
  font-size: 56rpx;
}

.grid-days-suffix {
  font-size: 26rpx;
  color: #ffffff;
  line-height: 1;
  margin-right: 4rpx;
}

.care-mode .grid-days-suffix {
  font-size: 34rpx;
}

.grid-days-unit {
  font-size: 26rpx;
  color: #ffffff;
  line-height: 1;
}

.care-mode .grid-days-unit {
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
