import request from '@/utils/request';
import API from '@/config/api';
import
{
    User,
    Category,
    Countdown,
    CountdownForm,
    CountdownQueryParams
} from 'types';
import { LoginByPasswordParams, LoginByUsernameParams, LoginResponse } from '@/types/index';

/**
 * 密码登录
 */
export async function loginByPassword(params: LoginByPasswordParams): Promise<LoginResponse> {
  // 实际项目中替换为真实的API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟登录成功
      resolve({
        success: true,
        message: '登录成功',
        data: {
          token: 'mock_token_' + Date.now(),
          user: {
            id: 1,
            // nickname: '用户' + params.username.slice(-4),
            nickname: params.username,
            avatar: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      });
    }, 1000);
  });
}
/**
 * 密码登录
 */
export async function register(params: LoginByPasswordParams): Promise<LoginResponse> {
  // 实际项目中替换为真实的API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟登录成功
      resolve({
        success: true,
        message: '登录成功',
        data: {
          token: 'mock_token_' + Date.now(),
          user: {
            id: 1,
            // nickname: '用户' + params.username.slice(-4),
            nickname: params.username,
            avatar: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      });
    }, 1000);
  });
}
/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 1,
        nickname: '张三',
        avatar: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }, 500);
  });
}
class ApiService
{
    // 用户相关
    async getCurrentUser (): Promise<User>
    {
        const res = await request.get<User>( API.user.current );
        return res.data;
    }

    async updateUser ( data: Partial<User> ): Promise<User>
    {
        const res = await request.put<User>( API.user.update, data );
        return res.data;
    }

    // 分类相关
    async getCategories (): Promise<Category[]>
    {
        const res = await request.get<Category[]>( API.category.list );
        return res.data;
    }

    async createCategory ( data: Omit<Category, 'id' | 'created_at' | 'updated_at'> ): Promise<Category>
    {
        const res = await request.post<Category>( API.category.create, data );
        return res.data;
    }

    async updateCategory ( id: number, data: Partial<Category> ): Promise<Category>
    {
        const res = await request.put<Category>( `${ API.category.update }/${ id }`, data );
        return res.data;
    }

    async deleteCategory ( id: number ): Promise<void>
    {
        await request.delete( `${ API.category.delete }/${ id }` );
    }

    // 倒数日相关
    async getCountdowns ( params: CountdownQueryParams = {} ): Promise<Countdown[]>
    {
        const res = await request.get<Countdown[]>( API.countdown.list, params );
        return res.data;
    }

    async getArchivedCountdowns (): Promise<Countdown[]>
    {
        const res = await request.get<Countdown[]>( API.countdown.archived );
        return res.data;
    }

    async getCountdown ( id: number ): Promise<Countdown>
    {
        const res = await request.get<Countdown>( `${ API.countdown.detail }/${ id }` );
        return res.data;
    }

    async createCountdown ( data: CountdownForm ): Promise<Countdown>
    {
        const res = await request.post<Countdown>( API.countdown.create, data );
        return res.data;
    }

    async updateCountdown ( id: number, data: Partial<CountdownForm> ): Promise<Countdown>
    {
        const res = await request.post<Countdown>( `${ API.countdown.update }/${ id }`, data );
        return res.data;
    }

    async deleteCountdown ( id: number ): Promise<void>
    {
        await request.delete( `${ API.countdown.delete }/${ id }` );
    }

    async archiveCountdown ( id: number ): Promise<Countdown>
    {
        const res = await request.put<Countdown>( `${ API.countdown.archive }/${ id }/archive` );
        return res.data;
    }

    async unarchiveCountdown ( id: number ): Promise<Countdown>
    {
        const res = await request.put<Countdown>( `${ API.countdown.unarchive }/${ id }/unarchive` );
        return res.data;
    }

    async togglePinCountdown ( id: number ): Promise<Countdown>
    {
        const res = await request.put<Countdown>( `${ API.countdown.togglePin }/${ id }/toggle-pin` );
        return res.data;
    }

    async getCountdownsByDate ( date: string ): Promise<Countdown[]>
    {
        const res = await request.get<Countdown[]>( `${ API.countdown.byDate }/${ date }` );
        return res.data;
    }
}

// 创建服务实例
const apiService = new ApiService();

export default apiService;