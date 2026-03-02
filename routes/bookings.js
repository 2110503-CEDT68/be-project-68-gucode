const express = require('express');
const {
    getBookings,
    getBooking,
    addBooking,
    createBooking,
    updateBooking,
    deleteBooking
    } = require('../controllers/bookings');

const router = express.Router({mergeParams: true});

const {protect, authorize} = require('../middleware/auth');

//GET all bookings
router.route('/').get(protect, getBooking)
.post(protect, authorize('admin', 'user'), addBooking);

//POST create booking
// /api/dentists/:dentistId/bookings
// router.route('/:dentistId')
//     .post(protect , createBooking);

//GET single booking 
//PUT update booking
router.route('/:id')
    .get(protect, getBookings)
    .put(protect, authorize('admin','user'), updateBooking)
    .delete(protect, authorize('admin','user'), deleteBooking);

module.exports = router;