// API配置
// Vite 在客户端仅暴露 VITE_ 前缀环境变量
// const API_BASE_URL: string =(process as any)?.env?.VITE_API_BASE_URL ||
//   ( import.meta as any )?.env?.VITE_API_BASE_URL ||
//   'https://app.tutlab.tech/api/v1.';
const API_BASE_URL: string =
  'https://app.tutlab.tech/index.php/api/';

export const API = {
    // 用户相关
    user: {
        current: `${ API_BASE_URL }account/profileDirect`,
        login: `${ API_BASE_URL }user/login`,
        register: `${ API_BASE_URL }user/register`,
        update: `${ API_BASE_URL }account/profileDirect`,
        initInfo: `${ API_BASE_URL }account/initInfo`,
        loginByWeixin: `${ API_BASE_URL }wechat/loginByWeixin`,
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