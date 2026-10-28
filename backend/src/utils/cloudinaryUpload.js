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

export const uploadAudioToCloudinary = (
  buffer,
  folder = "nexo/messages/audio"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "video",
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

export const deleteAudioFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: "video" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

export const uploadMediaToCloudinary = (
  buffer,
  folder = "nexo/media",
  resourceType = "auto"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
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

export const deleteMediaFromCloudinary = (
  publicId,
  resourceType = "image"
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: resourceType },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};