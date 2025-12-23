import request from '@/utils/request';
import API from '@/config/api';
import
{
  User,
  Category,
  Countdown,
  CountdownQueryParams,
  CommonResponse
} from 'types';


class ApiService
{
  // 用户相关
  async getCurrentUser ( id: string ): Promise<User>
  {
    const res = await request.get<User>( API.user.current, { id } );
    return res.data;
  }

  async loginUser ( data: Partial<User> ): Promise<CommonResponse>
  {
    const res = await request.post<User>( API.user.login, data );
    return res;
  }
  async registerUser ( data: Partial<User> ): Promise<CommonResponse>
  {
    const res = await request.post<User>( API.user.register, data );
    return res;
  }
  async updateUser ( data: Partial<User> ): Promise<User>
  {
    const res = await request.post<User>( API.user.update, data );
    return res.data;
  }

  // 分类相关
  async getCategories ( userid: string ): Promise<Category[]>
  {
    const res = await request.get<Category[]>( API.category.list, { userid } );
    return res.data;
  }
  async getCategory ( id: string ): Promise<Category>
  {
    const res = await request.get<Category>( API.category.list, { id } );
    return res.data;
  }
  async createCategory ( data: Omit<Category, 'id' | 'created_at' | 'updated_at'> ): Promise<Category>
  {
    const res = await request.post<Category>( API.category.create, data );
    return res.data;
  }

  async updateCategory ( id: number, data: Partial<Category> ): Promise<Category>
  {
    const res = await request.post<Category>( `${ API.category.update }/${ id }`, data );
    return res.data;
  }

  async deleteCategory ( id: number ): Promise<void>
  {
    await request.delete( `${ API.category.delete }/${ id }` );
  }

  // 倒数日相关
  async getCountdowns ( params: CountdownQueryParams ): Promise<Countdown[]>
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
    const res = await request.get<Countdown>( `${ API.countdown.detail }`, { id } );
    return res.data;
  }

  async createCountdown ( data: Countdown ): Promise<Countdown>
  {
    const res = await request.post<Countdown>( API.countdown.create, data );
    return res.data;
  }

  async updateCountdown ( id: number, data: Partial<Countdown> ): Promise<Countdown>
  {
    const res = await request.post<Countdown>( `${ API.countdown.update }`, { id, data } );
    return res.data;
  }

  async deleteCountdown ( id: number ): Promise<void>
  {
    await request.delete( `${ API.countdown.delete }/${ id }` );
  }

  async archiveCountdown ( id: number ): Promise<Countdown>
  {
    const res = await request.post<Countdown>( `${ API.countdown.archive }/archive`, { id } );
    return res.data;
  }

  async unarchiveCountdown ( id: number ): Promise<Countdown>
  {
    const res = await request.post<Countdown>( `${ API.countdown.unarchive }/${ id }/unarchive` );
    return res.data;
  }

  async togglePinCountdown ( id: number ): Promise<Countdown>
  {
    const res = await request.post<Countdown>( `${ API.countdown.togglePin }/${ id }/toggle-pin` );
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