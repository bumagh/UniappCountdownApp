// utils/user-manager.ts
import type { UserInfo, SystemInfo, AppConfig, IUserManager } from 'types';

/**
 * 用户管理器实现
 */
class UserManager implements IUserManager
{
    // 单例实例
    private static instance: UserManager;

    // 用户信息
    userInfo: UserInfo | null = null;

    // 系统信息
    systemInfo: SystemInfo | null = null;

    // 应用配置
    appConfig: AppConfig | null = null;

    // 是否正在获取用户信息
    private isFetchingUser = false;

    // 获取用户信息的Promise（用于防止重复请求）
    private userFetchPromise: Promise<UserInfo | null> | null = null;

    // 缓存过期时间（毫秒）
    private readonly CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟

    // 私有构造器
    private constructor () { }

    /**
     * 获取单例实例
     */
    static getInstance (): UserManager
    {
        if ( !UserManager.instance )
        {
            UserManager.instance = new UserManager();
        }
        return UserManager.instance;
    }

    /**
     * 初始化用户管理器
     */
    async init (): Promise<void>
    {
        try
        {
            // 1. 尝试从缓存加载用户信息
            await this.loadUserFromCache();

            // 2. 验证token有效性（如果存在）
            if ( this.getToken() )
            {
                await this.validateToken();
            }

            console.log( 'User manager initialized' );
        } catch ( error )
        {
            console.error( 'User manager initialization failed:', error );
            // 初始化失败时清除可能有问题的用户信息
            this.clearUserInfo();
        }
    }

    /**
     * 从缓存加载用户信息
     */
    private async loadUserFromCache (): Promise<void>
    {
        try
        {
            const cachedUser = this.getCachedUserInfo();

            if ( cachedUser )
            {
                this.userInfo = cachedUser;
                console.log( 'User info loaded from cache' );
            }
        } catch ( error )
        {
            console.error( 'Failed to load user from cache:', error );
        }
    }

    /**
     * 获取缓存的用户信息
     */
    private getCachedUserInfo (): UserInfo | null
    {
        try
        {
            const cacheStr = uni.getStorageSync( 'userInfoCache' );
            if ( !cacheStr ) return null;

            const cacheData = JSON.parse( cacheStr );

            // 检查是否过期
            if ( Date.now() > cacheData.expiry )
            {
                this.clearCache();
                return null;
            }

            return cacheData.data as UserInfo;
        } catch ( error )
        {
            console.error( 'Failed to parse cached user info:', error );
            return null;
        }
    }

    /**
     * 缓存用户信息
     */
    private cacheUserInfo ( userInfo: UserInfo ): void
    {
        try
        {
            const cacheData = {
                data: userInfo,
                timestamp: Date.now(),
                expiry: Date.now() + this.CACHE_EXPIRY
            };

            uni.setStorageSync( 'userInfoCache', JSON.stringify( cacheData ) );
        } catch ( error )
        {
            console.error( 'Failed to cache user info:', error );
        }
    }

    /**
     * 清除缓存
     */
    private clearCache (): void
    {
        try
        {
            uni.removeStorageSync( 'userInfoCache' );
        } catch ( error )
        {
            console.error( 'Failed to clear cache:', error );
        }
    }

    /**
     * 获取用户信息
     * @param forceRefresh 是否强制刷新（跳过缓存）
     */
    async getUserInfo ( forceRefresh: boolean = false ): Promise<UserInfo | null>
    {
        // 如果有本地缓存且不强制刷新，直接返回
        if ( !forceRefresh && this.userInfo )
        {
            return this.userInfo;
        }

        // 防止重复请求
        if ( this.isFetchingUser && this.userFetchPromise )
        {
            return this.userFetchPromise;
        }

        this.isFetchingUser = true;

        this.userFetchPromise = new Promise( async ( resolve, reject ) =>
        {
            try
            {
                // 尝试从缓存获取
                if ( !forceRefresh )
                {
                    const cachedUser = this.getCachedUserInfo();
                    if ( cachedUser )
                    {
                        this.userInfo = cachedUser;
                        resolve( cachedUser );
                        return;
                    }
                }

                // 从网络获取
                const token = this.getToken();
                if ( !token )
                {
                    resolve( null );
                    return;
                }

                const userInfo = await this.fetchUserInfoFromServer( token );
                await this.setUserInfo( userInfo );

                resolve( userInfo );
            } catch ( error )
            {
                console.error( 'Failed to get user info:', error );
                reject( error );
            } finally
            {
                this.isFetchingUser = false;
                this.userFetchPromise = null;
            }
        } );

        return this.userFetchPromise;
    }

    /**
     * 从服务器获取用户信息
     */
    private async fetchUserInfoFromServer ( token: string ): Promise<UserInfo>
    {
        return new Promise( ( resolve, reject ) =>
        {
            uni.request( {
                url: `${ this.appConfig?.apiBaseURL || '' }/user/info`,
                method: 'GET',
                header: {
                    'Authorization': `Bearer ${ token }`,
                    'Content-Type': 'application/json'
                },
                success: ( res ) =>
                {
                    if ( res.statusCode === 200 && res.data?.code === 0 )
                    {
                        resolve( res.data.data as UserInfo );
                    } else
                    {
                        reject( new Error( res.data?.msg || '获取用户信息失败' ) );
                    }
                },
                fail: ( err ) =>
                {
                    reject( new Error( `网络请求失败: ${ err.errMsg }` ) );
                }
            } );
        } );
    }

    /**
     * 设置用户信息
     */
    async setUserInfo ( info: UserInfo ): Promise<void>
    {
        this.userInfo = info;

        // 缓存用户信息
        this.cacheUserInfo( info );

        // 如果有token，单独存储
        if ( info.token )
        {
            this.setToken( info.token );
        }

        // 更新全局数据
        this.updateGlobalData();

        console.log( 'User info set:', info );
    }

    /**
     * 更新用户信息
     */
    async updateUserInfo ( updates: Partial<UserInfo> ): Promise<void>
    {
        if ( !this.userInfo )
        {
            throw new Error( 'No user info to update' );
        }

        // 合并更新
        const updatedInfo = {
            ...this.userInfo,
            ...updates,
            // 确保id不变
            id: this.userInfo.id
        };

        await this.setUserInfo( updatedInfo );
    }

    /**
     * 清除用户信息
     */
    clearUserInfo (): void
    {
        this.userInfo = null;
        this.clearCache();
        this.clearToken();
        this.updateGlobalData();

        console.log( 'User info cleared' );
    }

    /**
     * 检查是否登录
     */
    get isLoggedIn (): boolean
    {
        return !!this.userInfo && !!this.getToken();
    }

    /**
     * 检查登录状态
     */
    checkLogin (): boolean
    {
        return this.isLoggedIn;
    }

    /**
     * 获取token
     */
    getToken (): string | null
    {
        return uni.getStorageSync( 'userToken' ) || null;
    }

    /**
     * 设置token
     */
    setToken ( token: string ): void
    {
        uni.setStorageSync( 'userToken', token );
    }

    /**
     * 清除token
     */
    clearToken (): void
    {
        uni.removeStorageSync( 'userToken' );
    }

    /**
     * 验证token有效性
     */
    private async validateToken (): Promise<boolean>
    {
        const token = this.getToken();
        if ( !token ) return false;

        try
        {
            // 这里可以调用服务器验证token的接口
            // 暂时假设token有效
            return true;
        } catch ( error )
        {
            console.error( 'Token validation failed:', error );
            return false;
        }
    }

    /**
     * 检查是否拥有指定角色
     */
    hasRole ( role: string ): boolean
    {
        return !!this.userInfo?.roles?.includes( role );
    }

    /**
     * 检查是否拥有指定权限
     */
    hasPermission ( permission: string ): boolean
    {
        return !!this.userInfo?.permissions?.includes( permission );
    }

    /**
     * 更新全局数据
     */
    private updateGlobalData (): void
    {
        const app = getApp();
        if ( app && app.globalData )
        {
            app.globalData.userInfo = this.userInfo;
        }
    }
}

// 导出单例
export const userManager = UserManager.getInstance();