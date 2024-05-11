import app from "./app.js"
import dotenv from "dotenv"
import connectDB from './db/dbconnection.js'

dotenv.config({
    path:'./.env'
})

connectDB().then(()=>{
  app.listen(process.env.PORT,()=>{
    console.log(`server is running at port${process.env.PORT}`);
  })
})
.catch((err)=>{
    console.log("some errors to running",err);
})


