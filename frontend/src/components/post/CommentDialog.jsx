import React, { useState } from 'react'
import { Dialog, DialogTrigger, DialogContent } from '../ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { Button } from '../ui/button'
import { useAuth } from '@/context/AuthContext'

const CommentDialog = ({openComment, setOpenComment, post}) => {
  const [text, setText] = useState("");
  const {user, setUser} = useAuth();

  const changeTextHandler = (e) => {
    setText(e.target.value)
  }

  const handleAddComment = () => {
    const comment = text.trim();

    if(!comment) return;

    //api call

    setText("");
  }
  return (
    <div>
      <Dialog
        open={openComment}
        onOpenChange={setOpenComment}
        >
        <DialogContent
          className="sm:max-w-5xl h-[70vh] p-0 overflow-hidden"
          showCloseButton={false}>


          <div className='flex flex-1 '>
             
             {/* media  */}
            <div className='w-1/2'>
            <img
              className='w-full h-full object-cover aspect-square'
              src={post?.image?.url} alt={post?.username} />
            </div>
             
             {/* comments  */}
          <div className='w-1/2 p-2 ml-1 flex  flex-col justify-between gap-3'>
            {/* User Header  */}
            <div className='flex justify-between'>
            <div className='flex items-center gap-5'>
              <Avatar>
                <AvatarImage src={post?.author?.profileImage?.url} alt='post?.author?.username' />
                <AvatarFallback>{postAuthor?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <h1>@{post?.author?.username}</h1>
            </div>

            <Dialog>
              <DialogTrigger className="cursor-pointer">
                <MoreHorizontal className="mr-2" />
              </DialogTrigger>
              <DialogContent 
              showCloseButton={false}
               className="flex flex-col text-sm items-center text-center">
                <Button variant='ghost' className='cursor-pointer font-bold text-orange-600'>Unfollow</Button>
                <Button variant='ghost' className='cursor-pointer font-bold text-orange-600'>Add to favorite</Button>
                {user && user?._id === postAuthor?._id && <Button variant='ghost' className='cursor-pointer font-bold text-orange-600'>Delete</Button> }
              </DialogContent>
            </Dialog>
          </div>

          <hr />

            {/* Comments  */}
          <div className="flex-1 overflow-y-auto  ">
            <p>comment</p>
            <p>comment</p>
            <p>comment</p>
            <p>comment</p>
          </div>

          <hr />

          {/* Post Action  */}
          <div className='flex items-center gap-5 justify-between'>

          <div className='flex items-center gap-5'>
            <div className='flex gap-1 items-center'>
              <Heart className='cursor-pointer hover:text-orange-500'/>
            <span>272 </span>
            </div>
            <Send className='cursor-pointer items-center hover:text-orange-500' />
          </div>

          <Bookmark className='cursor-pointer items-center hover:text-orange-500' />
          </div>

          <p className='w-2 bg-gray-500'></p>

           {/* Add Comments  */}
           <div className='flex items-center gap-2 my-1 p-1 mr-1 justify-between'>
            <input 
            type="text"
            placeholder='Add your comment...'
            value={text}
            onChange={changeTextHandler} 
            className=' w-full outline-none text-gray-800 rounded border border-orange-300 p-2  '/>

            <Button disabled={!text?.trim()} onClick={handleAddComment}>Post</Button>
           </div>

          </div>

          </div>



        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CommentDialog