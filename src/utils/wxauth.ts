// utils/wxAuth.ts

class WxAuth
{
    private appId: string; // 微信公众号AppID
    private redirectUri: string; // 授权后重定向的回调链接地址
    private state: string = 'STATE'; // 可选，用于防止CSRF

    constructor ( appId: string )
    {
        this.appId = appId;
        // 重要：回调地址需要是当前页面的完整URL，且必须与公众号网页授权域名一致
        // #ifdef H5
        this.redirectUri = encodeURIComponent( window.location.href.split( '#' )[ 0 ] );
        // #endif
        
        // #ifdef MP-WEIXIN
        // 微信小程序环境，不需要网页授权回调地址
        this.redirectUri = '';
        // #endif
    }

    /**
     * 判断当前是否在微信浏览器内
     */
    isInWechat (): boolean
    {
        // #ifdef H5
        const ua = navigator.userAgent.toLowerCase();
        return ua.indexOf( 'micromessenger' ) !== -1;
        // #endif
        
        // #ifdef MP-WEIXIN
        // 微信小程序环境，直接返回true
        return true;
        // #endif
    }

    /**
     * 获取URL中的查询参数
     */
    private getQueryParam ( name: string ): string | null
    {
        // #ifdef H5
        const reg = new RegExp( `(^|&)${ name }=([^&]*)(&|$)` );
        const match = window.location.search.substr( 1 ).match( reg );
        if ( match != null ) return decodeURIComponent( match[ 2 ] );
        return null;
        // #endif
        
        // #ifdef MP-WEIXIN
        // 微信小程序环境，使用uni.getLaunchOptionsSync获取参数
        const launchOptions = uni.getLaunchOptionsSync();
        return launchOptions.query && launchOptions.query[name] ? launchOptions.query[name] : null;
        // #endif
    }

    /**
     * 检查URL中是否有微信回调的code，并清除它（避免重复使用）
     */
    public handleAuthCallback (): string | null
    {
        const code = this.getQueryParam( 'code' );
        const state = this.getQueryParam( 'state' );

        if ( code )
        {
            // 成功获取到code，可以从URL中移除，保持地址栏干净
            // #ifdef H5
            this.clearCodeFromUrl();
            // #endif
            return code;
        }
        return null;
    }
    /**
      * 清除URL中的授权参数
      */
    clearAuthParamsFromUrl (): void
    {
        // #ifdef H5
        // 获取当前URL（不包含参数和hash）
        const urlWithoutParams = window.location.origin + window.location.pathname;

        // 替换当前URL，移除参数
        window.history.replaceState( {}, document.title, urlWithoutParams );
        // #endif
        
        // #ifdef MP-WEIXIN
        // 微信小程序环境，不需要清除URL参数
        // #endif
    }
    /**
     * 清除URL中的code和state参数，避免刷新页面重复提交
     */
    private clearCodeFromUrl (): void
    {
        // #ifdef H5
        const url = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState( {}, document.title, url );
        // #endif
        
        // #ifdef MP-WEIXIN
        // 微信小程序环境，不需要清除URL参数
        // #endif
    }

    /**
     * 跳转到微信授权页面
     * @param scope 授权作用域: snsapi_base (静默授权，仅openid) 或 snsapi_userinfo (需用户同意，获取用户信息)
     */
    public authorize ( scope: 'snsapi_base' | 'snsapi_userinfo' = 'snsapi_userinfo' ): void
    {
        // #ifdef H5
        if ( !this.isInWechat() )
        {
            uni.showModal( {
                title: '提示',
                content: '请在微信客户端中打开此页面',
                showCancel: false
            } );
            return;
        }

        // 构造微信授权URL
        const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${ this.appId }&redirect_uri=${ this.redirectUri }&response_type=code&scope=${ scope }&state=${ this.state }#wechat_redirect`;

        // 跳转
        window.location.href = authUrl;
        // #endif
        
        // #ifdef MP-WEIXIN
        // 微信小程序环境，使用wx.login获取code
        uni.login({
            provider: 'weixin',
            success: (loginRes) => {
                console.log('微信小程序登录成功，code:', loginRes.code);
                // 在小程序中，登录成功后可以直接使用loginRes.code
                // 不需要跳转到网页授权
            },
            fail: (error) => {
                console.error('微信小程序登录失败:', error);
                uni.showModal({
                    title: '登录失败',
                    content: '微信登录失败，请重试',
                    showCancel: false
                });
            }
        });
        // #endif
    }
}

// 导出单例，请替换为您的真实公众号AppID
export default new WxAuth( 'wxc164b903f978d83d' );