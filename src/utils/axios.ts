
/**
 * 根据运行环境获取基础请求URL
 */
export const getUrl = (): string => {
    const value: string = import.meta.env.VITE_AXIOS_BASE_URL as string
    
    // #ifdef H5
    if (value === 'getCurrentDomain') {
        return window.location.protocol + '//' + window.location.host
    }
    // #endif
    
    // #ifdef MP-WEIXIN
    // 微信小程序环境，直接返回配置的URL或默认值
    // #endif
    
    return value
}

/**
 * 根据运行环境获取基础请求URL的端口
 */
export const getUrlPort = (): string => {
    const url = getUrl()
    
    // #ifdef H5
    try {
        return new URL(url).port
    } catch (error) {
        console.warn('解析URL端口失败:', error)
        return ''
    }
    // #endif
    
    // #ifdef MP-WEIXIN
    // 微信小程序环境，返回空字符串或默认端口
    return ''
    // #endif
}
