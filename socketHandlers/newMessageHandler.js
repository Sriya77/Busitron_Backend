import Conversation from "../models/conversation.models.js";
import Message from "../models/message.models.js";

const newMessageHandler = async (socket, data, io) => {
    const { message, conversationId } = data;
    const { author, content, media, document, type } = message;

    try {
        // Find the conversation by ID
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return socket.emit("error", { message: "Conversation not found" });
        }

        // Create a new message using the Message model
        const newMessage = await Message.create({
            author,
            content,
            media,
            document,
            type,
        });

        // Add new message to conversation
        conversation.messages.push(newMessage._id);
        await conversation.save();

        // Populate the conversation with messages and participants
        const updatedConversation = await Conversation.findById(conversationId)
            .populate("messages")
            .populate("participants");

        // Get online participants with a valid socket ID
        const onlineParticipants = updatedConversation.participants.filter(
            (participant) =>
                participant.status === "Online" && participant.socketId
        );

        // Emit 'new-message' event to online participants
        onlineParticipants.forEach((participant) => {
            io.to(participant.socketId).emit("new-direct-chat", {
                conversationId,
                message: newMessage,
            });
        });
    } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
    }
};

export default newMessageHandler;
