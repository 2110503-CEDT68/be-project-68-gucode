const express = require('express');
const dotenv = require('dotenv');
// Sanitize Data
const mongoSanitize = require('@exortek/express-mongo-sanitize');
// XSS (Prevent Embeded Script Input)
const {xss, sanitize} = require('express-xss-sanitizer');
// HPP (Prevent duplicate parameters in URL Path)
const hpp = require('hpp');
// Cors (Access Resources across domain)
const cors = require('cors');
// Helmet (Enhanced Security (More Headers))
const helmet = require('helmet');
// Rare Limit (Limit access in 'max' variable within 'windowsMs' milliseconds)
const rateLimit = require('express-rate-limit');

const path = require('path');

// Load config
dotenv.config({ path: './config/config.env' });

// Import database
const db = require('./config/db');
// Connect to database
db();

// Cookie Parser
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/auth');
const dentistRoutes = require('./routes/dentists');
const bookingRoutes = require('./routes/bookings');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.set('query parser', 'extended');

// Middleware
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(cors());
app.use(hpp());

app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dentists', dentistRoutes);
app.use('/api/bookings', bookingRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Dentist Booking API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5003;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) =>{
    console.log(`Error: ${err.message}`);
    // Close server & Exit Process
    server.close(()=>process.exit(1));
});

module.exports = app;