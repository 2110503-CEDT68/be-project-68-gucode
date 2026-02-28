const express = require("express");

const {
  getDentist,
  getDentists,
  createDentist,
  updateDentist,
  deleteDentist
} = require("../controllers/dentists");

//fix this from /.bookings to /.appointment becase is not find
const bookingRouter = require("./appointments");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

// Nested route
// /api/v1/dentists/:dentistId/bookings
router.use('/:dentistId/bookings', bookingRouter);


// GET all dentists
// POST create dentist (admin only)
router.route('/')
  .get(getDentists)
  .post(protect, authorize('admin'), createDentist);


// GET single dentist
// PUT update dentist (admin only)
// DELETE dentist (admin only)
router.route('/:id')
  .get(getDentist)
  .put(protect, authorize('admin'), updateDentist)
  .delete(protect, authorize('admin'), deleteDentist);


module.exports = router;