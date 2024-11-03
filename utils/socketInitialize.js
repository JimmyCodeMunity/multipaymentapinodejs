// socketHandle.js

// This function initializes the socket connection
const initSocket = (io) => {
    const userSocketMap = {};
  
    io.on("connection", (socket) => {
      console.log("User connected successfully", socket.id);
      const userId = socket.handshake.query.userId;
      console.log("UserId:", userId);
  
      if (userId !== "undefined") {
        userSocketMap[userId] = socket.id;
      }
  
      console.log("My User socket map:", userSocketMap);
  
      socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
        delete userSocketMap[userId];
        console.log("User socket map after disconnect:", userSocketMap);
      });
    });
  
    return userSocketMap;
  };
  
  module.exports = initSocket;
  