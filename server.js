const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load config
dotenv.config({ path: './config/config.env' });

// Import database
const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const dentistRoutes = require('./routes/dentists');
const appointmentRoutes = require('./routes/appointments');

const app = express();

// Connect to database
db();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
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
app.use('/api/appointments', appointmentRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;