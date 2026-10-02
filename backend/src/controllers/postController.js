import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";

export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.id;

        if (!image) return res.status(400).json({ message: 'Image required' });

        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({
                width: 800,
                height: 800,
                fit: "inside",
            })
            .jpeg({
                quality: 80,
            })
            .toBuffer();

        const cloudResponse = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "nexo/posts",
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

            uploadStream.end(optimizedImageBuffer);
        });

        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId
        });

        await User.findByIdAndUpdate(authorId, { $addToSet: { posts: post._id } });

        // for ui , we need author details
        await post.populate({ path: 'author', select: '-password' });

        return res.status(201).json({
            success: true,
            message: "New post created successfully",
            post,
        })

    } catch (error) {
        console.log(error.message);
    }
}

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' })

        return res.status(200).json({
            success: true,
            posts
        })


    } catch (error) {
        console.log(error.message);
    }
}

export const getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.id }).sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({ path: 'comments', sort: { createdAt: -1 }, populate: { path: 'author', select: 'username profilePicture' } });

        return res.status(200).json({
            success: true,
            posts
        })
    } catch (error) {
        console.log(error.message);
    }
}

export const likePost = async (req, res) => {
    try {
        const ownerId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            })
        }




        await Post.updateOne(
            { _id: postId },
            { $addToSet: { likes: ownerId } }
        );

        // implement socket io for real time notification

        return res.status(200).json({
            success: true,
            message: 'Post liked'
        })

    } catch (error) {
        console.log(error.message)
    }
}
export const dislikePost = async (req, res) => {
    try {
        const ownerId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(200).json({
                success: false,
                message: 'Post not found'
            })
        }

        await post.updateOne({ $pull: { likes: ownerId } });

        await post.save();

        // implement socket io for real time notification

        return res.status(200).json({
            success: true,
            message: 'Post disliked'
        })

    } catch (error) {
        console.log(error.message)
    }
}

export const addComment = async (req, res) => {
    try {
        const ownerId = req.id;
        const postId = req.params.id;

        const { text } = req.body;

        if (!text) {
            return res.status(200).json({
                success: false,
                message: 'Comment is required'
            })
        }


        const post = await Post.findById(postId);
        if (!post) {
            return res.status(200).json({
                success: false,
                message: 'Post not found'
            })
        }

        const comment = await Comment.create({
            text,
            author: ownerId,
            post: postId
        });

        await Post.updateOne(
            { _id: postId },
            { $push: { comments: comment._id } }
        );
        // implement socket io for real time notification

        return res.status(200).json({
            success: true,
            message: 'comment added',
            comment,
        })

    } catch (error) {
        console.log(error.message)
    }
}

export const getCommentsOfPost = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({ post: postId }).populate({ path: 'author', select: 'username profilePicture' });

        if (!comments) {
            return res.status(200).json({
                success: false,
                message: 'No comments on this post'
            })
        }

        return res.status(200).json({
            success: true,
            comments
        })


    } catch (error) {
        console.log(error.message);
    }
}


export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(400).json({
                success: false,
                message: 'Post not found'
            })
        }

        // check if the logged-in user is the owner of post
        if (post.author.toString() !== authorId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You are not authorize to delete this post'
            })
        }

        // delete post
        await Post.findByIdAndDelete(postId);

        // remove the post id from user
        await User.findByIdAndUpdate(authorId, { $pull: { posts: postId } });

        // delete associated comment with post
        await Comment.deleteMany({ post: postId });

        return res.status(200).json({
            success: true,
            message: "Post deleted"
        })


    } catch (error) {
        console.log(error.message);
    }
}


export const bookmarkPost = async (req, res) => {
    try {
        const authorId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(200).json({
                success: false,
                message: 'Post not found'
            })
        }

        const user = await User.findById(authorId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false,
            })
        }

        if (user.bookmarks.includes(post._id)) {
            // already bookmarked -> remove from bookmarks

            // await user.bookmarks.pull(post._id);
            // await user.save();

            await user.updateOne({ $pull: { bookmarks: post._id } });  // don't need to save

            return res.status(200).json({
                success: true,
                message: 'Post removed from bookmarks'
            })


        } else {
            // bookmark this post
            await user.updateOne({ $addToSet: { bookmarks: post._id } });

            return res.status(200).json({
                success: true,
                message: 'bookmarked successfully'
            })
        }


    } catch (error) {
        console.log(error.message);
    }
}