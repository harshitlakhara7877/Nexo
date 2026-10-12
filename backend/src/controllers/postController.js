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

        const trimmedCaption = caption?.trim() || "";

        if (trimmedCaption.length > 600) {
            return res.status(400).json({
                success: false,
                message: "Caption must be 600 characters or less",
            });
        }

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

        console.log(cloudResponse);

        const post = await Post.create({
            caption:trimmedCaption,
            image: {
                url: cloudResponse.secure_url,
                publicId: cloudResponse.public_id
            },
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
        console.error("Get create post error:", error);
    }
}


export const getSinglePost = async (req, res) => {
  try {
    const postId = req.params.id;

    // Validate MongoDB ObjectId
    // if (!mongoose.Types.ObjectId.isValid(postId)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid post ID",
    //   });
    // }

    const post = await Post.findById(postId).populate({
      path: "author",
      select: "username name profilePicture",
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Get single post error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch post",
    });
  }
};

//feed

export const getAllPosts = async (req, res) => {
    try {
        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            20,
            Math.max(
                1,
                Number.parseInt(req.query.limit, 10) || 10
            )
        );

        const currentUser = await User.findById(req.id)
            .select("following")
            .lean();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Include discovery posts, but exclude the current user's posts.
        const candidates = await Post.find({
            author: { $ne: currentUser._id },
        })
            .sort({ createdAt: -1, _id: -1 })
            .limit(500)
            .populate({
                path: "author",
                select: "username name profilePicture",
            })
            .lean();

        const followingSet = new Set(
            (currentUser.following || []).map((id) =>
                id.toString()
            )
        );

        const now = Date.now();

        const rankedPosts = candidates
            .filter((post) => post.author)
            .map((post) => {
                const ageHours = Math.max(
                    0,
                    (now - new Date(post.createdAt).getTime()) /
                        (1000 * 60 * 60)
                );

                const likesCount = post.likes?.length || 0;
                const commentsCount = post.comments?.length || 0;

                const recencyScore =
                    24 / (1 + ageHours / 12);

                const engagementScore =
                    2 * Math.log1p(likesCount) +
                    3 * Math.log1p(commentsCount);

                const followingScore = followingSet.has(
                    post.author._id.toString()
                )
                    ? 15
                    : 0;

                return {
                    ...post,
                    feedScore:
                        recencyScore +
                        engagementScore +
                        followingScore,
                };
            });

        rankedPosts.sort((a, b) => {
            return (
                b.feedScore - a.feedScore ||
                new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime() ||
                b._id.toString().localeCompare(
                    a._id.toString()
                )
            );
        });

        const totalPosts = rankedPosts.length;
        const totalPages = Math.ceil(totalPosts / limit);
        const startIndex = (page - 1) * limit;

        const posts = rankedPosts
            .slice(startIndex, startIndex + limit)
            .map(({ feedScore, ...post }) => post);

        return res.status(200).json({
            success: true,
            posts,
            pagination: {
                currentPage: page,
                limit,
                totalPosts,
                totalPages,
                hasMore: page < totalPages,
            },
        });
    } catch (error) {
        console.error("Get personalized feed error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load feed",
        });
    }
};


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


export const getLikedPosts = async (req, res) => {
  try {
    const posts = await Post.find({likes: req.id})
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "username name profilePicture",
      })
      .lean();

    if(!posts){
      return res.status(200).json({
      success: false,
      message: "No liked post",
    });  
    }  

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Get liked posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load liked posts",
    });
  }
};

export const likePost = async (req, res) => {
    try {
        const ownerId = req.id;
        const postId = req.params.id;


        const post = await Post.findByIdAndUpdate(postId,{$addToSet: {likes: ownerId}},{new: true});

     if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            })
        }

        // implement socket io for real time notification

        return res.status(200).json({
            success: true,
            message: 'Post liked',
            likeCount: post.likes.length,
            isLiked:true,
        })

    } catch (error) {
        console.log(error.message)
    }
}
export const dislikePost = async (req, res) => {
    try {
        const ownerId = req.id;
        const postId = req.params.id;

        const post = await Post.findByIdAndUpdate(postId,{$pull: {likes: ownerId}},{new: true});

     if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            })
        }
        
        // implement socket io for real time notification
        
        return res.status(200).json({
            success: true,
            message: 'Post disliked',
            likeCount: post.likes.length,
            isLiked: false,
        })

    } catch (error) {
         console.error("Dislike post error:", error);
        
    return res.status(500).json({
      success: false,
      message: "Failed to dislike post",
    });
    }
}

export const addComment = async (req, res) => {
    try {
        const ownerId = req.id;
        const postId = req.params.id;

        const { text } = req.body;

        if (!text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Comment is required'
            })
        }


        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            })
        }

        const comment = await Comment.create({
            author: ownerId,
            post: postId,
            text:text.trim()
        });

        await Post.updateOne(
            { _id: postId },
            { $push: { comments: comment._id } }
        )

        await comment.populate({path:"author", select:"username profilePicture"})
        // implement socket io for real time notification

        return res.status(200).json({
            success: true,
            message: 'comment added',
            comment,
        })

    } catch (error) {
         console.error("Add comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
    }
}

export const getCommentsOfPost = async (req, res) => {
    try {
        const postId = req.params.id;

        const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

        const comments = await Comment.find({ post: postId }).sort({createdAt: -1}).populate({ path: 'author', select: 'username profilePicture' });

        if (!comments) {
            return res.status(400).json({
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
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            })
        }

        // check if the logged-in user is the owner of post
        if (post.author.toString() !== authorId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorize to delete this post'
            })
        }

        const publicId = post.image?.publicId;

        // delete post
        await Post.findByIdAndDelete(postId);

        // remove the post id from user
        await User.findByIdAndUpdate(authorId, { $pull: { posts: postId } });

        // delete associated comment with post
        await Comment.deleteMany({ post: postId });

        if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        });
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete post image from Cloudinary:",
          cloudinaryError
        );
      }
    }

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
    const userId = req.id;
    const postId = req.params.id;

    const [post, user] = await Promise.all([
      Post.findById(postId).select("_id"),
      User.findById(userId).select("bookmarks"),
    ]);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isBookmarked = (user.bookmarks || []).some(
      (bookmarkId) =>
        String(bookmarkId) === String(post._id)
    );

    if (isBookmarked) {
      await User.updateOne(
        { _id: userId },
        { $pull: { bookmarks: post._id } }
      );

      return res.status(200).json({
        success: true,
        isBookmarked: false,
        message: "Post removed from bookmarks",
      });
    }

    await User.updateOne(
      { _id: userId },
      { $addToSet: { bookmarks: post._id } }
    );

    return res.status(200).json({
      success: true,
      isBookmarked: true,
      message: "Post bookmarked successfully",
    });
  } catch (error) {
    console.error("Bookmark post error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update bookmark",
    });
  }
};

export const getBookmarkedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.id)
      .select("bookmarks")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const posts = await Post.find({
      _id: { $in: user.bookmarks || [] },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "username name profilePicture",
      })
      .lean();

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Get bookmarked posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load bookmarks.",
    });
  }
};


export const getPostsByUsername = async (req, res) => {
  try {
    const username = req.params.username?.trim().toLowerCase();

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    const profile = await User.findOne({ username })
      .select("_id")
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const posts = await Post.find({
      author: profile._id,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "username name profilePicture",
      })
      .lean();

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Get posts by username error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load user posts.",
    });
  }
};