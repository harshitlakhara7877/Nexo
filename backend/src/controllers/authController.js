import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";


export const register = async (req, res)=>{
  try {
    const {username, email, password, name} = req.body;

    if(!username || !email || !password || !name){
      return res.status(400).json({
        message: "All field are required",
        success: false
      })
    }

    const ExistingUser = await User.find({
      $or: [{email}, {username}],
    });

    if(ExistingUser){
      return res.status(400).json({
        message: "User already exist",
        success: false
      })
    }

    const hashedPassword = await bcrypt.hash(password, 13);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      name,
    })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {expiresIn: "1d"});

    res.cookie("token", token, {
      httpOnly:true, secure: process.env.NODE_ENV === "production",sameSite:'strict', maxAge:1*24*60*60*1000
    });

    return res.status(200).json({
      message:"Account created successfully",
      success:true,
      token, 
      user:{
        id: user._id,
        username:user.username,
        email:user.email,
        name:user.name,
      }
    });

  } catch (error) {
    console.log(error.message);
  }
}

export const login = async (req, res) => {
  try {
    const {email, password} = req.body;

  if(!email || !password){
      return res.status(400).json({
        message: "All field are required",
        success: false
      })
    }

    const user = await User.findOne({email});

    if(!user){
      return res.status(400).json({
        message: "Invalid email or password",
        success: false
      })
    }

    const passwordMatches =  await bcrypt.compare(password, user.password);

    if(!passwordMatches){
      return res.status(400).json({
        message: "Invalid email or password",
        success: false
      })
    }

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "1d"});

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message:"Login successfull",
      success:true,
      token,
      user:{
        id: user._id,
        usernamez:user.username,
        email: user.email,
        name: user.name,
      }
    });

  } catch (error) {
    console.log(error.message);
  }
}

export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });


  res.json({
    success:true,
    message: "Logged out successfully"
  })
}