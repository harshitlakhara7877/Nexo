import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js"

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
        success: false
      })
    }

    return res.status(200).json({
      user: user,
      success: true
    })
  } catch (error) {
    console.log(error);
  }
}

export const editProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    if (name) {
      user.name = name;
    }
    if (bio !== undefined) {
      user.bio = bio;
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "nexo/profile"
        }
      );

      user.profilePicture = result.secure_url;
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      user: updatedUser
    })
  } catch (error) {
    console.log(error.message);
  }
}

export const getUserbyUsername = async (req, res) => {
  try {
    const user = await User.findOne({username:req.params.username}).select("-password");

    if(!user){
      return res.status(401).json({
        success:false,
        message: "User not found"
      })
    }

    res.json({
      success:true,
      user
    });
  } catch (error) {
    console.log(error.message)
  }
}

export const getSuggesetedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({_id:{$ne:req.id}}).select("-password");

    if(!suggestedUsers){
      return res.status(401).json({
        success:false,
        message: "No user found"
      })
    }

    return res.status(200).json({
        success:true,
        users: suggestedUsers
      })
  } catch (error) {
    console.log(error.message)
  }
}

export const followOrUnfollow = async (req, res) => {
  try {
    const ownerId= req.id;
    const otherId = req.params.id;

    if(ownerId === otherId){
      return res.status(401).json({
        message: "You can't follow or unfollow yourself",
        success:false
      })
    }

    const user = await User.findById(ownerId);
    const targetUser = await User.findById(otherId);

    if(!user || !targetUser){
      return res.status(401).json({
        message: "User not found",
        success:false
      })
    }

    const IsFollowing =  user.following.includes(targetUser);

    if(IsFollowing){
      // unfollow logic
      await Promise.all([
        User.updateOne({_id: ownerId},{$pull:{following: otherId}}),
        User.updateOne({_id: otherId},{$pull:{followers: ownerId}})
      ])
      return res.status(200).json({message: 'Unfollowed successfully',success:true});
    } else {
      // follow logic
      await Promise.all([
        User.updateOne({_id: ownerId},{$push:{following: otherId}}),
        User.updateOne({_id: otherId},{$push:{followers: ownerId}})
      ])

      return res.status(200).json({message: 'Followed successfully',success:true});
    }


  } catch (error) {
    console.log(error.message)
  }
}


