// API配置
const API_BASE_URL: string = 'https://app.tutlab.tech/api/v1.'; // 替换为你的实际域名


export const API = {
    // 用户相关
    user: {
        current: `${ API_BASE_URL }user/index`,
        login: `${ API_BASE_URL }user/login`,
        register: `${ API_BASE_URL }user/register`,
        update: `${ API_BASE_URL }user/update`
    },
    // 分类相关
    category: {
        list: `${ API_BASE_URL }category`,
        create: `${ API_BASE_URL }category`,
        update: `${ API_BASE_URL }category`,
        delete: `${ API_BASE_URL }category`
    },
    // 倒数日相关
    countdown: {
        list: `${ API_BASE_URL }countdown`,
        archived: `${ API_BASE_URL }countdown/archived`,
        detail: `${ API_BASE_URL }countdown/read`,
        create: `${ API_BASE_URL }countdown/save`,
        update: `${ API_BASE_URL }countdown/update`,
        delete: `${ API_BASE_URL }countdown`,
        archive: `${ API_BASE_URL }countdown`,
        unarchive: `${ API_BASE_URL }countdown`,
        togglePin: `${ API_BASE_URL }countdown`,
        byDate: `${ API_BASE_URL }countdown/date`
    }
} as const;

export default API;