<template>
  <view id="app">
    <router-view v-if=" isReady " />
  </view>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import apiService from './services/apiService';
import { Version } from 'types'
export default defineComponent( {
  name: 'App',
  data ()
  {
    return {
      isReady: false as boolean
    };
  },
  onLaunch ()
  {
    console.log( 'App Launch' );
    this.initApp();
    if ( !uni.getStorageSync( 'userid' ) )
    {
      uni.navigateTo( {
        url: '/subpackages/login/login'
      } );
      return;
    }
  },
  onShow ()
  {
    console.log( 'App Show' );
  },
  onHide ()
  {
    console.log( 'App Hide' );
  },
  methods: {
    async initApp ()
    {
      try
      {
        // 1) 检测版本：非最新版 -> 清理本地数据并提示重新登录
        await this.checkAppVersionAndHandle();

        // 2) 原有初始化逻辑
        uni.getSystemInfo( {
          success: ( res: any ) =>
          {
            this.isReady = true;
            console.log( '系统信息：', res );
          },
          fail: ( err: any ) =>
          {
            console.error( '获取系统信息失败：', err );
            this.isReady = true;
          }
        } );
      } catch ( e )
      {
        console.error( '初始化失败：', e );
        this.isReady = true;
      }
    },

    async checkAppVersionAndHandle ()
    {
      // 本地保存的版本号key（如项目里已有统一key可改成你的）
      const VERSION_KEY = 'app_version';

      try
      {
        const latest: Version = await apiService.getLatestVersion();
        // 兼容 getLatestVersion 返回 string 或 { version: string }
        const latestVersion = latest.version;

        if ( !latestVersion )
        {
          console.warn( '未获取到latestVersion，跳过版本检测' );
          return;
        }

        const localVersion = uni.getStorageSync( VERSION_KEY );

        // 首次启动：写入版本，不做清理
        if ( !localVersion )
        {
          uni.setStorageSync( VERSION_KEY, latestVersion );
          return;
        }

        // 非最新版：清理本地数据 + 提示重新登录 + 写入最新版本
        if ( localVersion !== latestVersion )
        {
          try
          {
            uni.clearStorageSync();
          } catch ( err )
          {
            // 某些端上clearStorageSync可能失败，兜底用异步清理
            uni.clearStorage?.();
          }

          uni.setStorageSync( VERSION_KEY, latestVersion );

          // 弹窗展示更新标题与描述（字段可能为空，做兜底）
          const modalTitle = ( '版本更新' + ( latest?.title && String( latest.title ).trim() ) ) || '版本更新提示';
          const modalContent = ( ( latest?.description && String( latest.description ).trim() ) + '\n检测到新版本，为保证数据一致性已清除本地数据，请重新登录。' )
            || '检测到新版本，为保证数据一致性已清除本地数据，请重新登录。';

          await new Promise<void>( ( resolve ) =>
          {
            uni.showModal( {
              title: modalTitle,
              content: modalContent,
              showCancel: false,
              confirmText: '确定更新',
              success: () => resolve()
            } );
          } );

          // 如有登录页，可调整为你的登录路由
          // #ifdef H5
          try
          {
            // 兼容有些项目用vue-router
            const pages = getCurrentPages?.() as any;
            if ( pages && pages.length )
            {
              // no-op
            }
          } catch ( e ) { }

          // #endif

          // 通用：跳到登录页（按你的实际路径改）
          uni.reLaunch( { url: '/subpackages/login/login' } );
        }
      } catch ( err )
      {
        console.error( '版本检测失败：', err );
        // 版本检测失败不阻塞启动
      }
    }
  }
} );
</script>

<style lang="scss">
@import '@/uni.scss';

#app {
  width: 100%;
  min-height: 100vh;
  background-color: $colorBg;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

page {
  background-color: $colorBg;
  color: $colorText;
  font-size: 28rpx;
  line-height: 1.6;
}

.navbar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  background-color: $colorWhite;
  border-bottom: 2rpx solid $colorBorder;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.navbar-title {
  font-size: 32rpx;
  font-weight: bold;
  color: $colorText;
}

.navbar-icon {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: $colorText;
}

.drawer {
  position: fixed;
  top: 0;
  left: -600rpx;
  width: 600rpx;
  height: 100vh;
  background-color: $colorWhite;
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

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 2rpx solid $colorBorder;
}

.drawer-title {
  font-size: 32rpx;
  font-weight: bold;
  color: $colorText;
}

.drawer-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: $colorTextLight;
}

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
  background-color: $colorWhite;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 2rpx solid $colorBorder;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: $colorText;
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
  color: $colorTextLight;
}

.modal-body {
  padding: 30rpx;
  max-height: 800rpx;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-top: 2rpx solid $colorBorder;
  gap: 20rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 40rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
  transition: all 0.3s;
}

.btn-primary {
  background-color: $colorPrimary;
  color: $colorWhite;
}

.btn-ghost {
  background-color: transparent;
  border: 2rpx solid $colorPrimary;
  color: $colorPrimary;
}

.btn-danger {
  background-color: $colorDanger;
  color: $colorWhite;
}

.btn-round {
  border-radius: 999rpx;
}

uni-input {
  height: auto !important;
  min-height: 0 !important;
  line-height: normal !important;
}
</style>