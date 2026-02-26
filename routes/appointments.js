const express = require('express');
const {
	getBookings,
	getBooking,
	createBooking,
	updateBooking,
	deleteBooking
} = require('../controllers/bookings');

const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/auth');

// GET all bookings
router.route('/')
	.get(protect, getBookings);

// POST create booking
// /api/v1/dentists/:dentistId/bookings
router.route('/:dentistId')
	.post(protect, createBooking);

// GET single booking
// PUT update booking
// DELETE booking
router.route('/:id')
	.get(protect, getBooking)
	.put(protect, updateBooking)
	.delete(protect, deleteBooking);

module.exports = router;