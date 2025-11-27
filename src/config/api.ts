// API配置
const API_BASE_URL: string = 'http://app.tutlabtech/api'; // 替换为你的实际域名

export const API = {
    // 用户相关
    user: {
        current: `${ API_BASE_URL }/user/current`,
        update: `${ API_BASE_URL }/user/update`
    },
    // 分类相关
    category: {
        list: `${ API_BASE_URL }/categories`,
        create: `${ API_BASE_URL }/categories`,
        update: `${ API_BASE_URL }/categories`,
        delete: `${ API_BASE_URL }/categories`
    },
    // 倒数日相关
    countdown: {
        list: `${ API_BASE_URL }/countdowns`,
        archived: `${ API_BASE_URL }/countdowns/archived`,
        detail: `${ API_BASE_URL }/countdowns`,
        create: `${ API_BASE_URL }/countdowns`,
        update: `${ API_BASE_URL }/countdowns`,
        delete: `${ API_BASE_URL }/countdowns`,
        archive: `${ API_BASE_URL }/countdowns`,
        unarchive: `${ API_BASE_URL }/countdowns`,
        togglePin: `${ API_BASE_URL }/countdowns`,
        byDate: `${ API_BASE_URL }/countdowns/date`
    }
} as const;

export default API;