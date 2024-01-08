import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
       
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localPath)=>{
    try {
        if(!localPath) return null
        //upload on cloudinary
         const response = await   cloudinary.uploader.upload(localPath,{
            resource_type:"auto"
        })
        //file has been uploaded
        // console.log("file is uploaded on cloudinary")
        //remove the local file after it has been uploaded to cloudinary
        fs.unlinkSync(localPath)
        return response;

    } catch (error) {
        fs.unlinkSync(localPath)//remove the locaaly saved temporarily file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary} 