const test = require('node:test');
const assert = require('node:assert/strict');

const {
    parseHistoryCsv,
    parseTimestamp,
    detectColumns,
    normalizeHeader,
    formatDateTime,
    CsvValidationError
} = require('../services/csvParser');

function toBuffer(text) {
    return Buffer.from(text, 'utf8');
}

test('normalizes header variations', () => {
    assert.equal(normalizeHeader('\uFEFFVisit Time'), 'visittime');
    assert.equal(normalizeHeader('Last_Visit_Time'), 'lastvisittime');
    assert.equal(normalizeHeader('Website URL'), 'websiteurl');
});

test('detects Chromium export columns', () => {
    const columns = detectColumns(['URL', 'Title', 'Visit Time', 'Visit Count']);

    assert.equal(columns.url, 'URL');
    assert.equal(columns.title, 'Title');
    assert.equal(columns.time, 'Visit Time');
    assert.equal(columns.visitCount, 'Visit Count');
});

test('parses a Chrome-style export with 12-hour timestamps', async () => {
    const result = await parseHistoryCsv(toBuffer(
        'URL,Title,Visit Time\n' +
        'https://github.com/,GitHub,11/20/2026 9:17:33 AM\n' +
        'https://www.youtube.com/,YouTube,11/20/2026 12:05:00 PM\n'
    ));

    assert.equal(result.rowCount, 2);
    assert.equal(result.records[0].websiteUrl, 'https://github.com/');
    assert.equal(result.records[0].pageTitle, 'GitHub');
    assert.equal(result.records[0].visitTime, '2026-11-20 09:17:33');
    assert.equal(result.records[1].visitTime, '2026-11-20 12:05:00');
    assert.equal(result.records[0].visitCount, 1);
});

test('parses a Chromium last_visit_time in WebKit microseconds', async () => {
    const result = await parseHistoryCsv(toBuffer(
        'url,title,visit_count,last_visit_time\n' +
        'https://www.google.com/,Google,3,13312345678901234\n'
    ));

    assert.equal(result.records[0].visitCount, 3);
    assert.equal(
        parseTimestamp('13312345678901234').toISOString(),
        '2022-11-08T01:47:58.901Z'
    );
});

test('parses ISO timestamps with a timezone', () => {
    assert.equal(
        parseTimestamp('2026-11-20T09:17:33Z').toISOString(),
        '2026-11-20T09:17:33.000Z'
    );
});

test('parses Unix seconds and milliseconds', () => {
    assert.equal(
        parseTimestamp('1763716653').toISOString(),
        parseTimestamp('1763716653000').toISOString()
    );
});

test('handles midnight and noon in 12-hour format', () => {
    assert.ok(formatDateTime(parseTimestamp('11/20/2026 12:05:00 AM')).endsWith('00:05:00'));
    assert.ok(formatDateTime(parseTimestamp('11/20/2026 12:05:00 PM')).endsWith('12:05:00'));
});

test('accepts day-first dates when the month is impossible', () => {
    assert.equal(
        formatDateTime(parseTimestamp('20/11/2026 09:17:33')),
        '2026-11-20 09:17:33'
    );
});

test('accepts header aliases and a UTF-8 BOM', async () => {
    const result = await parseHistoryCsv(toBuffer(
        '\uFEFFWebsite URL,Page Title,Timestamp\n' +
        'https://example.com,Example,2026-11-20 09:17:33\n'
    ));

    assert.equal(result.records[0].pageTitle, 'Example');
    assert.equal(result.records[0].visitTime, '2026-11-20 09:17:33');
});

test('rejects a CSV without a visit-time column', async () => {
    await assert.rejects(
        parseHistoryCsv(toBuffer('URL,Title\nhttps://example.com,Example\n')),
        (error) => {
            assert.ok(error instanceof CsvValidationError);
            assert.match(error.message, /Missing required column/);
            return true;
        }
    );
});

test('reports the row number of an invalid URL', async () => {
    await assert.rejects(
        parseHistoryCsv(toBuffer(
            'URL,Title,Visit Time\n' +
            'https://example.com,Example,2026-11-20 09:17:33\n' +
            'not-a-url,Broken,2026-11-20 10:00:00\n'
        )),
        (error) => {
            assert.ok(error instanceof CsvValidationError);
            assert.match(error.message, /1 row\(s\) are invalid/);
            assert.match(error.details[0], /Row 3/);
            return true;
        }
    );
});

test('rejects impossible calendar dates', async () => {
    await assert.rejects(
        parseHistoryCsv(toBuffer(
            'URL,Title,Visit Time\nhttps://example.com,Example,2026-02-30 09:00:00\n'
        )),
        (error) => {
            assert.ok(error instanceof CsvValidationError);
            assert.match(error.details[0], /unrecognized visit time/);
            return true;
        }
    );
});

test('rejects an empty file', async () => {
    await assert.rejects(parseHistoryCsv(Buffer.alloc(0)), /empty/);
});

test('rejects a header-only file', async () => {
    await assert.rejects(
        parseHistoryCsv(toBuffer('URL,Title,Visit Time\n')),
        /no data rows/
    );
});
