const { NotFoundError } = require("../errors");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

const getUser = async (req, res) => {
   const { id } = req.params;
   const user = await User.findOne({ _id: id });

   if (!user) {
      throw new NotFoundError(`No user exist with id ${id}`);
   }
   const { name, email, dob, about, createdAt, location, profileImage } = user;

   res.status(StatusCodes.OK).json({
      user: { name, email, dob, about, createdAt, location, profileImage },
   });
};

const updateUser = async (req, res) => {
   const { id } = req.user;
   const user = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
   });
   if (!user) {
      throw new NotFoundError(`No user exist with id ${id}`);
   }
   const token = user.createJWT();
   const { name, email, dob, about, createdAt, location, profileImage } = user;

   res.status(StatusCodes.OK).json({
      user: { name, email, dob, about, createdAt, location, profileImage },
      token,
   });
};

const updateDP = async (req, res) => {
   const image = req.files?.image;
   if (!image) {
      throw new BadRequestError("Expected an image");
   }
   const result = await cloudinary.uploader.upload(image.tempFilePath, {
      use_filename: true,
      folder: "fb-clone-dps",
   });
   fs.unlinkSync(image.tempFilePath);
   const { secure_url: src } = result;
   const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: src },
      { new: true, runValidators: true }
   );

   const { name, email, dob, about, createdAt, location, profileImage } = user;
   res.status(StatusCodes.OK).json({
      user: { name, email, dob, about, createdAt, location, profileImage },
   });
};

module.exports = { getUser, updateUser, updateDP };