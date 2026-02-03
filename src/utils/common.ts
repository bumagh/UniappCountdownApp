/**
 * 获取UniApp H5打包后的静态资源URL
 * @param name 资源文件名（不含扩展名）
 * @param extension 文件扩展名，默认为'png'
 * @returns Promise<string> 完整的资源URL路径
 */
export async function getDataUrl(name: string, extension: string = 'png'): Promise<string> {
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