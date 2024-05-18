import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const usersSchema = new mongoose.Schema({
    username: {
        type: String,
        // required: [true, "username required"],
        unique: true,

    },
    email: {
        type: String,
        required: [true, "email requiared"],
        lowerase: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        // required: [true, "password required"],
        min: [6, "minimum 6 characters required"],
        max: 12

    },
    refreshToken: {
        type: String
    },
    forgetPasswordToken: {
        type: String
    },
    forgetPasswordTokenExpiry: {
        type: Date
    },
    image: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: false,
    },
    latitude:Number,
    longitude:Number



}, { timestamps: true })

usersSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
usersSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}
// usersSchema.methods.generateAccessToken = function () {
//     return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY })

// }
// usersSchema.methods.generateRefressToken = function () {
//     return jwt.sign({ _id: this._id }, REFRESH_TOKEN_SECRET, { REFRESH_TOKEN_EXPIRY })
// }

usersSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
usersSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}





export const User = mongoose.model("User", usersSchema)