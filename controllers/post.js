const { BadRequestError } = require("../errors");
const Post = require("../models/Post");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const { StatusCodes } = require("http-status-codes");

const createPost = async (req, res) => {
   const { caption } = req.body;
   const image = req.files?.image;
   if (!caption && !image) {
      throw new BadRequestError("Expected a caption or image");
   }
   if (image) {
      const result = await cloudinary.uploader.upload(image.tempFilePath, {
         use_filename: true,
         folder: "fb-clone-posts",
      });
      fs.unlinkSync(image.tempFilePath);
      const { secure_url: src } = result;
      const post = await Post.create({ caption, image: { src }, createdBy: req.user.id });
      res.status(StatusCodes.CREATED).json({ post });
   } else {
      const post = await Post.create({ caption, createdBy: req.user.id });
      res.status(StatusCodes.CREATED).json({ post });
   }
};

const getPosts = async (req, res) => {
   const { by } = req.query;
   if (by) {
      const posts = await Post.find({ createdBy: by }).sort("-createdAt");
      res.status(StatusCodes.OK).json({ posts });
   } else {
      const posts = await Post.find().sort("-createdAt");
      res.status(StatusCodes.OK).json({ posts });
   }
};

const getPost = async (req, res) => {
   const { id } = req.params;
   const posts = await Post.findById(id);
   res.status(StatusCodes.OK).json({ posts });
};

const likePost = async (req, res) => {
   const { add } = req.query;
   if (add === "true") {
      const posts = await Post.findByIdAndUpdate(
         req.body.id,
         {
            $push: { likes: req.user.id },
         },
         { new: true, runValidators: true }
      );
      res.status(StatusCodes.OK).json({ posts });
   } else {
      const posts = await Post.findByIdAndUpdate(
         req.body.id,
         {
            $pull: { likes: req.user.id },
         },
         { new: true, runValidators: true }
      );
      res.status(StatusCodes.OK).json({ posts });
   }
};

const commentPost = async (req, res) => {
   console.log(req.body.comment);
   const posts = await Post.findByIdAndUpdate(
      req.body.id,
      {
         $push: { comments: { commentedBy: req.user.id, comment: req.body.comment } },
      },
      { new: true, runValidators: true }
   );
   res.status(StatusCodes.OK).json({ posts });
};

module.exports = { createPost, getPosts, likePost, commentPost, getPost };