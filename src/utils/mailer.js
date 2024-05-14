import nodemailer from 'nodemailer';
import { User } from "../models/users.model.js";
import bcrypt from 'bcryptjs';
import verifyonsignup from '../models/verifyEmail.model.js';

// HTML template for email verification
const verifyEmailHtml = (userName, verificationLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Verification</title>
<style>
    /* Responsive layout */
    @media screen and (max-width: 450px) {
        .container {
            flex-direction: column;
        }
        .image-container {
            height:200px;
            min-width: 75%;
            
        }
        .real-image{
            min-width: 98%;
        }
        .content-container {
           min-width: 80%;
            text-align: center;
            padding-right: 0;
        }
    }
</style>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 15px; margin: 0; height: 100%;">

<div class="container" style="display: flex; justify-content: center; align-items: center; min-height: 308px border; border: 2px solid #000;">
    <div class="image-container" style=" height:290px; width:50%; display:flex; align-items: center; justify-content: center; overflow:hidden;">
        <img class="real-image" src="https://i.ytimg.com/vi/IqKEK4xMJWE/maxresdefault.jpg" alt="Verification Image" style=" width: 70%; height:95%; border-radius: 8px; border: 2px solid #000; background-position: center; background-size: cover; ">
    </div>
    <div class="content-container" style="display:flex; flex-direction: column; width:50%; padding-right: 20px;">
        <h2 style="color: #333333; text-align: center;">Verify Your Email Address</h2>
        <p style="color: #666666; margin: 0;">Hello ${userName},</p>
        <p style="color: #666666; ">Thank you for signing up! To complete your registration, please click the button below to verify your email address:</p>
        <p style="text-align: center; margin-top: 30px;"><a href="${verificationLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Verify Email</a></p>
        <p style="color: #666666;">If you did not sign up for an account, you can safely ignore this email.</p>
    </div>
</div>

</body>
</html>
`;



// HTML template for password reset
const resetPasswordHtml = (userName, resetLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Verification</title>
<style>
    /* Responsive layout */
    @media screen and (max-width: 450px) {
        .container {
            flex-direction: column;
        }
        .image-container {
            height:200px;
            min-width: 75%;
            
        }
        .real-image{
            min-width: 98%;
        }
        .content-container {
           min-width: 80%;
            text-align: center;
            padding-right: 0;
        }
    }
</style>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 15px; margin: 0; height: 100%;">

<div class="container" style="display: flex; justify-content: center; align-items: center; min-height: 308px border; border: 2px solid #000;">
    <div class="image-container" style=" height:290px; width:50%; display:flex; align-items: center; justify-content: center; overflow:hidden;">
        <img class="real-image" src="https://i.ytimg.com/vi/IqKEK4xMJWE/maxresdefault.jpg" alt="Reset Password Image"  style=" width: 70%; height:95%; border-radius: 8px; border: 2px solid #000; background-position: center; background-size: cover; ">
    </div>
    <div class="content-container" style="display:flex; flex-direction: column; width:50%; padding-right: 20px;">
        <h2 style="color: #333333; text-align: center;">Reset Your Password</h2>
        <p style="color: #666666; margin: 0;">Hello ${userName},</p>
        <p style="color: #666666; ">You recently requested to reset your password for your account. Click the button below to reset it:</p>
        <p style="text-align: center; margin-top: 30px;"><a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Verify Email</a></p>
        <p style="color: #666666;">If you did not sign up for an account, you can safely ignore this email.</p>
    </div>
</div>

</body>
</html>
`;





export const sendEmail = async ({ email, emailType, userId, verifyemailonsignup }) => {
  try {
    let hashedToken = await bcrypt.hash(userId?.toString(), 10);

    if (emailType === "VERIFY") {
      if (verifyemailonsignup) {
        await verifyonsignup.findByIdAndUpdate(userId, { $set: { verifyToken: hashedToken, verifyTokenExpiry: Date.now() + 3600000 } });
      } else {
        await User.findByIdAndUpdate(userId, { $set: { verifyToken: hashedToken, verifyTokenExpiry: Date.now() + 3600000 } });
      }
    } else if (emailType === "RESET") {
      await User.findByIdAndUpdate(userId, { $set: { forgetPasswordToken: hashedToken, forgetPasswordTokenExpiry: Date.now() + 3600000 } });
    }

    var transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'adarshsharma7p@gmail.com',
        pass: 'gsgmqzzlifsxjwnj'
      }
    });

    const mailOption = {
      from: 'adarshsharma7p@gmail.com',
      to: `${email}`,
      subject: emailType === 'VERIFY' ? "Verify your email" : "Reset your Password",
      html: emailType === 'VERIFY' ? verifyEmailHtml(email, `${process.env.DOMAIN}/verifyemail?token=${hashedToken}`) : resetPasswordHtml(email, `${process.env.DOMAIN}/forgetpassword?token=${hashedToken}`)
    };

    const mailResponse = await transport.sendMail(mailOption);
    return mailResponse;
  } catch (error) {
    throw new Error(error.message);
  }
};
