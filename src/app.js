import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from 'cookie-parser';

const app = express();

const corsOptions = {
    origin: 'https://sprcbaghpat.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight requests

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url} with origin ${req.headers.origin}`);
    next();
});

const __dirname = path.resolve();
app.use("/public", express.static(path.join(__dirname, "public")));

import userRouter from "./routers/user.router.js";
import verifyEmailRouter from "./routers/verifyEmail.router.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/verifyEmail", verifyEmailRouter);

export default app;
