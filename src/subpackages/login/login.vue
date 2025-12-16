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
              <input v-model="form.username" type="text" placeholder="请输入用户名" placeholder-class="input-placeholder"
                class="input-field" maxlength="11" />
              <view v-if="form.username" class="input-clear" @click="clearusername">
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
              <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码"
                placeholder-class="input-placeholder" class="input-field" maxlength="20" />
              <view class="input-action" @click="togglePassword">
                <text>{{ showPassword ? '👁️‍🗨️' : '👁️' }}</text>
              </view>
            </view>
          </view>

          <!-- 记住密码和忘记密码 -->
          <view class="form-options">
            <view class="remember-me" @click="toggleRemember">
              <view class="checkbox" :class="{ 'checkbox-checked': form.remember }">
                <text v-if="form.remember" class="checkbox-icon">✓</text>
              </view>
              <text class="checkbox-label">记住密码</text>
            </view>
            <view class="forgot-password" @click="">
              <text>忘记密码？</text>
            </view>
          </view>

          <!-- 登录按钮 -->
          <view class="btn btn-primary login-btn" :class="{ 'btn-disabled': !isFormValid }" @click="handleLogin">
            <text>登录/注册</text>
          </view>

          <!-- 注册链接 -->
          <!-- <view class="register-link">
              <text>还没有账号？</text>
              <text class="register-text" @click="handleRegister">立即注册</text>
            </view> -->

          <!-- 其他登录方式 -->
          <!-- <view class="other-login">
              <view class="divider">
                <view class="divider-line"></view>
                <text class="divider-text">其他方式登录</text>
                <view class="divider-line"></view>
              </view>
              <view class="login-methods">
                <view class="method-item" @click="handleWechatLogin">
                  <view class="method-icon wechat">
                    <text>💬</text>
                  </view>
                  <text class="method-name">微信</text>
                </view>
                <view class="method-item" @click="handleQQLogin">
                  <view class="method-icon qq">
                    <text>🐧</text>
                  </view>
                  <text class="method-name">QQ</text>
                </view>
                <view class="method-item" @click="handleusernameLogin">
                  <view class="method-icon username">
                    <text>📱</text>
                  </view>
                  <text class="method-name">短信验证</text>
                </view>
              </view>
            </view> -->
        </view>

        <!-- 协议声明 -->
        <view class="agreement">
          <text class="agreement-text">登录即表示同意</text>
          <text class="agreement-link" @click="">《用户协议》</text>
          <text class="agreement-text">和</text>
          <text class="agreement-link" @click="">《隐私政策》</text>
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

interface LoginForm {
  username: string;
  password: string;
  remember: boolean;
}

interface LoginPageData {
  form: LoginForm;
  showPassword: boolean;
  loading: boolean;
}

export default defineComponent({
  name: 'Login',

  data(): LoginPageData {
    return {
      form: {
        username: '',
        password: '',
        remember: true
      },
      showPassword: false,
      loading: false
    };
  },

  computed: {
    // 表单验证
    isFormValid(): boolean {
      // return validateusername(this.form.username) && validatePassword(this.form.password);
      return true;
    }
  },

  onLoad() {
    this.loadSavedAccount();
  },

  methods: {
    // 加载保存的账号信息
    loadSavedAccount() {
      try {
        const savedAccount = uni.getStorageSync('saved_account');
        if (savedAccount) {
          this.form.username = savedAccount.username || '';
          this.form.password = savedAccount.password || '';
          this.form.remember = savedAccount.remember || false;
        }
      } catch (error) {
        console.error('加载保存的账号失败:', error);
      }
    },

    // 保存账号信息
    saveAccount() {
      if (this.form.remember) {
        uni.setStorageSync('saved_account', {
          username: this.form.username,
          password: this.form.password,
          remember: this.form.remember,
        });
      } else {
        uni.removeStorageSync('saved_account');
      }
    },

    // 清除用户名
    clearusername() {
      this.form.username = '';
    },

    // 切换密码显示
    togglePassword() {
      this.showPassword = !this.showPassword;
    },

    // 切换记住密码
    toggleRemember() {
      this.form.remember = !this.form.remember;
    },

    // 验证表单
    validateForm(): boolean {
      if (!validateUsername(this.form.username)) {
        showToast('请输入正确的用户名', 'none');
        return false;
      }

      if (!validatePassword(this.form.password)) {
        showToast('密码长度为6-20位', 'none');
        return false;
      }

      return true;
    },

    // 处理登录
    async handleLogin() {
      // if (!this.validateForm()) {
      //   return;
      // }
      if (this.loading) return;
      this.loading = true;

      // 调用登录接口
      const result = await apiService.loginUser({
        username: this.form.username,
        password: this.form.password
      });

      if (result.code == 1) {
        //注册
        const retReg = await apiService.registerUser(
          {
            username: this.form.username,
            password: this.form.password
          }
        );
        if (retReg.code != 0) {
          showToast(retReg.msg || '注册失败', 'none');
          this.loading = false;
        } else {
          showToast(retReg.msg);
        }
      } else if (result.code == 2) {
        showToast('密码错误', 'none');
        this.loading = false;
        return;
      }
      // 保存token
      uni.setStorageSync('token', result.data.token);
      uni.setStorageSync('userid', result.data.id);

      // 保存账号信息（如果需要）
      this.saveAccount();

      // 跳转到首页
      uni.switchTab({
        url: '/pages/index/index'
      });

      showToast('登录成功', 'success');
    }
  },

  // 处理注册
  handleRegister() {
    uni.navigateTo({
      url: '/pages/register/register'
    });
  },

  // 处理忘记密码
  handleForgotPassword() {
    uni.navigateTo({
      url: '/pages/forgot/forgot'
    });
  },

  // 处理微信登录
  handleWechatLogin() {
    uni.showModal({
      title: '提示',
      content: '微信登录功能暂未开放',
      showCancel: false
    });
  },

  // 处理QQ登录
  handleQQLogin() {
    uni.showModal({
      title: '提示',
      content: 'QQ登录功能暂未开放',
      showCancel: false
    });
  },

  // 处理手机验证码登录
  handleusernameLogin() {
    uni.navigateTo({
      url: '/pages/login-username/login-username'
    });
  },

  // 处理用户协议
  handleUserAgreement() {
    uni.navigateTo({
      url: '/pages/agreement/user-agreement'
    });
  },

  // 处理隐私政策
  handlePrivacyPolicy() {
    uni.navigateTo({
      url: '/pages/agreement/privacy-policy'
    });
  }
});
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