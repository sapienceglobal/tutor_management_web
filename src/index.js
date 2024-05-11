import app from "./app.js"
import dotenv from "dotenv"
import connectDB from './db/dbconnection.js'

let PORT=process.env.PORT || 4000
dotenv.config({
    path:'./.env'
})

connectDB().then(()=>{
  app.listen(PORT,()=>{
    console.log(`server is running at port${PORT}`);
  })
})
.catch((err)=>{
    console.log("some errors to running",err);
})


