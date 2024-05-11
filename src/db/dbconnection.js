import mongoose from "mongoose";
import {DATA_BASE_NAME} from '../constans.js'

const connectDB=async ()=>{
    try {
   const connectionInstance= await mongoose.connect(`${process.env.MONGO_DB_LINK}/${DATA_BASE_NAME}`)
//    console.log(connectionInstance);
   console.log(`DB connected || DB HOST: ${connectionInstance.connection.host}`);
} catch (error) {
    console.log("error to connection database",error);
    process.exit(1)
}
}

export default connectDB