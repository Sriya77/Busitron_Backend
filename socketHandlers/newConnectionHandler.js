import User from "../models/user.models.js";

const newConnectionHandler = async (socket, io) => {
    try {
        const userId = socket.user;

        // Update user's socketId and set status to "Online"
        const user = await User.findByIdAndUpdate(
            userId,
            { socketId: socket.id, status: "Online" },
            { new: true, validateModifiedOnly: true }
        );

        if (user) {
            // Notify other users that a new user has connected
            socket.broadcast.emit("user-connected", {
                message: `User ${user.name} has connected.`,
                userId: user._id,
                status: "Online",
            });
        } else {
            console.log(`User with ID ${userId} not found.`);
        }
    } catch (error) {
        console.error(`Error handling new connection: ${error.message}`);
    }
};

export default newConnectionHandler;
