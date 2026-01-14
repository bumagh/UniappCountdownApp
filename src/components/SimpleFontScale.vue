<!-- components/SimpleFontScale.vue -->
<template>
  <view class="simple-font-scale">
    <view class="scale-controls">
      <button @click="setScale(0.8)" size="mini">小</button>
      <button @click="setScale(1.0)" size="mini" style="margin: 0 10rpx">标准</button>
      <button @click="setScale(1.2)" size="mini">大</button>
      <button @click="setScale(1.5)" size="mini" style="margin-left: 10rpx">特大</button>
    </view>
  </view>
</template>

<script setup lang="ts">
const setScale = (scale: number) => {
  // 更新全局缩放
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = `${16 * scale}px`
    document.documentElement.style.setProperty('--font-scale', scale.toString())
  }
  
  // 保存设置
  localStorage.setItem('app_font_scale', scale.toString())
  
  // 通知其他页面
  uni.$emit('fontScaleChanged', scale)
  
  uni.showToast({
    title: `字体已调整为${scale * 100}%`,
    icon: 'success'
  })
}
</script>