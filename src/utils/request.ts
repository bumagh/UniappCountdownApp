import { ApiResponse } from 'types/index';

interface RequestOptions
{
    header?: Record<string, string>;
}

// 请求封装
class Request
{
    private baseURL: string = '';

    // 通用请求方法
    async request<T = any> (
        url: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        data: any = {},
        options: RequestOptions = {}
    ): Promise<ApiResponse<T>>
    {
        return new Promise( ( resolve, reject ) =>
        {
            uni.request( {
                url: url,
                method: method,
                data: data,
                header: {
                    'Content-Type': 'application/json',
                    ...options.header
                },
                success: ( res: any ) =>
                {
                    if ( res.statusCode === 200 )
                    {
                        if ( res.data.code === 200 )
                        {
                            resolve( res.data );
                        } else
                        {
                            reject( new Error( res.data.msg || '请求失败' ) );
                        }
                    } else
                    {
                        reject( new Error( `网络错误: ${ res.statusCode }` ) );
                    }
                },
                fail: ( err: any ) =>
                {
                    reject( new Error( '网络请求失败' ) );
                }
            } );
        } );
    }

    // GET请求
    async get<T = any> ( url: string, data: any = {} ): Promise<ApiResponse<T>>
    {
        return this.request<T>( url, 'GET', data );
    }

    // POST请求
    async post<T = any> ( url: string, data: any = {} ): Promise<ApiResponse<T>>
    {
        return this.request<T>( url, 'POST', data );
    }

    // PUT请求
    async put<T = any> ( url: string, data: any = {} ): Promise<ApiResponse<T>>
    {
        return this.request<T>( url, 'PUT', data );
    }

    // DELETE请求
    async delete<T = any> ( url: string, data: any = {} ): Promise<ApiResponse<T>>
    {
        return this.request<T>( url, 'DELETE', data );
    }
}

// 创建请求实例
const request = new Request();

export default request;