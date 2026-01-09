<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-title">
        <text>填写信息开启奇妙日</text>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view class="page-content" scroll-y>
      <view class="register-container">
        <view class="form-section">
          <!-- 用户名输入 -->
          <view class="input-group">
            <view class="input-label">
              <text>用户名</text>
            </view>
            <view class="input-wrapper">
              <input v-model=" form.username " type="text" placeholder="请输入用户名" placeholder-class="input-placeholder"
                class="input-field" maxlength="20" />
              <view v-if=" form.username " class="input-clear" @click="clearField( 'username' )">
                <text>✕</text>
              </view>
            </view>
          </view>

          <!-- 姓名输入 -->
          <view class="input-group">
            <view class="input-label">
              <text>姓名</text>
            </view>
            <view class="input-wrapper">
              <input v-model=" form.name " type="text" placeholder="请输入真实姓名" placeholder-class="input-placeholder"
                class="input-field" maxlength="10" />
              <view v-if=" form.name " class="input-clear" @click="clearField( 'name' )">
                <text>✕</text>
              </view>
            </view>
          </view>

          <!-- 性别选择 -->
          <view class="input-group">
            <view class="input-label">
              <text>性别</text>
            </view>
            <view class="gender-selector">
              <view class="gender-option" :class=" { 'gender-selected': form.gender === 'male' } "
                @click="selectGender( 'male' )">
                <text>男</text>
              </view>
              <view class="gender-option" :class=" { 'gender-selected': form.gender === 'female' } "
                @click="selectGender( 'female' )">
                <text>女</text>
              </view>

            </view>
          </view>

          <!-- 出生年月日选择 -->
          <view class="input-group">
            <view class="input-label">
              <text>出生年月</text>
            </view>
            <picker mode="date" :value=" form.birthday " fields="year-month" start="1900-01-01" :end=" today "
              @change=" onBirthdayChange ">
              <view class="input-wrapper">
                <input :value=" form.birthday || '请选择出生年月' " disabled placeholder-class="input-placeholder"
                  class="input-field" />
                <view class="date-picker-icon">
                  <text>📅</text>
                </view>
              </view>
            </picker>
          </view>

          <!-- 密码输入 -->
          <!-- <view class="input-group">
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
          </view> -->

          <!-- 确认密码 -->
          <!-- <view class="input-group">
            <view class="input-label">
              <text>确认密码</text>
            </view>
            <view class="input-wrapper">
              <input v-model=" form.passwordCheck " :type=" showPassword ? 'text' : 'password' " placeholder="请再次输入密码"
                placeholder-class="input-placeholder" class="input-field" maxlength="20" />
              <view class="input-action" @click=" togglePassword ">
                <text>{{ showPassword ? '👁️‍🗨️' : '👁️' }}</text>
              </view>
            </view>
          </view> -->

          <!-- 注册按钮 -->
          <view class="btn btn-primary register-btn" :class=" { 'btn-disabled': false } " @click=" handleRegister ">
            <text>立即开启奇妙日</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import apiService from '@/services/apiService';
import { validateUsername, validatePassword } from '@/utils/validate';
import { showToast } from '@/utils/uniUtils';

interface RegInfoForm
{
  username: string;
  name: string;
  gender: 'male' | 'female' | '';
  birthday: string;
  password: string;
  passwordCheck: string;
}

interface RegInfoPageData
{
  form: RegInfoForm;
  loading: boolean;
  showPassword: boolean;
  today: string;
  userid: number;
}

export default defineComponent( {
  name: 'RegisterInfo',

  data (): RegInfoPageData
  {
    // 获取当前日期作为选择器的最大值
    const today = new Date();
    const year = today.getFullYear();
    const month = String( today.getMonth() + 1 ).padStart( 2, '0' );
    const day = String( today.getDate() ).padStart( 2, '0' );

    return {
      form: {
        username: '',
        name: '',
        gender: 'male',
        birthday: '',
        password: '',
        passwordCheck: ''
      },
      showPassword: false,
      loading: false,
      today: `${ year }-${ month }-${ day }`,
      userid: 1

    };
  },

  computed: {
    // 表单验证
    isFormValid (): boolean
    {
      return this.form.username.length >= 3 &&
        this.form.name.length > 0 &&
        this.form.gender !== '' &&
        this.form.birthday !== ''
      // &&
      // this.form.password.length >= 6 &&
      // this.form.passwordCheck.length >= 6;
    }
  },

  onLoad ( options: any )
  {
    // 页面加载时可以初始化一些数据
    if ( options.nickname )
    {
      this.form.username = options.nickname;
      this.form.gender = parseInt(options.gender) == 0 ? 'male' : 'female';
      this.form.name = options.nickname;
      this.form.birthday = '1985-06-15';
      this.userid = options.id;
    }
  },

  onBackPress (): boolean | void
  {
    // 拦截系统返回（安卓物理返回、导航返回等），避免误退出
    uni.showModal( {
      title: '提示',
      content: '信息还未保存，确定要返回吗？',
      confirmText: '返回',
      cancelText: '继续填写',
      success: ( res ) =>
      {
        if ( res.confirm )
        {
          uni.switchTab( {
            url: '/pages/index/index'
          } );
        }
      }
    } );

    // 返回 true 表示已处理，阻止默认返回
    return true;
  },

  methods: {
    // 清除字段
    clearField ( field: keyof RegInfoForm )
    {
      this.form[ field ] = '';
    },

    // 切换密码显示
    togglePassword ()
    {
      this.showPassword = !this.showPassword;
    },

    // 选择性别
    selectGender ( gender: 'male' | 'female' )
    {
      this.form.gender = gender;
    },

    // 出生日期变化
    onBirthdayChange ( e: any )
    {
      this.form.birthday = e.detail.value;
    },

    // 验证表单
    validateForm (): boolean
    {
      if ( !validateUsername( this.form.username ) )
      {
        showToast( '用户名长度需在1-20位之间', 'none' );
        return false;
      }

      if ( !this.form.name.trim() )
      {
        showToast( '请输入姓名', 'none' );
        return false;
      }

      if ( this.form.gender === '' )
      {
        showToast( '请选择性别', 'none' );
        return false;
      }

      if ( !this.form.birthday )
      {
        showToast( '请选择出生年月', 'none' );
        return false;
      }

      // if ( !validatePassword( this.form.password ) )
      // {
      //   showToast( '密码长度为6-20位', 'none' );
      //   return false;
      // }

      // if ( this.form.password !== this.form.passwordCheck )
      // {
      //   showToast( '两次输入的密码不一致', 'none' );
      //   return false;
      // }

      return true;
    },

    // 处理注册
    async handleRegister ()
    {
      // 1. 表单验证
      if ( !this.validateForm() )
      {
        return;
      }

      // 防止重复提交
      if ( this.loading ) return;
      this.loading = true;

      // 2. 显示加载状态
      uni.showLoading( {
        title: '加载中...',
        mask: true
      } );

      try
      {
        // 3. 调用注册接口
        const retReg = await apiService.initInfo( {
          id: this.userid,
          username: this.form.username,
          name: this.form.name,
          gender: this.form.gender=='male'?'0':'1',
          birthday: this.form.birthday,
          password: this.form.password
        } );

        // 4. 注册成功处理
        uni.hideLoading();
        showToast( '恭喜您完成信息填写！', 'success' );

        // 保存账户信息到本地存储
        uni.setStorageSync( 'saved_account', {
          username: this.form.username,
          password: this.form.password,
        } );

        // 5. 延迟跳转，确保用户能看到成功提示
        setTimeout( () =>
        {
          uni.switchTab( {
            url: '/pages/index/index'
          } );
        }, 1500 );

      } catch ( error: any )
      {
        // 6. 隐藏加载状态
        uni.hideLoading();

        // 7. 错误处理逻辑
        let errorMessage = '信息填写失败，请稍后重试';

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

        // 8. 显示错误提示
        showToast( errorMessage, 'none' );
      } finally
      {
        this.loading = false;
      }
    }
  }
} );
</script>
<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f9ff 0%, #e8f4ff 100%);
}

.navbar {
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24rpx;
  background-color: transparent;
  position: relative;
  z-index: 1;
}

.navbar-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #1890ff;
}

.page-content {
  height: calc(100vh - 100rpx);
  padding: 36rpx 28rpx;
}

.register-container {
  display: flex;
  flex-direction: column;
}

.form-section {
  flex: 1;
}

.input-group {
  margin-bottom: 32rpx;
  display: flex;
  align-items: center;
}

.input-label {
  font-size: 34rpx;
  font-weight: 500;
  color: #333333;
  width: 180rpx;
  flex-shrink: 0;
  margin-right: 24rpx;
}

.input-wrapper {
  position: relative;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  border: 2rpx solid #e8f4ff;
  display: flex;
  align-items: center;
  flex: 1;
  height: 92rpx;
  box-sizing: border-box;
}

.input-field {
  flex: 1;
  font-size: 34rpx;
  color: #333333;
  height: 48rpx;
  line-height: 48rpx;
}

.input-placeholder {
  font-size: 32rpx;
  color: #aaaaaa;
}

.input-clear,
.input-action,
.date-picker-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #999999;
  flex-shrink: 0;
}

.input-clear {
  color: #cccccc;
}

/* 性别选择器样式 */
.gender-selector {
  display: flex;
  gap: 24rpx;
  flex: 1;
}

.gender-option {
  flex: 1;
  padding: 24rpx 0;
  text-align: center;
  background-color: #ffffff;
  border-radius: 20rpx;
  border: 2rpx solid #e8f4ff;
  font-size: 34rpx;
  color: #666666;
  transition: all 0.2s ease;
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gender-selected {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #ffffff;
  font-weight: 500;
}

/* 日期选择器样式 */
picker {
  flex: 1;
}

/* 注册按钮样式 */
.register-btn {
  margin-top: 56rpx;
  margin-bottom: 40rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 40rpx;
  border-radius: 20rpx;
  font-size: 38rpx;
  font-weight: 600;
  transition: all 0.2s ease;
  height: 104rpx;
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

/* 响应式调整 */
@media (max-width: 750rpx) {
  .page-content {
    padding: 28rpx 24rpx;
  }

  .input-group {
    margin-bottom: 28rpx;
  }

  .input-label {
    width: 160rpx;
    font-size: 32rpx;
    margin-right: 20rpx;
  }

  .input-wrapper {
    height: 88rpx;
    padding: 24rpx 28rpx;
  }

  .gender-option {
    height: 88rpx;
    padding: 22rpx 0;
    font-size: 32rpx;
  }

  .btn {
    height: 96rpx;
    padding: 28rpx 36rpx;
    font-size: 36rpx;
  }
}
</style>