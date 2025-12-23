<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-icon" @click=" goBack ">
        <text>‹</text>
      </view>
      <view class="navbar-title">
        <text>{{ isEdit ? '编辑倒数本' : '添加倒数本' }}</text>
      </view>
      <view class="navbar-icon" @click=" handleSubmit ">
        <text>✓</text>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view scroll-y class="page-content">
      <view class="form-container">
        <view class="form-item">
          <text class="form-label">本子名称</text>
          <input class="form-input" v-model=" formData.name " placeholder="请输入本子名称" maxlength="10" />
        </view>

        <view class="form-item">
          <text class="form-label">选择图标</text>
          <view class="icon-grid">
            <view v-for=" ( icon, index ) in iconList " :key=" index " class="icon-item"
              :class=" { 'icon-active': formData.icon === icon } " @click="selectIcon( icon )">
              <text class="icon-text">{{ icon }}</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">选择颜色</text>
          <view class="color-grid">
            <view v-for=" ( color, index ) in colorList " :key=" index " class="color-item"
              :class=" { 'color-active': formData.color === color } " :style=" { backgroundColor: color } "
              @click="selectColor( color )">
              <text v-if=" formData.color === color " class="color-check">✓</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 删除按钮（仅在编辑模式下显示） -->
      <view v-if=" isEdit " class="delete-section">
        <view class="btn btn-danger" @click=" handleDelete ">
          <text>删除倒数本</text>
        </view>
      </view>

      <!-- 底部空白 -->
      <view style="height: 40rpx;"></view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
interface BookEditPageData
{
  categoryId: string;
  isEdit: boolean;
  formData: {
    name: string;
    icon: string;
    color: string;
  };
  iconList: string[];
  colorList: string[];
}
import apiService from '@/services/apiService.js';
import db from '../../utils/db.js';
import { Category, Countdown, CountdownForm } from 'types';
import { defineComponent } from 'vue';

export default defineComponent( {
  name: 'BookEdit',
  data (): BookEditPageData
  {
    return {
      categoryId: '',
      isEdit: false,
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
  onLoad ( options: any )
  {
    if ( options.id )
    {
      this.categoryId = options.id;
      this.isEdit = true;
      this.loadCategoryData();
    }
  },
  methods: {
    async loadCategoryData ()
    {
      const category = await apiService.getCategory( this.categoryId?.toString() );
      if ( category != null )
      {
        this.formData = {
          name: category.name,
          icon: category.icon,
          color: category.color
        };
      }
    },
    selectIcon ( icon: string )
    {
      this.formData.icon = icon;
    },
    selectColor ( color: string )
    {
      this.formData.color = color;
    },
    goBack ()
    {
      uni.navigateBack( {
        delta: 1
      } );
    },
    handleDelete ()
    {
      if ( !this.isEdit ) return;

      uni.showModal( {
        title: '确认删除',
        content: `确定要删除"${ this.formData.name }"倒数本吗？该分类下的倒数日也会被删除。`,
        confirmColor: '#e54d42',
        success: ( res ) =>
        {
          if ( res.confirm )
          {
            try
            {
              db.deleteCategory( this.categoryId );
              uni.showToast( {
                title: '删除成功',
                icon: 'success'
              } );
              setTimeout( () =>
              {
                this.goBack();
              }, 1000 );
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
    },
    async handleSubmit ()
    {
      if ( !this.formData.name.trim() )
      {
        uni.showToast( {
          title: '请输入本子名称',
          icon: 'none'
        } );
        return;
      }

      const user = db.getCurrentUser();
      const userid = uni.getStorageSync( 'userid' );
      const user = d
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
        if ( this.isEdit )
        {
          db.updateCategory( this.categoryId, {
            name: this.formData.name,
            icon: this.formData.icon,
            color: this.formData.color
          } );
          uni.showToast( {
            title: '修改成功',
            icon: 'success'
          } );
        } else
        {
          db.addCategory( {
            name: this.formData.name,
            icon: this.formData.icon,
            color: this.formData.color,
            userId: user.id
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
      } catch ( e )
      {
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
  background-color: #ffffff;
  border: 2rpx solid #e8f4ff;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.icon-active {
  border-color: #1890ff;
  background-color: #e8f4ff;
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
  border-color: #333333;
  transform: scale(1.1);
}

.color-check {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: bold;
}

.delete-section {
  margin-top: 60rpx;
  padding: 0 30rpx;
}

.btn {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 28rpx;
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