import request from '@/utils/request';
import API from '@/config/api';
import {
User,
Category,
Countdown,
CountdownQueryParams,
CommonResponse,
ApiResponse,
} from 'types';
import { Version } from 'types';

class ApiService {
  // 用户相关
  async getCurrentUser(id: string): Promise<User> {
    const res = await request.request<User>(API.user.current, 'GET', { id });
    return res.data;
  }

  async uploadFile(filePath: string, topic: string = 'avatar', token?: string): Promise<string> {
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
          } catch (error) {
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
  async loginByWeixin(data: { code: string }): Promise<{ token: string; userInfo: any }> {
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
  async getUserInfo(data: { openid: string }): Promise<{ userInfo: any }> {
    const res = await request.post('/wechat/userInfo', data);
    return res.data;
  }
  async loginUser(data: Partial<User>): Promise<CommonResponse> {
    const res = await request.post<User>(API.user.login, data);
    return res;
  }
  async loginPwd(data: Partial<User>): Promise<CommonResponse> {
    const res = await request.request<User>(API.user.pwdLogin, 'POST', data);
    return res;
  }
  async incrementLoginDays(): Promise<{ login_days: number; message: string }> {
    const res = await request.request<{ login_days: number; message: string }>(API.user.incrementLoginDays, 'POST');
    return res.data;
  }
  async getJsConfig(url: string): Promise<CommonResponse> {
    const res = await request.request<User>(API.wechat.jsconfig, 'POST', { url });
    return res;
  }
  async registerUser(data: Partial<User>): Promise<CommonResponse> {
    const res = await request.post<User>(API.user.register, data);
    return res;
  }
  async updateUser(data: Partial<User>): Promise<CommonResponse> {
    const res = await request.post<User>(API.user.update, data);
    return res;
  }
  async initInfo(data: Partial<User>): Promise<User> {
    const res = await request.post<User>(API.user.initInfo, data);
    return res.data;
  }

  // 分类相关
  async getCategories(userid: string): Promise<Category[]> {
    const res = await request.get<Category[]>(API.category.list, { userid });
    return res.data;
  }
  async getCategory(id: string): Promise<Category> {
    const res = await request.get<Category>(API.category.read, { id });
    return res.data;
  }
  async createCategory(data: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const res = await request.post<Category>(API.category.create, data);
    return res.data;
  }

  async updateCategory(data: Partial<Category>): Promise<Category> {
    const res = await request.post<Category>(`${API.category.update}`, { ...data });
    return res.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await request.delete(`${API.category.delete}`, { id });
  }

  // 倒数日相关
  async getCountdowns(params: CountdownQueryParams): Promise<Countdown[]> {
    const res = await request.get<Countdown[]>(API.countdown.list, params);
    return res.data;
  }

  async getArchivedCountdowns(userid: string): Promise<Countdown[]> {
    const res = await request.get<Countdown[]>(API.countdown.archived, { userid });
    return res.data;
  }

  async getCountdown(id: number): Promise<Countdown> {
    const res = await request.get<Countdown>(`${API.countdown.detail}`, { id });
    return res.data;
  }

  async createCountdown(data: Countdown): Promise<Countdown> {
    const res = await request.post<Countdown>(API.countdown.create, data);
    return res.data;
  }

  async updateCountdown(id: number, data: Partial<Countdown>): Promise<Countdown> {
    const res = await request.post<Countdown>(`${API.countdown.update}`, { id, data });
    return res.data;
  }

  async deleteCountdown(id: number): Promise<ApiResponse<void>> {
    return await request.delete(`${API.countdown.delete}`, { id });
  }

  async archiveCountdown(id: number): Promise<Countdown> {
    const res = await request.post<Countdown>(`${API.countdown.archive}/archive`, { id });
    return res.data;
  }

  async unarchiveCountdown(id: number): Promise<Countdown> {
    const res = await request.post<Countdown>(`${API.countdown.unarchive}/unarchive`, { id });
    return res.data;
  }

  async togglePinCountdown(id: number): Promise<Countdown> {
    const res = await request.post<Countdown>(`${API.countdown.togglePin}/${id}/toggle-pin`);
    return res.data;
  }

  async getCountdownsByDate(date: string): Promise<Countdown[]> {
    const res = await request.get<Countdown[]>(`${API.countdown.byDate}/${date}`);
    return res.data;
  }
  async getLatestVersion(): Promise<Version> {
    const res = await request.get<Version>(API.version.getLatestVersion);
    return res.data;
  }
}

// 创建服务实例
const apiService = new ApiService();

export default apiService;