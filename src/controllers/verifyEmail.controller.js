import {ApiResponse} from "../utils/apiResponse.js"
import {ApiError} from "../utils/apiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {sendEmail} from "../utils/mailer.js"
import { User } from "../models/users.model.js"
import verifyonsignup from "../models/verifyEmail.model.js"

const verifyEmail=asyncHandler(async(req,res)=>{
    const {email}=req.body
    // console.log(req.body);
    const user = await User.findOne({ email: email })
    const verifySignupUser = await verifyonsignup.findOne({ email: email })

    if(verifySignupUser?.isvarified==true){
    return res.send({isVarified: verifySignupUser.isvarified })

    }
    if (verifySignupUser) {
      res.send({ message: "A email is already sent on your email address", userId: verifySignupUser._id, isVarified: verifySignupUser.isvarified })
    }

    if (user) {
     return res.send({ message: "Email is already exists" })
    }
    const verifyEmailUser=await verifyonsignup.create({
        email
    })
await sendEmail({email:email,emailType:"VERIFY",userId:verifyEmailUser._id,verifyemailonsignup:true})
res.send({message:"Email Sent Succesfully,Check your Email"})
})

const verifyEmailPage=asyncHandler(async(req,res)=>{
  const {token}=req.body
  //  console.log(req.body)
 const user= await verifyonsignup.findOne({verifyToken:token,verifyTokenExpiry:{$gt:Date.now()}})
 if(!user){
  return res.send({message:"token is invalid or expired",status:400,succes:false})
 }

 user.verifyToken=undefined
 user.verifyTokenExpiry=undefined
 user.isvarified=true
 await user.save()
  res.send({message:"Email Verified successfully,Now go back to Register Page and Click on Verify",succes:true,isVarified:user.isvarified,status:200})

})

const forgetPassword=asyncHandler(async(req,res)=>{
const {username,email}=req.body
const user=await User.findOne({$or:[{email},{username}]})
if(!user){
 return res.send({message:"Provide Username or Email "})
}
if(user.forgetPasswordTokenExpiry>Date.now()){
return res.send({message:"A Email already sent for Forget password"})
}
await sendEmail({email:user.email,emailType:"RESET",userId:user._id,verifyemailonsignup:false})
res.send({message:"A link Sent On Your Email Address for Change Password"})
})

const forgetPasswordPage=asyncHandler(async(req,res)=>{
const {token,password}=req.body
let user=await User.findOne({forgetPasswordToken:token})
if(!user){
  return res.send({message:"Password link is Expired Or Invalid"})
}
user.password=password
user.forgetPasswordToken=undefined
user.forgetPasswordTokenExpiry=undefined
await user.save({ validateBeforeSave: false})
return res.send({message:"Password is reset Succesfully"})
})

export {verifyEmail,verifyEmailPage,forgetPassword,forgetPasswordPage}