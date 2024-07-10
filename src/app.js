import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

const allowedOrigins = ['https://sprcbaghpat.vercel.app'];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Add this to handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json({
    limit: '16kb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: '16kb'
}));

app.use(express.static('public'));
app.use(cookieParser());

import userRouter from './routers/user.router.js';
import verifyEmailRouter from './routers/verifyEmail.router.js';

app.use('/api/v1/users', userRouter);
app.use('/api/v1/verifyEmail', verifyEmailRouter);

export default app;
