// Vercel serverless entry point for the Express API.
// The original request path is preserved by the rewrite in vercel.json,
// so the Express routes under /api/... keep working in production.
const app = require('../backend/app');

module.exports = app;
