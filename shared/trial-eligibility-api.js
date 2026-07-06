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
    const normalizedChannel = normalizeString(channel).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
    const keys = normalizedChannel === 'ideal'
      ? ['ideal_eligible', 'idealEligible']
      : ['upi_eligible', 'upiEligible'];
    const reasonKeys = normalizedChannel === 'ideal'
      ? ['ideal_eligible_reason', 'idealEligibleReason']
      : ['upi_eligible_reason', 'upiEligibleReason'];
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
    const base = {
      trialEligibilityStatus: 'failed',
      trialEligibilityReason: '',
      trialEligibilityReasonCode: reasonCode,
      trialEligibilityCheckedByApi: true,
      trialEligibilityTransientFailure: isTransientFailureReason(reasonCode),
      trialEligibilityRetryable: false,
      couponState: normalizeString(source.coupon_state || source.couponState),
      registrationType: normalizeString(source.reg_type || source.regType),
      phoneNumber: normalizeString(source.phone_number || source.phoneNumber),
      phoneVerified: readOwnBoolean(source, ['phone_verified', 'phoneVerified']).value,
      accountId: normalizeString(source.account_id || source.accountId),
      planType: normalizeString(source.plan_type || source.planType),
      responseEmail: normalizeString(source.email).toLowerCase(),
      jwtExpired: readOwnBoolean(source, ['jwt_expired', 'jwtExpired']).value,
      jwtExpiresInSeconds: Math.max(0, Math.floor(Number(source.jwt_exp_in_sec || source.jwtExpInSec) || 0)),
      upiChannelEligibilityStatus: upi.status,
      upiChannelEligibilityReason: upi.reason,
      idealChannelEligibilityStatus: ideal.status,
      idealChannelEligibilityReason: ideal.reason,
    };

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

  function isTrialEligibilityChannelAllowed(item = {}, channel = 'upi') {
    const normalizedChannel = normalizeString(channel).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
    const field = normalizedChannel === 'ideal'
      ? 'idealChannelEligibilityStatus'
      : 'upiChannelEligibilityStatus';
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
      phoneNumber: normalizeString(decision.phoneNumber),
      phoneVerified: decision.phoneVerified === true,
      accountId: normalizeString(decision.accountId),
      responseEmail: normalizeString(decision.responseEmail).toLowerCase(),
      jwtExpired: decision.jwtExpired === true,
      jwtExpiresInSeconds: Math.max(0, Math.floor(Number(decision.jwtExpiresInSeconds) || 0)),
      upiChannelEligibilityStatus: normalizeString(decision.upiChannelEligibilityStatus),
      upiChannelEligibilityReason: normalizeString(decision.upiChannelEligibilityReason),
      idealChannelEligibilityStatus: normalizeString(decision.idealChannelEligibilityStatus),
      idealChannelEligibilityReason: normalizeString(decision.idealChannelEligibilityReason),
    };
  }

  return {
    normalizeTrialEligibilityApiItem,
    isTrialEligibilityEligibleDecision,
    isTrialEligibilityAccountIneligibleDecision,
    isTrialEligibilityTokenInvalidDecision,
    isTrialEligibilityChannelAllowed,
    buildTrialEligibilityResultPatch,
  };
});
