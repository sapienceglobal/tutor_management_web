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
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 15px; margin: 0;">

<div style="max-width: 600px; margin: 0 auto;">
    <img src="https://i.ytimg.com/vi/IqKEK4xMJWE/maxresdefault.jpg" alt="Verification Image"  style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
        <h2 style="color: #333333; text-align: center;">Verify Your Email Address</h2>
        <p style="color: #666666; text-align: center;">Hello ${userName},</p>
        <p style="color: #666666; text-align: center;">Thank you for signing up! To complete your registration, please click the button below to verify your email address:</p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="${verificationLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Verify Email</a>
        </div>
        <p style="color: #666666; text-align: center; margin-top: 20px;">If you did not sign up for an account, you can safely ignore this email..</p>
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
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 15px; margin: 0;">

<div style="max-width: 600px; margin: 0 auto;">
    <img src="https://i.ytimg.com/vi/IqKEK4xMJWE/maxresdefault.jpg" alt="Reset Password Image" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
        <h2 style="color: #333333; text-align: center;">Reset Your Password</h2>
        <p style="color: #666666; text-align: center;">Hello ${userName},</p>
        <p style="color: #666666; text-align: center;">You recently requested to reset your password for your account. Click the button below to reset it:</p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Reset Password</a>
        </div>
        <p style="color: #666666; text-align: center; margin-top: 20px;">If you did not request a password reset, please ignore this email.</p>
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
