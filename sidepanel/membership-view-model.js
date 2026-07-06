(function attachSidepanelMembershipViewModel(globalScope) {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function normalizeEmail(value = '') {
    return normalizeText(value).toLowerCase();
  }

  function normalizeStatus(value = '') {
    return normalizeText(value).toLowerCase();
  }

  function normalizeRedeemChannel(value = '') {
    return normalizeText(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
  }

  function getGroup(item = {}) {
    const status = normalizeStatus(item?.status);
    if (status !== 'paid') {
      return 'free';
    }
    const channel = normalizeRedeemChannel(
      item?.redeemChannel
      || item?.channel
      || item?.paymentChannel
    );
    return channel === 'ideal' ? 'ideal-plus' : 'upi-plus';
  }

  function buildRows(options = {}) {
    const sourceItems = Array.isArray(options)
      ? options
      : (Array.isArray(options?.items) ? options.items : []);

    return sourceItems
      .map((item) => {
        const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
        const email = normalizeEmail(source.email || source.accountIdentifier);
        if (!email) {
          return null;
        }
        return {
          ...source,
          email,
        };
      })
      .filter(Boolean);
  }

  function hasAccessToken(item = {}) {
    return Boolean(normalizeText(
      item?.accessToken
      || item?.access_token
      || item?.token
      || item?.upiRedeemAccessToken
    ));
  }

  function summarize(items = []) {
    const rows = buildRows(Array.isArray(items) ? { items } : items);
    return rows.reduce((summary, row) => {
      const group = getGroup(row);
      summary.total += 1;
      if (hasAccessToken(row)) {
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
    });
  }

  const api = {
    buildRows,
    summarize,
    getGroup,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelMembershipViewModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
