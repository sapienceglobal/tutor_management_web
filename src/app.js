import express from "express";
import cors from "cors"
import cookieParser from 'cookie-parser'

const app=express()

// app.use(cors({
//     origin:process.env.CORS_ORIGIN,
//     credentials:true
// }))

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://sprcbaghpat.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true'); // Allow credentials
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});



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
