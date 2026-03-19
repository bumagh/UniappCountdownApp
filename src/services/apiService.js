import request from '@/utils/request';
import API from '@/config/api';
class ApiService {
    // 用户相关
    async getCurrentUser(id) {
        const res = await request.request(API.user.current, 'GET', { id });
        return res.data;
    }
    async uploadFile(filePath, topic = 'avatar', token) {
        return await new Promise((resolve, reject) => {
            uni.uploadFile({
                url: API.ajax.upload,
                filePath,
                name: 'file',
                formData: {
                    driver: 'local',
                    topic
                },
                header: token || uni.getStorageSync('token') ? {
                    'ba-user-token': token || uni.getStorageSync('token')
                } : {},
                success: (uploadRes) => {
                    try {
                        const payload = JSON.parse(uploadRes.data || '{}');
                        const successCode = payload?.code;
                        const fileUrl = payload?.data?.file?.url || payload?.data?.url;
                        if ((successCode === 1 || successCode === 200) && fileUrl) {
                            resolve(fileUrl);
                            return;
                        }
                        reject(new Error(payload?.msg || payload?.message || '文件上传失败'));
                    }
                    catch (error) {
                        reject(new Error('文件上传响应解析失败'));
                    }
                },
                fail: (error) => {
                    reject(new Error(error?.errMsg || '文件上传失败'));
                }
            });
        });
    }
    // 微信登录
    async loginByWeixin(data) {
        // #ifdef H5
        const res = await request.post(API.user.loginByWeixin, data);
        return res.data;
        // #endif
        // #ifdef MP-WEIXIN
        // 微信小程序环境，可能需要额外的用户信息获取逻辑
        // 先通过code获取token
        const miniRes = await request.post(API.user.loginByMiniProgram, data);
        return miniRes.data;
        // #endif
    }
    // 获取用户信息（通过openid，需要token）
    async getUserInfo(data) {
        const res = await request.post('/wechat/userInfo', data);
        return res.data;
    }
    async loginUser(data) {
        const res = await request.post(API.user.login, data);
        return res;
    }
    async loginPwd(data) {
        const res = await request.request(API.user.pwdLogin, 'POST', data);
        return res;
    }
    async incrementLoginDays() {
        const res = await request.request(API.user.incrementLoginDays, 'POST');
        return res.data;
    }
    async getJsConfig(url) {
        const res = await request.request(API.wechat.jsconfig, 'POST', { url });
        return res;
    }
    async registerUser(data) {
        const res = await request.post(API.user.register, data);
        return res;
    }
    async updateUser(data) {
        const res = await request.post(API.user.update, data);
        return res;
    }
    async initInfo(data) {
        const res = await request.post(API.user.initInfo, data);
        return res.data;
    }
    // 分类相关
    async getCategories(userid) {
        const res = await request.get(API.category.list, { userid });
        return res.data;
    }
    async getCategory(id) {
        const res = await request.get(API.category.read, { id });
        return res.data;
    }
    async createCategory(data) {
        const res = await request.post(API.category.create, data);
        return res.data;
    }
    async updateCategory(data) {
        const res = await request.post(`${API.category.update}`, { ...data });
        return res.data;
    }
    async deleteCategory(id) {
        await request.delete(`${API.category.delete}`, { id });
    }
    // 倒数日相关
    async getCountdowns(params) {
        const res = await request.get(API.countdown.list, params);
        return res.data;
    }
    async getArchivedCountdowns(userid) {
        const res = await request.get(API.countdown.archived, { userid });
        return res.data;
    }
    async getCountdown(id) {
        const res = await request.get(`${API.countdown.detail}`, { id });
        return res.data;
    }
    async createCountdown(data) {
        const res = await request.post(API.countdown.create, data);
        return res.data;
    }
    async updateCountdown(id, data) {
        const res = await request.post(`${API.countdown.update}`, { id, data });
        return res.data;
    }
    async deleteCountdown(id) {
        return await request.delete(`${API.countdown.delete}`, { id });
    }
    async archiveCountdown(id) {
        const res = await request.post(`${API.countdown.archive}/archive`, { id });
        return res.data;
    }
    async unarchiveCountdown(id) {
        const res = await request.post(`${API.countdown.unarchive}/unarchive`, { id });
        return res.data;
    }
    async togglePinCountdown(id) {
        const res = await request.post(`${API.countdown.togglePin}/${id}/toggle-pin`);
        return res.data;
    }
    async getCountdownsByDate(date) {
        const res = await request.get(`${API.countdown.byDate}/${date}`);
        return res.data;
    }
    async getLatestVersion() {
        const res = await request.get(API.version.getLatestVersion);
        return res.data;
    }
}
// 创建服务实例
const apiService = new ApiService();
export default apiService;
//# sourceMappingURL=apiService.js.map