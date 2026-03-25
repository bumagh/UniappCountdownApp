const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7天

/**
 * 获取远程图片的本地缓存路径（微信小程序用 downloadFile，H5 直接返回 URL）
 */
export async function getCachedRemoteImage(url: string): Promise<string> {
    // #ifdef H5
    return url;
    // #endif

    // #ifdef MP-WEIXIN
    const storageKey = `img_cache_${url}`;
    try {
        const cached = uni.getStorageSync(storageKey);
        if (cached && cached.path && cached.expireAt > Date.now()) {
            return cached.path;
        }
    } catch (_) {}

    return new Promise((resolve, reject) => {
        uni.downloadFile({
            url,
            success(res) {
                if (res.statusCode === 200) {
                    try {
                        uni.setStorageSync(storageKey, {
                            path: res.tempFilePath,
                            expireAt: Date.now() + CACHE_TTL_MS,
                        });
                    } catch (_) {}
                    resolve(res.tempFilePath);
                } else {
                    reject(new Error(`downloadFile failed: ${res.statusCode}`));
                }
            },
            fail: reject,
        });
    });
    // #endif
}

/**
 * 获取UniApp H5打包后的静态资源URL
 * @param name 资源文件名（不含扩展名）
 * @param extension 文件扩展名，默认为'png'
 * @returns Promise<string> 完整的资源URL路径
 */
const COS_REMOTE_ASSETS: Record<string, string> = {
    pic1: 'https://cos.tutlab.tech/qmr/pic1.png',
    pic2: 'https://cos.tutlab.tech/qmr/pic2.png',
};

export async function getDataUrl(name: string, extension: string = 'png'): Promise<string> {
    // 远程 COS 资源直接返回，不走本地路径
    if (COS_REMOTE_ASSETS[name]) {
        return getCachedRemoteImage(COS_REMOTE_ASSETS[name]);
    }

    // 参数校验
    if (!name || typeof name !== 'string') {
        console.warn('[getDataUrl] 无效的资源名称:', name);
        return Promise.resolve('/static/qr.png'); // 返回默认图片
    }

    // 清理文件名，防止路径遍历攻击
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedName) {
        console.warn('[getDataUrl] 资源名称包含非法字符:', name);
        return Promise.resolve('/static/qr.png');
    }

    // 构建相对路径
    const relativePath = `../static/${sanitizedName}.${extension}`;

    // 对于SVG文件，优先使用直接路径
    if (extension === 'svg') {
        try {
            // #ifdef H5
            // 检查是否在浏览器环境
            if (typeof window !== 'undefined' && window.location) {
                const baseUrl = window.location.origin;
                return Promise.resolve(`${baseUrl}/static/${sanitizedName}.${extension}`);
            }
            // #endif
            
            // #ifdef MP-WEIXIN
            // 微信小程序环境，使用相对路径
            return Promise.resolve(`/static/${sanitizedName}.${extension}`);
            // #endif
        } catch (error) {
            console.warn('[getDataUrl] 获取SVG base URL失败:', error);
        }
    }

    try {
        // #ifdef H5
        // 优先使用 Vite 的 import.meta.url 解析
        // @ts-ignore - import.meta.url 可能在某些环境中不可用
        if (typeof import.meta !== 'undefined' && import.meta.url) {
            const url = new URL(relativePath, import.meta.url);
            
            // 验证URL是否有效
            if (url.protocol && url.href) {
                return Promise.resolve(url.href);
            }
        }
        // #endif
    } catch (error) {
        // #ifdef H5
        console.warn('[getDataUrl] 使用 import.meta.url 解析失败:', error);
        // #endif
    }

    // 回退方案1: 尝试使用动态导入
    try {
        // #ifdef H5
        // @ts-ignore - 动态导入可能失败
        const module = await import(relativePath);
        if (module) {
            return Promise.resolve(`/static/${sanitizedName}.${extension}`);
        }
        // #endif
    } catch (error) {
        // #ifdef H5
        console.warn('[getDataUrl] 动态导入失败:', error);
        // #endif
    }

    // 回退方案2: 使用相对路径
    try {
        // #ifdef H5
        // 检查是否在浏览器环境
        if (typeof window !== 'undefined' && window.location) {
            const baseUrl = window.location.origin;
            return Promise.resolve(`${baseUrl}/static/${sanitizedName}.${extension}`);
        }
        // #endif
        
        // #ifdef MP-WEIXIN
        // 微信小程序环境，直接使用相对路径
        return Promise.resolve(`/static/${sanitizedName}.${extension}`);
        // #endif
    } catch (error) {
        console.warn('[getDataUrl] 获取base URL失败:', error);
    }

    // 最终回退方案: 使用绝对路径
    return Promise.resolve(`/static/${sanitizedName}.${extension}`);
}