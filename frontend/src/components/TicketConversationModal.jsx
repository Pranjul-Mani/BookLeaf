import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { getSocket, joinTicketRoom, leaveTicketRoom } from "../services/socket";
import {
  ArrowLeft,
  Send,
  User,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Paperclip,
  BookMarked,
  Sparkles,
  Tag,
  Eye
} from "lucide-react";
import { formatDate } from "../utils/dateUtils";
import { ImagePreviewModal } from "./common/ImagePreviewModal";

export function TicketConversationModal({ ticketId, onClose, currentUser }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState(null);
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
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.Open}`}>
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
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Back to Tickets Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all group cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>
        {ticket && (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Ticket: <strong className="text-brand-300">{ticket.ticket_number}</strong></span>
          </div>
        )}
      </div>

      {/* Main Conversation Container */}
      <div className="glass-panel w-full rounded-2xl flex flex-col overflow-hidden shadow-xl border border-slate-800">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-300 bg-brand-950 px-2.5 py-0.5 rounded border border-brand-800">
                {ticket?.ticket_number || "TCK"}
              </span>
              {ticket && getStatusBadge(ticket.status)}
              {ticket && getPriorityBadge(ticket.priority)}
              {ticket?.category && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-medium">
                  {ticket.category}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {ticket?.subject || (loading ? "Loading ticket details..." : "Support Ticket")}
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <BookMarked className="w-3.5 h-3.5 text-brand-400" />
                {ticket?.book_title}
              </span>
              {ticket?.createdAt && (
                <>
                  <span>•</span>
                  <span>Created {formatDate(ticket.createdAt)}</span>
                </>
              )}
              {ticket?.updatedAt && (
                <>
                  <span>•</span>
                  <span>Last reply {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="min-h-[380px] max-h-[580px] overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/40">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-2" />
              <span>Loading conversation...</span>
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
                    <div className="flex items-center gap-2 mb-1.5 text-[11px] text-slate-400">
                      {isAdminMsg ? (
                        <span className="font-semibold text-amber-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> BookLeaf Support ({msg.sender_name})
                        </span>
                      ) : (
                        <span className="font-semibold text-teal-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {msg.sender_name} (You)
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {/* {msg.is_ai_assisted && (
                        <span className="text-[10px] bg-brand-500/10 text-brand-300 px-1.5 py-0.2 rounded border border-brand-500/20 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> AI Verified
                        </span>
                      )} */}
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isAdminMsg
                          ? "bg-slate-900 border border-slate-800 text-slate-100 shadow-md rounded-tl-sm"
                          : "bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-md shadow-brand-600/15 rounded-tr-sm"
                        }`}
                    >
                      {msg.content}

                      {/* Attachments UI with View Eye Icon */}
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
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment(att)}
                                className="p-1 rounded hover:bg-slate-700 text-brand-300 hover:text-white transition-colors cursor-pointer"
                                title="View attachment"
                                aria-label="View attachment"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
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
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80">
          <form onSubmit={handleSendReply} className="flex gap-2.5">
            <textarea
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response to support..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 resize-none"
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
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-md shadow-brand-600/20 self-end cursor-pointer"
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
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {/* <span className="text-emerald-400 font-medium">Real-time sync active</span> */}
          </div>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
      />
    </div>
  );
}

export { TicketConversationModal as TicketConversationView };
