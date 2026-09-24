import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  author:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  caption: {
    type:String,
    trim: true,
    maxlenth: 2000,
  },
  image: {
    type:String,
    required: true
  },
  likes:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
},
{
    timestamps: true,
}
);

const Post = mongoose.model("Post", postSchema);

export default Post;