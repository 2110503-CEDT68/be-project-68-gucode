// server.js - Dentist Booking System API
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dentist_booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  telephone: {
    type: String,
    required: [true, 'Telephone number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Dentist Schema
const dentistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  yearsOfExperience: {
    type: Number,
    required: true,
    min: 0
  },
  areaOfExpertise: {
    type: String,
    required: true,
    trim: true
  },
  available: {
    type: Boolean,
    default: true
  }
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dentist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dentist',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create Models
// const User = mongoose.model('User', userSchema);
// const Dentist = mongoose.model('Dentist', dentistSchema);
// const Booking = mongoose.model('Booking', bookingSchema);

// // ==================== MIDDLEWARE ====================

// // Authentication Middleware
// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
//     if (!token) {
//       return res.status(401).json({ message: 'No token, authorization denied' });
//     }
    
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
//     req.user = await User.findById(decoded.userId).select('-password');
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };

// // Admin Middleware
// const adminAuth = async (req, res, next) => {
//   try {
//     if (req.user && req.user.role === 'admin') {
//       next();
//     } else {
//       res.status(403).json({ message: 'Access denied. Admin only.' });
//     }
//   } catch (error) {
//     res.status(401).json({ message: 'Unauthorized' });
//   }
// };

// ==================== AUTH ROUTES ====================

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, telephone, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      name,
      telephone,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout (client-side token removal)
app.post('/api/auth/logout', auth, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// ==================== DENTIST ROUTES ====================

// Get all dentists
app.get('/api/dentists', auth, async (req, res) => {
  try {
    const dentists = await Dentist.find({ available: true });
    res.json(dentists);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== BOOKING ROUTES (USER) ====================

// Create booking (only ONE session per user)
app.post('/api/bookings', auth, async (req, res) => {
  try {
    const { dentistId, date } = req.body;
    
    // Check if user already has a booking
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      status: { $nin: ['cancelled', 'completed'] }
    });
    
    if (existingBooking) {
      return res.status(400).json({ 
        message: 'You can only have ONE active booking. Please cancel or complete your existing booking first.' 
      });
    }
    
    // Create booking
    const booking = new Booking({
      user: req.user._id,
      dentist: dentistId,
      date
    });
    
    await booking.save();
    await booking.populate('dentist', 'name yearsOfExperience areaOfExpertise');
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// View user's booking
app.get('/api/bookings/my', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ user: req.user._id })
      .populate('dentist', 'name yearsOfExperience areaOfExpertise')
      .sort({ createdAt: -1 });
    
    if (!booking) {
      return res.json({ message: 'No booking found', booking: null });
    }
    
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Edit user's booking
app.put('/api/bookings/my', auth, async (req, res) => {
  try {
    const { dentistId, date } = req.body;
    
    const booking = await Booking.findOne({ 
      user: req.user._id,
      status: { $nin: ['cancelled', 'completed'] }
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'No active booking found' });
    }
    
    if (dentistId) booking.dentist = dentistId;
    if (date) booking.date = date;
    
    await booking.save();
    await booking.populate('dentist', 'name yearsOfExperience areaOfExpertise');
    
    res.json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user's booking
app.delete('/api/bookings/my', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      user: req.user._id,
      status: { $nin: ['cancelled', 'completed'] }
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'No active booking found' });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin: View all bookings
app.get('/api/admin/bookings', auth, adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email telephone')
      .populate('dentist', 'name yearsOfExperience areaOfExpertise')
      .sort({ createdAt: -1 });
    
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Edit any booking
app.put('/api/admin/bookings/:id', auth, adminAuth, async (req, res) => {
  try {
    const { dentistId, date, status } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (dentistId) booking.dentist = dentistId;
    if (date) booking.date = date;
    if (status) booking.status = status;
    
    await booking.save();
    await booking.populate('user', 'name email');
    await booking.populate('dentist', 'name yearsOfExperience areaOfExpertise');
    
    res.json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Delete any booking
app.delete('/api/admin/bookings/:id', auth, adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;