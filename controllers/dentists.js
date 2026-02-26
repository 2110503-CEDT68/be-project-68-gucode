const Dentist = require('../models/Dentist');
const Booking = require('../models/Booking');


//@desc Get all dentists
//@route GET /api/v1/dentists
//@access Public
exports.getDentists = async (req,res,next) => {

	try{
		const dentists = await Dentist.find();

		res.status(200).json({
			success:true,
			count: dentists.length,
			data: dentists
		});
	}
	catch(err){
		res.status(500).json({
			success:false,
			message: "Cannot get dentists"
		});
	}
};



//@desc Get single dentist
//@route GET /api/v1/dentists/:id
//@access Public
exports.getDentist = async (req,res,next)=>{

	try{
		const dentist = await Dentist.findById(req.params.id);

		if(!dentist){
			return res.status(404).json({
				success:false,
				message:`No dentist with id ${req.params.id}`
			});
		}

		res.status(200).json({
			success:true,
			data: dentist
		});
	}
	catch(err){
		res.status(500).json({
			success:false,
			message:"Cannot get dentist"
		});
	}
};



//@desc Create dentist
//@route POST /api/v1/dentists
//@access Private (Admin only)
exports.createDentist = async (req,res,next)=>{

	try{
		const dentist = await Dentist.create(req.body);

		res.status(201).json({
			success:true,
			data: dentist
		});
	}
	catch(err){
		res.status(400).json({
			success:false,
			message:"Cannot create dentist"
		});
	}
};



//@desc Update dentist
//@route PUT /api/v1/dentists/:id
//@access Private (Admin only)
exports.updateDentist = async (req,res,next)=>{

	try{
		const dentist = await Dentist.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new:true, runValidators:true }
		);

		if(!dentist){
			return res.status(404).json({
				success:false,
				message:`No dentist with id ${req.params.id}`
			});
		}

		res.status(200).json({
			success:true,
			data: dentist
		});
	}
	catch(err){
		res.status(400).json({
			success:false,
			message:"Cannot update dentist"
		});
	}
};



//@desc Delete dentist
//@route DELETE /api/v1/dentists/:id
//@access Private (Admin only)
exports.deleteDentist = async (req,res,next)=>{

	try{
		const dentist = await Dentist.findById(req.params.id);

		if(!dentist){
			return res.status(404).json({
				success:false,
				message:`No dentist with id ${req.params.id}`
			});
		}

		// ลบ booking ที่เกี่ยวข้องด้วย
		await Booking.deleteMany({dentist: req.params.id});
		await dentist.deleteOne();

		res.status(200).json({
			success:true,
			data:{}
		});
	}
	catch(err){
		res.status(500).json({
			success:false,
			message:"Cannot delete dentist"
		});
	}
};