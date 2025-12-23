<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-title">
        <text>登录</text>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view class="page-content">
      <view class="login-container">
        <!-- 欢迎标题 -->

        <!-- 登录表单 -->
        <view class="form-section">
          <!-- 用户名输入 -->
          <view class="input-group">
            <view class="input-label">
              <text>用户名</text>
            </view>
            <view class="input-wrapper">
              <input v-model=" form.username " type="text" placeholder="请输入用户名" placeholder-class="input-placeholder"
                class="input-field" maxlength="11" />
              <view v-if=" form.username " class="input-clear" @click=" clearusername ">
                <text>✕</text>
              </view>
            </view>
          </view>

          <!-- 密码输入 -->
          <view class="input-group">
            <view class="input-label">
              <text>密码</text>
            </view>
            <view class="input-wrapper">
              <input v-model=" form.password " :type=" showPassword ? 'text' : 'password' " placeholder="请输入密码"
                placeholder-class="input-placeholder" class="input-field" maxlength="20" />
              <view class="input-action" @click=" togglePassword ">
                <text>{{ showPassword ? '👁️‍🗨️' : '👁️' }}</text>
              </view>
            </view>
          </view>

          <!-- 记住密码和忘记密码 -->
          <view class="form-options">
            <view class="remember-me" @click=" toggleRemember ">
              <view class="checkbox" :class=" { 'checkbox-checked': form.remember } ">
                <text v-if=" form.remember " class="checkbox-icon">✓</text>
              </view>
              <text class="checkbox-label">记住密码</text>
            </view>
            <view class="forgot-password" @click="">
              <text>忘记密码？</text>
            </view>
          </view>

          <!-- 登录按钮 -->
          <!-- <view class="btn btn-primary login-btn" :class=" { 'btn-disabled': !isFormValid } " @click=" handleLogin ">
            <text>登录</text>
          </view> -->
          <view class="btn btn-primary login-btn" :class=" { 'btn-disabled': !isFormValid } "
            @click=" handleWechatLogin ">
            <text>微信号登录</text>
          </view>

          <!-- 注册链接 -->
          <!-- <view class="register-link">
            <text>还没有账号？</text>
            <text class="register-text" @click=" handleRegister ">立即注册</text>
          </view> -->
        </view>

      </view>
    </scroll-view>

    <!-- 加载提示 -->
    <!-- // <uni-load-more v-if="loading" :status="loading ? 'loading' : 'more'" color="#1890ff"></uni-load-more> -->
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import apiService from '@/services/apiService';
import { validateUsername, validatePassword } from '@/utils/validate';
import { showToast, } from '@/utils/uniUtils';
import wxauth from '@/utils/wxauth';

interface LoginForm
{
  username: string;
  password: string;
  remember: boolean;
}

interface LoginPageData
{
  form: LoginForm;
  showPassword: boolean;
  loading: boolean;
  isWechat: boolean;
}

export default defineComponent( {
  name: 'Login',

  data (): LoginPageData
  {
    return {
      form: {
        username: '',
        password: '',
        remember: true
      },
      showPassword: false,
      loading: false,
      isWechat: false,
    };
  },

  computed: {
    // 表单验证
    isFormValid (): boolean
    {
      // return validateusername(this.form.username) && validatePassword(this.form.password);
      return true;
    }
  },

  onLoad ()
  {
    // 1. 判断环境
    this.isWechat = wxauth.isInWechat();
    if ( this.isWechat )
      this.handleWechatCallback();
    // 2. 处理微信授权回调（如果是从微信跳转回来，URL会带code）
    this.loadSavedAccount();
  },

  methods: {
    async handleWechatCallback ()
    {
      const code = wxauth.handleAuthCallback();
      if ( code )
      {
        await this.processWechatLogin( code );
        wxauth.clearAuthParamsFromUrl();
      }
    },

    async handleWechatLogin ()
    {
      if ( this.loading ) return;

      if ( !this.isWechat )
      {
        uni.showModal( {
          title: '提示',
          content: '请在微信客户端中打开此页面使用微信登录',
          showCancel: false
        } );
        return;
      }

      const code = wxauth.handleAuthCallback();
      if ( code )
      {
        await this.processWechatLogin( code );
        wxauth.clearAuthParamsFromUrl();
      } else
      {
        wxauth.authorize();
      }
    },

    async processWechatLogin ( code: string )
    {
      if ( this.loading ) return;

      this.loading = true;
      uni.showLoading( {
        title: '微信登录中...',
        mask: true
      } );

      try
      {
        const loginRes = await apiService.loginByWeixin( { code: code } );

        uni.setStorageSync( 'token', loginRes.token );
        uni.setStorageSync( 'userInfo', JSON.stringify( loginRes.userInfo ) );
        uni.setStorageSync( 'userid', loginRes.userInfo.id )
        uni.showToast( {
          title: '微信登录成功',
          icon: 'success',
          duration: 1500
        } );
        if ( loginRes.userInfo.isfirst == 'yes' )
          setTimeout( () =>
          {
            uni.navigateTo( { url: `/subpackages/register/reginfo?nickname=${ loginRes.userInfo.nickname }&gender=${ loginRes.userInfo.sex }` } );
          }, 1500 );
        else
          setTimeout( () =>
          {
            uni.switchTab( { url: '/pages/index/index' } )
          }, 1500 );
      } catch ( error: any )
      {
        console.error( '微信登录失败:', error );

        let errorMessage = '微信登录失败，请重试';
        if ( error.code )
        {
          switch ( error.code )
          {
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
        } else if ( error.response?.status === 401 )
        {
          errorMessage = '登录验证失败';
        }

        uni.showToast( {
          title: errorMessage,
          icon: 'none',
          duration: 3000
        } );

        uni.removeStorageSync( 'token' );
        uni.removeStorageSync( 'userInfo' );

      } finally
      {
        uni.hideLoading();
        this.loading = false;
      }
    }
    ,


    // 加载保存的账号信息
    loadSavedAccount ()
    {
      try
      {
        const savedAccount = uni.getStorageSync( 'saved_account' );
        if ( savedAccount )
        {
          this.form.username = savedAccount.username || '';
          this.form.password = savedAccount.password || '';
          this.form.remember = savedAccount.remember || false;
        }
      } catch ( error )
      {
        console.error( '加载保存的账号失败:', error );
      }
    },

    // 保存账号信息
    saveAccount ()
    {
      if ( this.form.remember )
      {
        uni.setStorageSync( 'saved_account', {
          username: this.form.username,
          password: this.form.password,
          remember: this.form.remember,
        } );
      } else
      {
        uni.removeStorageSync( 'saved_account' );
      }
    },

    // 清除用户名
    clearusername ()
    {
      this.form.username = '';
    },

    // 切换密码显示
    togglePassword ()
    {
      this.showPassword = !this.showPassword;
    },

    // 切换记住密码
    toggleRemember ()
    {
      this.form.remember = !this.form.remember;
    },

    // 验证表单
    validateForm (): boolean
    {
      if ( !validateUsername( this.form.username ) )
      {
        showToast( '请输入正确的用户名', 'none' );
        return false;
      }

      if ( !validatePassword( this.form.password ) )
      {
        showToast( '密码长度为6-20位', 'none' );
        return false;
      }

      return true;
    },

    async handleLogin ()
    {
      // 1. 表单验证（可选的）
      // if (!this.validateForm()) {
      //   return;
      // }
      // 2. 防止重复提交
      if ( this.loading ) return;
      this.loading = true;

      // 3. 显示加载状态
      uni.showLoading( {
        title: '登录中...',
        mask: true
      } );

      try
      {
        // 4. 调用注册接口
        const retLogin = await apiService.loginUser( {
          username: this.form.username,
          password: this.form.password
        } );

        // 5. 注册成功处理
        uni.hideLoading();
        showToast( '登录成功', 'success' );
        uni.setStorageSync( 'saved_account', {
          username: this.form.username,
          password: this.form.password,
        } );
        uni.setStorageSync( 'token', retLogin.data.token );
        uni.setStorageSync( 'userid', retLogin.data.userid );
        console.log( retLogin )
        // 6. 延迟跳转，确保用户能看到成功提示
        setTimeout( () =>
        {
          // 使用重定向而非导航，避免用户能返回注册页
          // uni.switchTab( {
          //   url: '/pages/index/index'
          // } );
        }, 800 );

      } catch ( error: any )
      {
        // 7. 隐藏加载状态
        uni.hideLoading();
        // 8. 错误处理逻辑
        let errorMessage = '登录失败，请稍后重试';

        // 根据错误类型显示不同的提示
        if ( error.response )
        {
          // 服务器返回了错误状态码
          const status = error.response.status;
          const data = error.response.data;

          switch ( status )
          {
            case 400:
              errorMessage = data?.message || '请求参数错误';
              break;
            case 409:
              errorMessage = '用户名已存在';
              break;
            case 500:
              errorMessage = '服务器内部错误，请稍后重试';
              break;
            default:
              errorMessage = data?.message || `请求失败(${ status })`;
          }
        } else if ( error.request )
        {
          // 请求已发送但没有收到响应
          errorMessage = '网络连接失败，请检查网络';
        } else
        {
          // 请求配置出错
          errorMessage = error.message || '请求发送失败';
        }

        // 9. 显示错误提示
        showToast( errorMessage, 'none' );
      } finally
      {
        this.loading = false;

      }
    },
    // 处理注册
    handleRegister ()
    {
      uni.navigateTo( {
        url: '/subpackages/register/register'
      } );
    },

    // 处理忘记密码
    handleForgotPassword ()
    {
      uni.navigateTo( {
        url: '/pages/forgot/forgot'
      } );
    },

    // 处理微信登录
    // handleWechatLogin() {
    //   uni.showModal({
    //     title: '提示',
    //     content: '微信登录功能暂未开放',
    //     showCancel: false
    //   });
    // },

    // 处理QQ登录
    handleQQLogin ()
    {
      uni.showModal( {
        title: '提示',
        content: 'QQ登录功能暂未开放',
        showCancel: false
      } );
    },

    // 处理手机验证码登录
    handleusernameLogin ()
    {
      uni.navigateTo( {
        url: '/pages/login-username/login-username'
      } );
    },

    // 处理用户协议
    handleUserAgreement ()
    {
      uni.navigateTo( {
        url: '/pages/agreement/user-agreement'
      } );
    },

    // 处理隐私政策
    handlePrivacyPolicy ()
    {
      uni.navigateTo( {
        url: '/pages/agreement/privacy-policy'
      } );
    }
  },

} );
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f9ff 0%, #e8f4ff 100%);
}

.navbar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 30rpx;
  background-color: transparent;
  position: relative;
  z-index: 1;
}

.navbar-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1890ff;
}

.page-content {
  height: 100vh;
  padding: 40rpx 30rpx;
}

.login-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.welcome-section {
  margin-top: 60rpx;
  margin-bottom: 80rpx;
  text-align: center;
}

.welcome-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 16rpx;
}

.welcome-subtitle {
  display: block;
  font-size: 28rpx;
  color: #666666;
}

.form-section {
  flex: 1;
}

.input-group {
  margin-bottom: 40rpx;
}

.input-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 16rpx;
}

.input-wrapper {
  position: relative;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  border: 2rpx solid #e8f4ff;
  display: flex;
  align-items: center;
}

.input-field {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  height: 40rpx;
}

.input-placeholder {
  font-size: 28rpx;
  color: #aaaaaa;
}

.input-clear,
.input-action {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #999999;
}

.input-clear {
  color: #cccccc;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60rpx;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.checkbox {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  border: 2rpx solid #cccccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-checked {
  background-color: #1890ff;
  border-color: #1890ff;
}

.checkbox-icon {
  font-size: 24rpx;
  color: #ffffff;
}

.checkbox-label {
  font-size: 24rpx;
  color: #666666;
}

.forgot-password {
  font-size: 24rpx;
  color: #1890ff;
}

.login-btn {
  margin-bottom: 40rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 40rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #1890ff;
  color: #ffffff;
}

.btn-disabled {
  background-color: #cccccc;
  color: #ffffff;
  pointer-events: none;
}

.register-link {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 60rpx;
}

.register-link text {
  font-size: 24rpx;
  color: #666666;
}

.register-text {
  color: #1890ff !important;
}

.other-login {
  margin-bottom: 40rpx;
}

.divider {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.divider-line {
  flex: 1;
  height: 2rpx;
  background-color: #e8f4ff;
}

.divider-text {
  padding: 0 20rpx;
  font-size: 24rpx;
  color: #999999;
}

.login-methods {
  display: flex;
  justify-content: center;
  gap: 60rpx;
}

.method-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.method-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  background-color: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.wechat {
  color: #07C160;
}

.qq {
  color: #12B7F5;
}

.username {
  color: #1890ff;
}

.method-name {
  font-size: 22rpx;
  color: #666666;
}

.agreement {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 40rpx;
  padding: 20rpx;
}

.agreement-text {
  font-size: 22rpx;
  color: #999999;
}

.agreement-link {
  font-size: 22rpx;
  color: #1890ff;
}
</style>