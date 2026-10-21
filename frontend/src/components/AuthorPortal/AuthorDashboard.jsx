import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { getSocket } from "../../services/socket";
import { TicketConversationModal } from "../TicketConversationModal";
import { CustomSelect } from "../common/CustomSelect";
import { formatDate } from "../../utils/dateUtils";
import { 
  Book, 
  Coins, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  MessageSquare, 
  Paperclip, 
  Upload, 
  Sparkles, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight
} from "lucide-react";

export function AuthorDashboard({ activeTab, setActiveTab, currentUser }) {
  const [books, setBooks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketFilter, setTicketFilter] = useState("All");

  // Query Form State
  const [selectedBookId, setSelectedBookId] = useState("General / Account Level");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [readCounts, setReadCounts] = useState(() => {
    try {
      const saved = localStorage.getItem(`bookleaf_read_tickets_${currentUser?.author_id || currentUser?._id}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const selectedTicketIdRef = useRef(selectedTicketId);
  useEffect(() => {
    selectedTicketIdRef.current = selectedTicketId;
  }, [selectedTicketId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`bookleaf_read_tickets_${currentUser?.author_id || currentUser?._id}`);
      setReadCounts(saved ? JSON.parse(saved) : {});
    } catch (e) {
      setReadCounts({});
    }
  }, [currentUser]);

  const handleOpenTicket = (ticketId) => {
    const ticket = tickets.find((t) => t._id === ticketId);
    const count = ticket?.messages?.length || 0;
    setReadCounts((prev) => {
      const updated = { ...prev, [ticketId]: count };
      try {
        localStorage.setItem(
          `bookleaf_read_tickets_${currentUser?.author_id || currentUser?._id}`,
          JSON.stringify(updated)
        );
      } catch (e) {}
      return updated;
    });
    setSelectedTicketId(ticketId);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookData, ticketData] = await Promise.all([
        api.getMyBooks(),
        api.getTickets()
      ]);
      setBooks(bookData.books || []);
      setSummary(bookData.summary);
      setTickets(ticketData.tickets || []);
    } catch (err) {
      console.error("Failed to load author dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();

    // Listen for live ticket events
    const handleTicketCreated = (payload) => {
      if (payload.ticket && payload.ticket.author_id === currentUser.author_id) {
        setTickets((prev) => [payload.ticket, ...prev.filter((t) => t._id !== payload.ticket._id)]);
      }
    };

    const handleTicketUpdated = (payload) => {
      if (payload.ticket && payload.ticket.author_id === currentUser.author_id) {
        setTickets((prev) =>
          prev.map((t) => (t._id === payload.ticket._id ? payload.ticket : t))
        );
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

      // If author has this ticket open right now, mark it read immediately
      if (selectedTicketIdRef.current === payload.ticketId) {
        setReadCounts((prev) => {
          const currentCount = (prev[payload.ticketId] || 0) + 1;
          const updated = { ...prev, [payload.ticketId]: currentCount };
          try {
            localStorage.setItem(
              `bookleaf_read_tickets_${currentUser?.author_id || currentUser?._id}`,
              JSON.stringify(updated)
            );
          } catch (e) {}
          return updated;
        });
      }
    };

    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);
    socket.on("ticket:messageAdded", handleMessageAdded);

    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
      socket.off("ticket:messageAdded", handleMessageAdded);
    };
  }, [currentUser]);

  useEffect(() => {
    if (activeTab !== "tickets") {
      setSelectedTicketId(null);
    }
  }, [activeTab]);

  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || submitting) return;

    setSubmitting(true);
    setSubmitSuccess("");
    try {
      const data = await api.createTicket({
        book_id: selectedBookId,
        subject: subject.trim(),
        description: description.trim(),
        attachments
      });

      setSubmitSuccess(`Ticket #${data.ticket.ticket_number} created! Classified under "${data.ticket.category}".`);
      setSubject("");
      setDescription("");
      setAttachments([]);
      setSelectedBookId("General / Account Level");

      // Reload tickets and switch to tickets tab
      setTimeout(() => {
        setActiveTab("tickets");
        handleOpenTicket(data.ticket._id);
      }, 1200);
    } catch (err) {
      alert("Error submitting query: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulatedFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const simulated = files.map((f) => ({
      name: f.name,
      size: f.size,
      file_type: f.type || "application/octet-stream"
    }));
    setAttachments((prev) => [...prev, ...simulated]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === "All") return true;
    return t.status === ticketFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Main Tab Views */}
      {activeTab === "books" && (
        <div className="space-y-8">
          {/* Author Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-40 bg-brand-500/10 blur-[80px] pointer-events-none" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Joined {formatDate(currentUser.joined_date) || ""}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Welcome back, {currentUser.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Track your book sales, quarterly royalty payouts, and communicate directly with the BookLeaf publishing and production teams.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("new-ticket")}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Raise Support Query
              </button>
            </div>
          </div>

          {/* Aggregate Royalty & Production Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl glass-card border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Total Books</span>
                  <Book className="w-4 h-4 text-brand-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {summary.totalBooks}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">{summary.publishedBooks} Live</span>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">{summary.inProductionBooks} In Production</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl glass-card border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Total Copies Sold</span>
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {summary.totalCopiesSold.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Across Amazon, Flipkart & Store
                </div>
              </div>

              <div className="p-5 rounded-2xl glass-card border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Total Royalty Earned</span>
                  <Coins className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-2">
                  ₹{summary.totalRoyaltyEarned.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Paid: ₹{summary.royaltyPaid.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-5 rounded-2xl glass-card border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Royalty Pending</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 mt-2">
                  ₹{summary.royaltyPending.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {summary.royaltyPending >= 1000 ? (
                    <span className="text-emerald-400 font-medium">Meets ₹1k payout threshold</span>
                  ) : summary.royaltyPending > 0 ? (
                    <span className="text-amber-400/90">Rolls over (min ₹1,000 threshold)</span>
                  ) : (
                    <span className="text-slate-400">All payouts cleared</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">My Published & In-Production Books</h2>
              <p className="text-xs text-slate-400">Detailed overview of catalog records, pricing, and royalty metrics.</p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Showing {books.length} {books.length === 1 ? "book" : "books"}
            </span>
          </div>

          {books.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-card border border-slate-800">
              <Book className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <div className="text-sm font-semibold text-white">No books linked yet</div>
              <div className="text-xs text-slate-400 mt-1">Contact your BookLeaf publishing manager.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {books.map((b) => {
                const isLive = b.status === "Published & Live";
                return (
                  <div
                    key={b.book_id}
                    className="p-6 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top status & ID */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-brand-300 border border-slate-700">
                          {b.book_id}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                            isLive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1">
                        {b.title}
                      </h3>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>{b.genre}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">ISBN: {b.isbn || "Pending Assignment"}</span>
                      </div>

                      {/* Financial & Distribution Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                        <div>
                          <div className="text-slate-400 text-[11px]">MRP</div>
                          <div className="font-bold text-white mt-0.5">
                            {b.mrp ? `₹${b.mrp}` : "N/A (In Prod)"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Author Royalty</div>
                          <div className="font-bold text-teal-400 mt-0.5">
                            {b.author_royalty_per_copy ? `₹${b.author_royalty_per_copy}/copy` : "Calculated at launch"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Copies Sold</div>
                          <div className="font-bold text-white mt-0.5">
                            {b.total_copies_sold ? b.total_copies_sold.toLocaleString("en-IN") : "0"}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="text-slate-400 text-[11px]">Total Earned</div>
                          <div className="font-bold text-emerald-400 mt-0.5">
                            ₹{(b.total_royalty_earned || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="text-slate-400 text-[11px]">Royalty Paid</div>
                          <div className="font-bold text-white mt-0.5">
                            ₹{(b.royalty_paid || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="text-slate-400 text-[11px]">Pending Payout</div>
                          <div className="font-bold text-amber-400 mt-0.5">
                            ₹{(b.royalty_pending || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      {/* Distribution Channels & Partner */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Printer className="w-3.5 h-3.5 text-slate-400" />
                          Partner: <strong className="text-slate-200">{b.print_partner || "Delhi Hub"}</strong>
                        </span>
                        {b.publication_date && (
                          <span className="text-slate-400 flex items-center gap-1 ml-auto">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Live since: {formatDate(b.publication_date)}
                          </span>
                        )}
                      </div>

                      {b.available_on && b.available_on.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {b.available_on.map((channel) => (
                            <span
                              key={channel}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-800"
                            >
                              {channel}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Shortcut */}
                    <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {b.last_royalty_payout_date 
                          ? `Last payout disbursed: ${formatDate(b.last_royalty_payout_date)}` 
                          : "No previous payout recorded"}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedBookId(b.book_id);
                          setSubject(`Query regarding "${b.title}"`);
                          setActiveTab("new-ticket");
                        }}
                        className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                      >
                        Ask Support <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}

      {/* Submit Support Query Tab */}
      {activeTab === "new-ticket" && (
        <div className="max-w-3xl mx-auto glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Submit a Support Query</h2>
              <p className="text-xs text-slate-400">
                Our AI-assisted system will automatically classify and triage your query with the right operations desk.
              </p>
            </div>
          </div>

          {submitSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmitQuery} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300  tracking-wider mb-2">
                Which book is this query regarding?
              </label>
              <CustomSelect
                value={selectedBookId}
                onChange={setSelectedBookId}
                options={[
                  { value: "General / Account Level", label: "General / Account Level (Not book specific)" },
                  ...books.map((b) => ({
                    value: b.book_id,
                    label: `${b.title} (${b.book_id} - ${b.status})`
                  }))
                ]}
                fullWidth={true}
                className="w-full"
                buttonClassName="w-full py-2.5 px-4 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300  tracking-wider mb-2">
                Subject Line
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Overdue quarterly royalty payout / ISBN discrepancy on Amazon / Blurry print pages"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300  tracking-wider mb-2">
                Detailed Description & Context
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue with as much detail as possible (order numbers, dates, copies affected, or questions)..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* File Attachment Support (UI Only per specification) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300  tracking-wider mb-2">
                Attachments (Optional - Proof photos, statements, invoices)
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/50 rounded-xl p-5 text-center transition-colors bg-slate-900/40">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <label className="cursor-pointer text-xs font-medium text-brand-400 hover:text-brand-300">
                  <span>Click to select files</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleSimulatedFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, PDF up to 10MB (UI simulation)</p>
              </div>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-brand-400" />
                        <span className="font-medium">{att.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Math.round(att.size / 1024)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-slate-500 hover:text-rose-400 text-xs px-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting & AI Classifying...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Support Ticket</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* My Tickets Tab */}
      {activeTab === "tickets" && (
        selectedTicketId ? (
          <TicketConversationModal
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
            currentUser={currentUser}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">My Support Tickets</h2>
                <p className="text-xs text-slate-400">
                  Live view of all queries submitted by you. Responses from BookLeaf ops sync automatically without refreshing.
                </p>
              </div>

              {/* Filter buttons */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                {["All", "Open", "In Progress", "Resolved", "Closed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketFilter(st)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      ticketFilter === st
                        ? "bg-brand-600 text-white font-medium shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center rounded-2xl glass-card border border-slate-800">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <div className="text-sm font-semibold text-white">No tickets found</div>
                <div className="text-xs text-slate-400 mt-1">
                  {ticketFilter !== "All"
                    ? `No tickets currently with status "${ticketFilter}".`
                    : "You haven't submitted any queries yet."}
                </div>
                <button
                  onClick={() => setActiveTab("new-ticket")}
                  className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl"
                >
                  Submit your first query
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((t) => {
                  const statusStyles = {
                    Open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    "In Progress": "bg-amber-500/10 text-amber-300 border-amber-500/20",
                    Resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    Closed: "bg-slate-800 text-slate-400 border-slate-700"
                  };

                return (
                  <div
                    key={t._id}
                    onClick={() => handleOpenTicket(t._id)}
                    className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-brand-500/50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-300 bg-brand-950 px-2 py-0.5 rounded border border-brand-800">
                          {t.ticket_number}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusStyles[t.status] || statusStyles.Open}`}>
                          {t.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {t.category}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                        {t.subject}
                      </h4>

                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>Book: {t.book_title}</span>
                        <span>•</span>
                        <span>Created: {formatDate(t.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2.5 shrink-0">
                      {(() => {
                        const lastRead = readCounts[t._id];
                        const newCount = lastRead !== undefined
                          ? (t.messages || []).slice(lastRead).filter((m) => m.sender_role === "admin").length
                          : (t.messages || []).filter((m) => m.sender_role === "admin").length;

                        if (newCount <= 0) return null;

                        return (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {newCount === 1 ? "1 new message came" : `${newCount} new messages came`}
                          </span>
                        );
                      })()}

                      <button className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700 group-hover:border-brand-500 text-slate-200 flex items-center gap-1.5">
                        <span>View Conversation</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
