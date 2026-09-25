import User from "../models/User.js"

export const getUserProfile = async (req, res) => {
  try {
    console.log(req.userId);
    const user = await User.findById(req.userId).select("-password");

  if(!user){
    return res.status(401).json({
      message: "User not found",
      success: false
    })
  }

  return res.status(200).json({
    user:user,
    success: true
  })
  } catch (error) {
    console.log(error);
  }
}

