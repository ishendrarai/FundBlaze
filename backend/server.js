require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./database/connection');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 FundBlaze server  →  http://localhost:${PORT}`);
      console.log(`📡 API base          →  http://localhost:${PORT}/api/v1`);
      console.log(`🌍 Environment       →  ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  }
})();
