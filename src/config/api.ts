// API配置
const API_BASE_URL: string = 'http://app.tutlabtech/api/v1.'; // 替换为你的实际域名

export const API = {
    // 用户相关
    user: {
        current: `${ API_BASE_URL }user/index`,
        login: `${ API_BASE_URL }user/login`,
        register: `${ API_BASE_URL }user/register`,
        update: `${ API_BASE_URL }user/update`,
        initInfo: `${ API_BASE_URL }user/initInfo`
    },
    // 分类相关
    category: {
        list: `${ API_BASE_URL }category`,
        read: `${ API_BASE_URL }category/read`,
        create: `${ API_BASE_URL }category/save`,
        update: `${ API_BASE_URL }category/update`,
        delete: `${ API_BASE_URL }category/delete`
    },
    // 倒数日相关
    countdown: {
        list: `${ API_BASE_URL }countdown`,
        archived: `${ API_BASE_URL }countdown/archived`,
        detail: `${ API_BASE_URL }countdown/read`,
        create: `${ API_BASE_URL }countdown/save`,
        update: `${ API_BASE_URL }countdown/update`,
        delete: `${ API_BASE_URL }countdown/delete`,
        archive: `${ API_BASE_URL }countdown`,
        unarchive: `${ API_BASE_URL }countdown`,
        togglePin: `${ API_BASE_URL }countdown`,
        byDate: `${ API_BASE_URL }countdown/date`
    },
    version: {
        check: `${ API_BASE_URL }version/check`,
        getLatestVersion: `${ API_BASE_URL }version/getLatestVersion`,
    }
} as const;

export default API;