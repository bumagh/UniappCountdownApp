// 微信JSSDK配置和分享功能

import apiService from "@/services/apiService";
// #ifdef H5
import wx from 'weixin-js-sdk';
// #endif

interface WxJSSDKConfig {
  debug?: boolean;
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
  jsApiList: string[];
}

interface ShareConfig {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

class WechatJSSDK {
  private isWxEnvironment: boolean;
  private isReady: boolean = false;

  constructor() {
    this.isWxEnvironment = this.checkWxEnvironment();
  }

  // 检查是否在微信环境中
  private checkWxEnvironment(): boolean {
    // #ifdef H5
    // 使用weixin-js-sdk包检查微信环境
    const ua = navigator.userAgent.toLowerCase();
    const isWx = ua.includes('micromessenger');
    console.log('User Agent:', navigator.userAgent);
    console.log('是否在微信环境:', isWx);
    console.log('wx对象状态:', typeof wx !== 'undefined' ? '已加载' : '未加载');
    if (typeof wx !== 'undefined') {
      console.log('wx.config方法:', typeof wx.config);
    }
    return isWx;
    // #endif
    // #ifndef H5
    return false;
    // #endif
  }

  // 初始化微信JSSDK
  async init(config: WxJSSDKConfig): Promise<boolean> {
    if (!this.isWxEnvironment) {
      console.warn('当前不在微信环境中');
      return false;
    }

    // #ifdef H5
    try {
      // 使用weixin-js-sdk包，无需等待加载
      await new Promise<void>((resolve, reject) => {
        if (typeof wx !== 'undefined' && wx.config) {
          wx.config({
            debug: config.debug || false,
            appId: config.appId,
            timestamp: config.timestamp,
            nonceStr: config.nonceStr,
            signature: config.signature,
            jsApiList: [
              'updateAppMessageShareData',
              'updateTimelineShareData',
              'onMenuShareTimeline',
              'onMenuShareAppMessage',
              ...(config.jsApiList || []) as string[]
            ] as any[]
          });

          wx.ready(() => {
            this.isReady = true;
            console.log('微信JSSDK初始化成功');
            resolve();
          });

          wx.error((err: any) => {
            console.error('微信JSSDK初始化失败:', err);
            reject(err);
          });
        } else {
          reject(new Error('微信JSSDK未加载或wx.config方法不存在'));
        }
      });
      return true;
    } catch (error) {
      console.error('微信JSSDK初始化异常:', error);
      return false;
    }
    // #endif
    // #ifndef H5
    return false;
    // #endif
  }

  // 设置分享给朋友
  async setShareToFriend(config: ShareConfig): Promise<void> {
    if (!this.isWxEnvironment || !this.isReady) return;

    // #ifdef H5
    try {
      if (typeof wx !== 'undefined') {
        // 使用新版本的API
        wx.updateAppMessageShareData({
          title: config.title,
          desc: config.desc,
          link: config.link,
          imgUrl: config.imgUrl,
          success: () => {
            console.log('设置分享给朋友成功');
          },
          fail: (err: any) => {
            console.error('设置分享给朋友失败:', err);
          }
        });

        // 兼容旧版本API
        wx.onMenuShareAppMessage({
          title: config.title,
          desc: config.desc,
          link: config.link,
          imgUrl: config.imgUrl,
          success: () => {
            console.log('设置分享给朋友成功（兼容版本）');
          },
          cancel: () => {
            console.log('用户取消分享给朋友（兼容版本）');
          },
          fail: (err: any) => {
            console.error('设置分享给朋友失败（兼容版本）:', err);
          }
        });
      }
    } catch (error) {
      console.error('设置分享给朋友异常:', error);
    }
    // #endif
  }

  // 设置分享到朋友圈
  async setShareToTimeline(config: ShareConfig): Promise<void> {
    if (!this.isWxEnvironment || !this.isReady) return;

    // #ifdef H5
    try {
      if (typeof wx !== 'undefined') {
        // 使用新版本的API
        wx.updateTimelineShareData({
          title: config.title,
          link: config.link,
          imgUrl: config.imgUrl,
          success: () => {
            console.log('设置分享到朋友圈成功');
          },
          fail: (err: any) => {
            console.error('设置分享到朋友圈失败:', err);
          }
        });

        // 兼容旧版本API
        wx.onMenuShareTimeline({
          title: config.title,
          link: config.link,
          imgUrl: config.imgUrl,
          success: () => {
            console.log('设置分享到朋友圈成功（兼容版本）');
          },
          cancel: () => {
            console.log('用户取消分享到朋友圈（兼容版本）');
          },
          fail: (err: any) => {
            console.error('设置分享到朋友圈失败（兼容版本）:', err);
          }
        });
      }
    } catch (error) {
      console.error('设置分享到朋友圈异常:', error);
    }
    // #endif
  }

  // 获取微信签名（需要后端接口支持）
  async getSignature(url: string): Promise<{
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
  }> {
    try {
      // 这里需要调用你的后端接口获取微信签名
      // 示例接口，你需要根据实际后端API调整
      const response = await apiService.getJsConfig(url);

      console.log('微信签名API响应:', response);

      if (response!=null) {
        const data = response.data as any;
        
        // 验证返回数据是否包含必要字段
        if (data.appId && data.timestamp && data.nonceStr && data.signature) {
          return {
            appId: data.appId,
            timestamp: data.timestamp,
            nonceStr: data.nonceStr,
            signature: data.signature
          };
        } else {
          console.warn('微信签名API返回数据不完整:', data);
          throw new Error('微信签名数据不完整');
        }
      } else {
        console.warn('微信签名API调用失败:', response);
        throw new Error('获取微信签名失败');
      }
    } catch (error) {
      console.error('获取微信签名异常:', error);
      // 如果获取签名失败，返回测试数据（仅用于开发）
      console.warn('使用测试签名数据，请配置后端API');
      return {
        appId: 'wx1234567890abcdef',
        timestamp: Math.floor(Date.now() / 1000),
        nonceStr: this.generateNonceStr(),
        signature: 'test-signature-development-only'
      };
    }
  }

  // 生成随机字符串
  private generateNonceStr(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 初始化并设置分享（便捷方法）
  async initAndSetShare(shareConfig: ShareConfig): Promise<void> {
    if (!this.isWxEnvironment) return;

    try {
      // #ifdef H5
      const url = window.location.href.split('#')[0];
      const signatureData = await this.getSignature(url);
      console.log('获取到的签名数据:', signatureData);
      
      // 验证签名数据有效性
      if (!signatureData.appId || !signatureData.timestamp || !signatureData.nonceStr || !signatureData.signature) {
        console.error('签名数据无效:', signatureData);
        return;
      }
      
      await this.init({
        appId: signatureData.appId,
        timestamp: signatureData.timestamp,
        nonceStr: signatureData.nonceStr,
        signature: signatureData.signature,
        jsApiList: []
      });

      // 设置分享
      await this.setShareToFriend(shareConfig);
      await this.setShareToTimeline(shareConfig);
      // #endif
    } catch (error) {
      console.error('初始化并设置分享失败:', error);
    }
  }

  // 检查是否准备就绪
  ready(): boolean {
    return this.isReady;
  }

  // 检查是否在微信环境
  isInWx(): boolean {
    return this.isWxEnvironment;
  }
}

export default new WechatJSSDK();
