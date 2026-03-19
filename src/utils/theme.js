export class ThemeManager {
    currentTheme = 'dark';
    storageKey = 'app_theme';
    constructor() {
        // 初始化主题
        this.initTheme();
    }
    // 初始化主题
    initTheme() {
        try {
            const savedTheme = uni.getStorageSync(this.storageKey);
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                this.currentTheme = savedTheme;
            }
            else {
                // 默认使用暗黑主题
                this.currentTheme = 'dark';
                this.saveTheme();
            }
        }
        catch (error) {
            console.error('初始化主题失败:', error);
            this.currentTheme = 'dark';
        }
        this.applyTheme();
    }
    // 获取当前主题
    getCurrentTheme() {
        return this.currentTheme;
    }
    // 获取当前主题名称
    getThemeName() {
        return this.currentTheme === 'light' ? '蓝白系' : '暗黑系';
    }
    // 切换主题
    switchTheme(themeType) {
        this.currentTheme = themeType;
        this.saveTheme();
        this.applyTheme();
    }
    // 保存主题到本地存储
    saveTheme() {
        try {
            uni.setStorageSync(this.storageKey, this.currentTheme);
        }
        catch (error) {
            console.error('保存主题失败:', error);
        }
    }
    // 应用主题到页面
    applyTheme() {
        // try {
        //   // 移除所有主题类
        //   document.body.classList.remove('theme-light', 'theme-dark');
        //   // 添加当前主题类
        //   document.body.classList.add(`theme-${this.currentTheme}`);
        // } catch (error) {
        //   console.error('应用主题失败:', error);
        // }
    }
    // 获取所有主题
    getAllThemes() {
        return [
            {
                type: 'light',
                name: '蓝白系',
                description: '清新蓝白风格'
            },
            {
                type: 'dark',
                name: '暗黑系',
                description: '护眼暗黑风格'
            }
        ];
    }
}
// 导出单例实例
export const themeManager = new ThemeManager();
//# sourceMappingURL=theme.js.map