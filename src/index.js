// Local development server — Vercel uses api/index.js instead
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔴 FUDO Server running on port ${PORT}`));
