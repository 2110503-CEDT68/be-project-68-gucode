const User = require('../models/User');

// @desc    Register User
// @route   POST /api/auth/register
// @access  Public
exports.register = async(req, res, next)=>{
    try{
        const {name, telephone, email, password, role} = req.body;

        // Create User
        const user = await User.create({
            name,
            telephone,
            email,
            password,
            role
        });
        sendTokenResponse(user, 200, res);
    }catch(err){
        res.status(400).json({success: false});
        console.log(err.stack);
    }
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
exports.login = async(req, res, next) =>{
    try{
        const {email, password} = req.body;

        // Validate email & password
        if(!email || !password){ // No email or password is entered
            return res.status(400).json({success: false, message: 'Please provide an email and password'});
        }

        // Check for email
        const user = await User.findOne({email}).select('+password'); // if found user, then also gather the password field
        if(!uesr){ // No email was found in the database
            return res.status(400).json({success: false, message: 'Invalid Credentials'});
        }

        // Check for password
        const isMatch = await user.matchPassword(password);
        if(!isMatch){ // Wrong password
            return res.status(400).json({success: false, message: 'Invalid Credentials'});
        }

        sendTokenResponse(user, 200, res);
    }catch(err){
        return res.status(401).json({success: false, message: 'Cannot convert email or password to String'});
    }
}

// Get token from model, create cookie and send response back to client
const sendTokenResponse = (user, statusCode, res)=>{
    // Create Token
    const token = user.getSignedJwtToken();

    const options={
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE*24*60*60*1000), // in milliseconds
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production'){
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({success: true, token});
};

// @desc    Get Current Logged in User info
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async(req, res, next) =>{
    const user = await User.findById(req.user.id);
    res.status(200).json({success: true, data: user});
}

// @desc    Logout User
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async(req, res, next) =>{
    res.cookie('token','none',{ // Send new cookie to user with 'none'; or called as clear the client's cookie (because in middleware/auth.js also count 'none' as blank token)
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({success: true, message: 'Log out Successfully', data: {}});
}