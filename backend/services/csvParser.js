/**
 * Chromium / Google Chrome browser-history CSV parser.
 *
 * Chrome itself exports history as JSON (Takeout) or SQLite, while CSV
 * files come from history-export extensions. Their column sets vary, so
 * this parser maps common header aliases instead of hard-coding one
 * exporter's names:
 *
 *   URL          -> url, website url, link, address, page url
 *   Title        -> title, page title, page name
 *   Visit Time   -> visit time, timestamp, last visit time, date/time
 *   Visit Count  -> visit count, visits, count (optional)
 *
 * Supported timestamps:
 *   2026-11-20 09:17:33            (naive, stored as written)
 *   2026-11-20T09:17:33Z           (timezone-aware, converted to local)
 *   2026/11/20 09:17:33
 *   11/20/2026 9:17:33 AM          (US export format)
 *   20/11/2026 09:17:33            (day-first, when unambiguous)
 *   13312345678901234              (Chromium last_visit_time, WebKit µs)
 *   1763716653 / 1763716653000     (Unix seconds / milliseconds)
 */

const csv = require('csv-parser');
const { Readable } = require('stream');

const MAX_ROWS = 50000;
const MAX_ERRORS = 10;
const MAX_URL_LENGTH = 2048;
const MAX_TITLE_LENGTH = 512;

/** Microseconds between 1601-01-01 (WebKit epoch) and 1970-01-01. */
const WEBKIT_EPOCH_MS = 11644473600000;

const COLUMN_ALIASES = {
    url: [
        'url',
        'websiteurl',
        'website',
        'link',
        'address',
        'pageurl',
        'visitedurl',
        'siteurl'
    ],
    title: [
        'title',
        'pagetitle',
        'pagename',
        'name',
        'description'
    ],
    time: [
        'time',
        'visittime',
        'timestamp',
        'lastvisittime',
        'lastvisited',
        'visitdatetime',
        'datetime',
        'date',
        'visitedat'
    ],
    visitCount: [
        'visitcount',
        'visits',
        'count',
        'numberofvisits',
        'totalvisits'
    ]
};

class CsvValidationError extends Error {
    constructor(message, details = []) {
        super(message);
        this.name = 'CsvValidationError';
        this.statusCode = 400;
        this.details = details;
    }
}

function normalizeHeader(header) {
    return String(header)
        .replace(/^\uFEFF/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function detectColumns(headers) {
    const normalized = new Map();

    for (const header of headers) {
        normalized.set(normalizeHeader(header), header);
    }

    const pick = (aliases) => {
        for (const alias of aliases) {
            if (normalized.has(alias)) {
                return normalized.get(alias);
            }
        }

        return null;
    };

    return {
        url: pick(COLUMN_ALIASES.url),
        title: pick(COLUMN_ALIASES.title),
        time: pick(COLUMN_ALIASES.time),
        visitCount: pick(COLUMN_ALIASES.visitCount)
    };
}

function pad(value) {
    return String(value).padStart(2, '0');
}

function formatDateTime(date) {
    return [
        date.getFullYear(),
        '-',
        pad(date.getMonth() + 1),
        '-',
        pad(date.getDate()),
        ' ',
        pad(date.getHours()),
        ':',
        pad(date.getMinutes()),
        ':',
        pad(date.getSeconds())
    ].join('');
}

function buildDate(year, month, day, hour = 0, minute = 0, second = 0) {
    if (
        year < 1000 || year > 9999 ||
        month < 1 || month > 12 ||
        day < 1 || day > 31 ||
        hour < 0 || hour > 23 ||
        minute < 0 || minute > 59 ||
        second < 0 || second > 59
    ) {
        return null;
    }

    const date = new Date(year, month - 1, day, hour, minute, second);

    // Reject impossible calendar dates such as 2026-02-30.
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

/**
 * Parse a single timestamp cell into a Date.
 * Returns null when the value is not a recognizable date.
 */
function parseTimestamp(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const raw = String(value).trim().replace(/\u00a0/g, ' ');

    if (!raw) {
        return null;
    }

    // Numeric epochs (Chromium WebKit microseconds, Unix s/ms, FILETIME).
    if (/^\d{9,18}$/.test(raw)) {
        const numeric = Number(raw);

        if (!Number.isFinite(numeric) || numeric <= 0) {
            return null;
        }

        let milliseconds;

        if (raw.length >= 18) {
            // Windows FILETIME: 100-nanosecond intervals since 1601.
            milliseconds = numeric / 10000 - WEBKIT_EPOCH_MS;
        } else if (raw.length >= 16) {
            // Chromium last_visit_time: microseconds since 1601.
            milliseconds = numeric / 1000 - WEBKIT_EPOCH_MS;
        } else if (raw.length === 13) {
            // Unix milliseconds.
            milliseconds = numeric;
        } else if (raw.length === 10) {
            // Unix seconds.
            milliseconds = numeric * 1000;
        } else {
            return null;
        }

        const date = new Date(milliseconds);

        return Number.isNaN(date.getTime()) ? null : date;
    }

    // YYYY-MM-DD HH:mm[:ss] or YYYY-MM-DDTHH:mm[:ss]
    let match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/.exec(raw);

    if (match) {
        return buildDate(
            Number(match[1]),
            Number(match[2]),
            Number(match[3]),
            Number(match[4]),
            Number(match[5]),
            Number(match[6] || 0)
        );
    }

    // YYYY/MM/DD HH:mm[:ss]
    match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw);

    if (match) {
        return buildDate(
            Number(match[1]),
            Number(match[2]),
            Number(match[3]),
            Number(match[4]),
            Number(match[5]),
            Number(match[6] || 0)
        );
    }

    // US export style: 11/20/2026 9:17:33 AM
    match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i.exec(raw);

    if (match) {
        let month = Number(match[1]);
        let day = Number(match[2]);

        // Prefer month/day (Chromium exports), but accept day/month when
        // the first number cannot be a month.
        if (month > 12 && day <= 12) {
            [month, day] = [day, month];
        }

        let hour = Number(match[4]);
        const meridiem = (match[7] || '').toUpperCase();

        if (meridiem) {
            if (hour < 1 || hour > 12) {
                return null;
            }

            hour = hour % 12;

            if (meridiem === 'PM') {
                hour += 12;
            }
        }

        return buildDate(
            Number(match[3]),
            month,
            day,
            hour,
            Number(match[5]),
            Number(match[6] || 0)
        );
    }

    // ISO 8601 with an explicit timezone: 2026-11-20T09:17:33.000Z
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/.test(raw)) {
        const date = new Date(raw);

        return Number.isNaN(date.getTime()) ? null : date;
    }

    // Fallback for text dates such as "Nov 20, 2026 9:17:33 AM".
    if (/[a-z]/i.test(raw) && /\d{4}/.test(raw)) {
        const date = new Date(raw);

        return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
}

function isHttpUrl(value) {
    try {
        const parsed = new URL(value);

        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

function readCell(row, header) {
    if (!header) {
        return '';
    }

    const value = row[header];

    return value === null || value === undefined
        ? ''
        : String(value).trim();
}

/**
 * Parse an uploaded CSV buffer into validated history records.
 *
 * @param {Buffer} buffer
 * @returns {Promise<{records: Array, rowCount: number, headers: string[], columns: object}>}
 * @throws {CsvValidationError}
 */
async function parseHistoryCsv(buffer) {
    if (!buffer || buffer.length === 0) {
        throw new CsvValidationError('The uploaded CSV file is empty.');
    }

    const rows = [];
    let headers = null;
    let totalRows = 0;

    await new Promise((resolve, reject) => {
        Readable.from([buffer])
            .pipe(csv({
                mapHeaders: ({ header }) => String(header).replace(/^\uFEFF/, '').trim()
            }))
            .on('headers', (parsedHeaders) => {
                headers = parsedHeaders;
            })
            .on('data', (row) => {
                totalRows += 1;

                if (totalRows > MAX_ROWS) {
                    reject(new CsvValidationError(
                        `The CSV contains more than ${MAX_ROWS.toLocaleString()} rows. Split the export into smaller files.`
                    ));
                    return;
                }

                rows.push(row);
            })
            .on('end', resolve)
            .on('error', reject);
    });

    if (!headers || headers.length === 0) {
        throw new CsvValidationError('The CSV has no header row.');
    }

    const columns = detectColumns(headers);
    const missing = [];

    if (!columns.url) {
        missing.push('URL');
    }

    if (!columns.time) {
        missing.push('Visit Time');
    }

    if (missing.length > 0) {
        throw new CsvValidationError(
            `Missing required column(s): ${missing.join(' and ')}. ` +
            'Expected headers such as "URL", "Title" and "Visit Time".',
            [`Detected headers: ${headers.join(', ')}`]
        );
    }

    if (rows.length === 0) {
        throw new CsvValidationError('The CSV contains headers but no data rows.');
    }

    const records = [];
    const errors = [];

    rows.forEach((row, index) => {
        const rowNumber = index + 2; // header occupies row 1
        const url = readCell(row, columns.url);
        const title = readCell(row, columns.title);
        const rawTime = readCell(row, columns.time);

        if (!url) {
            errors.push(`Row ${rowNumber}: missing URL.`);
            return;
        }

        if (url.length > MAX_URL_LENGTH) {
            errors.push(`Row ${rowNumber}: URL exceeds ${MAX_URL_LENGTH} characters.`);
            return;
        }

        if (!isHttpUrl(url)) {
            errors.push(`Row ${rowNumber}: "${url}" is not a valid http(s) URL.`);
            return;
        }

        if (!rawTime) {
            errors.push(`Row ${rowNumber}: missing visit time.`);
            return;
        }

        const parsedTime = parseTimestamp(rawTime);

        if (!parsedTime) {
            errors.push(`Row ${rowNumber}: unrecognized visit time "${rawTime}".`);
            return;
        }

        let visitCount = 1;

        if (columns.visitCount) {
            const rawCount = readCell(row, columns.visitCount);

            if (rawCount) {
                const parsedCount = Number(rawCount.replace(/,/g, ''));

                if (Number.isFinite(parsedCount) && parsedCount >= 1) {
                    visitCount = Math.min(Math.floor(parsedCount), 100000);
                }
            }
        }

        records.push({
            websiteUrl: url,
            pageTitle: title ? title.slice(0, MAX_TITLE_LENGTH) : null,
            visitTime: formatDateTime(parsedTime),
            visitCount
        });
    });

    if (errors.length > 0) {
        throw new CsvValidationError(
            `CSV validation failed: ${errors.length} row(s) are invalid.`,
            errors.slice(0, MAX_ERRORS)
        );
    }

    return {
        records,
        rowCount: records.length,
        headers,
        columns
    };
}

module.exports = {
    parseHistoryCsv,
    parseTimestamp,
    detectColumns,
    normalizeHeader,
    formatDateTime,
    CsvValidationError
};
