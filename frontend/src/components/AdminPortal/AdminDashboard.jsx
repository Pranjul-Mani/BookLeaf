import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { getSocket, joinTicketRoom, leaveTicketRoom } from "../../services/socket";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  UserX, 
  Send, 
  RefreshCw, 
  Edit3, 
  Lock, 
  MessageSquare, 
  Layers, 
  User, 
  Paperclip, 
  ArrowLeft,
  X, 
  ChevronRight,
  ChevronDown,
  TrendingUp,
  FileText,
  Copy,
  BookOpen,
  SlidersHorizontal,
  Flame,
  Eye,
  Image as ImageIcon
} from "lucide-react";
import { CustomSelect } from "../common/CustomSelect";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { formatDate, formatDateTime } from "../../utils/dateUtils";

const STATUS_OPTIONS = [
  { value: "All", label: "All Statuses" },
  { value: "Open", label: "Open", dotColor: "#60a5fa" },
  { value: "In Progress", label: "In Progress", dotColor: "#f59e0b" },
  { value: "Resolved", label: "Resolved", dotColor: "#10b981" },
  { value: "Closed", label: "Closed", dotColor: "#94a3b8" }
];

const STATUS_CHANGE_OPTIONS = STATUS_OPTIONS.filter((s) => s.value !== "All");

const CATEGORY_OPTIONS = [
  { value: "All", label: "All Categories" },
  { value: "Royalty & Payments", label: "Royalty & Payments" },
  { value: "ISBN & Metadata Issues", label: "ISBN & Metadata" },
  { value: "Printing & Quality", label: "Printing & Quality" },
  { value: "Distribution & Availability", label: "Distribution & Availability" },
  { value: "Book Status & Production Updates", label: "Production Updates" },
  { value: "General Inquiry", label: "General Inquiry" }
];

const CATEGORY_OVERRIDE_OPTIONS = CATEGORY_OPTIONS.filter((c) => c.value !== "All");

const PRIORITY_OPTIONS = [
  { value: "All", label: "All Priorities" },
  { value: "Critical", label: "Critical", dotColor: "#f43f5e" },
  { value: "High", label: "High", dotColor: "#f97316" },
  { value: "Medium", label: "Medium", dotColor: "#eab308" },
  { value: "Low", label: "Low", dotColor: "#94a3b8" }
];

const PRIORITY_OVERRIDE_OPTIONS = PRIORITY_OPTIONS.filter((p) => p.value !== "All");

const SORT_OPTIONS = [
  { value: "urgent", label: "Urgency & Severity First" },
  { value: "oldest_unresolved", label: "Oldest Unresolved" },
  { value: "newest", label: "Newest First" }
];

const REPLY_STATUS_OPTIONS = [
  { value: "In Progress", label: "In Progress", dotColor: "#f59e0b" },
  { value: "Resolved", label: "Resolved", dotColor: "#10b981" },
  { value: "Closed", label: "Closed", dotColor: "#94a3b8" }
];

export function AdminDashboard({ currentUser, setToast: externalSetToast }) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const notify = (msg) => {
    if (externalSetToast) {
      externalSetToast(msg);
    } else {
      setToast(msg);
    }
  };

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("urgent");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Triage Drawer State
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [activeTriageTab, setActiveTriageTab] = useState("conversation"); // 'conversation' | 'internal_notes' | 'ai_intel'
  const [showConversations, setShowConversations] = useState(false);

  const selectedTicketRef = useRef(selectedTicket);
  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  // Debounce search query (250ms) to prevent violent re-rendering and layout shifts while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchQueue = async (isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setIsFetching(true);
      }

      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (categoryFilter !== "All") params.append("category", categoryFilter);
      if (priorityFilter !== "All") params.append("priority", priorityFilter);
      if (sortBy) params.append("sortBy", sortBy);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

      const [ticketData, statsData] = await Promise.all([
        api.getTickets(`?${params.toString()}`),
        api.getTicketStats()
      ]);

      setTickets(ticketData.tickets || []);
      setStats(statsData.stats);
    } catch (err) {
      console.error("Failed to load admin queue:", err);
    } finally {
      setInitialLoading(false);
      setIsFetching(false);
    }
  };

  const hasMountedRef = useRef(false);

  // Fetch tickets whenever filters change or debounced search updates
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      fetchQueue(true);
    } else {
      fetchQueue(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, sortBy, debouncedSearch]);

  // Real-time socket listeners (mounted once)
  useEffect(() => {
    const socket = getSocket();
    socket.emit("join:admin");

    const handleTicketCreated = (payload) => {
      setTickets((prev) => [payload.ticket, ...prev]);
      api.getTicketStats().then((data) => setStats(data.stats)).catch(() => {});
    };

    const handleTicketUpdated = (payload) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === payload.ticket._id ? payload.ticket : t))
      );
      if (selectedTicketRef.current?._id === payload.ticket._id) {
        setSelectedTicket(payload.ticket);
      }
    };

    const handleMessageAdded = (payload) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t._id === payload.ticketId) {
            return {
              ...t,
              status: payload.newStatus || t.status,
              messages: [...t.messages, payload.message]
            };
          }
          return t;
        })
      );
      if (selectedTicketRef.current?._id === payload.ticketId) {
        setSelectedTicket((prev) => ({
          ...prev,
          status: payload.newStatus || prev.status,
          messages: [...prev.messages, payload.message]
        }));
      }
    };

    const handleNoteAdded = (payload) => {
      if (selectedTicketRef.current?._id === payload.ticketId) {
        setSelectedTicket((prev) => ({
          ...prev,
          internal_notes: [...(prev.internal_notes || []), payload.note]
        }));
      }
    };

    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);
    socket.on("ticket:messageAdded", handleMessageAdded);
    socket.on("ticket:noteAdded", handleNoteAdded);

    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
      socket.off("ticket:messageAdded", handleMessageAdded);
      socket.off("ticket:noteAdded", handleNoteAdded);
    };
  }, []);

  const openTicketTriage = (ticket) => {
    setSelectedTicket(ticket);
    setReplyMessage("");
    setReplyStatus(ticket.status === "Open" ? "In Progress" : ticket.status);
    setShowConversations(false);
    setTriageModalOpen(true);
    joinTicketRoom(ticket._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeTicketTriage = () => {
    if (selectedTicket) {
      leaveTicketRoom(selectedTicket._id);
    }
    setTriageModalOpen(false);
    setSelectedTicket(null);
    setShowConversations(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const data = await api.updateTicket(selectedTicket._id, { status: newStatus });
      setSelectedTicket(data.ticket);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleOverrideCategory = async (newCategory) => {
    if (!selectedTicket) return;
    try {
      const data = await api.updateTicket(selectedTicket._id, { category: newCategory });
      setSelectedTicket(data.ticket);
    } catch (err) {
      alert("Failed to override category: " + err.message);
    }
  };

  const handleOverridePriority = async (newPriority) => {
    if (!selectedTicket) return;
    try {
      const data = await api.updateTicket(selectedTicket._id, { priority: newPriority });
      setSelectedTicket(data.ticket);
    } catch (err) {
      alert("Failed to override priority: " + err.message);
    }
  };

  const handleToggleAssign = async () => {
    if (!selectedTicket) return;
    try {
      const isAssigned = Boolean(selectedTicket.assigned_to?.name || selectedTicket.assigned_to?.admin_id);
      const payload = isAssigned
        ? { assigned_to: null }
        : {
            assigned_to: {
              admin_id: currentUser.id || currentUser._id,
              name: currentUser.name,
              email: currentUser.email
            }
          };

      const data = await api.updateTicket(selectedTicket._id, payload);
      setSelectedTicket(data.ticket);
    } catch (err) {
      alert("Failed to update ticket assignment: " + err.message);
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket || submittingReply) return;

    setSubmittingReply(true);
    try {
      const data = await api.addMessage(selectedTicket._id, {
        content: replyMessage.trim(),
        update_status: replyStatus || undefined,
        is_ai_assisted: true
      });
      setSelectedTicket(data.ticket);
      setReplyMessage("");
      setActiveTriageTab("conversation");
      notify("Message sent successfully!");
    } catch (err) {
      notify("Failed to send response: " + (err.message || "Error"));
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNote.trim() || !selectedTicket || savingNote) return;

    setSavingNote(true);
    try {
      const data = await api.addInternalNote(selectedTicket._id, internalNote.trim());
      setSelectedTicket(data.ticket);
      setInternalNote("");
    } catch (err) {
      alert("Failed to add note: " + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleRegenerateDraft = async () => {
    if (!selectedTicket || regeneratingDraft) return;
    setRegeneratingDraft(true);
    try {
      const data = await api.regenerateAiDraft(selectedTicket._id);
      setSelectedTicket((prev) => ({
        ...prev,
        ai_draft_response: data.ai_draft_response
      }));
      setReplyMessage(data.ai_draft_response.content);
    } catch (err) {
      alert("Failed to regenerate AI response: " + err.message);
    } finally {
      setRegeneratingDraft(false);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "High":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "In Progress":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Resolved":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  // Dedicated Full-Page View for a particular ticket card
  if (selectedTicket) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-150">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={closeTicketTriage}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-brand-500/50 hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition-all shadow-sm group"
            >
              <ArrowLeft className="w-4 h-4 text-brand-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>Support Queue</span>
              <span>/</span>
              <span className="font-mono font-bold text-brand-300">{selectedTicket.ticket_number}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Boolean(selectedTicket.assigned_to?.name || selectedTicket.assigned_to?.admin_id) ? (
              <button
                onClick={handleToggleAssign}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-rose-950/40 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 flex items-center gap-1.5 transition-all shadow-sm group"
                title="Unassign this ticket"
              >
                <UserX className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Unassign</span>
              </button>
            ) : (
              <button
                onClick={handleToggleAssign}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm group"
                title="Assign ticket to yourself"
              >
                <UserCheck className="w-3.5 h-3.5 text-brand-400 group-hover:scale-110 transition-transform" />
                <span>Assign to Me</span>
              </button>
            )}
          </div>
        </div>

        {/* Ticket Header & Metadata Card */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-300 bg-brand-950 px-2.5 py-1 rounded border border-brand-800">
                {selectedTicket.ticket_number}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getStatusStyle(selectedTicket.status)}`}>
                {selectedTicket.status}
              </span>
              {selectedTicket.priority && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getPriorityStyle(selectedTicket.priority)}`}>
                  Priority: {selectedTicket.priority}
                </span>
              )}
              {selectedTicket.category && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-medium">
                  {selectedTicket.category}
                </span>
              )}
            </div>

            {selectedTicket.assigned_to?.name && (
              <span className="text-amber-300 bg-amber-950/70 border border-amber-800/80 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Assigned: {selectedTicket.assigned_to.name}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white">
            {selectedTicket.subject}
          </h1>

          {/* Ticket Description below main title */}
          {selectedTicket.description && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {selectedTicket.description}
            </div>
          )}

          {/* Uploaded Attachments & Proof Photos Section with View Eye Icon */}
          {(() => {
            const allAttachments = [
              ...(selectedTicket.attachments || []),
              ...(selectedTicket.messages?.flatMap((m) => m.attachments || []) || [])
            ].filter(
              (att, index, self) =>
                Boolean(att && att.name) &&
                index === self.findIndex((t) => t.name === att.name && t.size === att.size)
            );

            if (allAttachments.length === 0) return null;

            return (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Paperclip className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Uploaded Attachments & Proof Photos ({allAttachments.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {allAttachments.map((att, idx) => {
                    const isImg =
                      att.file_type?.startsWith("image/") ||
                      (att.url && att.url.startsWith("data:image/")) ||
                      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name || "");
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 transition-all group text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {isImg && att.url ? (
                            <div
                              onClick={() => setPreviewAttachment(att)}
                              className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer group/thumb"
                              title="Click to preview image"
                            >
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                              />
                              <div className="absolute inset-0 bg-brand-950/40 dark:bg-black/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                              {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                          )}

                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate">{att.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {att.size ? `${Math.round(att.size / 1024)} KB` : "Attached"}{" "}
                              {isImg ? "• Image" : "• Document"}
                            </span>
                          </div>
                        </div>

                        {/* View Eye Icon Button */}
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-500/20 hover:border-brand-500/40 transition-all cursor-pointer shrink-0"
                          title="View image/attachment"
                          aria-label="View attachment"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-800">
            <span className="text-slate-200 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-400" />
              {selectedTicket.author_name} ({selectedTicket.author_email})
            </span>
            <span>•</span>
            <span className="text-brand-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              {selectedTicket.book_title}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Created {formatDateTime(selectedTicket.createdAt)}
            </span>
          </div>
        </div>

        {/* Quick Status, Category, Priority & Tabs Bar */}
        <div className="p-4 rounded-2xl glass-card border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs relative z-20 overflow-visible">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Status:</span>
              <CustomSelect
                value={selectedTicket.status}
                onChange={handleUpdateStatus}
                options={STATUS_CHANGE_OPTIONS}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Category:</span>
              <CustomSelect
                value={selectedTicket.category}
                onChange={handleOverrideCategory}
                options={CATEGORY_OVERRIDE_OPTIONS}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Priority:</span>
              <CustomSelect
                value={selectedTicket.priority}
                onChange={handleOverridePriority}
                options={PRIORITY_OVERRIDE_OPTIONS}
                size="sm"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTriageTab("conversation")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTriageTab === "conversation"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Conversation ({selectedTicket.messages?.length || 0})
            </button>
            <button
              onClick={() => setActiveTriageTab("ai_intel")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTriageTab === "ai_intel"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-brand-300 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Intelligence & Draft</span>
            </button>
            <button
              onClick={() => setActiveTriageTab("internal_notes")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTriageTab === "internal_notes"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-purple-300 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Internal Notes ({selectedTicket.internal_notes?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Tab View Panels */}
        <div className="space-y-6">
          {activeTriageTab === "conversation" && (
            <div className="space-y-4">
              {/* Messages Feed (Visible only when showConversations is true) */}
              {showConversations && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                      Conversation History ({selectedTicket.messages?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowConversations(false)}
                      className="text-xs text-brand-400 hover:underline"
                    >
                      Hide History
                    </button>
                  </div>
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((msg, idx) => {
                      const isAdminMsg = msg.sender_role === "admin";
                      return (
                        <div
                          key={msg._id || idx}
                          className={`p-5 rounded-2xl glass-card ${
                            isAdminMsg
                              ? "bg-slate-900 border border-slate-700 ml-4 sm:ml-12"
                              : "bg-brand-950/40 border border-brand-800/60 mr-4 sm:mr-12"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span className="font-bold flex items-center gap-1 text-slate-200">
                              {isAdminMsg ? (
                                <span className="text-amber-400 flex items-center gap-1">
                                  <ShieldAlert className="w-3.5 h-3.5" /> BookLeaf Support ({msg.sender_name})
                                </span>
                              ) : (
                                <span className="text-teal-400 flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" /> {msg.sender_name} (Author)
                                </span>
                              )}
                            </span>
                            <span className="text-[11px]">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {formatDate(msg.created_at)}
                            </span>
                          </div>

                          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>

                          {/* Message Attachments with View Eye Button */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                              <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                                <Paperclip className="w-3 h-3 text-brand-400" />
                                <span>Attachments ({msg.attachments.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {msg.attachments.map((att, aIdx) => {
                                  const isImg =
                                    att.file_type?.startsWith("image/") ||
                                    (att.url && att.url.startsWith("data:image/")) ||
                                    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name || "");
                                  return (
                                    <div
                                      key={aIdx}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300"
                                    >
                                      {isImg && att.url ? (
                                        <div
                                          onClick={() => setPreviewAttachment(att)}
                                          className="relative w-7 h-7 rounded-md overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer group/thumb shadow-sm"
                                          title="Click to preview image"
                                        >
                                          <img
                                            src={att.url}
                                            alt={att.name}
                                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                                          />
                                          <div className="absolute inset-0 bg-brand-950/40 dark:bg-black/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                            <Eye className="w-3 h-3 text-white" />
                                          </div>
                                        </div>
                                      ) : null}
                                      <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {att.size ? `${Math.round(att.size / 1024)} KB` : ""}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewAttachment(att)}
                                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/15 transition-colors cursor-pointer"
                                        title="View attachment"
                                        aria-label="View attachment"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {msg.is_ai_assisted && (
                            <div className="mt-2 text-[10px] text-brand-300 flex items-center gap-1 font-mono">
                              <Sparkles className="w-3 h-3 text-brand-400" /> AI-Drafted Response applied by Ops
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-400 text-xs">
                      No conversation messages recorded yet.
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Response Composer with increased height */}
              <form onSubmit={handleSendResponse} className="p-6 sm:p-7 rounded-2xl glass-card border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-brand-400" /> Compose Response to Author
                    </span>
                    {selectedTicket.ai_draft_response?.content && (
                      <button
                        type="button"
                        onClick={() => setReplyMessage(selectedTicket.ai_draft_response.content)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all text-xs"
                        title="Insert AI-drafted response"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>Insert AI Drafted Response</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowConversations((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                        showConversations
                          ? "bg-brand-600 text-white border-brand-500 shadow-sm"
                          : "bg-slate-900 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600"
                      }`}
                      title={showConversations ? "Hide conversation history" : "Show full conversation history"}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                      <span>{showConversations ? "Hide Conversations" : `All Conversations (${selectedTicket.messages?.length || 0})`}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showConversations ? "rotate-180" : ""}`} />
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">On Send, set status to:</span>
                      <CustomSelect
                        value={replyStatus}
                        onChange={setReplyStatus}
                        options={REPLY_STATUS_OPTIONS}
                        size="sm"
                        align="right"
                      />
                    </div>
                  </div>
                </div>

                <textarea
                  rows={12}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write your response to the author (or click 'Insert AI Drafted Response' above)..."
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 resize-y min-h-[260px] leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                  {replyMessage.trim() && (
                    <button
                      type="button"
                      onClick={() => setReplyMessage("")}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-slate-700/80 hover:border-rose-800/60 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="Clear response message"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Clear Response</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReply || !replyMessage.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-brand-500/20"
                  >
                    {submittingReply ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Verified Response</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTriageTab === "ai_intel" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20">
                {/* Auto-Classification Box */}
                <div className="p-5 rounded-2xl glass-card border border-slate-800 relative z-20 overflow-visible">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Auto-Classification
                    </span>
                    <span className="font-mono text-slate-400">
                      Confidence: {Math.round((selectedTicket.ai_classification?.confidence || 0.9) * 100)}%
                    </span>
                  </div>
                  <div className="text-base font-bold text-white">
                    {selectedTicket.category}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 italic">
                    "{selectedTicket.ai_classification?.reasoning || "Categorized based on intent pattern"}"
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Admin Override:</span>
                    <CustomSelect
                      value={selectedTicket.category}
                      onChange={handleOverrideCategory}
                      options={CATEGORY_OVERRIDE_OPTIONS}
                      size="sm"
                      align="right"
                    />
                  </div>
                </div>

                {/* Priority Scoring Box */}
                <div className="p-5 rounded-2xl glass-card border border-slate-800 relative z-20 overflow-visible">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> Priority Scoring
                    </span>
                    <span className="font-mono text-slate-400">
                      Urgency Score: {selectedTicket.ai_priority_score?.urgency_score || 50}/100
                    </span>
                  </div>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs border ${getPriorityStyle(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 italic">
                    "{selectedTicket.ai_priority_score?.reasoning || "Scored based on financial and publishing risk"}"
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Admin Override:</span>
                    <CustomSelect
                      value={selectedTicket.priority}
                      onChange={handleOverridePriority}
                      options={PRIORITY_OVERRIDE_OPTIONS}
                      size="sm"
                      align="right"
                    />
                  </div>
                </div>
              </div>

              {/* AI Draft Response Card */}
              <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <h4 className="text-sm font-bold text-white">AI-Drafted Response Preview</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {selectedTicket.ai_draft_response?.model_used || "BookLeaf AI"}
                    </span>
                    <button
                      onClick={handleRegenerateDraft}
                      disabled={regeneratingDraft}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${regeneratingDraft ? "animate-spin" : ""}`} />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {selectedTicket.ai_draft_response?.content || "No draft generated"}
                </div>

                {selectedTicket.ai_draft_response?.suggested_actions && selectedTicket.ai_draft_response.suggested_actions.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Suggested Ops Actions:
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {selectedTicket.ai_draft_response.suggested_actions.map((act, aIdx) => (
                        <li key={aIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setReplyMessage(selectedTicket.ai_draft_response.content);
                      setActiveTriageTab("conversation");
                    }}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Use This Draft to Reply</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTriageTab === "internal_notes" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  Internal notes are visible ONLY to BookLeaf team members and will NEVER be seen by authors.
                </span>
              </div>

              {/* Notes Feed */}
              <div className="space-y-2.5">
                {selectedTicket.internal_notes && selectedTicket.internal_notes.length > 0 ? (
                  selectedTicket.internal_notes.map((n, idx) => (
                    <div
                      key={n._id || idx}
                      className="p-4 rounded-xl glass-card border border-purple-900/40 text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-semibold text-purple-300 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" /> {n.author_name} ({n.author_email})
                        </span>
                        <span className="text-[11px] font-mono">
                          {formatDateTime(n.created_at)}
                        </span>
                      </div>
                      <div className="text-slate-200 mt-1">{n.note}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs rounded-2xl glass-card border border-slate-800">
                    No internal notes yet. Add background investigation notes below.
                  </div>
                )}
              </div>

              {/* Add note form */}
              <form onSubmit={handleAddInternalNote} className="space-y-2 pt-2">
                <textarea
                  rows={3}
                  required
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Write an internal note (e.g. verified with finance bank batch #4401)..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 resize-y"
                />
                <button
                  type="submit"
                  disabled={savingNote || !internalNote.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {savingNote ? "Saving Note..." : "Save Internal Note"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Lightbox Image Preview Modal in Detail View */}
        <ImagePreviewModal
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          attachment={previewAttachment}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Ops Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-48 bg-amber-500/10 blur-[90px] pointer-events-none" />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> BookLeaf Operations Hub
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Author Communication & Triage Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Author Support Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed font-normal">
            AI-classified support queries across authors and published catalog titles. Manage incoming tickets and resolve author concerns in real time.
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl glass-card border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Total Tickets</div>
            <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Catalog inquiries</div>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Open & Active</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{stats.open + stats.inProgress}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {stats.open} Open • {stats.inProgress} In Progress
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-slate-800">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Critical
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {stats.critical + stats.high}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Overdue royalties or ISBNs</div>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Resolved & Closed</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.resolved + stats.closed}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">All SLAs met</div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs relative z-20">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            {isFetching ? (
              <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
            <input
              type="text"
              placeholder="Search by ticket #, author, book, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />

          {/* Category Filter */}
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={CATEGORY_OPTIONS}
          />

          {/* Priority Filter */}
          <CustomSelect
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={PRIORITY_OPTIONS}
          />
        </div>

        {/* Sort criteria */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400 font-semibold shrink-0 text-xs">Sort By:</span>
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
            align="right"
          />
        </div>
      </div>

      {/* Ticket Queue List */}
      <div className={`space-y-3 min-h-[360px] transition-opacity duration-150 ${isFetching ? "opacity-75" : "opacity-100"}`}>
        {initialLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading support queue...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-card border border-slate-800 animate-in fade-in duration-150">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-white">Queue is clear!</div>
            <div className="text-xs text-slate-400 mt-1">
              No tickets found matching the selected filter criteria.
            </div>
          </div>
        ) : (
          tickets.map((t) => {
            const isCritical = t.priority === "Critical";
            const isUnresolvedOld = (t.status === "Open" || t.status === "In Progress") && isCritical;

            return (
              <div
                key={t._id}
                onClick={() => openTicketTriage(t)}
                className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-brand-500/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-stretch justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  {/* Badge line */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-300 bg-brand-950 px-2 py-0.5 rounded border border-brand-800">
                      {t.ticket_number}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusStyle(t.status)}`}>
                      {t.status}
                    </span>
                    {t.priority && (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getPriorityStyle(t.priority)}`}>
                        {t.priority}
                      </span>
                    )}
                    {t.category && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-medium">
                        {t.category}
                      </span>
                    )}

                    {isUnresolvedOld && (
                      <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 shadow-sm shadow-rose-600/40">
                        <Flame className="w-3 h-3" /> Urgent Attention
                      </span>
                    )}

                    {t.is_category_overridden && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                        Category Overridden
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                      {t.subject}
                    </h3>
                  </div>

                  {/* Metadata footer */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-teal-400" />
                      {t.author_name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      {t.book_title}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(t.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right side: Top-Right Assigned Status + Action Button */}
                <div className="flex sm:flex-col items-end justify-between sm:self-stretch gap-3 shrink-0">
                  <div>
                    {t.assigned_to?.name ? (
                      <span className="text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Assigned: {t.assigned_to.name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Unassigned</span>
                      </span>
                    )}
                  </div>

                  <button className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white shadow-md flex items-center gap-1.5 transition-all">
                    <span>Triage & Draft</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
      />

      {/* Fallback Toast Notification */}
      {toast && !externalSetToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-950/40 border border-emerald-400/40 transition-all duration-300 pointer-events-auto"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide pr-2">
            {toast}
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer shrink-0 ml-auto"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
