(function attachMembershipAccessTokenRefresh(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageMembershipAccessTokenRefresh = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipAccessTokenRefreshModule() {
  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function getErrorMessage(error) {
    return error?.message || String(error || '未知错误');
  }

  function isNonRetryableUpiRedeemRetryError(message = '') {
    const text = normalizeString(message);
    return /缺少\s*GPT\s*密码|缺少\s*2FA|登录需要邮箱一次性验证码|登录后需要邮箱|邮箱一次性验证码|验证码页面|登录密码未通过|密码未通过|2FA\s*动态码被页面拒绝|账号登录态不一致|accessToken\s*属于|未读取到\s*accessToken|未进入\s*ChatGPT\s*已登录态|账号无资格|access[_-]?token\s*无效|access[_-]?token[\s\S]*(?:过期|失效|expired|invalid)|无效或已过期|未登录|会话已过期|重新登录|session\s*expired/i.test(text);
  }

  function isAccessTokenInvalidMembershipError(error) {
    const text = normalizeString(getErrorMessage(error));
    if (!text) {
      return false;
    }
    return /(?:access[_\s-]?token|accessToken|token|\bAT\b|会话|session)[\s\S]*(?:无效|过期|失效|未登录|重新登录|invalid|expired|unauthorized|401)|(?:无效|过期|失效|未登录|重新登录|invalid|expired|unauthorized|401)[\s\S]*(?:access[_\s-]?token|accessToken|token|\bAT\b|会话|session)|session\s*expired|\bHTTP\s*401\b|401\s*Unauthorized/i.test(text);
  }

  function buildMissingAccessTokenRefreshMaterialReason(credential = {}) {
    const missing = [];
    if (!normalizeString(credential.password)) {
      missing.push('GPT 密码');
    }
    return missing.length ? `缺少 ${missing.join('、')}` : '';
  }

  function isPreSubmitUpiRedeemBlockedReason(message = '') {
    const text = normalizeString(message);
    return isNonRetryableUpiRedeemRetryError(text)
      || /提交密码后|未进入登录验证码页|登录未进入验证码页|登录或读取\s*accessToken\s*未完成|读取\s*accessToken\s*未完成|verify your identity|one-time password|one-time code/i.test(text);
  }

  function isPreSubmitUpiRedeemBlockedResultItem(item = {}) {
    const redeemStatus = normalizeString(item?.redeemStatus).toLowerCase();
    const cdkey = normalizeString(item?.upiRedeemCdkey || item?.cdkey);
    const reason = normalizeString(item?.redeemReason || item?.reason);
    return redeemStatus === 'failed' && !cdkey && isPreSubmitUpiRedeemBlockedReason(reason);
  }

  return {
    buildMissingAccessTokenRefreshMaterialReason,
    isAccessTokenInvalidMembershipError,
    isNonRetryableUpiRedeemRetryError,
    isPreSubmitUpiRedeemBlockedReason,
    isPreSubmitUpiRedeemBlockedResultItem,
  };
});
