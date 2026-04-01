<template>
  <view id="app">
    <router-view v-if="isReady" />
  </view>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import apiService from './services/apiService';
import { Version } from 'types'
import { getUrl } from './utils/axios';
import { trackEvent } from './utils/analytics';
export default defineComponent({
  name: 'App',
  data() {
    return {
      isReady: false as boolean
    };
  },
  onLaunch() {
    console.log(getUrl());
    console.log('App Launch');
    trackEvent('app_launch', {
      baseUrl: getUrl()
    });
    this.initApp();
    if (!uni.getStorageSync('userid')) {
      // uni.navigateTo( {
      //   url: '/subpackages/login/login'
      // } );
      return;
    }
  },
  onShow() {
    console.log('App Show');
    trackEvent('app_show');
  },
  onHide() {
    console.log('App Hide');
    trackEvent('app_hide');
  },
  methods: {
    async initApp() {
      try {
        // 1) 检测版本：非最新版 -> 清理本地数据并提示重新登录
        await this.checkAppVersionAndHandle();

        // 2) 原有初始化逻辑
        uni.getSystemInfo({
          success: (res: any) => {
            this.isReady = true;
            console.log('系统信息：', res);
          },
          fail: (err: any) => {
            console.error('获取系统信息失败：', err);
            this.isReady = true;
          }
        });
      } catch (e) {
        console.error('初始化失败：', e);
        this.isReady = true;
      }
    },

    async checkAppVersionAndHandle() {
      // 本地保存的版本号key（如项目里已有统一key可改成你的）
      const VERSION_KEY = 'app_version';

      try {
        const latest: Version = await apiService.getLatestVersion();

        // 兼容 getLatestVersion 返回 string 或 { version: string }
        const latestVersion = latest.version;

        if (!latestVersion) {
          console.warn('未获取到latestVersion，跳过版本检测');
          return;
        }

        const localVersion = uni.getStorageSync(VERSION_KEY);
        trackEvent('version_check_completed', {
          localVersion: localVersion || '',
          latestVersion
        });

        // 首次启动：写入版本，不做清理
        if (!localVersion) {
          uni.setStorageSync(VERSION_KEY, latestVersion);
          return;
        }
        console.log("当前版本:" + localVersion);
        console.log("服务器版本:" + latestVersion);
        // 非最新版：清理本地数据 + 提示重新登录 + 写入最新版本
        if (localVersion !== latestVersion) {
          trackEvent('version_update_required', {
            localVersion,
            latestVersion
          });
          try {
            await this.clearAllForUpdate();
          } catch (err) {
            // 某些端上clearStorageSync可能失败，兜底用异步清理
          }

          uni.setStorageSync(VERSION_KEY, latestVersion);

          // 弹窗展示更新标题与描述（字段可能为空，做兜底）
          const modalTitle = ('版本更新' + (latest?.title && String(latest.title).trim())) || '版本更新提示';
          const modalContent = ((latest?.description && String(latest.description).trim()) + '\n检测到新版本，为保证数据一致性已清除本地数据，请重新登录。')
            || '检测到新版本，为保证数据一致性已清除本地数据(不影响使用)，请重新登录。';

          await new Promise<void>((resolve) => {
            uni.showModal({
              title: modalTitle,
              content: modalContent,
              showCancel: false,
              confirmText: '确定更新',
              success: () => resolve()
            });
          });

          // 如有登录页，可调整为你的登录路由
          // #ifdef H5
          try {
            // 兼容有些项目用vue-router
            const pages = getCurrentPages?.() as any;
            if (pages && pages.length) {
              // no-op
            }
          } catch (e) { }

          // #endif

          // 通用：跳到登录页（按你的实际路径改）
          uni.reLaunch({ url: '/subpackages/login/login' });
        }
      } catch (err) {
        console.error('版本检测失败：', err);
        trackEvent('version_check_failed', {
          message: (err as any)?.message || ''
        });
        // 版本检测失败不阻塞启动
      }
    },

    async clearAllForUpdate(): Promise<void> {
      try {
        // 1. 清理 uni 存储
        if (typeof uni !== 'undefined' && uni.clearStorageSync) {
          uni.clearStorageSync();
        }

        // 2. 清理浏览器存储
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }

        // 3. 清理 cookies
        await this.clearCookies();

        // 4. 清理缓存 API
        await this.clearCaches();

        // 5. 清理 Service Worker
        await this.clearServiceWorkers();

        console.log('✅ 所有存储和缓存已清理完成');
      } catch (error) {
        console.error('❌ 清理存储时发生错误:', error);
        throw error;
      }
    },

    /**
     * 清理 Cookies
     */
    async clearCookies(): Promise<void> {
      try {
        if (typeof document !== 'undefined' && document.cookie) {
          const cookies = document.cookie.split(';');

          cookies.forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (name) {
              // 设置过期时间为过去的时间来删除cookie
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

              // 同时清理带有域的cookie
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;

              // 清理子域
              const hostParts = window.location.hostname.split('.');
              if (hostParts.length > 1) {
                const domain = hostParts.slice(-2).join('.');
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
              }
            }
          });
        }
      } catch (error) {
        console.warn('清理Cookies失败:', error);
      }
    },

    /**
     * 清理 Cache Storage
     */
    async clearCaches(): Promise<void> {
      try {
        if ('caches' in window && caches && typeof caches.keys === 'function') {
          const cacheKeys = await caches.keys();
          const deletePromises = cacheKeys.map(key => caches.delete(key));
          await Promise.all(deletePromises);
        }
      } catch (error) {
        console.warn('清理Cache Storage失败:', error);
      }
    },

    /**
     * 清理 Service Workers
     */
    async clearServiceWorkers(): Promise<void> {
      try {
        if ('serviceWorker' in navigator &&
          navigator.serviceWorker &&
          typeof navigator.serviceWorker.getRegistrations === 'function') {

          const registrations = await navigator.serviceWorker.getRegistrations();
          const unregisterPromises = registrations.map(registration => {
            // 先取消所有更新
            registration.update();
            return registration.unregister();
          });

          await Promise.all(unregisterPromises);
        }
      } catch (error) {
        console.warn('清理Service Workers失败:', error);
      }
    },

    /**
     * 清理 IndexedDB 数据库
     */
    async clearIndexedDB(): Promise<void> {
      try {
        if ('indexedDB' in window) {
          // 获取所有数据库并删除
          if (typeof indexedDB.databases === 'function') {
            const databases = await indexedDB.databases();
            const deletePromises = databases.map(db => {
              if (db.name) {
                return new Promise<void>((resolve, reject) => {
                  const request = indexedDB.deleteDatabase(db.name!);
                  request.onsuccess = () => resolve();
                  request.onerror = () => reject(request.error);
                  request.onblocked = () => {
                    console.warn(`数据库 ${db.name} 被阻塞，可能正在使用中`);
                    resolve();
                  };
                });
              }
              return Promise.resolve();
            });
            await Promise.all(deletePromises);
          }
        }
      } catch (error) {
        console.warn('清理IndexedDB失败:', error);
      }
    }

  }
});




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