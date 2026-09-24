import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username:{
    type:String,
    required:true,
    unique:true,
    trim:true,
    lowercase: true,
  },
  email:{
    type:String,
    required:true,
    unique:true,
    trim:true,
    lowercase: true,
  },
  password:{
    type:String,
    required:true
  },
  name:{
    type:String,
    required:true,
    trim:true,
  },
  bio:{
    type:String,
    default: "",
  },
  profileImage:{
    type:String,
    default: "",
  },
  followers:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  following:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  posts:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    }
  ],
  bookmarks:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    }
  ],
  comments:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    }],
  
},
 {
  timestamps: true
} 
);

const User = mongoose.model("User", userSchema);

export default User;