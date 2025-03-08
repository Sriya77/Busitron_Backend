import Conversation from "../models/conversation.models.js";

const chatHistoryHandler = async (socket, data) => {
    try {
        const { conversationId } = data;

        // Find the conversation by ID and populate the messages
        const conversation = await Conversation.findById(conversationId)
            .select("messages")
            .populate("messages");

        if (!conversation) {
            return socket.emit("error", { message: "Conversation not found" });
        }

        // Prepare response data
        const resData = {
            conversationId,
            history: conversation.messages,
        };

        // Emit the chat history back to the same socket
        socket.emit("chat-history", resData);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        socket.emit("error", {
            message: "Failed to fetch chat history",
            error,
        });
    }
};

export default chatHistoryHandler;
