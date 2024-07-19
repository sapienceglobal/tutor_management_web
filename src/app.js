import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';

const app = express();

const corsOptions = {
    origin: 'https://sprcbaghpat.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: true,
};

app.use(cors(corsOptions));

// Middleware for handling preflight requests
app.options('*', cors(corsOptions)); 

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url} with origin ${req.headers.origin}`);
    next();
});

import userRouter from "./routers/user.router.js";
import verifyEmailRouter from "./routers/verifyEmail.router.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/verifyEmail", verifyEmailRouter);

export default app;
