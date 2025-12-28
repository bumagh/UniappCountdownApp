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
        this.redirectUri = encodeURIComponent( window.location.href.split( '#' )[ 0 ] );
    }

    /**
     * 判断当前是否在微信浏览器内
     */
    isInWechat (): boolean
    {
        const ua = navigator.userAgent.toLowerCase();
        return ua.indexOf( 'micromessenger' ) !== -1;
    }

    /**
     * 获取URL中的查询参数
     */
    private getQueryParam ( name: string ): string | null
    {
        const reg = new RegExp( `(^|&)${ name }=([^&]*)(&|$)` );
        const match = window.location.search.substr( 1 ).match( reg );
        if ( match != null ) return decodeURIComponent( match[ 2 ] );
        return null;
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
            this.clearCodeFromUrl();
            return code;
        }
        return null;
    }
    /**
      * 清除URL中的授权参数
      */
    clearAuthParamsFromUrl (): void
    {
        // 获取当前URL（不包含参数和hash）
        const urlWithoutParams = window.location.origin + window.location.pathname;

        // 替换当前URL，移除参数
        window.history.replaceState( {}, document.title, urlWithoutParams );
    }
    /**
     * 清除URL中的code和state参数，避免刷新页面重复提交
     */
    private clearCodeFromUrl (): void
    {
        const url = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState( {}, document.title, url );
    }

    /**
     * 跳转到微信授权页面
     * @param scope 授权作用域: snsapi_base (静默授权，仅openid) 或 snsapi_userinfo (需用户同意，获取用户信息)
     */
    public authorize ( scope: 'snsapi_base' | 'snsapi_userinfo' = 'snsapi_userinfo' ): void
    {
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
    }
}

// 导出单例，请替换为您的真实公众号AppID
export default new WxAuth( 'wxc164b903f978d83d' );