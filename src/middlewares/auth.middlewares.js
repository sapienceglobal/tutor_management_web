import jwt from 'jsonwebtoken';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/users.model.js';

export const verifyjwt = asyncHandler(async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, "Unauthorized request");
        }

        const accessToken = authHeader.replace('Bearer ', ''); // Extract the token

        let decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            return res.json({statu:400, message:"Invalid access token"});
        }

        const user = await User.findById(decoded._id).select("-password -refreshToken");
        if (!user) {
            return res.json({statu:400, message:"Invalid access token"});
        }

        req.user = user;
        next();
    } catch (error) {
        return res.json({status:401, message:error?.message || "Invalid access token"});
    }
});
