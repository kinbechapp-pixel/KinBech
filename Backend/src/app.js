const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const chatRoutes = require('./routes/chats');
const wishlistRoutes = require('./routes/wishlist');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// More permissive CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'kinbech-api' });
});

app.use('/auth', authRoutes);
app.use('/listings', listingRoutes);
app.use('/chats', chatRoutes);
app.use('/wishlist', wishlistRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
