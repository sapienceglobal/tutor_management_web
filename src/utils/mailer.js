import nodemailer from 'nodemailer'
import {User} from "../models/users.model.js"
import bcrypt from 'bcryptjs'
import verifyonsignup from '../models/verifyEmail.model.js'


// function verifyEmailHtml(){
//   `<p>Click<a href="${process.env.DOMAIN}/verifyemail?token=${hashedToken}">Here</a> to Verify your email
//   or copy and paste the link below in your browser. <br>${process.env.DOMAIN}/verifyemail?token=${hashedToken}</p>`
// }
// const resetPasswordHtml=()=>{
//   `<p>Click<a href="${process.env.DOMAIN}/resetpassword?token=${hashedToken}">Here</a> to Reset your password
//   or copy and paste the link below in your browser. <br>${process.env.DOMAIN}/verifyemail?token=${hashedToken}</p>`
// }

export const sendEmail=async ({email,emailType,userId,verifyemailonsignup})=>{
    try {
      let hashedToken=await bcrypt.hash(userId?.toString(),10)

       if(emailType==="VERIFY"){
        if(verifyemailonsignup){
          await verifyonsignup.findByIdAndUpdate(userId,{$set:{verifyToken:hashedToken,verifyTokenExpiry:Date.now()+3600000}})
        }else{
           await User.findByIdAndUpdate(userId,{$set:{verifyToken:hashedToken,verifyTokenExpiry:Date.now()+3600000}})
        }
       
        
       }else if(emailType==="RESET"){
        await User.findByIdAndUpdate(userId,{$set:{forgetPasswordToken:hashedToken,forgetPasswordTokenExpiry:Date.now()+3600000}})
       } 


       var transport = nodemailer.createTransport({
        service:'gmail',
        auth: {
          user:'adarshsharma7p@gmail.com',
          pass:'gsgmqzzlifsxjwnj'
        }
      });

          const mailOption={
            from: 'adarshsharma7p@gmail.com', // sender address
            to:`${email}`, 
            subject:emailType==='VERIFY'?"Verify your email":"Reset your Password",
            // html: `${emailType=="VERIFY" ? verifyEmailHtml : resetPasswordHtml()}` 
            html:emailType==='VERIFY'?`<p>Click<a href="${process.env.DOMAIN}/verifyemail?token=${hashedToken}">Here</a> to Verify your email
            //   or copy and paste the link below in your browser. <br>${process.env.DOMAIN}/verifyemail?token=${hashedToken}</p>`:`<p>Click<a href="${process.env.DOMAIN}/forgetpassword?token=${hashedToken}">Here</a> to Forget Your Password
            //   or copy and paste the link below in your browser. <br>${process.env.DOMAIN}/forgetpassword?token=${hashedToken}</p>`
          // html body
          }
         const mailResponse= await transport.sendMail(mailOption)
          return mailResponse
    } catch (error) {
        throw new Error(error.message)
    }
}