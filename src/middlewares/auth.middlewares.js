import jwt from 'jsonwebtoken'
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/apiError.js'
import { User } from '../models/users.model.js'


export const verifyjwt=asyncHandler(async(req,res,next)=>{
   try {
     const accessToken=req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")
     if (!accessToken) {
        throw new ApiError(401, "Unauthorized request")
    }
     let decode=jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
     if(!decode){
     throw new ApiError(400,"invalid accesToken")
     }
    const user= await User.findById(decode._id).select("-password -refreshToken")
    if (!user) { 
        throw new ApiError(401, "Invalid Access Token")
    }
    req.user=user
    next()
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
    
   }

})

