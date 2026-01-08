<template>
  <view class="countdown-card shadow" :class="cardClass" @click=" handleClick ">
    <view v-if=" countdown.is_pinned " class="pin-badge">
      <text>📌</text>
    </view>

    <view class="countdown-main" :class="mainClass">
      <text class="countdown-number">{{ absDays }}</text>
      <text class="countdown-unit">天</text>
    </view>

    <view class="countdown-info">
      <text class="countdown-title">{{ countdown.title }}</text>
      <text class="countdown-date">{{ formatDate( countdown.displayDate ) }}</text>
      <view class="countdown-category">
        <view class="category-dot" :style=" { backgroundColor: categoryColor } "></view>
        <text class="category-name">{{ categoryName }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { Category, Countdown } from 'types';
import { calculateDays, getAbsoluteDays, formatDate } from '@/utils/countdownUtils';

interface CountdownWithDisplayDate extends Countdown
{
  displayDate: string;
}

export default defineComponent( {
  name: 'CountdownCard',
  props: {
    countdown: { type: Object as PropType<CountdownWithDisplayDate>, required: true },
    categories: { type: Array as PropType<Category[]>, default: () => [] },
    compact: { type: Boolean as PropType<boolean>, default: true }
  },
  emits: [ 'click' ],
  setup ( props, { emit } )
  {
    const days = computed( () => calculateDays( props.countdown.displayDate ) );
    const absDays = computed( () => getAbsoluteDays( props.countdown.displayDate ) );

    const category = computed( () => props.categories.find( c => c.id === props.countdown.category_id ) );
    const categoryColor = computed( () => category.value ? category.value.color : '#1890ff' );
    const categoryName = computed( () => category.value ? category.value.name : '未分类' );

    const isPast = computed( () => days.value < 0 );

    const cardClass = computed( () => ( {
      'pinned-card': !!props.countdown.is_pinned,
      'past-card': isPast.value,
      'compact-card': !!props.compact
    } ) );

    const mainClass = computed( () => ( {
      'past-main': isPast.value
    } ) );

    const handleClick = () =>
    {
      emit( 'click', props.countdown );
    };

    return {
      formatDate,
      absDays,
      categoryColor,
      categoryName,
      cardClass,
      mainClass,
      handleClick
    };
  }
} );
</script>

<style scoped>
.countdown-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  position: relative;
  transition: all 0.3s ease;
}

/* 紧凑模式：整体压缩显示 */
.compact-card {
  padding: 24rpx 20rpx;
  gap: 18rpx;
}

.pinned-card {
  border: 2rpx solid #1890ff;
  background: linear-gradient(135deg, #ffffff 0%, #e8f4ff 100%);
  box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.15);
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
  opacity: 0.8;
  background-color: #f5f5f5 !important;
}

.past-card.pinned-card {
  border-color: #999999;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%) !important;
  border-left: 6rpx solid #999999;
}

.countdown-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 140rpx;
}

.compact-card .countdown-main {
  min-width: 120rpx;
}

.countdown-number {
  font-size: 72rpx;
  font-weight: bold;
  color: #1890ff;
  line-height: 1;
}

.compact-card .countdown-number {
  font-size: 64rpx;
}

.past-main .countdown-number {
  color: #666666;
}

.countdown-unit {
  font-size: 22rpx;
  color: #666666;
  margin-top: 6rpx;
}

.countdown-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.countdown-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.compact-card .countdown-title {
  font-size: 28rpx;
}

.countdown-date {
  font-size: 22rpx;
  color: #666666;
}

.countdown-category {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 2rpx;
}

.category-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
}

.category-name {
  font-size: 22rpx;
  color: #666666;
}

.shadow {
  box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.08);
}
</style>
