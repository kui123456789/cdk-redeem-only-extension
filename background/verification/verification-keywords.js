(function attachMultiPageVerificationKeywords(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageVerificationKeywords = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageVerificationKeywordsModule() {
  const DEFAULT_HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE = [
    '(?:सत्यापन|वेरिफिकेशन)\\s*कोड', '(?:अस्थायी|अस्थाई)\\s+(?:सत्यापन|वेरिफिकेशन)\\s*कोड',
    '(?:chatgpt|openai)\\s*(?:का\\s*)?(?:सत्यापन|वेरिफिकेशन)\\s*कोड', 'कोड\\s*(?:दर्ज|प्रविष्ट|डालें|भरें)\\s*(?:करें)?',
    '(?:दर्ज|प्रविष्ट|डालें|भरें)\\s*(?:करें)?\\s*कोड', 'जारी\\s+रखने\\s+के\\s+लिए',
    '(?:एक\\s*बार|एकबार)\\s*(?:का\\s*)?(?:कोड|पासकोड)', 'ओटीपी', 'otp',
  ].join('|');

  function decodeHtmlEntitiesForVerificationText(value = '') {
    return String(value || '')
      .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
      .replace(/&#(\d+);/g, (_match, codepoint) => {
        const numeric = Number(codepoint);
        return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : '';
      })
      .replace(/&#x([0-9a-f]+);/gi, (_match, codepoint) => {
        const numeric = Number.parseInt(codepoint, 16);
        return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : '';
      });
  }

  function fallbackHtmlToVerificationSearchText(value = '') {
    const text = String(value || '');
    if (!/[<&][a-z#!/?]/i.test(text) && !/&(?:nbsp|amp|lt|gt|quot|apos|#)/i.test(text)) return text;
    return decodeHtmlEntitiesForVerificationText(text)
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function fallbackNormalizeDigits(value = '') {
    const digits = String(value || '').replace(/\D+/g, '');
    return digits.length === 6 ? digits : '';
  }

  function fallbackCollectUniqueBareBodyVerificationCodes(value = '') {
    const searchable = fallbackHtmlToVerificationSearchText(value)
      .replace(/https?:\/\/\S+/gi, ' ')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, ' ')
      .replace(/\b20\d{2}[-/年.]\s?\d{1,2}[-/月.]\s?\d{1,2}(?:[日T\s,，]+[0-2]?\d[:：]\d{2}(?::\d{2})?)?\b/g, ' ')
      .replace(/\b[0-2]?\d[:：]\d{2}(?::\d{2})?\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!searchable) return [];
    const codes = [];
    const barePattern = /(?:^|[^0-9])((?:\d[\s-]*){6})(?![\s-]*\d)/g;
    let match = barePattern.exec(searchable);
    while (match) {
      const code = fallbackNormalizeDigits(match[1]);
      if (code && !codes.includes(code)) codes.push(code);
      match = barePattern.exec(searchable);
    }
    return codes;
  }

  function createVerificationKeywords(context = {}) {
    const constants = context.constants || {};
    const hindiVerificationKeywordPatternSource = String(
      constants.HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE || DEFAULT_HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE
    );
    const htmlToVerificationSearchText = typeof context.htmlToVerificationSearchText === 'function'
      ? (...args) => context.htmlToVerificationSearchText(...args)
      : fallbackHtmlToVerificationSearchText;
    const collectUniqueBareBodyVerificationCodes = typeof context.collectUniqueBareBodyVerificationCodes === 'function'
      ? (...args) => context.collectUniqueBareBodyVerificationCodes(...args)
      : fallbackCollectUniqueBareBodyVerificationCodes;

    function isAssurivoVerificationPayload(payload) {
      return Boolean(
        payload
        && typeof payload === 'object'
        && !Array.isArray(payload)
        && String(payload.status || '').trim().toLowerCase() === 'success'
        && Array.isArray(payload.data)
        && payload.data.some((item) => item && typeof item === 'object' && !Array.isArray(item) && (
          Object.prototype.hasOwnProperty.call(item, 'body')
          || Object.prototype.hasOwnProperty.call(item, 'html')
          || Object.prototype.hasOwnProperty.call(item, 'content')
          || Object.prototype.hasOwnProperty.call(item, 'message')
          || Object.prototype.hasOwnProperty.call(item, 'text')
          || Object.prototype.hasOwnProperty.call(item, 'mail')
          || Object.prototype.hasOwnProperty.call(item, 'email')
          || Object.prototype.hasOwnProperty.call(item, 'payload')
          || Object.prototype.hasOwnProperty.call(item, 'subject')
          || Object.prototype.hasOwnProperty.call(item, 'title')
          || Object.prototype.hasOwnProperty.call(item, 'from')
          || Object.prototype.hasOwnProperty.call(item, 'sender')
          || Object.prototype.hasOwnProperty.call(item, 'sender_email')
          || Object.prototype.hasOwnProperty.call(item, 'mail_from')
        ))
      );
    }

    function collectAssurivoFieldStrings(value, depth = 0, visited = new Set()) {
      if (value === null || value === undefined || depth > 3) return [];
      if (typeof value === 'string' || typeof value === 'number') {
        const text = String(value || '').trim();
        return text ? [text] : [];
      }
      if (typeof value !== 'object' || visited.has(value)) return [];
      visited.add(value);
      const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);
      const texts = [];
      for (const [_key, childValue] of entries) texts.push(...collectAssurivoFieldStrings(childValue, depth + 1, visited));
      return texts;
    }

    function getAssurivoEntryBodyText(entry = {}) {
      return [entry.body, entry.html, entry.content, entry.message, entry.text, entry.mail, entry.email, entry.payload]
        .flatMap((value) => collectAssurivoFieldStrings(value))
        .join(' ');
    }

    function getAssurivoEntryMetadataText(entry = {}) {
      return [entry.subject, entry.title, entry.from, entry.sender, entry.sender_email, entry.mail_from,
        entry.from_email, entry.email_from, entry.reply_to, entry.to, entry.recipient, entry.mail_to]
        .flatMap((value) => collectAssurivoFieldStrings(value))
        .join(' ');
    }

    function isAssurivoFeedVerificationEntry(entry = {}) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
      const body = htmlToVerificationSearchText(getAssurivoEntryBodyText(entry));
      const metadata = getAssurivoEntryMetadataText(entry);
      const combined = `${metadata} ${body}`;
      if (!/(?:chatgpt|openai)/i.test(combined)) return false;
      const verificationKeywordPattern = new RegExp(`(?:verification|verify|temporary|one[-\\s]*time|code|验证码|一次性|一時(?:的な)?(?:認証|検証)コード|認証コード|認證コード|検証コード|確認コード|コードを入力して続行|${hindiVerificationKeywordPatternSource})`, 'i');
      if (verificationKeywordPattern.test(body)) return true;
      if (verificationKeywordPattern.test(metadata)) return collectUniqueBareBodyVerificationCodes(body).length === 1;
      return /(?:chatgpt|openai)/i.test(combined);
    }

    function isVerificationMailText(value = '') {
      return isAssurivoFeedVerificationEntry({ subject: value, body: value, text: value, message: value });
    }

    return {
      isAssurivoVerificationPayload,
      collectAssurivoFieldStrings,
      getAssurivoEntryBodyText,
      getAssurivoEntryMetadataText,
      isAssurivoFeedVerificationEntry,
      isVerificationMailText,
    };
  }

  return {
    createVerificationKeywords,
    isVerificationMailText: (...args) => createVerificationKeywords().isVerificationMailText(...args),
  };
});
