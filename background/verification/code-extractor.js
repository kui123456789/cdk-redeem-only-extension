(function attachMultiPageVerificationCodeExtractor(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageVerificationCodeExtractor = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageVerificationCodeExtractorModule() {
  function createVerificationCodeExtractor(context = {}) {
    const constants = context.constants || {};
    const { HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE } = constants;
    const getAssurivoEntryBodyText = (...args) => context.getAssurivoEntryBodyText(...args);
    const formatAssurivoTimestampForLog = (...args) => context.formatAssurivoTimestampForLog(...args);
    const extractAssurivoFeedEntryTimestamp = (...args) => context.extractAssurivoFeedEntryTimestamp(...args);
    const getOrderedAssurivoVerificationEntries = (...args) => context.getOrderedAssurivoVerificationEntries(...args);
    const getLatestAssurivoEntryTimestamp = (...args) => context.getLatestAssurivoEntryTimestamp(...args);

        function normalizeDigits(value = '') {
          const digits = String(value || '').replace(/\D+/g, '');
          return digits.length === 6 ? digits : '';
        }

        function collectCodesFromText(value = '', options = {}) {
          const text = String(value || '');
          if (!text.trim()) {
            return [];
          }
          const verificationKeywordPattern = [
            'openai',
            'chatgpt',
            'verification',
            'verify',
            'one[-\\s]*time',
            'temporary',
            'code',
            '验证码',
            '一次性',
            '認証コード',
            '認證コード',
            '検証コード',
            '確認コード',
            '一時(?:的な)?(?:認証|検証)コード',
            '一時(?:認証|検証)コード',
            'コード',
            HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE,
          ].join('|');
          const contextualPatterns = [
            new RegExp(`(?:${verificationKeywordPattern})[^0-9]{0,80}((?:\\d[\\s-]*){6})`, 'gi'),
            new RegExp(`((?:\\d[\\s-]*){6})[^0-9]{0,80}(?:${verificationKeywordPattern})`, 'gi'),
          ];
          const codes = [];
          for (const pattern of contextualPatterns) {
            let match = pattern.exec(text);
            while (match) {
              const code = normalizeDigits(match[1]);
              if (code) {
                codes.push(code);
              }
              match = pattern.exec(text);
            }
          }
          if (options.allowBareCode) {
            const barePattern = /(?:^|[^\d])((?:\d[\s-]*){6})(?:[^\d]|$)/g;
            let match = barePattern.exec(text);
            while (match) {
              const code = normalizeDigits(match[1]);
              if (code) {
                codes.push(code);
              }
              match = barePattern.exec(text);
            }
          }
          return codes;
        }

        function decodeHtmlEntitiesForVerificationText(value = '') {
          return String(value || '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;|&apos;/gi, "'")
            .replace(/&#(\d+);/g, (_match, codepoint) => {
              const numeric = Number(codepoint);
              return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : '';
            })
            .replace(/&#x([0-9a-f]+);/gi, (_match, codepoint) => {
              const numeric = Number.parseInt(codepoint, 16);
              return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : '';
            });
        }

        function htmlToVerificationSearchText(value = '') {
          const text = String(value || '');
          if (!/[<&][a-z#!/?]/i.test(text) && !/&(?:nbsp|amp|lt|gt|quot|apos|#)/i.test(text)) {
            return text;
          }
          return decodeHtmlEntitiesForVerificationText(text)
            .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        function shouldAllowBareCodeForVerificationCandidate(candidate = {}) {
          const key = String(candidate.key || '');
          const text = String(candidate.text || '');
          if (/(?:code|otp|verification)/i.test(key)) {
            return true;
          }
          if (!/(?:body|html|content|message|mail|email|text)/i.test(key)) {
            return false;
          }
          const searchable = htmlToVerificationSearchText(text);
          return /(?:openai|chatgpt)/i.test(searchable)
            && new RegExp(`(?:verification|verify|temporary|one[-\\s]*time|code|验证码|一次性|認証コード|認證コード|検証コード|確認コード|一時(?:的な)?(?:認証|検証)コード|一時(?:認証|検証)コード|コード|${HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE})`, 'i').test(searchable);
        }

        function sanitizeVerificationBodyForBareCodeSearch(value = '') {
          return htmlToVerificationSearchText(value)
            .replace(/https?:\/\/\S+/gi, ' ')
            .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, ' ')
            .replace(/\b20\d{2}[-/年.]\s?\d{1,2}[-/月.]\s?\d{1,2}(?:[日T\s,，]+[0-2]?\d[:：]\d{2}(?::\d{2})?)?\b/g, ' ')
            .replace(/\b[0-2]?\d[:：]\d{2}(?::\d{2})?\b/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        function collectUniqueBareBodyVerificationCodes(value = '') {
          const searchable = sanitizeVerificationBodyForBareCodeSearch(value);
          if (!searchable) {
            return [];
          }
          const codes = [];
          const barePattern = /(?:^|[^0-9])((?:\d[\s-]*){6})(?![\s-]*\d)/g;
          let match = barePattern.exec(searchable);
          while (match) {
            const code = normalizeDigits(match[1]);
            if (code && !codes.includes(code)) {
              codes.push(code);
            }
            match = barePattern.exec(searchable);
          }
          return codes;
        }

        function extractCodeFromText(value = '', options = {}) {
          const excluded = new Set((options.excludeCodes || []).map((code) => String(code || '').trim()).filter(Boolean));
          const codes = collectCodesFromText(value, options).filter((code) => !excluded.has(code));
          return codes.length ? codes[codes.length - 1] : '';
        }

        function collectCustomEmailVerificationTextCandidates(payload) {
          const prioritized = [];
          const fallback = [];
          const visited = new Set();
          const priorityKeyPattern = /(?:message|body|text|content|mail|email|subject|snippet|code|otp|verification)/i;
          const metadataKeyPattern = /(?:order|id|time|date|expire|created|updated|status|count|timestamp)/i;

          function visit(value, key = '') {
            if (value === null || value === undefined) {
              return;
            }
            if (typeof value === 'string' || typeof value === 'number') {
              const text = String(value || '').trim();
              if (!text) {
                return;
              }
              if (priorityKeyPattern.test(key)) {
                prioritized.push({ key, text });
              } else if (!metadataKeyPattern.test(key)) {
                fallback.push({ key, text });
              }
              return;
            }
            if (typeof value !== 'object') {
              return;
            }
            if (visited.has(value)) {
              return;
            }
            visited.add(value);
            const entries = Array.isArray(value)
              ? value.map((entry, index) => [String(index), entry])
              : Object.entries(value);
            for (const [childKey, childValue] of entries) {
              visit(childValue, childKey);
            }
          }

          visit(payload, '');
          return [...prioritized, ...fallback];
        }

        function collectCustomEmailVerificationCodes(payload) {
          const codes = [];
          if (typeof payload === 'string' || typeof payload === 'number') {
            codes.push(...collectCodesFromText(payload, { allowBareCode: true }));
            const htmlText = htmlToVerificationSearchText(payload);
            if (htmlText && htmlText !== String(payload)) {
              codes.push(...collectCodesFromText(htmlText, { allowBareCode: true }));
            }
            return codes;
          }
          for (const candidate of collectCustomEmailVerificationTextCandidates(payload)) {
            const allowBareCode = shouldAllowBareCodeForVerificationCandidate(candidate);
            codes.push(...collectCodesFromText(candidate.text, { allowBareCode }));
            const htmlText = htmlToVerificationSearchText(candidate.text);
            if (htmlText && htmlText !== candidate.text) {
              codes.push(...collectCodesFromText(htmlText, { allowBareCode }));
            }
          }
          return codes;
        }

        function collectAssurivoOpenPageBodyCodes(payload) {
          const rawText = String(payload || '');
          if (!rawText.trim()) {
            return { codes: [], matchedPrompt: false };
          }
          const text = htmlToVerificationSearchText(rawText).replace(/\s+/g, ' ').trim();
          if (!text) {
            return { codes: [], matchedPrompt: false };
          }
          const patterns = [
            /enter\s+this\s+temporary\s+verification\s+code\s+to\s+continue[:：]?\s*((?:\d[\s-]*){6})/gi,
            /temporary\s+verification\s+code\s+to\s+continue[:：]?\s*((?:\d[\s-]*){6})/gi,
            /your\s+temporary\s+chatgpt\s+(?:login|verification)\s+code[\s\S]{0,1200}?enter\s+this\s+temporary\s+verification\s+code\s+to\s+continue[:：]?\s*((?:\d[\s-]*){6})/gi,
            /(?:この|次の)?\s*一時(?:的な)?(?:認証|検証)コード(?:を)?(?:入力して)?(?:続行|確認|ログイン)?(?:してください)?[:：]?\s*((?:\d[\s-]*){6})/gi,
            /(?:認証コード|認證コード|検証コード|確認コード)[:：]?\s*((?:\d[\s-]*){6})/gi,
            /(?:जारी\s+रखने\s+के\s+लिए)?[\s\S]{0,160}?(?:अस्थायी|अस्थाई)?\s*(?:सत्यापन|वेरिफिकेशन)\s+कोड(?:\s*(?:को|दर्ज|प्रविष्ट|डालें|भरें|का))?[\s\S]{0,160}?[:：]?\s*((?:\d[\s-]*){6})/gi,
            /(?:कोड|ओटीपी|otp)[^0-9]{0,80}((?:\d[\s-]*){6})/gi,
          ];
          const codes = [];
          let matchedPrompt = new RegExp(`enter\\s+this\\s+temporary\\s+verification\\s+code\\s+to\\s+continue|your\\s+temporary\\s+chatgpt\\s+(?:login|verification)\\s+code|一時(?:的な)?(?:認証|検証)コード|認証コード|認證コード|検証コード|確認コード|${HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE}`, 'i').test(text);
          for (const pattern of patterns) {
            let match = pattern.exec(text);
            while (match) {
              const code = normalizeDigits(match[1]);
              if (code && !codes.includes(code)) {
                codes.push(code);
              }
              matchedPrompt = true;
              match = pattern.exec(text);
            }
          }
          return { codes, matchedPrompt };
        }

        function extractSingleBareAssurivoBodyCodeDetails(entries = [], excluded = new Set(), options = {}) {
          if (!options.allowSingleBareAssurivoCodeFallback) {
            return null;
          }
          const orderedEntries = getOrderedAssurivoVerificationEntries(entries, options);
          const codeRows = [];
          for (const entry of orderedEntries) {
            const emailTimestamp = extractAssurivoFeedEntryTimestamp(entry);
            const rawCodes = collectUniqueBareBodyVerificationCodes(getAssurivoEntryBodyText(entry));
            for (const code of rawCodes) {
              if (!codeRows.some((row) => row.code === code)) {
                codeRows.push({ code, emailTimestamp });
              }
            }
          }
          if (codeRows.length !== 1) {
            return null;
          }
          const onlyCode = codeRows[0].code;
          if (excluded.has(onlyCode)) {
            return null;
          }
          return {
            code: onlyCode,
            emailTimestamp: codeRows[0].emailTimestamp || getLatestAssurivoEntryTimestamp(orderedEntries),
            emailTimestampText: formatAssurivoTimestampForLog(codeRows[0].emailTimestamp || getLatestAssurivoEntryTimestamp(orderedEntries)),
            source: 'assurivo-feed',
            promptMatched: false,
            candidateCodes: [onlyCode],
            onlyExcludedCodes: false,
            reusedExcludedCode: false,
            failureDetail: '',
          };
        }

        function getStrictVerificationBodyCodeDetails(value = '', options = {}) {
          const text = htmlToVerificationSearchText(value).replace(/\s+/g, ' ').trim();
          if (!text) {
            return { codes: [], promptMatched: false };
          }
          const promptMatched = new RegExp(`(?:your\\s+temporary\\s+chatgpt\\s+verification\\s+code|temporary\\s+chatgpt\\s+verification\\s+code|temporary\\s+openai\\s+verification\\s+code|enter\\s+(?:this|the)\\s+(?:temporary\\s+)?(?:verification\\s+)?code|use\\s+this\\s+code|verification\\s+code|one[-\\s]*time\\s+code|一時(?:的な)?(?:認証|検証)コード|認証コード|認證コード|検証コード|確認コード|${HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE})`, 'i').test(text);
          const patterns = [
            /enter\s+this\s+temporary\s+verification\s+code\s+to\s+continue[:：]?\s*((?:\d[\s-]*){6})/gi,
            /temporary\s+verification\s+code\s+to\s+continue[:：]?\s*((?:\d[\s-]*){6})/gi,
            /your\s+temporary\s+chatgpt\s+verification\s+code(?:\s+is)?[:：]?\s*((?:\d[\s-]*){6})/gi,
            /your\s+temporary\s+openai\s+verification\s+code(?:\s+is)?[:：]?\s*((?:\d[\s-]*){6})/gi,
            /use\s+this\s+code(?:\s+to\s+(?:verify|continue|sign\s*in|log\s*in))?[:：]?\s*((?:\d[\s-]*){6})/gi,
            /enter\s+(?:this|the)\s+(?:temporary\s+)?(?:verification\s+)?code(?:\s+to\s+continue)?[:：]?\s*((?:\d[\s-]*){6})/gi,
            /(?:your|this)\s+(?:temporary\s+)?(?:chatgpt\s+|openai\s+)?(?:verification|login|one[-\s]*time)\s+code(?:\s+is)?[:：]?\s*((?:\d[\s-]*){6})/gi,
            /(?:この|次の)?\s*一時(?:的な)?(?:認証|検証)コード(?:を)?(?:入力して)?(?:続行|確認|ログイン)?(?:してください)?[:：]?\s*((?:\d[\s-]*){6})/gi,
            /(?:認証コード|認證コード|検証コード|確認コード)[:：]?\s*((?:\d[\s-]*){6})/gi,
            /(?:जारी\s+रखने\s+के\s+लिए)?[\s\S]{0,160}?(?:अस्थायी|अस्थाई)?\s*(?:सत्यापन|वेरिफिकेशन)\s+कोड(?:\s*(?:को|दर्ज|प्रविष्ट|डालें|भरें|का))?[\s\S]{0,160}?[:：]?\s*((?:\d[\s-]*){6})/gi,
            /(?:कोड|ओटीपी|otp)[^0-9]{0,80}((?:\d[\s-]*){6})/gi,
            new RegExp(`(?:your\\s+temporary\\s+chatgpt\\s+verification\\s+code|temporary\\s+chatgpt\\s+verification\\s+code|一時(?:的な)?(?:認証|検証)コード|認証コード|認證コード|検証コード|確認コード|verification\\s+code|temporary\\s+code|one[-\\s]*time\\s+code|use\\s+this\\s+code|enter\\s+(?:this|the)\\s+(?:temporary\\s+)?(?:verification\\s+)?code|${HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE})[\\s\\S]{0,700}?(?:^|[^0-9])((?:\\d[\\s-]*){6})(?![\\s-]*\\d)`, 'gi'),
          ];
          const codes = [];
          for (const pattern of patterns) {
            let match = pattern.exec(text);
            while (match) {
              const code = normalizeDigits(match[1]);
              if (code && !codes.includes(code)) {
                codes.push(code);
              }
              match = pattern.exec(text);
            }
          }
          if (
            !codes.length
            && (promptMatched || options.trustedOpenAiMail)
            && (options.trustedOpenAiMail || /(?:chatgpt|openai)/i.test(text))
          ) {
            const bareCodes = collectUniqueBareBodyVerificationCodes(text);
            if (bareCodes.length === 1) {
              codes.push(bareCodes[0]);
            }
          }
          return { codes, promptMatched };
        }

        function collectStrictVerificationBodyCodes(value = '') {
          return getStrictVerificationBodyCodeDetails(value).codes;
        }

        function extractFirstEmailCodeFromOrderedEntries(entries = [], excluded = new Set(), options = {}) {
          for (const entry of getOrderedAssurivoVerificationEntries(entries, options)) {
            const codes = collectCustomEmailVerificationCodes(entry)
              .filter((code) => !excluded.has(code));
            if (codes.length) {
              return codes[codes.length - 1];
            }
          }
          return '';
        }

    function extractStrictVerificationCodeFromBody(body = '', options = {}) {
      return getStrictVerificationBodyCodeDetails(body, options);
    }

    return {
      normalizeDigits,
      collectCodesFromText,
      decodeHtmlEntitiesForVerificationText,
      htmlToVerificationSearchText,
      shouldAllowBareCodeForVerificationCandidate,
      sanitizeVerificationBodyForBareCodeSearch,
      collectUniqueBareBodyVerificationCodes,
      extractCodeFromText,
      collectCustomEmailVerificationTextCandidates,
      collectCustomEmailVerificationCodes,
      collectAssurivoOpenPageBodyCodes,
      extractSingleBareAssurivoBodyCodeDetails,
      getStrictVerificationBodyCodeDetails,
      collectStrictVerificationBodyCodes,
      extractFirstEmailCodeFromOrderedEntries,
      extractStrictVerificationCodeFromBody,
    };
  }

  return {
    createVerificationCodeExtractor,
    extractStrictVerificationCodeFromBody: (...args) => createVerificationCodeExtractor()["extractStrictVerificationCodeFromBody"](...args),
  };
});
