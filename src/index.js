import app from "./app.js";
import dotenv from "dotenv";
import connectDB from './db/dbconnection.js';

dotenv.config({
    path: './.env'
});

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
  });
}).catch((err) => {
    console.log("Some errors occurred while running", err);
});
