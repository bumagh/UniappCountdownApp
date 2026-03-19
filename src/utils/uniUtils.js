/**
 * 显示提示
 */
export function showToast(title, icon = 'none') {
    uni.showToast({
        title,
        icon,
        duration: 2000
    });
}
/**
 * 显示加载
 */
export function showLoading(title = '加载中') {
    uni.showLoading({
        title,
        mask: true
    });
}
/**
 * 隐藏加载
 */
export function hideLoading() {
    uni.hideLoading();
}
/**
 * 跳转页面
 */
export function navigateTo(url) {
    uni.navigateTo({
        url
    });
}
//# sourceMappingURL=uniUtils.js.map