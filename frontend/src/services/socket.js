import { io } from "socket.io-client";

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io({
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on("connect", () => {
      console.log("[Socket] Connected to real-time server with ID:", socketInstance.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });
  }

  return socketInstance;
}

export function joinTicketRoom(ticketId) {
  const socket = getSocket();
  if (socket && ticketId) {
    socket.emit("join:ticket", ticketId);
  }
}

export function leaveTicketRoom(ticketId) {
  const socket = getSocket();
  if (socket && ticketId) {
    socket.emit("leave:ticket", ticketId);
  }
}
