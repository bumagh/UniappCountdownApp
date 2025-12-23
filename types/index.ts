// 用户类型
export interface User
{
  id: number;
  nickname: string;
  username: string;
  password: string;
  avatar: string;
  gender?: string;
  birth_date?: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

// 分类类型
export interface Category
{
  id: number;
  name: string;
  icon: string;
  color: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// 倒数日类型
export interface Countdown
{
  id?: number;
  title: string;
  date: string;
  category_id: number;
  user_id: number;
  is_pinned: boolean;
  repeat_cycle: number;
  repeat_frequency: '不重复' | '天重复' | '周重复' | '月重复' | '年重复';
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
  days_left?: number;
  status_text?: string;
  repeat_text?: string;
}

// API 响应类型
export interface ApiResponse<T = any>
{
  code: number;
  msg: string;
  data: T;
}

// 表单类型
export interface CountdownForm
{
  is_pinned: boolean;
  title: string;
  date: string;
  category_id: number;
  repeat_cycle: number;
  repeat_frequency: '不重复' | '天重复' | '周重复' | '月重复' | '年重复';
}

// 请求参数类型
export interface CountdownQueryParams
{
  userid: string,
  category_id?: number;
  include_archived?: number;
}
// 登录请求参数
export interface LoginByPasswordParams
{
  username: string;
  password: string;
}

export interface LoginByusernameParams
{
  username: string;
  code: string;
}

// 登录响应
export interface LoginResponse
{
  code: number;
  msg: string;
  data: {
    token: string;
    user: User;
  };
}
export interface CommonResponse
{
  code: number;
  msg: string;
  data: any;
}


// types/user.d.ts
// 用户信息接口
export interface UserInfo
{
  id: string | number;
  name: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  token?: string;
  roles?: string[];
  permissions?: string[];
  // 扩展字段
  [ key: string ]: any;
}

// 系统信息接口
export interface SystemInfo
{
  platform: 'ios' | 'android' | 'windows' | 'mac' | 'web';
  system: string;
  brand: string;
  model: string;
  version: string;
  SDKVersion?: string;
  language: string;
  theme?: 'light' | 'dark';
  safeArea?: UniApp.SafeArea;
  windowWidth: number;
  windowHeight: number;
  // 扩展字段
  [ key: string ]: any;
}

// 应用配置接口
export interface AppConfig
{
  version: string;
  buildNumber: number;
  env: 'development' | 'test' | 'production';
  apiBaseURL: string;
  // 扩展字段
  [ key: string ]: any;
}

// 用户管理器接口
export interface IUserManager
{
  // 用户信息
  userInfo: UserInfo | null;
  isLoggedIn: boolean;

  // 系统信息
  systemInfo: SystemInfo | null;

  // 应用配置
  appConfig: AppConfig | null;

  // 初始化方法
  init (): Promise<void>;

  // 用户相关方法
  setUserInfo ( info: UserInfo ): Promise<void>;
  getUserInfo ( forceRefresh?: boolean ): Promise<UserInfo | null>;
  clearUserInfo (): void;
  checkLogin (): boolean;

  // 更新用户信息
  updateUserInfo ( updates: Partial<UserInfo> ): Promise<void>;

  // Token管理
  getToken (): string | null;
  setToken ( token: string ): void;
  clearToken (): void;

  // 权限检查
  hasRole ( role: string ): boolean;
  hasPermission ( permission: string ): boolean;
}