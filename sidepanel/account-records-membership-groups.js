// sidepanel/account-records-membership-groups.js - Membership row grouping helpers.
(function attachSidepanelAccountRecordsMembershipGroups(globalScope) {
  const GROUP_TO_UI_GROUP = {
    free: 'free',
    'upi-plus': 'paid-upi',
    'ideal-plus': 'paid-ideal',
    'pix-plus': 'paid-pix',
  };

  function createAccountRecordsMembershipGroupHelpers(context = {}) {
    const {
      membershipViewModel = {},
      membershipRowPolicy = {},
    } = context;
    const normalizeEmail = typeof context.normalizeEmail === 'function'
      ? context.normalizeEmail
      : (value = '') => String(value || '').trim().toLowerCase();
    const normalizeText = typeof context.normalizeText === 'function'
      ? context.normalizeText
      : (value = '') => String(value || '').trim();
    const normalizeRedeemChannel = typeof context.normalizeRedeemChannel === 'function'
      ? context.normalizeRedeemChannel
      : (value = '') => {
        const normalized = normalizeText(value).toLowerCase();
        return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
      };

    function getMembershipViewModelGroup(row = {}) {
      if (typeof membershipViewModel.getGroup === 'function') {
        return membershipViewModel.getGroup(row);
      }
      return membershipRowPolicy.getMembershipGroup?.(row) || 'free';
    }

    function getUpiCredentialMembershipUiGroup(row = {}) {
      const group = getMembershipViewModelGroup(row);
      return GROUP_TO_UI_GROUP[group] || 'free';
    }

    function buildMembershipViewModelRows(rows = []) {
      if (typeof membershipViewModel.buildRows === 'function') {
        return membershipViewModel.buildRows({ items: rows });
      }
      return (Array.isArray(rows) ? rows : [])
        .map((row) => {
          const source = row && typeof row === 'object' && !Array.isArray(row) ? row : {};
          const email = normalizeEmail(source.email || source.accountIdentifier);
          return email ? { ...source, email } : null;
        })
        .filter(Boolean);
    }

    function summarizeMembershipViewModelRows(rows = []) {
      if (typeof membershipViewModel.summarize === 'function') {
        return membershipViewModel.summarize(rows);
      }
      return (Array.isArray(rows) ? rows : []).reduce((summary, row) => {
        const group = getMembershipViewModelGroup(row);
        summary.total += 1;
        if (normalizeText(
          row?.accessToken
          || row?.access_token
          || row?.token
          || row?.upiRedeemAccessToken
        )) {
          summary.withAt += 1;
        }
        if (Object.prototype.hasOwnProperty.call(summary, group)) {
          summary[group] += 1;
        }
        return summary;
      }, {
        total: 0,
        withAt: 0,
        free: 0,
        'upi-plus': 0,
        'ideal-plus': 0,
        'pix-plus': 0,
      });
    }

    function buildUpiCredentialMembershipDisplayRowKey(row = {}, fallbackEmail = '') {
      const email = normalizeEmail(row?.email || fallbackEmail);
      if (!email) {
        return '';
      }
      if (normalizeText(row?.status).toLowerCase() === 'paid') {
        return `paid:${normalizeRedeemChannel(row?.redeemChannel || row?.channel || row?.paymentChannel)}:${email}`;
      }
      return email;
    }

    return {
      getMembershipViewModelGroup,
      getUpiCredentialMembershipUiGroup,
      buildMembershipViewModelRows,
      summarizeMembershipViewModelRows,
      buildUpiCredentialMembershipDisplayRowKey,
    };
  }

  const api = {
    createAccountRecordsMembershipGroupHelpers,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsMembershipGroups = api;
})(typeof window !== 'undefined' ? window : globalThis);
