const Booking = require('../models/Booking');
const Dentist = require('../models/Dentist');


//@desc Get all bookings
//@route GET /api/v1/bookings
//@access Private
exports.getBookings = async (req,res,next)=>{
	let query;

	// user เห็นเฉพาะของตัวเอง
	if(req.user.role !== 'admin'){
		query = Booking.find({user:req.user.id}).populate({
			path:'dentist',
			select:'name experience expertise'
		});
	}
	else{
		query = Booking.find().populate({
			path:'dentist',
			select:'name experience expertise'
		});
	}

	try{
		const bookings = await query;

		res.status(200).json({
			success:true,
			count: bookings.length,
			data: bookings
		});
	}
	catch(err){
		console.log(err.stack);
		res.status(500).json({
			success:false,
			message:"Cannot get bookings"
		});
	}
};



//@desc Get single booking
//@route GET /api/v1/bookings/:id
//@access Private
exports.getBooking = async (req,res,next)=>{
	try{
		const booking = await Booking.findById(req.params.id).populate({
			path:'dentist',
			select:'name experience expertise'
		});

		if(!booking){
			return res.status(404).json({
				success:false,
				message:`No booking with id ${req.params.id}`
			});
		}

		// ตรวจสิทธิ์
		if(booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
			return res.status(401).json({
				success:false,
				message:"Not authorized"
			});
		}

		res.status(200).json({
			success:true,
			data: booking
		});
	}
	catch(err){
		res.status(500).json({
			success:false,
			message:"Cannot get booking"
		});
	}
};



//@desc Create booking
//@route POST /api/v1/dentists/:dentistId/bookings
//@access Private
exports.createBooking = async (req,res,next)=>{
	try{
		req.body.dentist = req.params.dentistId;

		const dentist = await Dentist.findById(req.params.dentistId);
		if(!dentist){
			return res.status(404).json({
				success:false,
				message:`No dentist with id ${req.params.dentistId}`
			});
		}

		req.body.user = req.user.id;

		
		const existedBooking = await Booking.findOne({user:req.user.id});
		if(existedBooking && req.user.role !== 'admin'){
			return res.status(400).json({
				success:false,
				message:"You already have a booking"
			});
		}

		const booking = await Booking.create(req.body);

		res.status(201).json({
			success:true,
			data: booking
		});
	}
	catch(err){
		res.status(500).json({
			success:false,
			message:"Cannot create booking"
		});
	}
};



//@desc Update booking
//@route PUT /api/v1/bookings/:id
//@access Private
exports.updateBooking = async (req,res,next)=>{
	try{
		let booking = await Booking.findById(req.params.id);

		if(!booking){
			return res.status(404).json({
				success:false,
				message:`No booking with id ${req.params.id}`
			});
		}

		if(booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
			return res.status(401).json({
				success:false,
				message:"Not authorized to update"
			});
		}

		booking = await Booking.findByIdAndUpdate(
			req.params.id,
			req.body,
			{new:true, runValidators:true}
		);

		res.status(200).json({
			success:true,
			data: booking
		});
	}
	catch(err){
		res.status(500).json({
			success:false,
			message:"Cannot update booking"
		});
	}
};



//@desc Delete booking
//@route DELETE /api/v1/bookings/:id
//@access Private
exports.deleteBooking = async (req,res,next)=>{
	try{
		const booking = await Booking.findById(req.params.id);

		if(!booking){
			return res.status(404).json({
				success:false,
				message:`No booking with id ${req.params.id}`
			});
		}

		if(booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
			return res.status(401).json({
				success:false,
				message:"Not authorized to delete"
			});
		}

		await booking.deleteOne();

		res.status(200).json({
			success:true,
			data:{}
		});
	}
	catch(err){
		res.status(500).json({
			success:false,
			message:"Cannot delete booking"
		});
	}
};