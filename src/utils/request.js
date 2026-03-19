// 请求封装
class Request {
    createBusinessError(responseData) {
        const message = responseData?.msg || responseData?.message || '请求失败';
        const error = new Error(message);
        error.code = responseData?.code;
        error.response = responseData;
        error.data = responseData?.data;
        return error;
    }
    getAuthHeader() {
        const token = uni.getStorageSync('token');
        if (!token)
            return {};
        return {
            'ba-user-token': `${token}`
        };
    }
    // 通用请求方法
    async request(url, method = 'GET', data = {}, options = {}) {
        return new Promise((resolve, reject) => {
            const authHeader = options.skipAuth ? {} : this.getAuthHeader();
            let requestConfig;
            // #ifdef H5
            // H5环境可能需要处理跨域等特殊情况
            requestConfig = {
                url: url,
                method: method,
                data: data,
                header: {
                    'Content-Type': 'application/json',
                    ...authHeader,
                    ...options.header
                },
                timeout: 10000,
                success: (res) => {
                    if (res.statusCode === 200) {
                        if (res.data.code === 200) {
                            resolve(res.data);
                        }
                        else {
                            reject(this.createBusinessError(res.data));
                        }
                    }
                    else {
                        reject(new Error(`网络错误: ${res.statusCode}`));
                    }
                },
                fail: (err) => {
                    reject(new Error('网络请求失败'));
                }
            };
            // #endif
            // #ifdef MP-WEIXIN
            // 微信小程序环境的请求配置
            requestConfig = {
                url: url,
                method: method,
                data: data,
                header: {
                    'Content-Type': 'application/json',
                    ...authHeader,
                    ...options.header
                },
                timeout: 10000,
                success: (res) => {
                    if (res.statusCode === 200) {
                        if (res.data.code === 200) {
                            resolve(res.data);
                        }
                        else {
                            reject(this.createBusinessError(res.data));
                        }
                    }
                    else {
                        reject(new Error(`网络错误: ${res.statusCode}`));
                    }
                },
                fail: (err) => {
                    console.warn('微信小程序请求失败:', err);
                    reject(new Error('网络请求失败'));
                }
            };
            // #endif
            uni.request(requestConfig);
        });
    }
    // GET请求
    async get(url, data = {}) {
        return this.request(url, 'GET', data);
    }
    // POST请求
    async post(url, data = {}) {
        return this.request(url, 'POST', data);
    }
    // PUT请求
    async put(url, data = {}) {
        return this.request(url, 'PUT', data);
    }
    // DELETE请求
    async delete(url, data = {}) {
        return this.request(url, 'DELETE', data);
    }
}
// 创建请求实例
const request = new Request();
export default request;
//# sourceMappingURL=request.js.map