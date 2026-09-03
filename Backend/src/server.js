require('dotenv').config();

const app = require('./app');
const { connectDb } = require('./config/db');

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  await connectDb();
  const { seedIfEmpty } = require('./utils/seed');
  await seedIfEmpty();
  app.listen(PORT, HOST, () => {
    console.log(`KinBech API running on http://${HOST}:${PORT}`);
    console.log(`For local development: http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
