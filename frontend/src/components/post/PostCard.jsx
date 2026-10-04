// import {
//   Bookmark,
//   Heart,
//   MessageCircle,
//   MoreHorizontal,
//   Send,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// export default function PostCard({ post }) {
//   const author = post.author;

//   const profileImage = author?.profilePicture?.url;

//   const navigate = useNavigate();
//   return (

//     <article className="overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white">
//       {/* Post Header */}
//       <div className="flex items-center justify-between px-5 py-4">
//         <div 
//         className="flex items-center gap-3 cursor-pointer"
//         onClick={(e) => {
//           e.stopPropagation();
//           navigate(`/profile/${author?.username}`)
//         }}
//         >
//           {/* Avatar */}
//           {profileImage ? (
//             <img
//               src={profileImage}
//               alt={author?.username || "User"}
//               className="h-10 w-10 rounded-full aspect-square object-cover"
//             />
//           ) : (
//             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF0E9] text-sm font-semibold text-[#FF4D00]">
//               {author?.username?.charAt(0)?.toUpperCase() || "U"}
//             </div>
//           )}

//           <div>
//             <p className="text-sm font-semibold text-[#1B1C20]">
//               {author?.name || author?.username || "Unknown User"}
//             </p>

//             <p className="text-xs text-[#686A72]">
//               @{author?.username || "user"}
//             </p>
//           </div>
//         </div>

//         <button
//           type="button"
//           className="flex h-9 w-9 items-center justify-center rounded-full text-[#686A72] transition hover:bg-[#F7F6F3] hover:text-[#1B1C20]"
//         >
//           <MoreHorizontal size={20} />
//         </button>
//       </div>

//       {/* Post Image */}
//       <div className="w-full cursor-pointer bg-[#F7F6F3]" onClick={() => navigate(`/post/${post._id}`)}>
//         <img
//           src={post.image?.url}
//           alt={post.caption || "Post"}
//           className="block max-h-[700px] w-full object-cover"
//         />
//       </div>

//       {/* Actions */}
//       <div className="flex items-center justify-between px-5 pt-4">
//         <div className="flex items-center gap-1">
//           <button
//             type="button"
//             className="flex h-10 w-10 items-center justify-center rounded-full text-[#1B1C20] transition hover:bg-[#F7F6F3] hover:text-[#FF4D00]"
//           >
//             <Heart size={21} />
//           </button>

//           <button
//             type="button"
//             className="flex h-10 w-10 items-center justify-center rounded-full text-[#1B1C20] transition hover:bg-[#F7F6F3]"
//           >
//             <MessageCircle size={21} />
//           </button>

//           <button
//             type="button"
//             className="flex h-10 w-10 items-center justify-center rounded-full text-[#1B1C20] transition hover:bg-[#F7F6F3]"
//           >
//             <Send size={21} />
//           </button>
//         </div>

//         <button
//           type="button"
//           className="flex h-10 w-10 items-center justify-center rounded-full text-[#1B1C20] transition hover:bg-[#F7F6F3]"
//         >
//           <Bookmark size={21} />
//         </button>
//       </div>

//       {/* Likes */}
//       <div className="px-5 pt-1">
//         <p className="text-sm font-semibold text-[#1B1C20]">
//           {post.likes?.length || 0} likes
//         </p>
//       </div>

//       {/* Caption */}
//       {post.caption && (
//         <div className="px-5 pt-2">
//           <p className="text-sm leading-6 text-[#1B1C20]">
//             <span className="mr-1 font-semibold">
//               @{author?.username}
//             </span>
//             {post.caption}
//           </p>
//         </div>
//       )}

//       {/* Comments */}
//       <button
//         type="button"
//         className="px-5 pb-2 pt-3 text-sm text-[#9A9CA3] transition hover:text-[#686A72]"
//       >
//         View all {post.comments?.length || 0} comments
//       </button>

//       {/* Timestamp */}
//       <div className="px-5 pb-5">
//         <p className="text-[11px] uppercase tracking-wide text-[#9A9CA3]">
//           {post.createdAt
//             ? new Date(post.createdAt).toLocaleDateString()
//             : ""}
//         </p>
//       </div>
//     </article>
//   );
// }

import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog'
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { Button } from '@base-ui/react'
import CommentDialog from './CommentDialog'
import { useAuth } from '@/context/AuthContext'

const PostCard = ({post}) => {
  const [openComment, setOpenComment] = useState(false);
  const {user} = useAuth();

  const postAuthor = post.author;
  const profileImage = postAuthor?.profilePicture?.url;
  
  return (
    <div className='w-full max-w-sm  mx-auto'>

      <div className='flex my-3 items-center justify-between'>
        <div className='flex items-center gap-5'>
          <Avatar>
            <AvatarImage 
            src={profileImage} 
            alt={postAuthor?.username} 
            className="rounded-full aspect-square object-cover"/>
            <AvatarFallback>{postAuthor?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
         <p className="text-sm text-orange-400">
             @{postAuthor?.username || "user"}
             </p>
        </div>

        <Dialog>
          <DialogTrigger className="cursor-pointer">
            <MoreHorizontal />
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="flex flex-col text-sm items-center text-center">
            <Button variant='ghost' className='cursor-pointer font-bold text-orange-600'>Unfollow</Button>
            <Button variant='ghost' className='cursor-pointer font-bold text-orange-600'>Add to favorite</Button>
            {user && user?._id === postAuthor?._id && <Button variant='ghost' className='cursor-pointer font-bold text-orange-600'>Delete</Button> }
          </DialogContent>
        </Dialog>
      </div>

      <img
        className='w-full object-cover aspect-square'
        src={post?.image?.url}
        alt={postAuthor?.username} />


      <div>
        <div className='flex items-center gap-5 my-5 justify-between'>

          <div className='flex items-center gap-5'>
            <div className='flex gap-1'>
              <Heart className='cursor-pointer hover:text-orange-500'/>
            <span>{post?.likes.length}</span>
            </div>
            <div className='flex gap-1'>
            <MessageCircle onClick={() => setOpenComment(true)} className='cursor-pointer hover:text-orange-500' />
            <span>{post?.comments.length}</span>
            </div>
            <Send className='cursor-pointer hover:text-orange-500' />
          </div>

          <Bookmark className='cursor-pointer hover:text-orange-500' />
        </div>

        

        <p>caption</p>

        {openComment && <CommentDialog openComment={openComment} setOpenComment={setOpenComment} post={post} />}
        
      </div>
    </div>
  )
}

export default PostCard