import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import { createNotification } from "../utils/createNotification.js";


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

    const isVideo = image.mimetype.startsWith("video/");
    const mediaType = isVideo ? "video" : "image";

    let cloudResponse;

    if (isVideo) {
      cloudResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "nexo/posts",
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

        uploadStream.end(image.buffer);
      });
    } else {
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

      cloudResponse = await new Promise((resolve, reject) => {
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
    }

    console.log(cloudResponse);

    const post = await Post.create({
      caption: trimmedCaption,
      mediaType,
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

export const getPostPreview = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId).populate({
      path: "author",
      select: "username name profilePicture",
    });

    if (!post) {
      return res.status(404).send("Post not found");
    }

    const clientOrigin =
      process.env.CLIENT_ORIGIN ||
      process.env.PUBLIC_APP_URL ||
      "http://localhost:5173";
    const postUrl = `${clientOrigin}/post/${post._id}`;
    const authorName =
      post.author?.name || post.author?.username || "Nexo user";
    const title = `${authorName} on Nexo`;
    const description =
      post.caption || `Check out this post from ${authorName} on Nexo`;

    let imageUrl = post.image?.url || "";
    if (
      imageUrl &&
      (post.mediaType === "video" ||
        imageUrl.match(/\.(mp4|mov|webm|m4v)($|\?)/i))
    ) {
      imageUrl = imageUrl.replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, ".jpg$2");
    }

    const escapeHtml = (str) =>
      String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const safeTitle = escapeHtml(title);
    const safeDesc = escapeHtml(description);
    const safeImage = escapeHtml(imageUrl);
    const safeUrl = escapeHtml(postUrl);

    if (req.headers.accept?.includes("application/json")) {
      return res.status(200).json({
        success: true,
        metadata: {
          title,
          description,
          image: imageUrl,
          url: postUrl,
          author: post.author,
          mediaType: post.mediaType,
        },
      });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <meta property="og:site_name" content="Nexo">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:secure_url" content="${safeImage}">
  <meta property="og:image:alt" content="${safeDesc}">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:type" content="${post.mediaType === "video" ? "video.other" : "article"}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">
  <meta http-equiv="refresh" content="0;url=${safeUrl}">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #000; color: #fff;">
  <p>Redirecting to <a href="${safeUrl}" style="color: #ff4d00;">${safeTitle}</a>...</p>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Get post preview error:", error);
    return res.status(500).send("Failed to load post preview");
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
    const posts = await Post.find({ likes: req.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "username name profilePicture",
      })
      .lean();

    if (!posts) {
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

// export const likePost = async (req, res) => {
//   try {
//     const ownerId = req.id;
//     const postId = req.params.id;

//     const post = await Post.findById(postId).select("author likes");

//     if (!post) {
//       return res.status(404).json({
//         success: false,
//         message: "Post not found",
//       });
//     }

//     const result = await Post.findByIdAndUpdate(postId, { $addToSet: { likes: ownerId } , new:true });

//     if (!result) {
//       return res.status(404).json({
//         success: false,
//         message: 'Post not found'
//       })
//     }


//     console.log("[LIKE DEBUG] Like update", {
//       postId,
//       senderId: String(senderId),
//       recipientId: String(post.author),
//       modifiedCount: result.modifiedCount,
//     });

//     if (result.modifiedCount > 0) {
//       await createNotification({
//         recipient: post.author,
//         sender: ownerId,
//         type: "like",
//         post: post._id
//       })

      
//     }

//     // implement socket io for real time notification

//     return res.status(200).json({
//       success: true,
//       message: 'Post liked',
//       likeCount: post.likes.length,
//       isLiked: true,
//     })

//   } catch (error) {
//     console.log(error.message)
//   }
// }

export const likePost = async (req, res) => {
  try {
    const ownerId = req.id;
    const postId = req.params.id;

    const post = await Post.findById(postId).select("author");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Add the user only if they haven't already liked the post.
    const result = await Post.updateOne(
      { _id: postId },
      {
        $addToSet: {
          likes: ownerId,
        },
      },
    );

    const updatedPost = await Post.findById(postId).select("likes");

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Notify the author only when a new like was added.
    if (result.modifiedCount > 0) {
      await createNotification({
        recipient: post.author,
        sender: ownerId, // Use ownerId consistently.
        type: "like",
        post: postId,
        io: req.app.get("io")
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post liked",
      likeCount: updatedPost.likes.length,
      isLiked: true,
    });
  } catch (error) {
    console.error("Like post error:", error);

    // Always finish the HTTP request when an error occurs.
    return res.status(500).json({
      success: false,
      message: "Failed to like post",
    });
  }
};

export const dislikePost = async (req, res) => {
  try {
    const ownerId = req.id;
    const postId = req.params.id;

    const post = await Post.findByIdAndUpdate(postId, { $pull: { likes: ownerId } }, { new: true });

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
      text: text.trim()
    });

    await Post.updateOne(
      { _id: postId },
      { $push: { comments: comment._id } }
    )

    await comment.populate({ path: "author", select: "username profilePicture" });

    await createNotification({
      recipient: post.author,
      sender: ownerId,
      type: "comment",
      post: post._id,
      comment: comment._id,
      io: req.app.get("io"),
    });
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

    const comments = await Comment.find({ post: postId }).sort({ createdAt: -1 }).populate({ path: 'author', select: 'username profilePicture' });

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