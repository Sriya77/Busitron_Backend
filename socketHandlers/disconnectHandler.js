import User from "../models/user.models.js";

const disconnectHandler = async (socket) => {
    try {
        const user = await User.findOneAndUpdate(
            { socketId: socket.id },
            { socketId: undefined, status: "Offline" },
            { new: true, validateModifiedOnly: true }
        );
        if (user) {
            // Notify other users that this user has gone offline
            socket.broadcast.emit("user-disconnected", {
                message: `User ${user.name} has gone offline.`,
                userId: user._id,
                status: "Offline",
            });
        } else {
            console.log(`User with socket ID ${socket.id} not found.`);
        }
    } catch (error) {
        console.error(`Error handling disconnection: ${error.message}`);
    }
};

export default disconnectHandler;
