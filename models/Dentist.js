const mongoose = require('mongoose');

const dentistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide dentist name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Please provide years of experience'],
    min: [0, 'Years of experience cannot be negative']
  },
  areaOfExpertise: {
    type: String,
    required: [true, 'Please provide area of expertise'],
    trim: true,
    maxlength: [100, 'Area of expertise cannot be more than 100 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Dentist', dentistSchema);