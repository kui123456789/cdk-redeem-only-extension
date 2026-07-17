(function attachTrialEligibilityApi(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageTrialEligibilityApi = api;
})(typeof self !== 'undefined' ? self : globalThis, function createTrialEligibilityApi() {
  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function decodeBufferLikeValue(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return '';
    }
    const data = Array.isArray(value.data) ? value.data : [];
    if (value.type !== 'Buffer' || !data.length) {
      return '';
    }
    return data
      .slice(0, 500)
      .map((item) => {
        const code = Math.max(0, Math.min(255, Math.floor(Number(item) || 0)));
        return String.fromCharCode(code);
      })
      .join('')
      .trim();
  }

  function normalizeDiagnosticValue(value = '') {
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value === 'string') {
      return normalizeString(value);
    }
    const decodedBuffer = decodeBufferLikeValue(value);
    if (decodedBuffer) {
      return decodedBuffer;
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).slice(0, 500);
      } catch {
        return normalizeString(value);
      }
    }
    return normalizeString(value);
  }

  function looksLikeHtmlResponse(value = '') {
    const text = normalizeDiagnosticValue(value);
    if (!text) {
      return false;
    }
    return /^\s*(?:<!doctype\s+html\b|<html[\s>]|<head[\s>]|<body[\s>])/i.test(text)
      || /"type"\s*:\s*"Buffer"[\s\S]{0,80}"data"\s*:\s*\[\s*60\s*,\s*104\s*,\s*116\s*,\s*109\s*,\s*108/i.test(text);
  }

  function hasHtmlDiagnosticPayload(source = {}) {
    return looksLikeHtmlResponse(source)
      || looksLikeHtmlResponse(source.message)
      || looksLikeHtmlResponse(source.error)
      || looksLikeHtmlResponse(source.reason)
      || looksLikeHtmlResponse(source.detail)
      || looksLikeHtmlResponse(source.body)
      || looksLikeHtmlResponse(source.data);
  }

  function normalizeEmail(value = '') {
    return normalizeString(value).toLowerCase();
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }

  function normalizeBoolean(value) {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) return false;
    const normalized = normalizeString(value).toLowerCase();
    return ['1', 'true', 'yes', 'y', 'ok', 'active', 'success'].includes(normalized);
  }

  function readOwnBoolean(source = {}, keys = []) {
    for (const key of keys) {
      if (hasOwn(source, key)) {
        return {
          present: true,
          value: normalizeBoolean(source[key]),
          raw: source[key],
          key,
        };
      }
    }
    return {
      present: false,
      value: false,
      raw: undefined,
      key: '',
    };
  }

  function pickMessage(source = {}, fallback = '') {
    return normalizeString(
      source.message
      || source.error
      || source.reason
      || fallback
    );
  }

  function pickExplicitMessage(source = {}, fallback = '') {
    return normalizeString(
      source.message
      || source.error
      || fallback
    );
  }

  function isTransientFailureReason(reason = '') {
    return /^(?:fetch-error|http-error|unknown-coupon-state)$/i.test(normalizeString(reason));
  }

  function normalizeChannelStatus(source = {}, channel = 'upi') {
    const rawChannel = normalizeString(channel).toLowerCase();
    const normalizedChannel = rawChannel === 'ideal' || rawChannel === 'pix' ? rawChannel : 'upi';
    const keysByChannel = {
      upi: ['upi_eligible', 'upiEligible'],
      ideal: ['ideal_eligible', 'idealEligible'],
      pix: ['pix_eligible', 'pixEligible'],
    };
    const reasonKeysByChannel = {
      upi: ['upi_eligible_reason', 'upiEligibleReason'],
      ideal: ['ideal_eligible_reason', 'idealEligibleReason'],
      pix: ['pix_eligible_reason', 'pixEligibleReason'],
    };
    const keys = keysByChannel[normalizedChannel];
    const reasonKeys = reasonKeysByChannel[normalizedChannel];
    const field = readOwnBoolean(source, keys);
    let reason = '';
    for (const key of reasonKeys) {
      if (hasOwn(source, key)) {
        reason = normalizeString(source[key]);
        break;
      }
    }
    if (!field.present) {
      return {
        status: 'unknown',
        reason,
      };
    }
    return {
      status: field.value ? 'eligible' : 'ineligible',
      reason: field.value ? '' : (reason || `${normalizedChannel.toUpperCase()} 渠道不可用`),
    };
  }

  function normalizeTrialEligibilityApiItem(item = {}) {
    const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
    const reasonCode = normalizeString(source.reason).toLowerCase();
    const tokenOk = readOwnBoolean(source, ['token_ok', 'tokenOk']);
    const eligible = readOwnBoolean(source, ['eligible']);
    const upi = normalizeChannelStatus(source, 'upi');
    const ideal = normalizeChannelStatus(source, 'ideal');
    const pix = normalizeChannelStatus(source, 'pix');
    const base = {
      trialEligibilityStatus: 'failed',
      trialEligibilityReason: '',
      trialEligibilityReasonCode: reasonCode,
      trialEligibilityCheckedByApi: true,
      trialEligibilityTransientFailure: isTransientFailureReason(reasonCode),
      trialEligibilityRetryable: false,
      couponState: normalizeString(source.coupon_state || source.couponState),
      registrationType: normalizeString(source.reg_type || source.regType),
      registrationPhone: normalizeString(source.phone_number || source.registrationPhone),
      phoneVerified: readOwnBoolean(source, ['phone_verified', 'phoneVerified']).value,
      accountId: normalizeString(source.account_id || source.accountId),
      planType: normalizeString(source.plan_type || source.planType),
      responseEmail: normalizeEmail(source.email),
      jwtExpired: readOwnBoolean(source, ['jwt_expired', 'jwtExpired']).value,
      jwtExpiresInSeconds: Math.max(0, Math.floor(Number(source.jwt_exp_in_sec || source.jwtExpInSec) || 0)),
      upiChannelEligibilityStatus: upi.status,
      upiChannelEligibilityReason: upi.reason,
      idealChannelEligibilityStatus: ideal.status,
      idealChannelEligibilityReason: ideal.reason,
      pixChannelEligibilityStatus: pix.status,
      pixChannelEligibilityReason: pix.reason,
    };

    if (hasHtmlDiagnosticPayload(source)) {
      return {
        ...base,
        trialEligibilityStatus: 'failed',
        trialEligibilityReason: '资格检查接口返回了 HTML 页面，不是有效 JSON；可能 API 地址填错、后端路由异常或网关拦截。',
        trialEligibilityReasonCode: reasonCode && !/^\[object\b/i.test(reasonCode) ? reasonCode : 'html-response',
        trialEligibilityTransientFailure: true,
        trialEligibilityRetryable: true,
      };
    }

    if (!tokenOk.present) {
      return {
        ...base,
        trialEligibilityStatus: 'failed',
        trialEligibilityReason: pickExplicitMessage(source, '资格检查接口返回不完整：缺少 token_ok。'),
        trialEligibilityRetryable: true,
      };
    }
    if (!tokenOk.value) {
      return {
        ...base,
        trialEligibilityStatus: 'failed',
        trialEligibilityReason: pickMessage(source, 'ChatGPT accessToken 无效或已过期。'),
        tokenInvalid: true,
      };
    }
    if (!eligible.present) {
      return {
        ...base,
        trialEligibilityStatus: 'failed',
        trialEligibilityReason: pickExplicitMessage(source, '资格检查接口返回不完整：缺少 eligible。'),
        trialEligibilityRetryable: true,
      };
    }
    if (!eligible.value) {
      return {
        ...base,
        trialEligibilityStatus: 'ineligible',
        trialEligibilityReason: pickMessage(source, '账号无试用资格。'),
      };
    }
    return {
      ...base,
      trialEligibilityStatus: 'eligible',
      trialEligibilityReason: pickMessage(source, '账号有试用资格。'),
    };
  }

  function isTrialEligibilityEligibleDecision(decision = {}) {
    return normalizeString(decision.trialEligibilityStatus).toLowerCase() === 'eligible';
  }

  function isTrialEligibilityAccountIneligibleDecision(decision = {}) {
    return normalizeString(decision.trialEligibilityStatus).toLowerCase() === 'ineligible';
  }

  function isTrialEligibilityTokenInvalidDecision(decision = {}) {
    return decision.tokenInvalid === true;
  }

  function isTrialEligibilityDecisionEmailMismatch(decision = {}, expectedEmail = '') {
    const expected = normalizeEmail(expectedEmail);
    const responseEmail = normalizeEmail(decision.responseEmail || decision.email);
    return Boolean(expected && responseEmail && expected !== responseEmail);
  }

  function buildTrialEligibilityEmailMismatchReason(decision = {}, expectedEmail = '') {
    if (!isTrialEligibilityDecisionEmailMismatch(decision, expectedEmail)) {
      return '';
    }
    return `资格检查返回邮箱 ${normalizeEmail(decision.responseEmail || decision.email)}，不是当前目标邮箱 ${normalizeEmail(expectedEmail)}，疑似 AT 串号。`;
  }

  function isTrialEligibilityChannelAllowed(item = {}, channel = 'upi') {
    const rawChannel = normalizeString(channel).toLowerCase();
    const normalizedChannel = rawChannel === 'ideal' || rawChannel === 'pix' ? rawChannel : 'upi';
    const field = normalizedChannel === 'ideal'
      ? 'idealChannelEligibilityStatus'
      : (normalizedChannel === 'pix' ? 'pixChannelEligibilityStatus' : 'upiChannelEligibilityStatus');
    const status = normalizeString(item[field]).toLowerCase();
    return !status || status === 'unknown' || status === 'eligible';
  }

  function buildTrialEligibilityResultPatch(decision = {}) {
    return {
      trialEligibilityStatus: normalizeString(decision.trialEligibilityStatus),
      trialEligibilityReason: normalizeString(decision.trialEligibilityReason),
      trialEligibilityReasonCode: normalizeString(decision.trialEligibilityReasonCode),
      trialEligibilityCheckedByApi: decision.trialEligibilityCheckedByApi === true,
      trialEligibilityTransientFailure: decision.trialEligibilityTransientFailure === true,
      trialEligibilityRetryable: decision.trialEligibilityRetryable === true,
      couponState: normalizeString(decision.couponState),
      registrationType: normalizeString(decision.registrationType),
      registrationPhone: normalizeString(decision.registrationPhone),
      phoneVerified: decision.phoneVerified === true,
      accountId: normalizeString(decision.accountId),
      responseEmail: normalizeEmail(decision.responseEmail),
      jwtExpired: decision.jwtExpired === true,
      jwtExpiresInSeconds: Math.max(0, Math.floor(Number(decision.jwtExpiresInSeconds) || 0)),
      upiChannelEligibilityStatus: normalizeString(decision.upiChannelEligibilityStatus),
      upiChannelEligibilityReason: normalizeString(decision.upiChannelEligibilityReason),
      idealChannelEligibilityStatus: normalizeString(decision.idealChannelEligibilityStatus),
      idealChannelEligibilityReason: normalizeString(decision.idealChannelEligibilityReason),
      pixChannelEligibilityStatus: normalizeString(decision.pixChannelEligibilityStatus),
      pixChannelEligibilityReason: normalizeString(decision.pixChannelEligibilityReason),
    };
  }

  return {
    normalizeTrialEligibilityApiItem,
    isTrialEligibilityEligibleDecision,
    isTrialEligibilityAccountIneligibleDecision,
    isTrialEligibilityTokenInvalidDecision,
    isTrialEligibilityDecisionEmailMismatch,
    buildTrialEligibilityEmailMismatchReason,
    isTrialEligibilityChannelAllowed,
    buildTrialEligibilityResultPatch,
  };
});
