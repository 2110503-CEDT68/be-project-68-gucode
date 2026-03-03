const User = require('../models/User');
const axios = require('axios');

// @desc    Register User
// @route   POST /api/auth/register
// @access  Public
exports.register = async(req, res, next)=>{
    const {name, telephone, email, password, role} = req.body;

    try{

        // Create User
        const user = await User.create({
            name,
            telephone,
            email,
            password,
            role
        });
        sendTokenResponse(user, 200, res);

        const message = `✅ สร้างบัญชีผู้ใช้สำเร็จ

เรียน ผู้ดูแลระบบ

มีการสร้างบัญชีใหม่โดยมีข้อมูลดังนี้
Username: ${user.name}
Email: ${user.email}
เบอร์โทร: ${user.telephone}
สถานะ: ${user.role}

เมื่อเวลา ${new Date().toLocaleTimeString('en-US', {timeZone: 'Asia/Bangkok'})} วันที่ ${new Date().toLocaleDateString('en-UK', {timeZone: 'Asia/Bangkok'})}

ขอแสดงความนับถือ
Gucode Group`

        await sendLineNotify(message);
        await sendDiscordNotify(message);
    }catch(err){
        console.log(err.stack);
        res.status(400).json({success: false});
        const message = `❌ เกิดข้อผิดพลาดขณะกำลังสร้างบัญชีผู้ใช้ใหม่

เรียน ผู้ดูแลระบบ

มีการพยายามสร้างบัญชีผู้ใช้ใหม่ด้วยข้อมูลดังนี้
Username: ${name}
Email: ${email}
เบอร์โทร: ${telephone}
รหัสผ่าน: ${password}
สถานะ: ${role}

ข้อผิดพลาดรายงานจากระบบ:
Status: ${res.statusCode}
${err}

ขอแสดงความนับถือ
Gucode Group
`

        await sendLineNotify(message);
        await sendDiscordNotify(message);
    }
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
exports.login = async(req, res, next) =>{
    const {email, password} = req.body;

    try{

        // Validate email & password
        if(!email || !password){ // No email or password is entered
            return res.status(400).json({success: false, message: 'Please provide an email and password'});
        }

        // Check for email
        const user = await User.findOne({email}).select('+password'); // if found user, then also gather the password field
        if(!user){ // No email was found in the database
            return res.status(400).json({success: false, message: 'Invalid Credentials'});
        }

        // Check for password
        const isMatch = await user.matchPassword(password);
        if(!isMatch){ // Wrong password
            const message = `🚨แจ้งเตือน มีการพยายามเข้าสู่ระบบ

เรียน ผู้ดูแลระบบ

มีการพยายามล็อกอินด้วยข้อมูลดังนี้
Email: ${email}
รหัสผ่าน: ${password}
เมื่อเวลา ${new Date().toLocaleTimeString('en-US', {timeZone: 'Asia/Bangkok'})} วันที่ ${new Date().toLocaleDateString('en-UK', {timeZone: 'Asia/Bangkok'})}

⚠️ โปรดระมัดระวังการเข้าถึงโดยมิจฉาชีพ

ขอแสดงความนับถือ
Gucode Group
`

            await sendLineNotify(message);
            await sendDiscordNotify(message);
            return res.status(400).json({success: false, message: 'Invalid Credentials'});
        }

        sendTokenResponse(user, 200, res);

        const message = `⚠️แจ้งเตือน มีการเข้าสู่ระบบสำเร็จ ✅

เรียน ผู้ดูแลระบบ 

มีการล็อกอินเข้าสู่ระบบด้วยบัญชี
Username: ${user.name} 
Email: ${user.email}

เมื่อเวลา ${new Date().toLocaleTimeString('en-US', {timeZone: 'Asia/Bangkok'})} วันที่ ${new Date().toLocaleDateString('en-UK', {timeZone: 'Asia/Bangkok'})}

ขอแสดงความนับถือ
Gucode Group`;
        await sendLineNotify(message);
        await sendDiscordNotify(message);
    }catch(err){
        console.log(err.stack)
        res.status(401).json({success: false, message: 'Cannot convert email or password to String'});
        const message = `❌ เกิดข้อผิดพลาดขณะกำลัง Login

เรียน ผู้ดูแลระบบ

มีการพยายามล็อกอินด้วยข้อมูลดังนี้
Email: ${email}
รหัสผ่าน: ${password}

ข้อผิดพลาดรายงานจากระบบ:
Status: ${res.statusCode}
${err}

ขอแสดงความนับถือ
Gucode Group
`

        await sendLineNotify(message);
        await sendDiscordNotify(message);
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


// LINE NOTIFY FUNCTION
const sendLineNotify = async(message) =>{
    try{
        const lineToken = process.env.LINE_BOT_TOKEN;
        const userID = process.env.LINE_USER_ID;

        await axios.post('https://api.line.me/v2/bot/message/push', {
            to: userID,
            messages: [{ type: 'text', text: message },
                {type:'sticker',packageId: '446', stickerId: '1988'},
                {type: 'text', text: '$_$', emojis: [{index: 2, type:'emojis',productId: '670e0cce840a8236ddd4ee4c', emojiId: '001'},{index:0,type:'emojis',productId:'670e0cce840a8236ddd4ee4c',emojiId:'007'}]}
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${lineToken}`
            }
        });
    }catch(err){
        console.log(err.stack);
    }
}

// DISCORD NOTIFY FUNCTION
const sendDiscordNotify = async(message)=>{
    try{
        const DiscordWebhookURL = process.env.DISCORD_WEBHOOK_URL;

        await axios.post(DiscordWebhookURL,{
            content: message
        });
    }catch(err){
        console.log(err.stack);
    }
}