(function attachMultiPageAssurivoFeedClient(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageAssurivoFeedClient = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageAssurivoFeedClientModule() {
  const DEFAULT_ASSURIVO_VERIFICATION_OPEN_URL = 'https://assurivo.com/console/open.php';
  const DEFAULT_ASSURIVO_VERIFICATION_FEED_URL = 'https://assurivo.com/console/feed.php';

  function createAssurivoFeedClient(context = {}) {
    const constants = context.constants || {};
    const { ICLOUD_MAIL_POLL_MIN_ATTEMPTS, ICLOUD_MAIL_POLL_TIMEOUT_MARGIN_MS, ASSURIVO_VERIFICATION_OPEN_URL, ASSURIVO_VERIFICATION_FEED_URL, ASSURIVO_VERIFICATION_FILTER_SKEW_MS, ASSURIVO_RESEND_SAME_CODE_GRACE_MS } = constants;
    const fetchImpl = context.fetchImpl;
    function addLog(message, level = 'info', options = {}) {
      const nextOptions = options && typeof options === 'object' ? { ...options } : {};
      const activeStep = typeof context.getActiveVerificationLogStep === 'function'
        ? Math.floor(Number(context.getActiveVerificationLogStep()) || 0)
        : 0;
      if (!nextOptions.step && activeStep > 0) {
        nextOptions.step = activeStep;
      }
      if (!nextOptions.stepKey) {
        const stepValue = Math.floor(Number(nextOptions.step) || activeStep || 0);
        const stepKey = typeof context.getVerificationLogStepKey === 'function'
          ? context.getVerificationLogStepKey(stepValue)
          : '';
        if (stepKey) {
          nextOptions.stepKey = stepKey;
        }
      }
      return context.addLog(message, level, nextOptions);
    }
    const getVerificationCodeLabel = (...args) => context.getVerificationCodeLabel(...args);
    const collectCustomEmailVerificationCodes = (...args) => context.collectCustomEmailVerificationCodes(...args);
    const collectAssurivoOpenPageBodyCodes = (...args) => context.collectAssurivoOpenPageBodyCodes(...args);
    const getOrderedAssurivoOpenPageMailBlocks = (...args) => context.getOrderedAssurivoOpenPageMailBlocks(...args);
    const hasOnlyOlderTimestampedAssurivoOpenPageEntries = (...args) => context.hasOnlyOlderTimestampedAssurivoOpenPageEntries(...args);
    const isAssurivoVerificationPayload = (...args) => context.isAssurivoVerificationPayload(...args);
    const getAssurivoEntryBodyText = (...args) => context.getAssurivoEntryBodyText(...args);
    const isAssurivoFeedVerificationEntry = (...args) => context.isAssurivoFeedVerificationEntry(...args);
    const extractSingleBareAssurivoBodyCodeDetails = (...args) => context.extractSingleBareAssurivoBodyCodeDetails(...args);
    const getStrictVerificationBodyCodeDetails = (...args) => context.getStrictVerificationBodyCodeDetails(...args);
    const formatAssurivoTimestampForLog = (...args) => context.formatAssurivoTimestampForLog(...args);
    const extractVerificationEntryTimestamp = (...args) => context.extractVerificationEntryTimestamp(...args);
    const extractAssurivoFeedEntryTimestamp = (...args) => context.extractAssurivoFeedEntryTimestamp(...args);
    const normalizeFilterAfterTimestamp = (...args) => context.normalizeFilterAfterTimestamp(...args);
    const getOrderedAssurivoVerificationEntries = (...args) => context.getOrderedAssurivoVerificationEntries(...args);
    const hasOnlyOlderTimestampedAssurivoEntries = (...args) => context.hasOnlyOlderTimestampedAssurivoEntries(...args);
    const getLatestAssurivoEntryTimestamp = (...args) => context.getLatestAssurivoEntryTimestamp(...args);
    const describeAssurivoFilterTiming = (...args) => context.describeAssurivoFilterTiming(...args);
    const extractFirstEmailCodeFromOrderedEntries = (...args) => context.extractFirstEmailCodeFromOrderedEntries(...args);
    const resolveInitialVerificationRequestedAt = (...args) => context.resolveInitialVerificationRequestedAt(...args);
    const getCompletionStep = (...args) => context.getCompletionStep(...args);

        function isRetryableCustomEmailVerificationFetchError(error) {
          const message = String(typeof error === 'string' ? error : error?.message || '').trim();
          return /HTTP\s*(?:408|429|5\d\d)\b|Gateway Time-out|gateway timeout|暂未返回有效验证码|自定义邮箱暂未返回有效验证码|取码接口.*(?:超时|timeout)|查询暂时较慢/i.test(message);
        }

        function isAssurivoEmptyFeedVerificationFetchError(error) {
          const message = String(typeof error === 'string' ? error : error?.message || '').trim();
          return /Assurivo\s+JSON\s+接口暂未返回有效验证码/i.test(message)
            && /(?:"data"\s*:\s*\[\]|Assurivo\s+JSON\s+未返回\s+ChatGPT\/OpenAI\s+验证邮件|只返回了早于本轮发码时间的验证码邮件|未收到本轮验证码邮件)/i.test(message);
        }

        function normalizeEmailForComparison(value = '') {
          return String(value || '').trim().toLowerCase();
        }

        function normalizeCustomEmailVerificationUrl(value = '') {
          const rootScope = typeof self !== 'undefined' ? self : globalThis;
          const sharedNormalizer = rootScope.MailProviderUtils?.normalizeCustomEmailVerificationUrl;
          if (typeof sharedNormalizer === 'function') {
            return sharedNormalizer(value);
          }
          const raw = String(value || '').trim();
          if (!/^https?:\/\//i.test(raw)) {
            return '';
          }
          try {
            const parsed = new URL(raw);
            return /^https?:$/i.test(parsed.protocol) ? parsed.toString() : '';
          } catch {
            return '';
          }
        }

        function parseCustomEmailPoolEntryValue(value = '') {
          const rootScope = typeof self !== 'undefined' ? self : globalThis;
          const sharedParser = rootScope.MailProviderUtils?.parseCustomEmailPoolEntryValue;
          if (typeof sharedParser === 'function') {
            return sharedParser(value);
          }
          const raw = String(value || '').trim();
          const parts = raw.split(/-{3,}/).map((part) => part.trim());
          const hasSeparator = parts.length > 1;
          const emailSource = hasSeparator ? parts[0] : raw;
          const verificationUrl = (hasSeparator ? parts.slice(1) : [raw])
            .map((part) => normalizeCustomEmailVerificationUrl(part))
            .find(Boolean) || '';
          let urlEmail = '';
          if (verificationUrl) {
            try {
              const parsed = new URL(verificationUrl);
              urlEmail = normalizeEmailForComparison(parsed.searchParams.get('mail') || parsed.searchParams.get('email') || '');
            } catch { }
          }
          const normalizedEmail = normalizeEmailForComparison(emailSource);
          return {
            email: /^[^\s@:/?#]+@[^\s@:/?#]+\.[^\s@:/?#]+$/.test(normalizedEmail) ? normalizedEmail : urlEmail,
            credential: hasSeparator && !verificationUrl ? raw : '',
            verificationUrl,
          };
        }

        function buildLinlinflowMailApiUrl(rawUrl = '') {
          const value = String(rawUrl || '').trim();
          if (!/^https?:\/\//i.test(value)) {
            return '';
          }

          try {
            const parsed = new URL(value);
            const pathname = String(parsed.pathname || '').replace(/\/+$/g, '') || '/';
            const hostname = String(parsed.hostname || '').toLowerCase();
            const looksLikeLinlinflow = hostname.includes('linlinflow');
            if (!looksLikeLinlinflow || pathname === '/latest' || pathname === '/mail-api' || pathname.startsWith('/mail-api/')) {
              return '';
            }

            let email = parsed.searchParams.get('email') || parsed.searchParams.get('mail') || '';
            let authCode = parsed.searchParams.get('auth_code')
              || parsed.searchParams.get('code')
              || parsed.searchParams.get('key')
              || '';

            if ((!email || !authCode) && pathname !== '/') {
              const parts = pathname.split('/').filter(Boolean);
              if (parts.length >= 2) {
                authCode = authCode || parts[0];
                email = email || parts[1];
              }
            }

            email = String(email || '').trim();
            authCode = String(authCode || '').trim();
            if (!email || !authCode) {
              return '';
            }

            const apiUrl = new URL(
              `/mail-api/${encodeURIComponent(authCode)}/${encodeURIComponent(email)}`,
              parsed.origin
            );
            apiUrl.searchParams.set('folder', 'inbox');
            apiUrl.searchParams.set('refresh', '1');
            return apiUrl.toString();
          } catch {
            return '';
          }
        }

        function buildLinlinflowLatestApiUrl(rawUrl = '', options = {}) {
          const value = String(rawUrl || '').trim();
          if (!/^https?:\/\//i.test(value)) {
            return '';
          }

          try {
            const parsed = new URL(value);
            const pathname = String(parsed.pathname || '').replace(/\/+$/g, '') || '/';
            const looksLikeLinlinflowLatest = pathname === '/latest';
            if (!looksLikeLinlinflowLatest) {
              return '';
            }
            const email = String(parsed.searchParams.get('email') || parsed.searchParams.get('mail') || '').trim();
            const authCode = String(
              parsed.searchParams.get('auth_code')
              || parsed.searchParams.get('code')
              || parsed.searchParams.get('key')
              || ''
            ).trim();
            if (!email || !authCode) {
              return '';
            }
            const apiUrl = new URL(
              `/mail-api/${encodeURIComponent(authCode)}/${encodeURIComponent(email)}`,
              parsed.origin
            );
            apiUrl.searchParams.set('folder', 'inbox');
            if (options.refresh) {
              apiUrl.searchParams.set('refresh', '1');
            }
            if (options.background) {
              apiUrl.searchParams.set('async', '1');
            }
            if (options.cacheFirst || (!options.refresh && !options.background)) {
              apiUrl.searchParams.set('cache_first', '1');
            }
            return apiUrl.toString();
          } catch {
            return '';
          }
        }

        function getCustomEmailVerificationRequestUrl(rawUrl = '') {
          return buildAssurivoFeedVerificationUrlFromUrl(rawUrl)
            || buildLinlinflowMailApiUrl(rawUrl)
            || rawUrl;
        }

        function getCustomEmailVerificationRequestLabel(rawUrl = '') {
          return buildLinlinflowMailApiUrl(rawUrl)
            ? 'LinlinFlow 邮箱取码接口'
            : (
              buildAssurivoFeedVerificationUrlFromUrl(rawUrl)
                ? 'Assurivo JSON 接口'
                : '自定义邮箱取码 URL'
            );
        }

        function normalizeCustomEmailPoolEntryForVerification(rawEntry = {}) {
          const asObject = rawEntry && typeof rawEntry === 'object'
            ? rawEntry
            : { email: rawEntry };
          const parsedEntry = parseCustomEmailPoolEntryValue(asObject.credential || asObject.email || '');
          const email = normalizeEmailForComparison(parsedEntry.email || asObject.email || '');
          if (!email) {
            return null;
          }
          return {
            email,
            credential: parsedEntry.credential || String(asObject.credential || '').trim(),
            verificationUrl: normalizeCustomEmailVerificationUrl(
              asObject.verificationUrl || asObject.url || parsedEntry.verificationUrl || ''
            ),
          };
        }

        function getCustomEmailVerificationEntry(state = {}, targetEmail = '') {
          const normalizedTarget = normalizeEmailForComparison(
            targetEmail
            || state?.step8VerificationTargetEmail
            || state?.email
          );
          if (!normalizedTarget) {
            return null;
          }

          const entries = Array.isArray(state?.customEmailPoolEntries)
            ? state.customEmailPoolEntries
            : [];
          for (const rawEntry of entries) {
            const entry = normalizeCustomEmailPoolEntryForVerification(rawEntry);
            if (entry?.email === normalizedTarget) {
              return entry;
            }
          }

          const legacyEntries = Array.isArray(state?.customEmailPool)
            ? state.customEmailPool
            : String(state?.customEmailPool || '').split(/\r?\n/);
          for (const rawEntry of legacyEntries) {
            const entry = normalizeCustomEmailPoolEntryForVerification(rawEntry);
            if (entry?.email === normalizedTarget) {
              return entry;
            }
          }
          return null;
        }

        function extractAssurivoOpenPageMailBlocks(payload) {
          const rawText = String(payload || '');
          if (!rawText.trim()) {
            return [];
          }

          const blocks = [];
          const articlePattern = /<article\b[^>]*class=["'][^"']*\bmail\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi;
          let match = articlePattern.exec(rawText);
          while (match) {
            blocks.push(match[0]);
            match = articlePattern.exec(rawText);
          }
          return blocks.length ? blocks : [rawText];
        }

        function extractAssurivoOpenPageVerificationCode(payload, excluded = new Set(), options = {}) {
          const blocks = getOrderedAssurivoOpenPageMailBlocks(payload, options);
          let matchedPrompt = false;
          for (const block of blocks) {
            const { codes, matchedPrompt: blockMatchedPrompt } = collectAssurivoOpenPageBodyCodes(block);
            matchedPrompt = matchedPrompt || blockMatchedPrompt;
            const filteredCodes = codes.filter((code) => !excluded.has(code));
            if (filteredCodes.length) {
              return {
                code: options.preferFirstCode ? filteredCodes[0] : filteredCodes[filteredCodes.length - 1],
                matchedPrompt,
              };
            }
          }
          return {
            code: '',
            matchedPrompt,
          };
        }

        function extractAssurivoFeedVerificationCodeDetails(payload = {}, excluded = new Set(), options = {}) {
          const entries = Array.isArray(payload?.data) ? payload.data : [];
          const candidates = getOrderedAssurivoVerificationEntries(
            entries.filter((entry) => isAssurivoFeedVerificationEntry(entry)),
            options
          );
          if (!candidates.length) {
            const bareFallbackResult = extractSingleBareAssurivoBodyCodeDetails(entries, excluded, options);
            if (bareFallbackResult?.code) {
              return bareFallbackResult;
            }
            const hasMailEntries = entries.length > 0;
            const latestTimestamp = getLatestAssurivoEntryTimestamp(entries);
            return {
              code: '',
              emailTimestamp: latestTimestamp,
              source: 'assurivo-feed',
              failureDetail: hasMailEntries
                ? `Assurivo JSON 返回了 ${entries.length} 封邮件，但没有邮件正文匹配 ChatGPT/OpenAI 验证语义；最新邮件时间 ${formatAssurivoTimestampForLog(latestTimestamp) || '未知'}。`
                : 'Assurivo JSON 未返回 ChatGPT/OpenAI 验证邮件。',
            };
          }

          const allowExcludedAfterTimestamp = normalizeFilterAfterTimestamp(options.allowExcludedAfterTimestamp);
          let firstFailureResult = null;
          for (const candidateEntry of candidates) {
            const emailTimestamp = extractAssurivoFeedEntryTimestamp(candidateEntry);
            const bodyDetails = getStrictVerificationBodyCodeDetails(getAssurivoEntryBodyText(candidateEntry), {
              trustedOpenAiMail: true,
            });
            const rawCodes = bodyDetails.codes;
            const codes = rawCodes
              .filter((code) => !excluded.has(code));
            const canReuseExcludedFromFreshMail = Boolean(
              !codes.length
              && rawCodes.length
              && allowExcludedAfterTimestamp > 0
              && emailTimestamp > 0
              && emailTimestamp >= allowExcludedAfterTimestamp - ASSURIVO_RESEND_SAME_CODE_GRACE_MS
            );
            const reusedExcludedCode = canReuseExcludedFromFreshMail ? rawCodes[0] : '';
            let failureDetail = '';
            if (!rawCodes.length) {
              failureDetail = `最新邮件正文未匹配到验证码；邮件时间 ${formatAssurivoTimestampForLog(emailTimestamp) || '未知'}；正文验证码语义 ${bodyDetails.promptMatched ? '已匹配' : '未匹配'}。`;
            } else if (!codes.length) {
              failureDetail = `最新邮件正文只包含已被页面拒绝的验证码 ${rawCodes.join(', ')}；邮件时间 ${formatAssurivoTimestampForLog(emailTimestamp) || '未知'}。`;
            }
            const result = {
              code: codes.length ? codes[0] : reusedExcludedCode,
              emailTimestamp,
              emailTimestampText: formatAssurivoTimestampForLog(emailTimestamp),
              source: 'assurivo-feed',
              promptMatched: bodyDetails.promptMatched,
              candidateCodes: rawCodes,
              onlyExcludedCodes: Boolean(rawCodes.length && !codes.length && !reusedExcludedCode),
              reusedExcludedCode: Boolean(reusedExcludedCode),
              failureDetail,
            };
            if (result.code) {
              return result;
            }
            if (!firstFailureResult) {
              firstFailureResult = result;
            }
          }
          const bareFallbackResult = extractSingleBareAssurivoBodyCodeDetails(entries, excluded, options);
          if (bareFallbackResult?.code) {
            return bareFallbackResult;
          }
          return firstFailureResult || {
            code: '',
            emailTimestamp: getLatestAssurivoEntryTimestamp(candidates),
            source: 'assurivo-feed',
            failureDetail: 'Assurivo JSON 返回了 OpenAI/ChatGPT 邮件，但正文未匹配到验证码。',
          };
        }

        function isLinlinflowMailApiPayload(payload) {
          return Boolean(
            payload
            && typeof payload === 'object'
            && !Array.isArray(payload)
            && (
              Array.isArray(payload.messages)
              || Object.prototype.hasOwnProperty.call(payload, 'message_count')
              || Object.prototype.hasOwnProperty.call(payload, 'code')
              || Object.prototype.hasOwnProperty.call(payload, 'verification_code')
            )
            && (
              Object.prototype.hasOwnProperty.call(payload, 'email')
              || Object.prototype.hasOwnProperty.call(payload, 'folder')
              || Object.prototype.hasOwnProperty.call(payload, 'messages')
            )
          );
        }

        function extractLinlinflowMailApiCode(payload = {}, excluded = new Set(), options = {}) {
          const timestampOptions = options.ignoreTimestampFilter
            ? { ...options, filterAfterTimestamp: 0 }
            : options;
          const messageCode = extractFirstEmailCodeFromOrderedEntries(
            Array.isArray(payload.messages) ? payload.messages : [],
            excluded,
            timestampOptions
          );
          if (messageCode) {
            return messageCode;
          }

          const topLevelTimestamp = extractVerificationEntryTimestamp({
            received_time: payload.received_at || payload.received_time || payload.date || payload.timestamp,
          });
          const minTimestamp = normalizeFilterAfterTimestamp(options.filterAfterTimestamp) - ASSURIVO_VERIFICATION_FILTER_SKEW_MS;
          if (!options.ignoreTimestampFilter && minTimestamp > 0 && topLevelTimestamp > 0 && topLevelTimestamp < minTimestamp) {
            return '';
          }

          const topLevelCodes = collectCustomEmailVerificationCodes({
            code: payload.code,
            verification_code: payload.verification_code,
            body: payload.body || payload.body_preview || '',
          }).filter((code, index, list) => !excluded.has(code) && list.indexOf(code) === index);
          if (!topLevelCodes.length) {
            return '';
          }
          return options.preferFirstCode ? topLevelCodes[0] : topLevelCodes[topLevelCodes.length - 1];
        }

        function extractCustomEmailVerificationCode(payload, options = {}) {
          return extractCustomEmailVerificationCodeDetails(payload, options).code || '';
        }

        function extractCustomEmailVerificationCodeDetails(payload, options = {}) {
          const excluded = new Set((options.excludeCodes || []).map((code) => String(code || '').trim()).filter(Boolean));
          if (isAssurivoVerificationPayload(payload)) {
            return extractAssurivoFeedVerificationCodeDetails(payload, excluded, options);
          }
          if (options.assurivoOpenPage && (typeof payload === 'string' || typeof payload === 'number')) {
            const { code, matchedPrompt } = extractAssurivoOpenPageVerificationCode(payload, excluded, options);
            if (code) {
              return { code, source: 'assurivo-open-page' };
            }
            if (matchedPrompt) {
              return { code: '', source: 'assurivo-open-page' };
            }
          }
          if (isLinlinflowMailApiPayload(payload)) {
            return {
              code: extractLinlinflowMailApiCode(payload, excluded, options),
              source: 'linlinflow',
            };
          }
          const codes = collectCustomEmailVerificationCodes(payload).filter((code, index, list) => (
            !excluded.has(code) && list.indexOf(code) === index
          ));
          if (!codes.length) {
            return { code: '', source: 'generic' };
          }
          return {
            code: options.preferFirstCode ? codes[0] : codes[codes.length - 1],
            source: 'generic',
          };
        }

        function parseCustomEmailVerificationPayloadText(text = '') {
          const rawText = String(text || '').trim();
          if (!rawText) {
            return '';
          }
          try {
            return JSON.parse(rawText);
          } catch {
            return rawText;
          }
        }

        function describeCustomEmailVerificationPayload(payload) {
          if (typeof payload === 'string') {
            return payload.slice(0, 160);
          }
          try {
            return JSON.stringify(payload).slice(0, 160);
          } catch {
            return '';
          }
        }

        function normalizeAssurivoCredentialParts(credential = '', fallbackEmail = '') {
          const raw = String(credential || '').trim();
          const separatorIndex = raw.indexOf('----');
          if (separatorIndex < 0) {
            return { email: '', pwd: '' };
          }
          const email = normalizeEmailForComparison(raw.slice(0, separatorIndex) || fallbackEmail);
          const pwd = raw.slice(separatorIndex + 4).trim();
          if (!email || !pwd) {
            return { email: '', pwd: '' };
          }
          return { email, pwd };
        }

        function buildAssurivoVerificationUrl(entry = {}, state = {}, endpoint = 'feed') {
          const credential = String(entry?.credential || '').trim();
          const { email, pwd } = normalizeAssurivoCredentialParts(credential, entry?.email);
          if (!email || !pwd) {
            return '';
          }
          const limit = Math.max(1, Math.min(20, Math.floor(Number(state?.assurivoMailLimit) || 5)));
          const url = new URL(endpoint === 'feed' ? ASSURIVO_VERIFICATION_FEED_URL : ASSURIVO_VERIFICATION_OPEN_URL);
          url.searchParams.set('mail', email);
          url.searchParams.set('pwd', pwd);
          url.searchParams.set('limit', String(limit));
          return url.toString();
        }

        function isAssurivoOpenVerificationUrl(rawUrl = '') {
          try {
            const url = new URL(String(rawUrl || '').trim());
            return url.hostname === 'assurivo.com' && url.pathname === '/console/open.php';
          } catch {
            return false;
          }
        }

        function isAssurivoFeedVerificationUrl(rawUrl = '') {
          try {
            const url = new URL(String(rawUrl || '').trim());
            return url.hostname === 'assurivo.com' && url.pathname === '/console/feed.php';
          } catch {
            return false;
          }
        }

        function buildAssurivoFeedVerificationUrlFromUrl(rawUrl = '') {
          try {
            const url = new URL(String(rawUrl || '').trim());
            if (url.hostname !== 'assurivo.com' || !['/console/open.php', '/console/feed.php'].includes(url.pathname)) {
              return '';
            }
            url.pathname = '/console/feed.php';
            return url.toString();
          } catch {
            return '';
          }
        }

        function shouldUseAssurivoCredentialUrl(state = {}) {
          const hasConfiguredIcloudApi = Boolean(
            String(state?.icloudApiBaseUrl || '').trim()
            && String(state?.icloudApiAdminKey || '').trim()
          );
          return !hasConfiguredIcloudApi;
        }

        function isIcloudMail(mail) {
          return mail?.source === 'icloud-mail' || mail?.provider === 'icloud';
        }

        function normalizeIcloudMailPollPayload(mail, payload = {}) {
          if (!isIcloudMail(mail)) {
            return payload;
          }

          const currentAttempts = Math.max(1, Math.floor(Number(payload?.maxAttempts) || 1));
          if (currentAttempts >= ICLOUD_MAIL_POLL_MIN_ATTEMPTS) {
            return payload;
          }

          return {
            ...payload,
            maxAttempts: ICLOUD_MAIL_POLL_MIN_ATTEMPTS,
          };
        }

        function getMailPollingResponseTimeoutMs(payload = {}) {
          const maxAttempts = Math.max(1, Math.floor(Number(payload?.maxAttempts) || 1));
          const intervalMs = Math.max(1, Number(payload?.intervalMs) || 3000);
          return Math.max(45000, maxAttempts * intervalMs + ICLOUD_MAIL_POLL_TIMEOUT_MARGIN_MS);
        }

        function resolveMailPollingTimeouts(mail, timedPoll) {
          const payload = normalizeIcloudMailPollPayload(mail, timedPoll?.payload || {});
          const defaultResponseTimeoutMs = Math.max(1000, Number(timedPoll?.responseTimeoutMs) || 30000);
          const defaultTimeoutMs = Math.max(defaultResponseTimeoutMs, Number(timedPoll?.timeoutMs) || defaultResponseTimeoutMs);
          if (!isIcloudMail(mail)) {
            return {
              payload,
              responseTimeoutMs: defaultResponseTimeoutMs,
              timeoutMs: defaultTimeoutMs,
            };
          }

          const derivedResponseTimeoutMs = Math.max(
            defaultResponseTimeoutMs,
            getMailPollingResponseTimeoutMs(payload)
          );
          const derivedTimeoutMs = Math.max(defaultTimeoutMs, derivedResponseTimeoutMs);

          return {
            payload,
            responseTimeoutMs: derivedResponseTimeoutMs,
            timeoutMs: derivedTimeoutMs,
          };
        }

        async function fetchCustomEmailVerificationCode(step, state = {}, options = {}) {
          const completionStep = getCompletionStep(step, options);
          const verificationLabel = completionStep === 6 ? '设置 GPT 密码' : getVerificationCodeLabel(step);
          const targetEmail = normalizeEmailForComparison(
            options.targetEmail
            || state?.step8VerificationTargetEmail
            || state?.email
          );
          const entry = getCustomEmailVerificationEntry(state, targetEmail);
          const explicitVerificationUrl = String(entry?.verificationUrl || '').trim();
          const assurivoVerificationUrl = (!explicitVerificationUrl && shouldUseAssurivoCredentialUrl(state))
            ? buildAssurivoVerificationUrl(entry, state)
            : '';
          const assurivoFallbackVerificationUrl = assurivoVerificationUrl
            ? buildAssurivoVerificationUrl(entry, state, 'feed')
            : '';
          const verificationUrl = explicitVerificationUrl || assurivoVerificationUrl;
          if (!verificationUrl) {
            return {
              handled: false,
              targetEmail,
            };
          }

          const fetcher = typeof fetchImpl === 'function'
            ? fetchImpl
            : (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
          if (typeof fetcher !== 'function') {
            throw new Error(`步骤 ${completionStep}：当前运行环境不支持 fetch，无法通过自定义邮箱取码 URL 获取验证码。`);
          }

          const filterAfterTimestamp = resolveInitialVerificationRequestedAt(step, state, options.filterAfterTimestamp);
          const requests = [];
          if (assurivoVerificationUrl) {
            requests.push({
              url: assurivoVerificationUrl,
              label: 'Assurivo JSON 接口',
              preferFirstCode: false,
              assurivoOpenPage: false,
            });
            if (assurivoFallbackVerificationUrl && assurivoFallbackVerificationUrl !== assurivoVerificationUrl) {
              requests.push({
                url: assurivoFallbackVerificationUrl,
                label: 'Assurivo JSON 接口',
                preferFirstCode: false,
              });
            }
          } else {
            const linlinflowLatestUrl = buildLinlinflowLatestApiUrl(verificationUrl, { cacheFirst: true });
            if (linlinflowLatestUrl) {
              requests.push({
                url: linlinflowLatestUrl,
                label: '自动识别最新验证码接口',
                preferFirstCode: true,
                assurivoOpenPage: false,
              });
              const linlinflowLatestRefreshUrl = buildLinlinflowLatestApiUrl(verificationUrl, {
                refresh: true,
              });
              if (linlinflowLatestRefreshUrl && linlinflowLatestRefreshUrl !== linlinflowLatestUrl) {
                requests.push({
                  url: linlinflowLatestRefreshUrl,
                  label: '自动识别最新验证码刷新接口',
                  preferFirstCode: true,
                  assurivoOpenPage: false,
                  ignoreTimestampFilter: true,
                });
              }
            } else {
              const linlinflowRequestUrl = buildLinlinflowMailApiUrl(verificationUrl);
              const requestUrl = linlinflowRequestUrl || getCustomEmailVerificationRequestUrl(verificationUrl);
              requests.push({
                url: requestUrl,
                label: getCustomEmailVerificationRequestLabel(verificationUrl),
                preferFirstCode: Boolean(linlinflowRequestUrl) || isAssurivoOpenVerificationUrl(verificationUrl),
                assurivoOpenPage: false,
              });
            }
          }

          let lastError = null;
          for (let requestIndex = 0; requestIndex < requests.length; requestIndex += 1) {
            const request = requests[requestIndex];
            await addLog(`步骤 ${completionStep}：正在通过${request.label}获取${verificationLabel}验证码。`, 'info');
            const response = await fetcher(request.url, {
              method: 'GET',
              cache: 'no-store',
              credentials: 'include',
              headers: {
                Accept: request.preferFirstCode ? 'text/html,application/xhtml+xml,application/json,text/plain,*/*' : 'application/json,text/plain,*/*',
                'Cache-Control': 'no-cache, no-store, max-age=0',
                Pragma: 'no-cache',
              },
            });
            const text = await response.text().catch(() => '');
            const payload = parseCustomEmailVerificationPayloadText(text);
            if (!response.ok) {
              const detail = describeCustomEmailVerificationPayload(payload);
              lastError = new Error(`步骤 ${completionStep}：${request.label}请求失败，HTTP ${response.status}${detail ? `：${detail}` : ''}`);
              if (requestIndex < requests.length - 1) {
                await addLog(`${request.label}请求失败，将回退到下一种取码方式：${lastError.message}`, 'warn');
                continue;
              }
              throw lastError;
            }

              const codeDetails = extractCustomEmailVerificationCodeDetails(payload, {
                excludeCodes: options.excludeCodes || [],
                filterAfterTimestamp,
                preferFirstCode: request.preferFirstCode,
                assurivoOpenPage: request.assurivoOpenPage,
                ignoreTimestampFilter: request.ignoreTimestampFilter,
                allowExcludedAfterTimestamp: options.allowExcludedAfterTimestamp,
                allowSingleBareAssurivoCodeFallback: Boolean(
                  assurivoVerificationUrl
                  || buildAssurivoFeedVerificationUrlFromUrl(request.url)
                  || isAssurivoOpenVerificationUrl(request.url)
                ),
              });
            const code = codeDetails.code || '';
            if (code) {
              const timestampSuffix = codeDetails.emailTimestampText
                ? `（邮件时间 ${codeDetails.emailTimestampText}）`
                : '';
              const reusedSuffix = codeDetails.reusedExcludedCode ? '（重发后的新邮件仍使用同一个验证码）' : '';
              await addLog(`步骤 ${completionStep}：已通过${request.label}获取最新${verificationLabel}验证码：${code}${timestampSuffix}${reusedSuffix}`, 'ok');
              return {
                handled: true,
                code,
                emailTimestamp: codeDetails.emailTimestamp || Date.now(),
                targetEmail,
                verificationUrl: request.url,
                reusedExcludedCode: Boolean(codeDetails.reusedExcludedCode),
              };
            }

            let oldOnlyAssurivoDetail = '';
            if (
              assurivoVerificationUrl
              && (
                (
                  isAssurivoVerificationPayload(payload)
                  && hasOnlyOlderTimestampedAssurivoEntries(payload.data, filterAfterTimestamp)
                )
                || (
                  request.assurivoOpenPage
                  && (typeof payload === 'string' || typeof payload === 'number')
                  && hasOnlyOlderTimestampedAssurivoOpenPageEntries(payload, filterAfterTimestamp)
                )
              )
            ) {
              const timingSuffix = isAssurivoVerificationPayload(payload)
                ? describeAssurivoFilterTiming(payload.data, filterAfterTimestamp)
                : '';
              oldOnlyAssurivoDetail = `${request.label}只返回了早于本轮发码时间的验证码邮件${timingSuffix}`;
              await addLog(`步骤 ${completionStep}：${oldOnlyAssurivoDetail}，将继续等待新邮件。`, 'warn');
            }
            const detail = oldOnlyAssurivoDetail || codeDetails.failureDetail || describeCustomEmailVerificationPayload(payload);
            lastError = new Error(`步骤 ${completionStep}：${request.label}暂未返回有效验证码${detail ? `：${detail}` : ''}`);
            if (requestIndex < requests.length - 1) {
              await addLog(`${request.label}暂未返回有效验证码，将回退到下一种取码方式。`, 'warn');
            }
          }

          throw lastError || new Error(`步骤 ${completionStep}：自定义邮箱暂未返回有效验证码。`);
        }

    async function fetchAssurivoFeed(options = {}) {
      const fetcher = typeof options.fetchImpl === 'function' ? options.fetchImpl : (fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null));
      if (typeof fetcher !== 'function') throw new Error('当前运行环境不支持 fetch，无法获取 Assurivo 邮件。');
      const url = options.url || buildAssurivoVerificationUrl(options.entry || {}, options.state || {}, options.endpoint || 'feed');
      const response = await fetcher(url, { method: 'GET', cache: 'no-store', credentials: 'include', headers: { Accept: 'application/json,text/plain,*/*' } });
      const text = await response.text().catch(() => '');
      if (!response.ok) throw new Error(`Assurivo 请求失败，HTTP ${response.status}`);
      const payload = parseCustomEmailVerificationPayloadText(text);
      return Array.isArray(payload?.data) ? payload.data : [];
    }

    return {
      isRetryableCustomEmailVerificationFetchError,
      isAssurivoEmptyFeedVerificationFetchError,
      normalizeEmailForComparison,
      normalizeCustomEmailVerificationUrl,
      parseCustomEmailPoolEntryValue,
      buildLinlinflowMailApiUrl,
      buildLinlinflowLatestApiUrl,
      getCustomEmailVerificationRequestUrl,
      getCustomEmailVerificationRequestLabel,
      normalizeCustomEmailPoolEntryForVerification,
      getCustomEmailVerificationEntry,
      extractAssurivoOpenPageMailBlocks,
      extractAssurivoOpenPageVerificationCode,
      extractAssurivoFeedVerificationCodeDetails,
      isLinlinflowMailApiPayload,
      extractLinlinflowMailApiCode,
      extractCustomEmailVerificationCode,
      extractCustomEmailVerificationCodeDetails,
      parseCustomEmailVerificationPayloadText,
      describeCustomEmailVerificationPayload,
      normalizeAssurivoCredentialParts,
      buildAssurivoVerificationUrl,
      isAssurivoOpenVerificationUrl,
      isAssurivoFeedVerificationUrl,
      buildAssurivoFeedVerificationUrlFromUrl,
      shouldUseAssurivoCredentialUrl,
      isIcloudMail,
      normalizeIcloudMailPollPayload,
      getMailPollingResponseTimeoutMs,
      resolveMailPollingTimeouts,
      fetchCustomEmailVerificationCode,
      fetchAssurivoFeed,
    };
  }

  return {
    createAssurivoFeedClient,
    fetchAssurivoFeed: (...args) => createAssurivoFeedClient({
      constants: {
        ASSURIVO_VERIFICATION_OPEN_URL: DEFAULT_ASSURIVO_VERIFICATION_OPEN_URL,
        ASSURIVO_VERIFICATION_FEED_URL: DEFAULT_ASSURIVO_VERIFICATION_FEED_URL,
      },
    }).fetchAssurivoFeed(...args),
  };
});
