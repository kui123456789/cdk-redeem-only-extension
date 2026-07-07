(function attachMultiPageVerificationAssurivoTime(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageVerificationAssurivoTime = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageVerificationAssurivoTimeModule() {
  function createVerificationAssurivoTime(context = {}) {
    const constants = context.constants || {};
    const { ASSURIVO_VERIFICATION_FILTER_SKEW_MS, ASSURIVO_TIMESTAMP_LOG_TIME_ZONE } = constants;
    const htmlToVerificationSearchText = (...args) => context.htmlToVerificationSearchText(...args);
    const extractAssurivoOpenPageMailBlocks = (...args) => context.extractAssurivoOpenPageMailBlocks(...args);

        function extractAssurivoOpenPageMailTimestamp(block = '') {
          const text = htmlToVerificationSearchText(block).replace(/\s+/g, ' ').trim();
          const patterns = [
            /(?:时间|時刻|日時|日付|time|date)[:：]\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/i,
            /(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/,
          ];
          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match?.[1]) {
            const timestamp = parseAssurivoChinaTimestampString(match[1]);
              if (timestamp > 0) {
                return timestamp;
              }
            }
          }
          return 0;
        }

        function getOrderedAssurivoOpenPageMailBlocks(payload, options = {}) {
          const annotated = extractAssurivoOpenPageMailBlocks(payload).map((block, index) => ({
            block,
            index,
            timestamp: extractAssurivoOpenPageMailTimestamp(block),
          }));
          const filterAfterTimestamp = normalizeFilterAfterTimestamp(options.filterAfterTimestamp);
          const hasTimestampedEntries = annotated.some((item) => item.timestamp > 0);
          const minTimestamp = filterAfterTimestamp > 0
            ? Math.max(0, filterAfterTimestamp - ASSURIVO_VERIFICATION_FILTER_SKEW_MS)
            : 0;
          const selected = minTimestamp > 0 && hasTimestampedEntries
            ? annotated.filter((item) => item.timestamp >= minTimestamp)
            : annotated;
          if (hasTimestampedEntries) {
            selected.sort((left, right) => (right.timestamp - left.timestamp) || (left.index - right.index));
          }
          return selected.map((item) => item.block);
        }

        function hasOnlyOlderTimestampedAssurivoOpenPageEntries(payload, filterAfterTimestamp = 0) {
          const minTimestamp = normalizeFilterAfterTimestamp(filterAfterTimestamp) - ASSURIVO_VERIFICATION_FILTER_SKEW_MS;
          if (!(minTimestamp > 0)) {
            return false;
          }
          const timestamps = extractAssurivoOpenPageMailBlocks(payload)
            .map((block) => extractAssurivoOpenPageMailTimestamp(block))
            .filter((timestamp) => timestamp > 0);
          return Boolean(timestamps.length) && timestamps.every((timestamp) => timestamp < minTimestamp);
        }

        function formatVerificationTimestampForLog(timestamp = 0, options = {}) {
          const numeric = Number(timestamp);
          if (!Number.isFinite(numeric) || numeric <= 0) {
            return '';
          }
          try {
            const timeZone = String(options.timeZone || '').trim();
            const suffix = String(options.suffix || '').trim();
            const formatted = new Date(numeric).toLocaleString('zh-CN', {
              hour12: false,
              ...(timeZone ? { timeZone } : {}),
            });
            return suffix ? `${formatted} ${suffix}` : formatted;
          } catch {
            return '';
          }
        }

        function formatAssurivoTimestampForLog(timestamp = 0) {
          return formatVerificationTimestampForLog(timestamp, {
            timeZone: ASSURIVO_TIMESTAMP_LOG_TIME_ZONE,
            suffix: 'Assurivo UTC+8',
          });
        }

        function normalizeVerificationTimestampMs(value) {
          const numeric = Number(value);
          if (!Number.isFinite(numeric) || numeric <= 0) {
            return 0;
          }
          return Math.floor(numeric < 10000000000 ? numeric * 1000 : numeric);
        }

        function parseVerificationTimestampString(value = '') {
          const text = String(value || '').trim();
          if (!text) {
            return 0;
          }
          if (/^\d{10,13}(?:\.\d+)?$/.test(text)) {
            return normalizeVerificationTimestampMs(Number(text));
          }
          if (!/(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|[A-Z][a-z]{2},).*\d{1,2}:\d{2}/.test(text)) {
            return 0;
          }

          const normalized = text.replace(/\s+/g, ' ').trim();
          const ymdMatch = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?(?:\s*(Z|[+-]\d{2}:?\d{2}))?$/);
          if (ymdMatch) {
            const [, year, month, day, hour = '0', minute = '0', second = '0', tz = ''] = ymdMatch;
            if (tz) {
              const normalizedTz = tz === 'Z' ? 'Z' : tz.replace(/^([+-]\d{2})(\d{2})$/, '$1:$2');
              const parsed = Date.parse(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}${normalizedTz}`);
              return Number.isFinite(parsed) ? parsed : 0;
            }
            const parsed = new Date(
              Number(year),
              Number(month) - 1,
              Number(day),
              Number(hour),
              Number(minute),
              Number(second)
            ).getTime();
            return Number.isFinite(parsed) ? parsed : 0;
          }

          const parsed = Date.parse(text);
          return Number.isFinite(parsed) ? parsed : 0;
        }

        function parseVerificationTimestampValue(value) {
          if (typeof value === 'number') {
            return normalizeVerificationTimestampMs(value);
          }
          if (typeof value === 'string') {
            return parseVerificationTimestampString(value);
          }
          return 0;
        }

        function isVerificationTimestampKey(key = '') {
          return /^(?:received(?:_?at|_?time)?|recv(?:_?at|_?time)?|sent(?:_?at|_?time)?|created(?:_?at|_?time)?|saved(?:_?at|_?time)?|mail(?:_?date|_?time)?|date|datetime|time|timestamp)$/i.test(
            String(key || '').replace(/[-\s]+/g, '_')
          );
        }

        function extractVerificationEntryTimestamp(entry) {
          const timestamps = [];
          const dateParts = [];
          const timeParts = [];
          const visited = new Set();

          function visit(value, key = '', depth = 0) {
            if (value === null || value === undefined || depth > 5) {
              return;
            }
            const normalizedKey = String(key || '').replace(/[-\s]+/g, '_');
            const isTimestampKey = isVerificationTimestampKey(normalizedKey);
            if (isTimestampKey && (typeof value === 'string' || typeof value === 'number')) {
              const text = String(value || '').trim();
              if (/date/i.test(normalizedKey)) {
                dateParts.push(text);
              }
              if (/time|timestamp|received|recv|sent|created/i.test(normalizedKey)) {
                timeParts.push(text);
              }
              const timestamp = parseVerificationTimestampValue(value);
              if (timestamp > 0) {
                timestamps.push(timestamp);
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
            for (const [childKey, childValue] of Object.entries(value)) {
              visit(childValue, childKey, depth + 1);
            }
          }

          visit(entry, '');
          if (!timestamps.length && dateParts.length && timeParts.length) {
            for (const dateText of dateParts) {
              for (const timeText of timeParts) {
                const timestamp = parseVerificationTimestampString(`${dateText} ${timeText}`);
                if (timestamp > 0) {
                  timestamps.push(timestamp);
                }
              }
            }
          }
          return timestamps.length ? Math.max(...timestamps) : 0;
        }

        function parseAssurivoChinaTimestampString(value = '') {
          const text = String(value || '').replace(/\s+/g, ' ').trim();
          const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
          if (!match) {
            return parseVerificationTimestampString(text);
          }
          const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
          const parsed = Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour) - 8,
            Number(minute),
            Number(second)
          );
          return Number.isFinite(parsed) ? parsed : 0;
        }

        function extractAssurivoFeedEntryTimestamp(entry = {}) {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            return 0;
          }
          for (const key of ['saved_at', 'saved_time', 'savedAt', 'received_at', 'created_at', 'date', 'time']) {
            if (entry[key] !== undefined && entry[key] !== null && String(entry[key]).trim()) {
              const timestamp = parseAssurivoChinaTimestampString(entry[key]);
              if (timestamp > 0) {
                return timestamp;
              }
            }
          }
          return extractVerificationEntryTimestamp(entry);
        }

        function normalizeFilterAfterTimestamp(value) {
          const timestamp = normalizeVerificationTimestampMs(value);
          return timestamp > 0 ? timestamp : 0;
        }

        function getOrderedAssurivoVerificationEntries(entries = [], options = {}) {
          const annotated = (Array.isArray(entries) ? entries : []).map((entry, index) => ({
            entry,
            index,
            timestamp: extractAssurivoFeedEntryTimestamp(entry),
          }));
          const filterAfterTimestamp = normalizeFilterAfterTimestamp(options.filterAfterTimestamp);
          const hasTimestampedEntries = annotated.some((item) => item.timestamp > 0);
          const minTimestamp = filterAfterTimestamp > 0
            ? Math.max(0, filterAfterTimestamp - ASSURIVO_VERIFICATION_FILTER_SKEW_MS)
            : 0;
          const selected = minTimestamp > 0 && hasTimestampedEntries
            ? annotated.filter((item) => item.timestamp >= minTimestamp)
            : annotated;
          if (hasTimestampedEntries) {
            selected.sort((left, right) => (right.timestamp - left.timestamp) || (left.index - right.index));
          }
          return selected.map((item) => item.entry);
        }

        function hasOnlyOlderTimestampedAssurivoEntries(entries = [], filterAfterTimestamp = 0) {
          const minTimestamp = normalizeFilterAfterTimestamp(filterAfterTimestamp) - ASSURIVO_VERIFICATION_FILTER_SKEW_MS;
          if (!(minTimestamp > 0)) {
            return false;
          }
          const timestamps = (Array.isArray(entries) ? entries : [])
            .map((entry) => extractAssurivoFeedEntryTimestamp(entry))
            .filter((timestamp) => timestamp > 0);
          return Boolean(timestamps.length) && timestamps.every((timestamp) => timestamp < minTimestamp);
        }

        function getLatestAssurivoEntryTimestamp(entries = []) {
          const timestamps = (Array.isArray(entries) ? entries : [])
            .map((entry) => extractAssurivoFeedEntryTimestamp(entry))
            .filter((timestamp) => timestamp > 0);
          return timestamps.length ? Math.max(...timestamps) : 0;
        }

        function describeAssurivoFilterTiming(entries = [], filterAfterTimestamp = 0) {
          const latestTimestamp = getLatestAssurivoEntryTimestamp(entries);
          const requestedAt = normalizeFilterAfterTimestamp(filterAfterTimestamp);
          const parts = [];
          const latestText = formatAssurivoTimestampForLog(latestTimestamp);
          const requestedText = formatAssurivoTimestampForLog(requestedAt);
          if (latestText) {
            parts.push(`最新邮件时间 ${latestText}`);
          }
          if (requestedText) {
            parts.push(`本轮发码时间 ${requestedText}`);
          }
          if (parts.length) {
            parts.push(`容错 ${Math.round(ASSURIVO_VERIFICATION_FILTER_SKEW_MS / 1000)} 秒`);
          }
          return parts.length ? `（${parts.join('；')}）` : '';
        }

    function parseAssurivoTimestamp(value) {
      return parseAssurivoChinaTimestampString(value);
    }

    return {
      extractAssurivoOpenPageMailTimestamp,
      getOrderedAssurivoOpenPageMailBlocks,
      hasOnlyOlderTimestampedAssurivoOpenPageEntries,
      formatVerificationTimestampForLog,
      formatAssurivoTimestampForLog,
      normalizeVerificationTimestampMs,
      parseVerificationTimestampString,
      parseVerificationTimestampValue,
      isVerificationTimestampKey,
      extractVerificationEntryTimestamp,
      parseAssurivoChinaTimestampString,
      extractAssurivoFeedEntryTimestamp,
      normalizeFilterAfterTimestamp,
      getOrderedAssurivoVerificationEntries,
      hasOnlyOlderTimestampedAssurivoEntries,
      getLatestAssurivoEntryTimestamp,
      describeAssurivoFilterTiming,
      parseAssurivoTimestamp,
    };
  }

  return {
    createVerificationAssurivoTime,
    parseAssurivoTimestamp: (...args) => createVerificationAssurivoTime()["parseAssurivoTimestamp"](...args),
  };
});
