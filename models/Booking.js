const mongoose = require('mongoose');

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
    required: [true, 'Please provide a booking date'],
    validate: {
      validator: function(value) {
        return value >= new Date();
      },
      message: 'Booking date must be in the future'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to ensure one active booking per user
bookingSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);