const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

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
// Cors
const cors = require('cors');
// Swagger Doc
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

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
    max: 100
});
app.use(limiter);
// HPP (Prevent duplicate parameters in URL Path)
app.use(hpp());
// Cors (Access Resources across domain)
app.use(cors());
// Swagger Doc
const swaggerOptions = {
    swaggerDefinition:{
        openapi: '3.0.0',
        info:{
            title: 'Library API',
            version: '1.0.0',
            description: 'A simple Express VacQ API'
        },
        // Add server URL; so that *try out* function of Swagger Doc can be used with real database!
        servers:[
            {
                url: 'http://localhost:5003/api/v1'
            }
        ]
    },
    apis:['./routes/*.js']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Mount
app.use('/api/v1/dentists', dentists);
app.use('/api/v1/auth', auth);
app.use('/api/v1/bookings', bookings); //ต้องแก้ router 

const PORT = process.env.PORT || 5003;
const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) =>{
    console.log(`Error: ${err.message}`);
    // Close server & Exit Process
    server.close(()=>process.exit(1));
});