/**
 * 验证手机号
 * @param username 手机号
 * @returns 是否有效
 */
export function validateMobile(username: string): boolean {
  const reg = /^1[3-9]\d{9}$/;
  return reg.test(username);
}

export function validateUsername(username: string): boolean {
  // 英文字母开头，可以包含字母、数字、下划线，长度3-20位
  const reg = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
  return reg.test(username);
}
/**
 * 验证密码
 * @param password 密码
 * @returns 是否有效
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6 && password.length <= 20;
}

/**
 * 验证验证码
 * @param code 验证码
 * @returns 是否有效
 */
export function validateCode(code: string): boolean {
  const reg = /^\d{6}$/;
  return reg.test(code);
}