(function attachUpiRedeemApiClient(root, factory) {
  const api = factory(root);
  root.MultiPageUpiRedeemApiClient = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createUpiRedeemApiClientModule() {
  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function hasHeader(headers = {}, name = '') {
    const target = normalizeString(name).toLowerCase();
    if (!target || !headers || typeof headers !== 'object') {
      return false;
    }
    return Object.keys(headers).some((key) => normalizeString(key).toLowerCase() === target);
  }

  function withJsonContentType(headers = {}) {
    const nextHeaders = headers && typeof headers === 'object' && !Array.isArray(headers)
      ? { ...headers }
      : {};
    if (!hasHeader(nextHeaders, 'content-type')) {
      nextHeaders['content-type'] = 'application/json';
    }
    return nextHeaders;
  }

  async function readResponseBody(response) {
    if (!response) {
      return null;
    }
    if (typeof response.text === 'function') {
      const text = await response.text();
      if (!normalizeString(text)) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    if (typeof response.json === 'function') {
      return response.json().catch(() => null);
    }
    return null;
  }

  function getPayloadError(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return '';
    }
    if (payload.ok === false || payload.success === false) {
      return normalizeString(payload.error || payload.message || 'UPI redeem API returned failure.');
    }
    if (payload.error) {
      return typeof payload.error === 'string'
        ? normalizeString(payload.error)
        : JSON.stringify(payload.error);
    }
    if (Array.isArray(payload.errors) && payload.errors.length) {
      return JSON.stringify(payload.errors);
    }
    const status = normalizeString(payload.status).toLowerCase();
    if (['error', 'failed', 'failure'].includes(status)) {
      return normalizeString(payload.message || payload.status);
    }
    return '';
  }

  function getPayloadErrorDetails(payload) {
    const payloadError = getPayloadError(payload);
    if (payloadError) {
      return payloadError;
    }
    if (typeof payload === 'string') {
      return normalizeString(payload).replace(/\s+/g, ' ').slice(0, 500);
    }
    if (payload && typeof payload === 'object') {
      try {
        return JSON.stringify(payload).slice(0, 500);
      } catch {
        return '';
      }
    }
    return '';
  }

  function createApiClientError({ response = null, payload = null, url = '' } = {}) {
    const statusCode = Number(response?.status) || 0;
    const payloadError = getPayloadErrorDetails(payload);
    const error = new Error(`UPI Redeem API request failed (HTTP ${statusCode})${payloadError ? `: ${payloadError}` : ''}`);
    error.name = 'UpiRedeemApiClientError';
    error.isUpiRedeemApiClientError = true;
    error.payload = payload;
    error.payloadError = payloadError;
    error.response = response;
    error.statusCode = statusCode;
    error.url = url;
    return error;
  }

  function createUpiRedeemApiClient(options = {}) {
    const {
      fetchImpl = (typeof fetch === 'function' ? fetch.bind(globalThis) : null),
    } = options || {};

    async function postJson({
      url = '',
      apiUrl = '',
      body = {},
      headers = {},
      signal = undefined,
      returnResponse = false,
      throwOnError = true,
    } = {}) {
      if (typeof fetchImpl !== 'function') {
        throw new Error('fetch is not available for UPI redeem API requests.');
      }
      const requestUrl = normalizeString(url || apiUrl);
      const response = await fetchImpl(requestUrl, {
        method: 'POST',
        headers: withJsonContentType(headers),
        body: JSON.stringify(body),
        ...(signal ? { signal } : {}),
      });
      const payload = await readResponseBody(response);
      if (!response?.ok && throwOnError) {
        throw createApiClientError({ response, payload, url: requestUrl });
      }
      return returnResponse ? { response, payload } : payload;
    }

    function redeemCdkey({
      apiUrl = '',
      externalApiKey = '',
      clientId = '',
      cdkey = '',
      session = null,
      accessToken = '',
      channel = 'upi',
      signal = undefined,
    } = {}) {
      return postJson({
        apiUrl,
        body: { cdkey, session, accessToken, channel },
        headers: {
          authorization: `Bearer ${externalApiKey}`,
          'x-client-id': clientId,
          'content-type': 'application/json',
        },
        signal,
      });
    }

    function checkEligibility({
      apiUrl = '',
      url = '',
      token = '',
      accessToken = '',
      promoId = '',
      headers = {},
      signal = undefined,
      returnResponse = false,
      throwOnError = true,
    } = {}) {
      const body = { token: normalizeString(token || accessToken) };
      const normalizedPromoId = normalizeString(promoId);
      if (normalizedPromoId) {
        body.promoId = normalizedPromoId;
      }
      return postJson({
        apiUrl: apiUrl || url,
        body,
        headers,
        signal,
        returnResponse,
        throwOnError,
      });
    }

    return {
      postJson,
      redeemCdkey,
      checkEligibility,
    };
  }

  return {
    createUpiRedeemApiClient,
  };
});
