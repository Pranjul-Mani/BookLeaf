import { io } from "socket.io-client";

let socketInstance = null;

const RAW_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";
const SERVER_URL = RAW_URL ? RAW_URL.replace(/\/+$/, "").replace(/\/api$/, "") : undefined;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SERVER_URL || undefined, {
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
