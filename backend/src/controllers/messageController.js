import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const {message} = req.body;

        if(!message){
            return res.status(400).json({
                success:false,
                message: 'Message required',
            })
        }

        let conversation = await Conversation.findOne({participants:{$all:[senderId, receiverId]}});

        if(!conversation){
            conversation = await Conversation.create({participants:[senderId, receiverId]});
        }

        const newMessage = await Message.create({
            conversation:conversation._id,
            sender:senderId,
            message:newMessage
        });
        
        await conversation.Message.push(newMessage._id);

        await conversation.save();

        // implement socket io


        return res.status(200).json({
                success:true,
                message:newMessage,
            })

         
    } catch (error) {
        console.log(error.messagte)
    }
}
export const getMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;

        const conversation = await Conversation.findOne({participants:{$all:[senderId, receiverId]}});

        if(!conversation){
            return res.status(200).json({
                success:true,
                message:[],
            })
        }

        return res.status(200).json({
                success:true,
                message: conversation.Message
            })

         
    } catch (error) {
        console.log(error.messagte)
    }
}

