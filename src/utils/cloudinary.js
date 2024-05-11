import {v2 as cloudinary} from 'cloudinary';
import { ApiError } from './apiError.js';
import fs from 'fs'
          
cloudinary.config({ 
  cloud_name:`${process.env.CLOUD_NAME}`,
  api_key:`${process.env.API_KEY}`,
  api_secret:`${process.env.API_SECRET}`,
});
const uploadOnCloudinary=async(localfilepath)=>{
try {
    if(!localfilepath) return null
           let response=await cloudinary.uploader.upload(localfilepath,{
                resource_type:"auto",
            })
            fs.unlinkSync(localfilepath)
            return response
        
} catch (error) {
    fs.unlinkSync(localfilepath)
    throw new ApiError(500,"problem while uploading file,try again")

}
} 
export {uploadOnCloudinary}