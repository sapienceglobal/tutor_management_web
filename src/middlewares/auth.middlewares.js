// import jwt from 'jsonwebtoken';
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from '../utils/apiError.js';
// import { User } from '../models/users.model.js';

// export const verifyjwt = asyncHandler(async (req, res, next) => {
//     try {
//         const authHeader = req.header("Authorization");

//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             console.log("Unauthorized request");
//             return res.json({status:400, message:"Unauthorized request"});
//         }

//         const accessToken = authHeader.replace('Bearer ', ''); // Extract the token
//         if(!accessToken){
//             return res.json({statu:400, message:"Unauthorized request barearr waala"});
//         }

//         let decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
//         if (!decoded) {
//             return res.json({statu:400, message:"Invalid access token"});
//         }

//         const user = await User.findById(decoded._id).select("-password -refreshToken");
//         if (!user) {
//             return res.json({statu:400, message:"Invalid access token"});
//         }

//         req.user = user;
//         next();
//     } catch (error) {
//         return res.json({status:401, message:error?.message || "Invalid access token"});
//     }
// });

import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/users.model.js';

export const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        // Check if cookies are present
        const accessToken = req.cookies.accessToken ||  req.header("Authorization")?.replace("Bearer ", "");

        if (!accessToken) {
            console.log('Unauthorized request');
            return res.status(401).json({ status: 401, message: 'Unauthorized request' });
        }

        // Verify the access token
        let decoded;
        try {
            decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        } catch (error) {
            console.log('Invalid access token');
            return res.status(401).json({ status: 401, message: 'Invalid access token' });
        }

        // Find the user by ID
        const user = await User.findById(decoded.id).select('-password -refreshToken');
        if (!user) {
            return res.status(401).json({ status: 401, message: 'Invalid access token' });
        }

        // Attach the user to the request object
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message || 'Internal Server Error' });
    }
});

