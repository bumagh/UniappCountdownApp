// 用户类型
export interface User
{
    id: number;
    nickname: string;
    avatar: string;
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
    id: number;
    title: string;
    date: string;
    category_id: number;
    user_id: number;
    is_pinned: boolean;
    repeat_cycle: number;
    repeat_frequency: '不重复' | '天重复' | '周重复' | '月重复' | '年重复';
    is_archived: boolean;
    created_at: string;
    updated_at: string;
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
    category_id?: number;
    include_archived?: number;
}