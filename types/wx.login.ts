// types/wx-login.d.ts
declare namespace WXLogin
{
    // 微信授权响应
    interface AuthResponse
    {
        code?: string;
        state?: string;
        errMsg?: string;
    }

    // 用户信息
    interface UserInfo
    {
        openid: string;
        nickname: string;
        sex: number;
        province: string;
        city: string;
        country: string;
        headimgurl: string;
        privilege: string[];
        unionid?: string;
    }

    // 登录参数
    interface LoginParams
    {
        appId: string;
        scope?: 'snsapi_base' | 'snsapi_userinfo';
        state?: string;
        redirectUri: string;
    }

    // 配置参数
    interface Config
    {
        appId: string;
        redirectUri?: string;
        state?: string;
    }
}