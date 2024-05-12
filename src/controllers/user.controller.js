import {ApiResponse} from "../utils/apiResponse.js"
import {ApiError} from "../utils/apiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/users.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import verifyonsignup from "../models/verifyEmail.model.js"
import jwt from 'jsonwebtoken'


const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }
  } catch (error) {
    return res.send({message: "something went wrong while generating refresh and acces token"})
  }
}


const userRegister=asyncHandler(async(req,res)=>{
   console.log(req.file)
const {username,fullName,password,email}=req.body
if([username,fullName,email,password].some((field)=> field?.trim() == "")){
  res.send({message:"All feilds required"})
}
const existedUser = await User.findOne({ $or: [{ username }, { email }]})
if (existedUser) {
 return res.send({status:400, message: "User already Exists"})
}

const imagePath = await req.file?.path
  if (!imagePath) {
    return res.send({status:400, message:"image is required"})
  }
  let imageResponse = await uploadOnCloudinary(imagePath)
  if(!imageResponse?.url){
    return res.send({status:400, message:"error while uploading image"})
  }

  const user = await User.create({
    username: username,
    email,
    password,
    fullName,
    image: imageResponse.url,
    
  })
await verifyonsignup.findOneAndDelete({email})
 res.send({status:200,user,message:"User Registered Succefully"})

})

const loginUser=asyncHandler(async(req,res)=>{
const {email,username,password}=req.body
if(!email && !username || !password){
res.send({message:"username/email and Password is required"})
}
const user=await User.findOne({$or:[{email},{username}]})
if(!user){
  res.send({message:"user not found ,Please Register"})
}
let isPasswordCorrect=await user.isPasswordCorrect(password)
if(!isPasswordCorrect){
  res.send({message:"Password is Invalid"})
}
const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
const curruser = await User.findById(user._id).select("-password -refreshToken")

// const options = {
//   httpOnly: true,
//   secure: true
// }
// We won't set cookies directly due to cross-site limitations
  // (Uncomment and modify options if using cookie approach in the future)
  // const options = {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === 'production',
  //   sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  // };

  // Return tokens in the response body for API approach or authorization flow
  res.status(200).json({ status: 200, curruser, accessToken, refreshToken ,message:"Logged In"});

// res.status(200)
//    .cookie("accessToken", accessToken, options)
//    .cookie("refreshToken", refreshToken, options)
//    .json({ status: 200, curruser, message: "Logged in" });
 })

const editUserDetails = asyncHandler(async (req, res) => {
  try {
    
    let user = await User.findById(req.user._id);
    const { username, currentPassword, newPassword } = req.body;
    if (currentPassword?.trim()=="" && newPassword?.trim()!="" || newPassword?.trim()=="" && currentPassword?.trim()!="") {
      return res.send({ message: "Current password and New Password Both is required" });
    }
    if(!newPassword==""){
        if(newPassword.length<6){
      return res.send({message:"Password Must be 6 Characters"})
    }
    }
  
    if(!username && !currentPassword && !req.file){
   return res.send({message:"At least one field is required"})
    }

   
    let newObj = {};
    const imagePath = req.file?.path;

    let imageResponse = await uploadOnCloudinary(imagePath);
    if (imageResponse) {
      newObj.image = imageResponse.url;
    }

    if (username) {
      newObj.username = username;
    }
    if (newPassword && currentPassword) {
      let isPasswordValid = await user.isPasswordCorrect(currentPassword);
      if (!isPasswordValid) {
        return res.send({ message: "Current password is invalid" });
      }
      
      user.password=newPassword
      await user.save({ validateBeforeSave: false })
    }
   
    user = await User.findByIdAndUpdate(user._id, newObj, { new: true });
    res.send({ message: "Updated", curruser: user });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
});


const checkUser=asyncHandler(async(req,res)=>{
  res.status(200).json({curruser:req.user})
  // const incomingToken = req.cookies.refreshToken
  // console.log(incomingToken);
  // if (!incomingToken) {
  //   return res.send({text:"Login To See All Details"})
  // }
  // let decode = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET)
  // if (!decode) {
  //   throw new ApiError(400, "unathorized Token")
  // }
  // const user = await User.findById(decode._id).select("-password ")
  // console.log("user",user.refreshToken);
  // if (incomingToken != user.refreshToken) {
  //   throw new ApiError(400, "token is used or expired")
  // }
  // const options = {
  //   httpOnly: true,
  //   secure: true
  // }
  // const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
  // const curruser = await User.findById(user._id).select("-password -refreshToken")

  // res.status(200)
  //   .cookie("accessToken", accessToken, options)
  //   .cookie("refreshToken", refreshToken, options)
  //   .json({
  //       curruser
  //   }
  //   )

 
})

const logoutUser = asyncHandler(async (req, res) => {
  // Invalidate refresh token (optional but recommended)
  await User.findByIdAndUpdate(req.user._id, { refreshToken: undefined });

  // No need to clear cookies as they are not being used

  res.status(200).json({ text: "logout" });
});




export {userRegister,loginUser,checkUser,logoutUser,editUserDetails}