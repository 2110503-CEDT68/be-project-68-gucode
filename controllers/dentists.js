const Dentist = require('../models/Dentist');
const Booking = require('../models/Booking');


// @desc	Get all dentists
// @route	GET /api/v1/dentists
// @access	Public
exports.getDentists = async (req,res,next) => {
	let query;

	// Copy req.body (Change to Array; 1 index = 1 query)
	const reqQuery = {...req.query};

	// Fields to exclude (We will focus on select & sort specifically in the next part)
	const removeFields = ['select', 'sort', 'page', 'limit'];

	// Loop over remove fields and delete them from reqQuery (remove whatever that matches in removeFields)
	removeFields.forEach(param=>delete reqQuery[param]);
	console.log(reqQuery);

	// Create Query String
	let queryStr = JSON.stringify(reqQuery);

	// Create Operator ($gt, $gte, etc.)
	queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

	// Finding Resource
	query = Dentist.find(JSON.parse(queryStr)).populate('bookings'); // Unxecute Yet

	// Select Fields
	if(req.query.select){ // If query includes select
		const fields = req.query.select.split(',').join(' '); // Replace , to space because we use , to split fields in path but we use space to split fields when connect to the database
		query = query.select(fields); // Update Querty to be Executed
	}

	// Sort
	if(req.query.sort){
		const sortBy = req.query.sort.split(',').join(' ');
		query = query.sort(sortBy);
	}else{
		query = query.sort('-createdAt'); // Define default Sorting
	}

	// Pagination
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 5;
	const startIndex = (page-1) * limit;
	const endIndex = page * limit;

	try{
		// Pagination (Cont.)
		const total = await Dentist.countDocuments();
		query = query.skip(startIndex).limit(limit); // Set the query to show in specified page range

		// Executing Query
		const dentists = await query;

		// Pagination Result
		const pagination = {};

		if(endIndex < total){
			pagination.next = {page: page+1, limit};
		}

		if(startIndex > 0){
			pagination.prev = {page: page-1, limit};
		}

		res.status(200).json({
			success:true,
			count: dentists.length,
			pagination,
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



// @desc	Get single dentist
// @route	GET /api/v1/dentists/:id
// @access	Public
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



// @desc	Create a new dentist
// @route	POST /api/v1/dentists
// @access	Private (Admin only)
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



// @desc	Update dentist
// @route	PUT /api/v1/dentists/:id
// @access	Private (Admin only)
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



// @desc	Delete dentist
// @route	DELETE /api/v1/dentists/:id
// @access	Private (Admin only)
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
		await Dentist.deleteOne({_id: req.params.id});

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