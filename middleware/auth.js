const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Check whether user is logged in or not; Using "Protect"
exports.protect = async(req,res,next)=>{
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.split(' ')[1]; // "Bearer xxxx" --> Collect xxx to token
    }

    // Make sure the token is filled
    if(!token || token == 'null'){
        return res.status(401).json({success: false, message: 'Not authorize to access this route'});
    }

    try{
        // Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    }catch(err){
        console.log(err.stack);
        return res.status(401).json({success: false, message: 'Not authorize to access this route'});
    }
}

// Grant access to specific roles e.g. 'admin', 'user'
exports.authorize = (...roles) =>{
    return (req, res, next) =>{
        if(!roles.includes(req.user.role)){
            return res.status(403).json({success: false, message: `User role ${req.user.role} is not authorized to access this route`});
        }
        next();
    }
}