import sharp from "sharp";
import cloudinary from "../config/cloudinary.js ";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";

export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.id;

        if (!image) return res.status(400).json({ message: 'Image required' });

        const optimizeImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 800, fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();


        const fileUri = `data:image/jpeg;base64,${optimizeImageBuffer.toString('base64')}`;

        const cloudResponse = await cloudinary.uploader.upload(fileUri);

        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId
        });

        const user = await User.findById(authorId);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }

        // for ui , we need author details
        await post.populate({ path: 'author', select: '-password' });

        return res.status(200).json({
            success: false,
            message: "New post created successfully",
            post,
        })

    } catch (error) {
        console.log(error.message);
    }
}

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ created: -1 })
            .populate({ path: 'author', select: 'username, profilePicture' })

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
        const posts = await Post.findById({ author: req.id }).sort({ created: -1 })
            .populate({ path: 'author', select: 'username, profilePicture' })
            .populate({ path: 'comments', sort: { created: -1 }, populate: { path: 'author', select: 'username, profilePicture' } });

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
        const ownerid = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(200).json({
                success: false,
                message: 'Post not found'
            })
        }

        await post.updateOne({$addToSet: {likes: ownerid}});

        await post.save();

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
        const ownerid = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(200).json({
                success: false,
                message: 'Post not found'
            })
        }

        await post.updateOne({$pull: {likes: ownerid}});

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
        const ownerid = req.id;
        const postId = req.params.id;

        const {text} = req.body;

        if(!text){
            return res.status(200).json({
                success: false,
                message: 'Comment is required'
            })
        }

        const comment = await Comment.create({
            text,
            author:ownerid,
            post:postId
        });



        const post = await Post.findById(postId);
        if (!post) {
            return res.status(200).json({
                success: false,
                message: 'Post not found'
            })
        }

        await post.comment.push(comment._id); 
        await post.save();

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

        const comments = await Comment.find({post:postId}).populate({path:'author' ,  select:'username, profilePicture'});

        if(!comments){
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

      if(!post){
        return res.status(400).json({
                success: false,
                message: 'Post not found'
            })
      }

      // check if the logged-in user is the owner of post
      if(post.author.toString() !== authorId){
        return res.status(400).json({
                success: false,
                message: 'You are not authorize to delete this post'
            })
      }

      // delete post
      await Post.findByIdAndDelete(postId);

      // remove the post id from user
      const user = await User.findById(authorId);
      user.posts = user.posts.filter(id => id !== postId);
      await user.save();


      // delete associated comment with post
      await Comment.deleteMany({post:postId});
      
      return res.status(200).json({
        success:true,
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

        if(!post){
            return res.status(200).json({
                success: false,
                message: 'Post not found'
            })
        }

        const user = await User.findById(authorId);
        if(user.bookmarks.includes(post._id)){
            // already bookmarked -> remove from bookmarks

            // await user.bookmarks.pull(post._id);
            // await user.save();

            await user.updateOne({$pull:{bookmarks:post._id}});  // don't need to save

            return res.status(200).json({
                success: true,
                message: 'Post removed from bookmarks'
            })


        }else{
            // bookmark this post
            await user.updateOne({$addToSet:{bookmarks:post._id}});

            return res.status(200).json({
                success: true,
                message: 'bookmarked successfully'
            })
        }


     } catch (error) {
        console.log(error.message);
     }
}