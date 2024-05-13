import nodemailer from 'nodemailer';
import { User } from "../models/users.model.js";
import bcrypt from 'bcryptjs';
import verifyonsignup from '../models/verifyEmail.model.js';

// HTML template for email verification
const verifyEmailHtml = (userName, verificationLink) => `
    <!DOCTYPE html>
    <html lang="en" style="height: 100%;">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0; height: 100%;">

    <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="margin: 0 auto; height: 100%; border-collapse: collapse;">
    <tr style="height: 100%;">
        <td style="padding: 20px; text-align: center; vertical-align: middle; width: 95%;">
            <img src="https://i.ytimg.com/vi/IqKEK4xMJWE/maxresdefault.jpg" alt="Verification Image" style="width: 100%; height: 80%; border-radius: 8px; border: 2px solid #000; object-fit: cover; object-position: center;">
        </td>
        <td style="padding: 20px; text-align: left; vertical-align: middle; width: 50%;">
            <h2 style="color: #333333;">Verify Your Email Address</h2>
            <p style="color: #666666;">Hello ${userName},</p>
            <p style="color: #666666;">Thank you for signing up! To complete your registration, please click the button below to verify your email address:</p>
            <p style="text-align: center; margin-top: 30px;"><a href="${verificationLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Verify Email</a></p>
            <p style="color: #666666;">If you did not sign up for an account, you can safely ignore this email.</p>
        </td>
    </tr>
    </table>

    </body>
    </html>
`;

// HTML template for password reset
const resetPasswordHtml = (userName, resetLink) => `
    <!DOCTYPE html>
    <html lang="en" style="height: 100%;">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0; height: 100%;">

    <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="margin: 0 auto; height: 100%; border-collapse: collapse;">
    <tr style="height: 100%;">
    <td style="padding: 20px; text-align: center; vertical-align: middle; width: 95%;">
    <img src="https://i.ytimg.com/vi/IqKEK4xMJWE/maxresdefault.jpg" alt="Reset Password Image" style="width: 100%; height: 80%; border-radius: 8px; border: 2px solid #000; object-fit: cover; object-position: center;">
</td>
        <td style="padding: 20px; text-align: left; vertical-align: middle; width: 50%;">
            <h2 style="color: #333333;">Reset Your Password</h2>
            <p style="color: #666666;">Hello ${userName},</p>
            <p style="color: #666666;">You recently requested to reset your password for your account. Click the button below to reset it:</p>
            <p style="text-align: center; margin-top: 30px;"><a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Reset Password</a></p>
            <p style="color: #666666;">If you did not request a password reset, please ignore this email.</p>
        </td>
       
    </tr>
    </table>

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
