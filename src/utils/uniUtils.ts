/**
 * 显示提示
 */
export function showToast(title: string, icon: 'success' | 'loading' | 'none' = 'none'): void {
    uni.showToast({
      title,
      icon,
      duration: 2000
    });
  }
  
  /**
   * 显示加载
   */
  export function showLoading(title: string = '加载中'): void {
    uni.showLoading({
      title,
      mask: true
    });
  }
  
  /**
   * 隐藏加载
   */
  export function hideLoading(): void {
    uni.hideLoading();
  }
  
  /**
   * 跳转页面
   */
  export function navigateTo(url: string): void {
    uni.navigateTo({
      url
    });
  }