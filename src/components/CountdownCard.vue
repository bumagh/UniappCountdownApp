<template>
  <view class="countdown-card shadow" :class="cardClass" @click=" handleClick ">
    <view v-if=" countdown.is_pinned " class="pin-badge">
      <!-- <text>📌</text> -->
    </view>

    <view class="countdown-left">
      <view class="category-pill" :style=" { borderColor: categoryColor } ">
        <view class="category-dot" :style=" { backgroundColor: categoryColor } "></view>
        <text class="category-name">{{ categoryName }}</text>
      </view>
      <text class="countdown-title">{{ countdown.title }}</text>
    </view>

    <view class="countdown-right" :class="[ mainClass ]">
      <text class="countdown-number" :class="daysClass">{{ absDays }}</text>
      <text class="countdown-unit" :class="[ daysClass ]">天</text>
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

    const handleClick = () =>
    {
      emit( 'click', props.countdown );
    };

    return {
      absDays,
      categoryColor,
      categoryName,
      cardClass,
      mainClass,
      daysClass,
      unitClass,
      handleClick
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

.compact-card .countdown-number {
  font-size: 58rpx;
}

/* “天”字：与数字同高，胶囊背景使用与 days 同色系的更深色（通过叠加黑色遮罩加深） */
.countdown-unit {
  font-size: 20rpx;
  color: rgba( 255, 255, 255, 0.92 );
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

.countdown-unit::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba( 0, 0, 0, 0.18 );
}

.countdown-unit {
  /* 确保文字在遮罩之上 */
  z-index: 0;
}

.countdown-unit > * {
  z-index: 1;
}

/* 直接给 text 用时，没有子节点，用伪元素遮罩即可；这里显式抬升文字层级 */
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
</style>
