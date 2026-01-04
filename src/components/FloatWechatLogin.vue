<template>
  <view
    v-if="show"
    class="login-fab"
    :class="{ 'login-fab--disabled': disabled || loading }"
    :style="fabStyle"
    @click="onClick"
  >
    <text>{{ loading ? loadingText : text }}</text>
  </view>
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
    async autoCheckCodeAndLogin (): Promise<void> {
      if ( this.loading ) return;

      // 仅在微信环境下尝试自动处理回调
      if ( !wxauth.isInWechat() ) return;

      const code = wxauth.handleAuthCallback();
      uni.setStorageSync( 'wx_code', code );
      if ( !code ) return;

      await this.processWechatLogin( code );
      wxauth.clearAuthParamsFromUrl();
    },

    async onClick (): Promise<void> {
      if ( this.disabled || this.loading ) return;
      await this.startWechatLogin();
    },

    async startWechatLogin (): Promise<void> {
      // 1) 必须在微信环境
      if ( !wxauth.isInWechat() ) {
        uni.showModal( {
          title: '提示',
          content: '请在微信客户端中打开此页面使用微信登录',
          showCancel: false
        } );
        return;
      }

      // 2) 尝试从URL获取 code
      const code = wxauth.handleAuthCallback();
      if ( code ) {
        await this.processWechatLogin( code );
        wxauth.clearAuthParamsFromUrl();
        return;
      }

      // 3) 没有code则发起授权跳转（会跳走当前页面）
      wxauth.authorize();
    },

    async processWechatLogin ( code: string ): Promise<void> {
      if ( this.loading ) return;

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

        uni.showToast( {
          title: '微信登录成功',
          icon: 'success',
          duration: 1500
        } );

        this.$emit( 'success', loginRes as LoginSuccessPayload );

        if ( !this.autoRedirect ) return;

        // 首次登录处理（沿用 login.vue 逻辑：isfirst == 'yes'）
        const isFirst = loginRes.userInfo?.isfirst === 'yes';

        if ( isFirst && this.firstLoginUrlBuilder ) {
          const url = this.firstLoginUrlBuilder( loginRes.userInfo );
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

        uni.showToast( {
          title: errorMessage,
          icon: 'none',
          duration: 3000
        } );

        uni.removeStorageSync( 'token' );
        uni.removeStorageSync( 'userInfo' );

        this.$emit( 'error', error );
      } finally {
        uni.hideLoading();
        this.loading = false;
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
  padding: 24rpx 80rpx;
  border-radius: 999rpx;
  font-size: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(24, 144, 255, 0.18);
  text-align: center;
  font-weight: bold;
  letter-spacing: 2rpx;
}

.login-fab--disabled {
  opacity: 0.6;
}
</style>