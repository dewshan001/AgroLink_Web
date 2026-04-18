const cloudinary = require("cloudinary").v2;

const env = (key) => (typeof process.env[key] === "string" ? process.env[key].trim() : "");

cloudinary.config({
  cloud_name: env("CLOUDINARY_CLOUD_NAME"),
  api_key: env("CLOUDINARY_API_KEY"),
  api_secret: env("CLOUDINARY_API_SECRET"),
});

const isCloudinaryConfigured = () =>
  Boolean(
    env("CLOUDINARY_CLOUD_NAME")
    && env("CLOUDINARY_API_KEY")
    && env("CLOUDINARY_API_SECRET")
  );

const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: options.folder || "agrolink",
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    stream.end(buffer);
  });

const deleteFromCloudinary = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

module.exports = {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
};
