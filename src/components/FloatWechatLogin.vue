<template>
  <!-- #ifdef MP-WEIXIN -->
  <button
    v-if="show && !showAvatarModal"
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
    v-if="show && !showAvatarModal"
    class="login-fab"
    :class="{ 'login-fab--disabled': disabled || loading }"
    :style="fabStyle"
    @click="onClick"
  >
    <text>{{ loading ? loadingText : text }}</text>
  </view>
  <!-- #endif -->

  <!-- 头像和昵称设置弹窗 -->
  <view v-if="showAvatarModal" class="avatar-modal-mask" @click="closeAvatarModal">
    <view class="avatar-modal-content" @click.stop>
      <view class="avatar-modal-header">
        <text class="avatar-modal-title">完善个人信息</text>
        <view class="avatar-modal-close" @click="closeAvatarModal">
          <text>×</text>
        </view>
      </view>
      
      <view class="avatar-modal-body">
        <!-- 头像选择 -->
        <view class="avatar-section">
          <text class="section-title">头像</text>
          <button class="avatar-wrapper" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image class="avatar" :src="tempAvatarUrl"></image>
            <view class="avatar-edit-hint">点击选择头像</view>
          </button>
        </view>
        
        <!-- 昵称输入 -->
        <view class="nickname-section">
          <text class="section-title">昵称</text>
          <input 
            type="nickname" 
            class="nickname-input" 
            placeholder="请输入昵称"
            v-model="tempNickname"
            @blur="onNicknameBlur"
          />
        </view>
      </view>
      
      <view class="avatar-modal-footer">
        <button class="cancel-btn" @click="closeAvatarModal">取消</button>
        <button 
          class="confirm-btn" 
          :class="{ 'confirm-btn--disabled': !canConfirm }"
          :disabled="!canConfirm"
          @click="confirmUserInfo"
        >
          确认登录
        </button>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import apiService from '@/services/apiService';
import wxauth from '@/utils/wxauth';

// 声明wx全局变量
declare const wx: any;

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
      loading: false as boolean,
      // 弹窗相关数据
      showAvatarModal: false as boolean,
      tempAvatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0' as string,
      tempNickname: '' as string,
      loginCode: '' as string // 保存登录用的code
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
    },
    // 检查是否可以确认登录
    canConfirm (): boolean {
      return this.tempNickname.trim().length > 0 && this.tempAvatarUrl !== '';
    }
  },
  methods: {
    // 关闭头像昵称设置弹窗
    closeAvatarModal(): void {
      this.showAvatarModal = false;
      this.loading = false;
    },

    maskCode(code?: string): string {
      if (!code) return '';
      if (code.length <= 8) return code;
      return `${code.slice(0, 4)}***${code.slice(-4)}`;
    },

    buildErrorDebugInfo(error: any): Record<string, any> {
      return {
        message: error?.message,
        code: error?.code,
        response: error?.response,
        data: error?.data,
        errMsg: error?.errMsg,
        stack: error?.stack
      };
    },

    syncUserStorage(userInfo: any, token?: string): void {
      if (token) {
        uni.setStorageSync('token', token);
      }

      uni.setStorageSync('userInfo', JSON.stringify(userInfo || {}));
      if (userInfo?.id != null) {
        uni.setStorageSync('userid', userInfo.id);
      }
      if (userInfo?.avatar) {
        uni.setStorageSync('userAvatar', userInfo.avatar);
        uni.setStorageSync('user_avatar', userInfo.avatar);
      }
      if (userInfo?.nickname) {
        uni.setStorageSync('userNickname', userInfo.nickname);
      }
      if (userInfo?.gender != null) {
        uni.setStorageSync('userGender', userInfo.gender);
      }
    },

    async completeUserProfile(loginRes: LoginSuccessPayload): Promise<any> {
      const userId = loginRes.userInfo?.id;
      if (userId == null) {
        return loginRes.userInfo;
      }

      const nickname = this.tempNickname.trim() || loginRes.userInfo?.nickname || '';
      let avatar = this.tempAvatarUrl || loginRes.userInfo?.avatar || '';
      const shouldUploadAvatar = !!avatar && !/^https?:\/\//.test(avatar) && !avatar.startsWith('/');

      if (shouldUploadAvatar) {
        console.log('[FloatWechatLogin] completeUserProfile upload avatar', {
          userId,
          avatar
        });
        avatar = await apiService.uploadFile(avatar, 'avatar', loginRes.token);
      }

      const updatePayload: Record<string, any> = {
        id: userId,
        nickname
      };
      if (avatar) {
        updatePayload.avatar = avatar;
      }

      const updateRes = await apiService.updateUser(updatePayload);
      console.log('[FloatWechatLogin] completeUserProfile update result', {
        code: updateRes.code,
        msg: updateRes.msg,
        payload: updatePayload
      });

      if (updateRes.code !== 200) {
        throw new Error(updateRes.msg || '个人信息保存失败');
      }

      return {
        ...loginRes.userInfo,
        nickname,
        avatar: avatar || loginRes.userInfo?.avatar || ''
      };
    },

    // 选择头像回调
    onChooseAvatar(e: any): void {
      const { avatarUrl } = e.detail;
      if (avatarUrl) {
        this.tempAvatarUrl = avatarUrl;
        console.log('选择头像:', avatarUrl);
      }
    },

    // 昵称输入框失焦
    onNicknameBlur(e: any): void {
      // 可以在这里进行昵称验证
      const nickname = e.detail.value;
      console.log('昵称输入:', nickname);
    },

    // 确认用户信息并登录
    async confirmUserInfo(): Promise<void> {
      if (!this.canConfirm) return;

      this.loading = true;
      uni.showLoading({
        title: '登录中...',
        mask: true
      });

      try {
        // 使用保存的code进行登录
        if (this.loginCode) {
          console.log('[FloatWechatLogin] confirmUserInfo start', {
            loginCode: this.maskCode(this.loginCode),
            hasNickname: !!this.tempNickname,
            hasAvatar: !!this.tempAvatarUrl
          });
          // 调用后端API登录
          const loginRes = await apiService.loginByWeixin({
            code: this.loginCode
          });
          console.log('[FloatWechatLogin] confirmUserInfo success', {
            userId: loginRes.userInfo?.id,
            isFirst: loginRes.userInfo?.isfirst,
            nickname: loginRes.userInfo?.nickname,
            hasToken: !!loginRes.token
          });

          const completedUserInfo = await this.completeUserProfile(loginRes);
          loginRes.userInfo = completedUserInfo;

          // 存储登录态
          this.syncUserStorage(loginRes.userInfo, loginRes.token);

          uni.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500
          });

          this.$emit('success', loginRes as LoginSuccessPayload);
          this.closeAvatarModal();

          // 处理跳转逻辑
          if (this.autoRedirect) {
            setTimeout(() => {
              // 首次登录处理
              const isFirst = loginRes.userInfo?.isfirst === 'yes';
              if (isFirst && this.firstLoginUrlBuilder != null) {
                const url = `/subpackages/register/reginfo?id=${loginRes.userInfo.id}&nickname=${loginRes.userInfo.nickname}&gender=${loginRes.userInfo.gender}`;
                uni.navigateTo({ url });
                return;
              }

              // 普通成功跳转
              switch (this.successNavType) {
                case 'back':
                  uni.navigateBack();
                  break;
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
            }, 1500);
          }
        } else {
          throw new Error('登录code已失效，请重新登录');
        }
      } catch (error: any) {
        console.error('登录失败:', error);
        console.error('[FloatWechatLogin] confirmUserInfo failed', this.buildErrorDebugInfo(error));
        
        let errorMessage = '登录失败，请重试';
        if (error?.code) {
          switch (error.code) {
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
        }
        
        uni.showModal({
          title: '登录失败',
          content: errorMessage,
          showCancel: false,
          confirmText: '确定'
        });

        this.$emit('error', error);
      } finally {
        uni.hideLoading();
        this.loading = false;
      }
    },

    /**
     * 处理微信小程序登录
     */
    async handleWechatLogin(): Promise<void> {
      if (this.disabled || this.loading) return;
      
      this.loading = true;
      console.log('[FloatWechatLogin] handleWechatLogin start');
      
      try {
        // 1. 使用wx.login获取code
        const loginRes = await new Promise<UniLoginSuccess>((resolve, reject) => {
          // #ifdef MP-WEIXIN
          wx.login({
            success: resolve,
            fail: reject
          });
          // #endif
        
        });
        
        if (loginRes.code) {
          console.log('获取到微信登录code:', loginRes.code);
          console.log('[FloatWechatLogin] handleWechatLogin code received', {
            loginCode: this.maskCode(loginRes.code)
          });
          
          // 2. 保存code，显示头像昵称设置弹窗
          this.loginCode = loginRes.code;
          this.showAvatarModal = true;
          this.loading = false;
        } else {
          throw new Error('获取微信登录code失败');
        }
        
      } catch (error: any) {
        console.error('微信登录失败:', error);
        console.error('[FloatWechatLogin] handleWechatLogin failed', this.buildErrorDebugInfo(error));
        
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
      console.log('[FloatWechatLogin] autoCheckCodeAndLogin h5 callback', {
        hasCode: !!code,
        code: this.maskCode(code || '')
      });
      if ( !code ) return;

      await this.processWechatLogin( code );
      wxauth.clearAuthParamsFromUrl();
      // #endif
      
      // #ifdef MP-WEIXIN
      // 微信小程序环境，检查是否有保存的code
      const savedCode = uni.getStorageSync('code');
      console.log('[FloatWechatLogin] autoCheckCodeAndLogin mp callback', {
        hasSavedCode: !!savedCode,
        code: this.maskCode(savedCode || '')
      });
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
      console.log('[FloatWechatLogin] startWechatLogin', {
        inWechat: wxauth.isInWechat(),
        successNavType: this.successNavType,
        successUrl: this.successUrl
      });
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
      console.log('[FloatWechatLogin] startWechatLogin h5 callback', {
        hasCode: !!code,
        code: this.maskCode(code || '')
      });
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
      console.log('[FloatWechatLogin] startMiniProgramLogin start');
      uni.showLoading({
        title: '微信登录中...',
        mask: true
      });

      try {
        // 调用微信小程序登录
        wxauth.authorize();
      } catch (error: any) {
        console.error('微信小程序登录失败:', error);
        console.error('[FloatWechatLogin] startMiniProgramLogin failed', this.buildErrorDebugInfo(error));
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
      console.log('[FloatWechatLogin] handleMiniProgramLoginSuccess', {
        code: this.maskCode(code)
      });
      await this.processWechatLogin(code);
    },

    async processWechatLogin ( code: string ): Promise<void> {
      console.log("processWechatLogin");
      console.log('[FloatWechatLogin] processWechatLogin start', {
        code: this.maskCode(code)
      });

      this.loading = true;
      uni.showLoading( {
        title: '微信登录中...',
        mask: true
      } );
      try {
        console.log('[FloatWechatLogin] processWechatLogin request', {
          api: 'apiService.loginByWeixin',
          code: this.maskCode(code)
        });
        const loginRes = await apiService.loginByWeixin( { code } );
        console.log('[FloatWechatLogin] processWechatLogin success', {
          userId: loginRes.userInfo?.id,
          isFirst: loginRes.userInfo?.isfirst,
          nickname: loginRes.userInfo?.nickname,
          hasToken: !!loginRes.token
        });

        // 存储登录态
        this.syncUserStorage( loginRes.userInfo, loginRes.token );

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
        console.error('[FloatWechatLogin] processWechatLogin failed', this.buildErrorDebugInfo(error));

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

/* 头像昵称设置弹窗样式 */
.avatar-modal-mask {
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

.avatar-modal-content {
  background-color: #ffffff;
  border-radius: 20rpx;
  width: 600rpx;
  max-width: 90%;
  max-height: 80%;
  overflow: hidden;
}

.avatar-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.avatar-modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.avatar-modal-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #999999;
  cursor: pointer;
}

.avatar-modal-body {
  padding: 30rpx;
}

.avatar-section, .nickname-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 15rpx;
  display: block;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 2rpx solid #e0e0e0;
  margin-bottom: 10rpx;
}

.avatar-edit-hint {
  font-size: 24rpx;
  color: #999999;
}

.nickname-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333333;
  background-color: #f8f8f8;
}

.avatar-modal-footer {
  display: flex;
  padding: 30rpx;
  border-top: 1rpx solid #f0f0f0;
  gap: 20rpx;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  border: none;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666666;
}

.confirm-btn {
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  color: #ffffff;
}

.confirm-btn--disabled {
  background: #cccccc;
  color: #999999;
}
</style>
