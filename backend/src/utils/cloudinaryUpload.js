import { resolve } from "dns";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import { error } from "console";

export const uploadToCloudinary = (buffer, folder = "nexo") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};


export const deleteFromCloudinary = (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, {resource_type:"image"},
            (error, result) => {
                if(error){
                    reject(error)
                } else {
                    resolve(result)
                }
            }
        )
    })
}