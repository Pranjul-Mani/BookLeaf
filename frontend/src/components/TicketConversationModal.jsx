import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { getSocket, joinTicketRoom, leaveTicketRoom } from "../services/socket";
import { 
  X, 
  Send, 
  User, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Paperclip, 
  BookMarked,
  Sparkles,
  Tag
} from "lucide-react";

export function TicketConversationModal({ ticketId, onClose, currentUser }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const fetchTicket = async () => {
    try {
      const data = await api.getTicketById(ticketId);
      setTicket(data.ticket);
    } catch (err) {
      setError(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    joinTicketRoom(ticketId);

    const socket = getSocket();

    const handleMessageAdded = (payload) => {
      if (payload.ticketId === ticketId) {
        setTicket((prev) => {
          if (!prev) return prev;
          // Avoid duplicate messages if already appended
          const exists = prev.messages.some(
            (m) => m._id && payload.message._id && m._id === payload.message._id
          );
          if (exists) return prev;
          return {
            ...prev,
            status: payload.newStatus || prev.status,
            messages: [...prev.messages, payload.message]
          };
        });
      }
    };

    const handleTicketUpdated = (payload) => {
      if (payload.ticket?._id === ticketId) {
        setTicket(payload.ticket);
      }
    };

    socket.on("ticket:messageAdded", handleMessageAdded);
    socket.on("ticket:updated", handleTicketUpdated);

    return () => {
      leaveTicketRoom(ticketId);
      socket.off("ticket:messageAdded", handleMessageAdded);
      socket.off("ticket:updated", handleTicketUpdated);
    };
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const data = await api.addMessage(ticketId, {
        content: replyText.trim()
      });
      setTicket(data.ticket);
      setReplyText("");
    } catch (err) {
      alert("Failed to send message: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "In Progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      Resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      Closed: "bg-slate-700/50 text-slate-400 border-slate-600"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.Open}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      Critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      Low: "bg-slate-800 text-slate-400 border-slate-700"
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${styles[priority] || styles.Low}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-3xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-brand-400 bg-brand-950 px-2 py-0.5 rounded border border-brand-800">
                {ticket?.ticket_number || "TCK"}
              </span>
              {ticket && getStatusBadge(ticket.status)}
              {ticket && getPriorityBadge(ticket.priority)}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
              {ticket?.subject || "Support Ticket"}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <BookMarked className="w-3.5 h-3.5 text-slate-500" />
              <span>{ticket?.book_title}</span>
              <span>•</span>
              <span className="text-slate-400">{ticket?.category}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/40">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Loading conversation...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          ) : (
            <>
              {ticket.messages.map((msg, index) => {
                const isAdminMsg = msg.sender_role === "admin";
                const isAuthorMsg = msg.sender_role === "author";
                const isMe = (currentUser.role === "admin" && isAdminMsg) || (currentUser.role === "author" && isAuthorMsg);

                return (
                  <div
                    key={msg._id || index}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                      {isAdminMsg ? (
                        <span className="font-semibold text-amber-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> BookLeaf Support ({msg.sender_name})
                        </span>
                      ) : (
                        <span className="font-semibold text-teal-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {msg.sender_name}
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.is_ai_assisted && (
                        <span className="text-[10px] bg-brand-500/10 text-brand-300 px-1.5 py-0.2 rounded border border-brand-500/20 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> AI Verified
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        isAdminMsg
                          ? "bg-slate-900 border border-slate-700 text-slate-100 shadow-md"
                          : "bg-brand-600 text-white shadow-md shadow-brand-600/15"
                      }`}
                    >
                      {msg.content}

                      {/* Attachments UI (UI only requirement) */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-700/60 space-y-1">
                          {msg.attachments.map((att, aIdx) => (
                            <div
                              key={aIdx}
                              className="flex items-center gap-2 text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-lg text-slate-300"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium truncate">{att.name}</span>
                              <span className="text-[10px] text-slate-500 ml-auto font-mono">
                                {att.size ? `${Math.round(att.size / 1024)} KB` : "Attached"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Reply Composer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/80">
          <form onSubmit={handleSendReply} className="flex gap-2">
            <textarea
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response to support..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-md shadow-brand-600/20"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>
          <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="text-emerald-400 font-medium">Real-time bi-directional sync active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
