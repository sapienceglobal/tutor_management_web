import express from "express";
import cors from "cors"
import cookieParser from 'cookie-parser'

const app=express()
const allowedOrigins = ['https://sprcbaghpat.vercel.app'];
app.use(cors({
    origin:allowedOrigins,
    credentials:true
}))

app.use(express.json({
    limit:'16kb'
}))
app.use(express.urlencoded(
    {
        extended:true,
        limit:'16kb'
    }))

app.use(express.static("public"))
app.use(cookieParser())

import userRouter from "./routers/user.router.js";
import verifyEmailRouter from "./routers/verifyEmail.router.js";
app.use("/api/v1/users",userRouter)
app.use("/api/v1/verifyEmail",verifyEmailRouter)

export default app
