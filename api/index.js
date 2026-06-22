// Vercel serverless entry point.
// Vercel automatically detects files in the /api directory and routes
// all traffic through them when configured in vercel.json.
const app = require('../src/app');

module.exports = app;
