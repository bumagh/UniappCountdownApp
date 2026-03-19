// utils/wx-service-login.ts
/**
 * 微信服务号登录工具类
 */
class WXServiceLogin {
    appId = '';
    redirectUri = '';
    state = 'STATE';
    constructor(config) {
        this.appId = config.appId;
        this.redirectUri = config.redirectUri || window.location.href.split('#')[0];
        this.state = config.state || 'STATE_' + Date.now();
    }
    /**
     * 初始化微信配置
     */
    async initWechatConfig() {
        // 这里需要从后端获取签名配置
        try {
            const config = await this.getWechatConfig();
            return new Promise((resolve) => {
                uni.config({
                    debug: false,
                    appId: config.appId,
                    timestamp: config.timestamp,
                    nonceStr: config.nonceStr,
                    signature: config.signature,
                    jsApiList: [
                        'checkJsApi',
                        'onMenuShareTimeline',
                        'onMenuShareAppMessage',
                        'onMenuShareQQ',
                        'onMenuShareWeibo',
                        'onMenuShareQZone',
                        'hideMenuItems',
                        'showMenuItems',
                        'hideAllNonBaseMenuItem',
                        'showAllNonBaseMenuItem',
                        'translateVoice',
                        'startRecord',
                        'stopRecord',
                        'onVoiceRecordEnd',
                        'playVoice',
                        'onVoicePlayEnd',
                        'pauseVoice',
                        'stopVoice',
                        'uploadVoice',
                        'downloadVoice',
                        'chooseImage',
                        'previewImage',
                        'uploadImage',
                        'downloadImage',
                        'getNetworkType',
                        'openLocation',
                        'getLocation',
                        'hideOptionMenu',
                        'showOptionMenu',
                        'closeWindow',
                        'scanQRCode',
                        'chooseWXPay',
                        'openProductSpecificView',
                        'addCard',
                        'chooseCard',
                        'openCard'
                    ],
                    success: () => {
                        resolve(true);
                    },
                    fail: (err) => {
                        console.error('微信配置失败:', err);
                        resolve(false);
                    }
                });
            });
        }
        catch (error) {
            console.error('获取微信配置失败:', error);
            return false;
        }
    }
    /**
     * 获取微信配置（需要后端接口）
     */
    async getWechatConfig() {
        const currentUrl = encodeURIComponent(window.location.href.split('#')[0]);
        try {
            const response = await uni.request({
                url: '/api/wechat/config',
                method: 'POST',
                data: { url: currentUrl }
            });
            return response.data.data;
        }
        catch (error) {
            throw new Error('获取微信配置失败');
        }
    }
    /**
     * 检查是否在微信环境中
     */
    isWechatBrowser() {
        const ua = navigator.userAgent.toLowerCase();
        return ua.indexOf('micromessenger') !== -1;
    }
    /**
     * 获取URL参数
     */
    getUrlParam(name) {
        const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
        const r = window.location.search.substr(1).match(reg);
        if (r != null)
            return decodeURIComponent(r[2]);
        return null;
    }
    /**
     * 生成随机字符串
     */
    generateNonceStr(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    /**
     * 跳转到微信授权页面
     */
    redirectToWechatAuth(params) {
        const { appId, scope = 'snsapi_userinfo', state = this.state, redirectUri } = params;
        const encodedRedirectUri = encodeURIComponent(redirectUri);
        const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
        window.location.href = authUrl;
    }
    /**
     * 处理授权回调
     */
    async handleAuthCallback() {
        const code = this.getUrlParam('code');
        const state = this.getUrlParam('state');
        if (!code) {
            return null;
        }
        // 验证state防止CSRF攻击
        if (state !== this.state) {
            console.warn('State验证失败，可能存在安全风险');
        }
        return code;
    }
    /**
     * 通过code获取access_token和用户信息
     */
    async getUserInfoByCode(code) {
        try {
            // 通过code获取access_token（需要后端接口）
            const tokenResponse = await uni.request({
                url: '/api/wechat/access-token',
                method: 'POST',
                data: { code }
            });
            const { access_token, openid, scope } = tokenResponse.data.data;
            // 如果是snsapi_base，只返回openid
            if (scope === 'snsapi_base') {
                return { openid, nickname: '', sex: 0, province: '', city: '', country: '', headimgurl: '', privilege: [] };
            }
            // 如果是snsapi_userinfo，获取用户详细信息
            const userInfoResponse = await uni.request({
                url: '/api/wechat/user-info',
                method: 'POST',
                data: { access_token, openid }
            });
            return userInfoResponse.data.data;
        }
        catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }
    /**
     * 静默登录（snsapi_base）
     */
    async silentLogin() {
        if (!this.isWechatBrowser()) {
            console.warn('非微信浏览器，无法使用微信登录');
            return null;
        }
        const code = await this.handleAuthCallback();
        if (!code) {
            // 没有code，需要跳转授权
            this.redirectToWechatAuth({
                appId: this.appId,
                scope: 'snsapi_base',
                redirectUri: this.redirectUri,
                state: this.state
            });
            return null;
        }
        const userInfo = await this.getUserInfoByCode(code);
        return userInfo?.openid || null;
    }
    /**
     * 授权登录（snsapi_userinfo）
     */
    async authLogin() {
        if (!this.isWechatBrowser()) {
            console.warn('非微信浏览器，无法使用微信登录');
            return null;
        }
        const code = await this.handleAuthCallback();
        if (!code) {
            // 没有code，需要跳转授权
            this.redirectToWechatAuth({
                appId: this.appId,
                scope: 'snsapi_userinfo',
                redirectUri: this.redirectUri,
                state: this.state
            });
            return null;
        }
        return await this.getUserInfoByCode(code);
    }
    /**
     * 检查登录状态
     */
    async checkLoginStatus() {
        const token = uni.getStorageSync('wx_access_token');
        if (!token) {
            return false;
        }
        try {
            const response = await uni.request({
                url: '/api/wechat/check-token',
                method: 'POST',
                data: { token }
            });
            return response.data.data.valid;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 获取本地存储的用户信息
     */
    getLocalUserInfo() {
        const userInfo = uni.getStorageSync('wx_user_info');
        return userInfo ? JSON.parse(userInfo) : null;
    }
    /**
     * 保存用户信息到本地
     */
    saveUserInfo(userInfo) {
        uni.setStorageSync('wx_user_info', JSON.stringify(userInfo));
    }
    /**
     * 清除登录信息
     */
    clearLoginInfo() {
        uni.removeStorageSync('wx_access_token');
        uni.removeStorageSync('wx_user_info');
        uni.removeStorageSync('wx_openid');
    }
}
export default WXServiceLogin;
//# sourceMappingURL=wx-service-login.js.map