/**
 * SVG 图标管理工具
 * 统一管理项目中使用的 SVG 图标
 */
import { getDataUrl } from './common';
/**
 * TabBar 图标名称常量
 */
export const TABBAR_ICONS = {
    HOME: 'home',
    HOME_ACTIVE: 'home-active',
    BOOK: 'book',
    BOOK_ACTIVE: 'book-active',
    CALENDAR: 'calendar',
    CALENDAR_ACTIVE: 'calendar-active',
    PROFILE: 'profile',
    PROFILE_ACTIVE: 'profile-active'
};
/**
 * 其他常用图标名称常量
 */
export const COMMON_ICONS = {
    QR: 'qr',
    LOGO: 'logo',
    SHARE_PROFILE: 'share-profile',
    DEFAULT_AVATAR: 'default-avatar'
};
/**
 * 获取 TabBar 图标 URL
 * @param iconName 图标名称
 * @returns Promise<string> SVG 图标 URL
 */
export async function getTabBarIcon(iconName) {
    return await getDataUrl(iconName, 'svg');
}
/**
 * 获取常用图标 URL
 * @param iconName 图标名称
 * @returns Promise<string> 图标 URL
 */
export async function getCommonIcon(iconName) {
    return await getDataUrl(iconName, 'png');
}
/**
 * 批量获取 TabBar 图标
 * @returns Promise<Record<string, string>> 所有 TabBar 图标的 URL
 */
export async function getAllTabBarIcons() {
    const iconNames = Object.values(TABBAR_ICONS);
    const icons = {};
    for (const iconName of iconNames) {
        icons[iconName] = await getTabBarIcon(iconName);
    }
    return icons;
}
/**
 * 获取特定页面的图标对（普通和激活状态）
 * @param pageName 页面名称
 * @returns Promise<{normal: string, active: string}> 图标对
 */
export async function getPageIconPair(pageName) {
    const normalIcon = await getTabBarIcon(`${pageName.toUpperCase()}_ACTIVE`);
    const activeIcon = await getTabBarIcon(`${pageName.toUpperCase()}`);
    return {
        normal: normalIcon,
        active: activeIcon
    };
}
/**
 * 在 Vue 组件中使用的 Mixin
 */
export const svgIconMixin = {
    methods: {
        /**
         * 获取 TabBar 图标
         */
        async getTabBarIcon(iconName) {
            return await getTabBarIcon(iconName);
        },
        /**
         * 获取常用图标
         */
        async getCommonIcon(iconName) {
            return await getCommonIcon(iconName);
        },
        /**
         * 获取页面图标对
         */
        async getPageIconPair(pageName) {
            return await getPageIconPair(pageName);
        }
    }
};
/**
 * 使用示例：
 *
 * // 在组件中使用
 * export default {
 *   mixins: [svgIconMixin],
 *   async mounted() {
 *     const homeIcon = await this.getTabBarIcon('HOME');
 *     const qrIcon = await this.getCommonIcon('QR');
 *     const iconPair = await this.getPageIconPair('home');
 *   }
 * }
 *
 * // 直接导入使用
 * import { getTabBarIcon, getPageIconPair } from '@/utils/svgIcons';
 *
 * const homeIcon = await getTabBarIcon('HOME');
 * const iconPair = await getPageIconPair('profile');
 */
//# sourceMappingURL=svgIcons.js.map