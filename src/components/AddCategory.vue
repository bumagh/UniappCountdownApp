<template>
  <view v-if=" visible " class="modal-mask" @click=" handleClose ">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">添加奇妙本</text>
        <view class="modal-close" @click=" handleClose ">
          <text class="close-icon">✕</text>
        </view>
      </view>

      <view class="modal-body">
        <view class="form-item">
          <view class="form-label">本子名称</view>
          <input class="form-input" v-model=" formData.name " placeholder="请输入本子名称" maxlength="10" />
        </view>

        <view class="form-item">
          <view class="form-label">选择图标</view>
          <view class="icon-grid">
            <view v-for=" ( icon, index ) in iconList " :key=" index " class="icon-item"
              :class=" { 'icon-active': formData.icon === icon } " @click="selectIcon( icon )">
              <text class="icon-text">{{ icon }}</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <view class="form-label">选择颜色</view>
          <view class="color-grid">
            <view v-for=" ( color, index ) in colorList " :key=" index " class="color-item"
              :class=" { 'color-active': formData.color === color } " :style=" { backgroundColor: color } "
              @click="selectColor( color )">
              <text v-if=" formData.color === color " class="color-check">✓</text>
            </view>
          </view>
        </view>
      </view>

      <view class="modal-footer">
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

<script>
import db from '../utils/db.js';

export default {
  name: 'AddCategory',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    categoryData: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      formData: {
        name: '',
        icon: '🏠',
        color: '#ff6b9d'
      },
      iconList: [
        '🏠', '💼', '👨‍👩‍👧', '🎯', '❤️', '🎉',
        '📚', '✈️', '🎂', '💪', '🎨', '🎵',
        '⚽', '🍔', '🌟', '🔥', '💡', '🌈'
      ],
      colorList: [
        '#ff6b9d', '#1cbbb4', '#fbbd08', '#39b54a',
        '#e54d42', '#8799a3', '#a463f2', '#ff9500',
        '#0081ff', '#6739b6', '#1cbbb4', '#f37b1d'
      ]
    };
  },
  watch: {
    visible (val) {
      if (val) {
        if (this.categoryData) {
          this.formData = {
            name: this.categoryData.name,
            icon: this.categoryData.icon,
            color: this.categoryData.color
          };
        } else {
          this.resetForm();
        }
      }
    }
  },
  methods: {
    selectIcon (icon) {
      this.formData.icon = icon;
    },
    selectColor (color) {
      this.formData.color = color;
    },
    handleClose () {
      this.$emit('close');
      this.resetForm();
    },
    handleSubmit () {
      if (!this.formData.name.trim()) {
        uni.showToast({
          title: '请输入本子名称',
          icon: 'none'
        });
        return;
      }

      const user = db.getCurrentUser();
      if (!user) {
        uni.showToast({
          title: '用户信息获取失败',
          icon: 'none'
        });
        return;
      }

      try {
        if (this.categoryData) {
          db.updateCategory(this.categoryData.id, {
            name: this.formData.name,
            icon: this.formData.icon,
            color: this.formData.color
          });
          uni.showToast({
            title: '修改成功',
            icon: 'success'
          });
        } else {
          db.addCategory({
            name: this.formData.name,
            icon: this.formData.icon,
            color: this.formData.color,
            userId: user.id
          });
          uni.showToast({
            title: '添加成功',
            icon: 'success'
          });
        }
        this.$emit('success');
        this.handleClose();
      } catch (e) {
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    },
    resetForm () {
      this.formData = {
        name: '',
        icon: '🏠',
        color: '#ff6b9d'
      };
    }
  }
};
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
  z-index: 9999;
}

.modal-content {
  width: 640rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 2rpx solid #f0ebe6;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #5c4033;
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
  color: #8f7a66;
}

.modal-body {
  padding: 30rpx;
  max-height: 800rpx;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 40rpx;
}

.form-label {
  font-size: 28rpx;
  color: #5c4033;
  margin-bottom: 20rpx;
  font-weight: bold;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background-color: #fffef9;
  border: 2rpx solid #f0ebe6;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #5c4033;
  box-sizing: border-box;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.icon-item {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fffef9;
  border: 2rpx solid #f0ebe6;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.icon-active {
  border-color: #ff6b9d;
  background-color: #fff0f5;
}

.icon-text {
  font-size: 40rpx;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.color-item {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid transparent;
  transition: all 0.3s;
}

.color-active {
  border-color: #5c4033;
  transform: scale(1.1);
}

.color-check {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: bold;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-top: 2rpx solid #f0ebe6;
  gap: 20rpx;
}

.btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.btn-ghost {
  background-color: transparent;
  border: 2rpx solid #ff6b9d;
  color: #ff6b9d;
}

.btn-primary {
  background-color: #ff6b9d;
  color: #ffffff;
}
</style>