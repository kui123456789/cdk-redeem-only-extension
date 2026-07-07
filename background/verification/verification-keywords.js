(function attachMultiPageVerificationKeywords(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageVerificationKeywords = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageVerificationKeywordsModule() {
  function createVerificationKeywords(context = {}) {
    const constants = context.constants || {};
    const { HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE } = constants;
    const htmlToVerificationSearchText = (...args) => context.htmlToVerificationSearchText(...args);
    const collectUniqueBareBodyVerificationCodes = (...args) => context.collectUniqueBareBodyVerificationCodes(...args);

        function isAssurivoVerificationPayload(payload) {
          return Boolean(
            payload
            && typeof payload === 'object'
            && !Array.isArray(payload)
            && String(payload.status || '').trim().toLowerCase() === 'success'
            && Array.isArray(payload.data)
            && payload.data.some((item) => (
              item
              && typeof item === 'object'
              && !Array.isArray(item)
              && (
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
              )
            ))
          );
        }

        function collectAssurivoFieldStrings(value, depth = 0, visited = new Set()) {
          if (value === null || value === undefined || depth > 3) {
            return [];
          }
          if (typeof value === 'string' || typeof value === 'number') {
            const text = String(value || '').trim();
            return text ? [text] : [];
          }
          if (typeof value !== 'object') {
            return [];
          }
          if (visited.has(value)) {
            return [];
          }
          visited.add(value);
          const entries = Array.isArray(value)
            ? value.map((item, index) => [String(index), item])
            : Object.entries(value);
          const texts = [];
          for (const [_key, childValue] of entries) {
            texts.push(...collectAssurivoFieldStrings(childValue, depth + 1, visited));
          }
          return texts;
        }

        function getAssurivoEntryBodyText(entry = {}) {
          return [
            entry.body,
            entry.html,
            entry.content,
            entry.message,
            entry.text,
            entry.mail,
            entry.email,
            entry.payload,
          ].flatMap((value) => collectAssurivoFieldStrings(value)).join(' ');
        }

        function getAssurivoEntryMetadataText(entry = {}) {
          return [
            entry.subject,
            entry.title,
            entry.from,
            entry.sender,
            entry.sender_email,
            entry.mail_from,
            entry.from_email,
            entry.email_from,
            entry.reply_to,
            entry.to,
            entry.recipient,
            entry.mail_to,
          ].flatMap((value) => collectAssurivoFieldStrings(value)).join(' ');
        }

        function isAssurivoFeedVerificationEntry(entry = {}) {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            return false;
          }
          const body = htmlToVerificationSearchText(getAssurivoEntryBodyText(entry));
          const metadata = getAssurivoEntryMetadataText(entry);
          const combined = `${metadata} ${body}`;
          const hasOpenAiSource = /(?:chatgpt|openai)/i.test(combined);
          if (!hasOpenAiSource) {
            return false;
          }
          const verificationKeywordPattern = new RegExp(`(?:verification|verify|temporary|one[-\\s]*time|code|验证码|一次性|一時(?:的な)?(?:認証|検証)コード|認証コード|認證コード|検証コード|確認コード|コードを入力して続行|${HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE})`, 'i');
          if (verificationKeywordPattern.test(body)) {
            return true;
          }
          if (verificationKeywordPattern.test(metadata)) {
            return collectUniqueBareBodyVerificationCodes(body).length === 1;
          }
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
    isVerificationMailText: (...args) => createVerificationKeywords()["isVerificationMailText"](...args),
  };
});
