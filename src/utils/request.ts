import { ApiResponse } from 'types/index';

interface RequestOptions
{
    header?: Record<string, string>;

    // 是否跳过自动注入token
    skipAuth?: boolean;
}

// 请求封装
class Request
{
    private createBusinessError ( responseData: any ): Error
    {
        const message = responseData?.msg || responseData?.message || '请求失败';
        const error = new Error( message ) as Error & {
            code?: number | string;
            response?: any;
            data?: any;
        };

        error.code = responseData?.code;
        error.response = responseData;
        error.data = responseData?.data;

        return error;
    }

    private getAuthHeader (): Record<string, string>
    {
        const token = uni.getStorageSync( 'token' );
        if ( !token ) return {};
        return {
            'ba-token': `${ token }`
        };
    }

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
            const authHeader = options.skipAuth ? {} : this.getAuthHeader();

            let requestConfig: any;

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
                success: ( res: any ) =>
                {
                    if ( res.statusCode === 200 )
                    {
                        if ( res.data.code === 200 )
                        {
                            resolve( res.data );
                        } else
                        {
                            reject( this.createBusinessError( res.data ) );
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
                success: ( res: any ) =>
                {
                    if ( res.statusCode === 200 )
                    {
                        if ( res.data.code === 200 )
                        {
                            resolve( res.data );
                        } else
                        {
                            reject( this.createBusinessError( res.data ) );
                        }
                    } else
                    {
                        reject( new Error( `网络错误: ${ res.statusCode }` ) );
                    }
                },
                fail: ( err: any ) =>
                {
                    console.warn( '微信小程序请求失败:', err );
                    reject( new Error( '网络请求失败' ) );
                }
            };
            // #endif

            uni.request( requestConfig );
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