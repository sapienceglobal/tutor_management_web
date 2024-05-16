import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/users.model.js"

const userLocation=asyncHandler(async(req,res)=>{
const {latitude,longitude} =req.body
const user=await User.findById(req.user._id)
await User.findByIdAndUpdate(user._id,{latitude:latitude,longitude:longitude})
res.send({message:"location fetched successfully"})

})

export {userLocation}