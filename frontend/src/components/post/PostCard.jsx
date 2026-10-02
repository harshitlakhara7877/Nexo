// const PostCard = ({ post }) => {
//   return (
//     <article className="rounded-2xl border bg-white">
//       <div className="flex items-center gap-3 p-4">
//         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-semibold text-[#FF4D00]">
//           {post.author?.username?.charAt(0).toUpperCase()}
//         </div>

//         <div>
//           <p className="text-sm font-semibold">
//             {post.author?.name || post.author?.username}
//           </p>

//           <p className="text-xs text-gray-500">
//             @{post.author?.username}
//           </p>
//         </div>
//       </div>

//       <img
//         src={post.image}
//         alt={post.caption || "Post"}
//         className="aspect-square w-full object-cover"
//       />

//       {post.caption && (
//         <div className="p-4">
//           <p className="text-sm text-gray-800">
//             {post.caption}
//           </p>
//         </div>
//       )}
//     </article>
//   );
// };

// export default PostCard;

import React from 'react'

const PostCard = () => {
  return (
    <div>
      
    </div>
  )
}

export default PostCard