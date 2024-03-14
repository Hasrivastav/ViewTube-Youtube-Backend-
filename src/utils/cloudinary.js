import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
       
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localPath)=>{
    try {
        if (!localPath) {
            return "pError:File path is not provided at uploadOnCloudinary FUNCTION -file- services/cloudinary.js";
          }
        //upload on cloudinary
         const response = await  cloudinary.uploader.upload(localPath,{
            resource_type:"auto"
        })
        //file has been uploaded
        // console.log("file is uploaded on cloudinary")
        //remove the local file after it has been uploaded to cloudinary
        console.log(
            "CloudUploadSuccess: File uploading at Clodinary is successfull through uploadOnCloudinary FUNCTION -file- services/cloudinary.js"
          );

        fs.unlinkSync(localPath)
        return response;

    } catch (error) {
        // fs.unlinkSync(localPath)//remove the locaaly saved temporarily file as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async (public_id, resource_type = "image") => {
  try {
     if (!public_id) return null;

     const response = await cloudinary.uploader.destroy(public_id, {
        resource_type: `${resource_type}`,
     });

     console.log("file deleted from Cloudinary");
     return response;
  } catch (error) {
     console.log("Failed while deleting the file from Cloudinary", error);
  }
};

export {uploadOnCloudinary,deleteFromCloudinary} 