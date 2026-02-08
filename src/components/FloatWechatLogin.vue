<template>
  <!-- #ifdef MP-WEIXIN -->
  <button
    v-if="show"
    class="login-fab"
    :class="{ 'login-fab--disabled': disabled || loading }"
    :style="fabStyle"
    :disabled="disabled || loading"
    @click="handleWechatLogin"
  >
    <text>{{ loading ? loadingText : text }}</text>
  </button>
  <!-- #endif -->
  
  <!-- #ifdef H5 -->
  <view
    v-if="show"
    class="login-fab"
    :class="{ 'login-fab--disabled': disabled || loading }"
    :style="fabStyle"
    @click="onClick"
  >
    <text>{{ loading ? loadingText : text }}</text>
  </view>
  <!-- #endif -->
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import apiService from '@/services/apiService';
import wxauth from '@/utils/wxauth';


type ZIndex = number | string;

type LoginSuccessPayload = {
  token: string;
  userInfo: any;
};

// uni.login 成功回调类型
interface UniLoginSuccess {
  code: string;
  errMsg: string;
}

export default defineComponent( {
  name: 'FloatWechatLogin',
  emits: [ 'success', 'error' ],
  props: {
    // 是否显示
    show: {
      type: Boolean,
      default: false
    },
    // 默认文案
    text: {
      type: String,
      default: '微信授权登录'
    },
    // 登录中文案
    loadingText: {
      type: String,
      default: '微信登录中...'
    },
    // 是否禁用（禁用时不触发登录）
    disabled: {
      type: Boolean,
      default: false
    },
    // 距离底部（支持 rpx/px/%）
    bottom: {
      type: String,
      default: '20%'
    },
    // 层级
    zIndex: {
      type: [ Number, String ] as PropType<ZIndex>,
      default: 10000
    },
    // 登录成功后是否自动返回/跳转
    autoRedirect: {
      type: Boolean,
      default: true
    },
    // 登录成功后跳转方式：switchTab / navigateTo / redirectTo / back
    successNavType: {
      type: String as PropType<'switchTab' | 'navigateTo' | 'redirectTo' | 'back'>,
      default: 'switchTab'
    },
    // 登录成功后跳转目标（back 时忽略）
    successUrl: {
      type: String,
      default: '/pages/index/index'
    },
    // 首次登录时跳转目标（比如填写信息页）。为空则不处理首次逻辑
    firstLoginUrlBuilder: {
      type: Function as PropType<( userInfo: any ) => string>,
      default: null
    },
    // 组件挂载/显示时是否自动检测code并登录（仅在URL带code时执行，不会主动跳转授权）
    autoCheckOnMount: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      loading: false as boolean
    };
  },
  mounted () {
    // #ifdef MP-WEIXIN
    // 监听微信小程序登录成功事件
    uni.$on('miniprogramLoginSuccess', this.handleMiniProgramLoginSuccess);
    // #endif
  },
  beforeUnmount () {
    // #ifdef MP-WEIXIN
    // 移除事件监听
    uni.$off('miniprogramLoginSuccess', this.handleMiniProgramLoginSuccess);
    // #endif
  },
  watch: {
    // show 从 false -> true 时也检查一次（适配条件渲染）
    show: {
      immediate: true,
      handler () {
        if ( !this.autoCheckOnMount ) return;
        if ( !this.show ) return;
        this.autoCheckCodeAndLogin();
      }
    }
  },
  computed: {
    fabStyle (): Record<string, string | number> {
      return {
        bottom: this.bottom,
        zIndex: this.zIndex as any
      };
    }
  },
  methods: {
     /**
     * 处理微信小程序登录
     */
    async handleWechatLogin(): Promise<void> {
      if (this.disabled || this.loading) return;
      
      this.loading = true;
      
      try {
        // 1. 使用uni.authorize主动发起用户信息授权
        const authRes = await new Promise<any>((resolve, reject) => {
          uni.authorize({
            scope: 'scope.userInfo',
            success: resolve,
            fail: reject
          });
        });
        
        console.log('用户授权成功:', authRes);
        
        // 2. 获取用户信息
        const userInfo = await new Promise<any>((resolve, reject) => {
          uni.getUserInfo({
            success: resolve,
            fail: reject
          });
        });
        
        console.log('获取用户信息:', userInfo);
        
        // 3. 使用uni.login获取code
        const loginRes = await new Promise<UniLoginSuccess>((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: resolve,
            fail: reject
          });
        });
        
        if (loginRes.code) {
          console.log('获取到微信登录code:', loginRes.code);
          
          // 4. 保存头像和昵称到storage
          uni.setStorageSync('userAvatar', userInfo.avatarUrl || '');
          uni.setStorageSync('userNickname', userInfo.nickName || '');
          uni.setStorageSync('userGender', userInfo.gender || 2);
          
          // 5. 携带code和用户信息登录到服务器
          // const result = await apiService.wechatMiniProgramLogin({
          //   code: loginRes.code,
          //   userInfo: userInfo,
          //   encryptedData: userInfo.encryptedData,
          //   iv: userInfo.iv
          // });
          
          // 临时：模拟登录成功
          const mockResult = {
            token: 'mock_token_' + Date.now(),
            userInfo: userInfo
          };
          
          console.log('登录成功:', mockResult);
          
          // 6. 触发成功事件
          this.$emit('success', mockResult);
          
          // 7. 显示成功提示
          uni.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 2000
          });
          
          // 8. 跳转到首页
          if (this.autoRedirect) {
            setTimeout(() => {
              this.navigateToHome();
            }, 1500);
          }
        } else {
          throw new Error('获取微信登录code失败');
        }
        
      } catch (error: any) {
        console.error('微信登录失败:', error);
        
        // 检查是否是授权拒绝
        if (error.errMsg && error.errMsg.includes('auth deny')) {
          // 用户拒绝授权，显示授权提示弹窗
          uni.showModal({
            title: '授权提示',
            content: '为了提供更好的服务，请授权获取您的用户信息',
            confirmText: '重新授权',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                // 用户点击重新授权，再次尝试
                setTimeout(() => {
                  this.handleWechatLogin();
                }, 500);
              }
            }
          });
        } else {
          // 其他错误
          uni.showModal({
            title: '登录失败',
            content: error.message || '微信登录失败，请重试',
            showCancel: false,
            confirmText: '确定'
          });
        }
        
        this.$emit('error', error);
      } finally {
        this.loading = false;
      }
    },
     /**
     * 获取用户信息回调
     */
    async onGetUserInfo(e: any): Promise<void> {
      console.log('获取用户信息回调', e);
      
      // 检查是否需要授权
      if (e.detail.errMsg === 'getUserInfo:fail auth deny') {
        // 用户拒绝授权，显示授权提示弹窗
        uni.showModal({
          title: '授权提示',
          content: '为了提供更好的服务，请授权获取您的用户信息',
          confirmText: '重新授权',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              // 用户点击重新授权，可以再次触发授权
              console.log('用户选择重新授权');
            }
          }
        });
        return;
      }
      
      if (e.detail.errMsg === 'getUserInfo:ok') {
        const userInfo = e.detail.userInfo;
        const { encryptedData, iv } = e.detail;
        
        this.loading = true;
        
        try {
          // 1. 使用uni.login获取code
          const loginRes = await new Promise<UniLoginSuccess>((resolve, reject) => {
            uni.login({
              provider: 'weixin',
              success: resolve,
              fail: reject
            });
          });
          
          if (loginRes.code) {
            console.log('获取到微信登录code:', loginRes.code);
            console.log('用户信息:', userInfo);
            console.log('加密数据:', { encryptedData, iv });
            
            // 2. 保存头像和昵称到storage
            uni.setStorageSync('userAvatar', userInfo.avatarUrl || '');
            uni.setStorageSync('userNickname', userInfo.nickName || '');
            uni.setStorageSync('userGender', userInfo.gender || 2);
            
            // 3. 携带code和用户信息登录到服务器
            // const result = await apiService.wechatMiniProgramLogin({
            //   code: loginRes.code,
            //   userInfo: userInfo,
            //   encryptedData: encryptedData,
            //   iv: iv
            // });
            
            // 临时：模拟登录成功
            const mockResult = {
              token: 'mock_token_' + Date.now(),
              userInfo: userInfo
            };
            
            console.log('登录成功:', mockResult);
            
            // 4. 触发成功事件
            this.$emit('success', mockResult);
            
            // 5. 显示成功提示
            uni.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 2000
            });
            
            // 6. 跳转到首页
            if (this.autoRedirect) {
              setTimeout(() => {
                this.navigateToHome();
              }, 1500);
            }
          } else {
            throw new Error('获取微信登录code失败');
          }
        } catch (error: any) {
          console.error('微信登录失败:', error);
          this.$emit('error', error);
          
          // 显示授权失败弹窗
          uni.showModal({
            title: '登录失败',
            content: error.message || '微信登录失败，请重试',
            showCancel: false,
            confirmText: '确定'
          });
        } finally {
          this.loading = false;
        }
      } else {
        // 其他错误情况
        uni.showModal({
          title: '授权提示',
          content: '您拒绝了授权，无法使用微信登录功能',
          confirmText: '重新授权',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              console.log('用户选择重新授权');
            }
          }
        });
      }
    },
    async autoCheckCodeAndLogin (): Promise<void> {
      if ( this.loading ) return;

      // 仅在微信环境下尝试自动处理回调
      if ( !wxauth.isInWechat() ) return;

      // #ifdef H5
      const code = wxauth.handleAuthCallback();
      uni.setStorageSync( 'wx_code', code );
      if ( !code ) return;

      await this.processWechatLogin( code );
      wxauth.clearAuthParamsFromUrl();
      // #endif
      
      // #ifdef MP-WEIXIN
      // 微信小程序环境，检查是否有保存的code
      const savedCode = uni.getStorageSync('code');
      if (savedCode) {
        await this.processWechatLogin(savedCode);
        // 清除已使用的code
        uni.removeStorageSync('code');
      }
      // #endif
    },

    async onClick (): Promise<void> {
      if ( this.disabled || this.loading ) return;
      await this.startWechatLogin();
    },

    async startWechatLogin (): Promise<void> {
      // 1) 必须在微信环境
      if ( !wxauth.isInWechat() ) {
        // #ifdef H5
        //输出当前url域名,如果是localhost,则跳转到账号密码登录
        // console.log('当前url域名:',window.location.hostname);
        if(window.location.hostname==='localhost'){
          uni.navigateTo({
            url:'/subpackages/login/pwdlogin'
          });
        }else{
              uni.showModal( {
          title: '提示',
          content: '请在微信客户端中打开此页面使用微信登录',
          showCancel: false
        } );
        }
        // #endif
        
        // #ifdef MP-WEIXIN
        // 微信小程序环境，直接进行登录
        await this.startMiniProgramLogin();
        // #endif
        return;
      }

      // #ifdef H5
      // 2) 尝试从URL获取 code
      const code = wxauth.handleAuthCallback();
      if ( code ) {
        await this.processWechatLogin( code );
        wxauth.clearAuthParamsFromUrl();
        return;
      }

      // 3) 没有code则发起授权跳转（会跳走当前页面）
      wxauth.authorize();
      // #endif
      
      // #ifdef MP-WEIXIN
      // 微信小程序环境，直接进行登录
      await this.startMiniProgramLogin();
      // #endif
    },

    // 微信小程序登录方法
    async startMiniProgramLogin(): Promise<void> {
      if (this.loading) return;
      
      this.loading = true;
      uni.showLoading({
        title: '微信登录中...',
        mask: true
      });

      try {
        // 调用微信小程序登录
        wxauth.authorize();
      } catch (error: any) {
        console.error('微信小程序登录失败:', error);
        uni.hideLoading();
        this.loading = false;
        
        uni.showToast({
          title: '微信登录失败，请重试',
          icon: 'none',
          duration: 3000
        });
        
        this.$emit('error', error);
      }
    },

    // 处理微信小程序登录成功事件
    async handleMiniProgramLoginSuccess(code: string): Promise<void> {
      console.log("handleMiniProgramLoginSuccess");
      await this.processWechatLogin(code);
    },

    async processWechatLogin ( code: string ): Promise<void> {
      console.log("processWechatLogin");

      this.loading = true;
      uni.showLoading( {
        title: '微信登录中...',
        mask: true
      } );
      try {
        const loginRes = await apiService.loginByWeixin( { code } );

        // 存储登录态
        uni.setStorageSync( 'token', loginRes.token );
        uni.setStorageSync( 'userInfo', JSON.stringify( loginRes.userInfo ) );
        if ( loginRes.userInfo?.id != null ) {
          uni.setStorageSync( 'userid', loginRes.userInfo.id );
        }
        
        // 保存头像和昵称到storage
        if (loginRes.userInfo) {
          uni.setStorageSync('userAvatar', loginRes.userInfo.avatarUrl || '');
          uni.setStorageSync('userNickname', loginRes.userInfo.nickName || '');
          uni.setStorageSync('userGender', loginRes.userInfo.gender || 2);
        }

        uni.showToast( {
          title: '微信登录成功',
          icon: 'success',
          duration: 1500
        } );

        this.$emit( 'success', loginRes as LoginSuccessPayload );
        
        if ( !this.autoRedirect ) return;

        // 首次登录处理（沿用 login.vue 逻辑：isfirst == 'yes'）
        const isFirst = loginRes.userInfo?.isfirst === 'yes';

        if ( isFirst && this.firstLoginUrlBuilder!=null ) {
           const url =  `/subpackages/register/reginfo?id=${ loginRes.userInfo.id }&nickname=${ loginRes.userInfo.nickname }&gender=${ loginRes.userInfo.gender }`;
          // const url = this.firstLoginUrlBuilder( loginRes.userInfo );
          setTimeout( () => {
            uni.navigateTo( { url } );
          }, 1500 );
          return;
        }

        // 普通成功跳转
        setTimeout( () => {
          switch ( this.successNavType ) {
            case 'back':
              uni.navigateBack();
              break;
            case 'navigateTo':
              uni.navigateTo( { url: this.successUrl } );
              break;
            case 'redirectTo':
              uni.redirectTo( { url: this.successUrl } );
              break;
            case 'switchTab':
            default:
              uni.switchTab( { url: this.successUrl } );
              break;
          }
        }, 1500 );

      } catch ( error: any ) {
        console.error( '微信登录失败:', error );

        let errorMessage = '微信登录失败，请重试';
        if ( error?.code ) {
          switch ( error.code ) {
            case 40029:
              errorMessage = '授权码无效或已过期';
              break;
            case 40163:
              errorMessage = '授权码已被使用，请重新授权';
              break;
            case 41008:
              errorMessage = '缺少授权码';
              break;
          }
        } else if ( error?.response?.status === 401 ) {
          errorMessage = '登录验证失败';
        }
        
        // 显示登录失败弹窗
        uni.showModal({
          title: '登录失败',
          content: errorMessage,
          showCancel: false,
          confirmText: '确定'
        });

        uni.removeStorageSync( 'token' );
        uni.removeStorageSync( 'userInfo' );
        // 清除用户信息
        uni.removeStorageSync('userAvatar');
        uni.removeStorageSync('userNickname');
        uni.removeStorageSync('userGender');

        this.$emit( 'error', error );
      } finally {
        uni.hideLoading();
        this.loading = false;
      }
    },
    // 跳转到首页
    navigateToHome(): void {
      switch (this.successNavType) {
        case 'navigateTo':
          uni.navigateTo({ url: this.successUrl });
          break;
        case 'redirectTo':
          uni.redirectTo({ url: this.successUrl });
          break;
        case 'switchTab':
        default:
          uni.switchTab({ url: this.successUrl });
          break;
      }
    }
  }
} );
</script>

<style scoped>
.login-fab {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
  padding: 24rpx 40rpx;
  border-radius: 999rpx;
  font-size: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(24, 144, 255, 0.18);
  text-align: center;
  font-weight: bold;
  letter-spacing: 2rpx;
}

.login-fab--disabled {
  opacity: 0.6;
}
</style>