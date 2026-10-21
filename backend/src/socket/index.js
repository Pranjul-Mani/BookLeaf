import { Server } from "socket.io";

let ioInstance = null;

export function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "DELETE"]
    }
  });

  ioInstance.on("connection", (socket) => {
    // Client connects
    socket.on("join:author", (authorId) => {
      socket.join(`author:${authorId}`);
    });

    socket.on("join:admin", () => {
      socket.join("admins");
    });

    socket.on("join:ticket", (ticketId) => {
      socket.join(`ticket:${ticketId}`);
    });

    socket.on("leave:ticket", (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
    });

    socket.on("disconnect", () => {
      // client disconnected
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}
