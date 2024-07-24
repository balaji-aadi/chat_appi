import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

(async function () {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
  });
})();

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File is uploaded on cloudinary", response.url);
    return response;
  } catch (err) {
    fs.unlinkSync(localFilePath);
    console.log(err);
    return null;
  }
};

// Optimize delivery by resizing and applying auto-format and auto-quality
const optimizeFile = (localFilePath) => {
  const optimizeUrl = cloudinary.url(localFilePath, {
    fetch_format: "auto",
    quality: "auto",
  });
  console.log(optimizeUrl);
};

// Transform the image: auto-crop to square aspect_ratio
const autoCropUrl = (localFilePath) => {
  const autoCrop = cloudinary.url(localFilePath, {
    crop: "auto",
    gravity: "auto",
    width: 500,
    height: 500,
  });
  console.log(autoCrop);
};

export { uploadOnCloudinary, optimizeFile, autoCropUrl };
