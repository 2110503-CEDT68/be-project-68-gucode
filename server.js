
const express = require('express');
const dotenv = require('dotenv');
// Sanitize Data
const mongoSanitize = require('@exortek/express-mongo-sanitize');
// Helmet
const helmet = require('helmet');
// XSS
const {xss} = require('express-xss-sanitizer');
// Rate Limit
const rateLimit = require('express-rate-limit');
// HPP
const hpp = require('hpp');

//Route files
const dentists = require('./routes/dentists');
const auth = require('./routes/auth');
const bookings = require('./routes/bookings');

// Mongo Connection
const connectDB = require('./config/db');
// Cookie
const cookieParser = require('cookie-parser');

// Load env vars
dotenv.config({path: './config/config.env'});

connectDB();

const app = express();
// Body Parser
app.use(express.json());
// Cookie Parser
app.use(cookieParser());
// Query Parser
app.set('query parser', 'extended');
// Sanitize Data
app.use(mongoSanitize());
// Helmet (Enhanced Security)
app.use(helmet());
// XSS (Prevent Embeded Script Input)
app.use(xss());
// Rate Limiting (Limit access in max variable within windowsMs milliseconds)
const limiter = rateLimit({
    windowMs: 10*60*1000, // 10 mins
    max: 100000
});
app.use(limiter);
// HPP (Prevent duplicate parameters in URL Path)
app.use(hpp());

// Mount
app.use('/api/dentists', dentists);
app.use('/api/auth', auth);
app.use('/api/bookings', bookings);

const PORT = process.env.PORT || 5003;
const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) =>{
    console.log(`Error: ${err.message}`);
    // Close server & Exit Process
    server.close(()=>process.exit(1));
});