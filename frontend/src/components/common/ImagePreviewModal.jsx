import React, { useEffect } from "react";
import { X, Download, Image as ImageIcon, FileText } from "lucide-react";

export function ImagePreviewModal({ isOpen, onClose, attachment }) {
  // Handle Escape key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !attachment) return null;

  const isImage =
    attachment.file_type?.startsWith("image/") ||
    (attachment.url && attachment.url.startsWith("data:image/")) ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachment.name || "");

  const handleDownload = () => {
    if (!attachment.url) return;
    const a = document.createElement("a");
    a.href = attachment.url;
    a.download = attachment.name || "attachment";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-transparent"
      onClick={onClose}
    >
      <div
        className="image-preview-card relative max-w-4xl w-full max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="image-preview-header flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
              {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="image-preview-title text-sm font-bold text-slate-900 dark:text-white truncate">
                {attachment.name || "Attachment Preview"}
              </h3>
              <p className="image-preview-sub text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                {attachment.size ? `${Math.round(attachment.size / 1024)} KB` : "Uploaded File"}
                {attachment.file_type ? ` • ${attachment.file_type}` : ""}
              </p>
            </div>
          </div>

          {/* Action buttons (Download & Close only, Open in New Tab removed) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {attachment.url && (
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Download File"
                aria-label="Download File"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="image-preview-body p-4 sm:p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-100/70 dark:bg-slate-950/40 min-h-[300px]">
          {isImage && attachment.url ? (
            <div className="flex flex-col items-center">
              <img
                src={attachment.url}
                alt={attachment.name || "Uploaded Attachment"}
                className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-lg border border-slate-300 dark:border-slate-800 select-none"
              />
            </div>
          ) : isImage && !attachment.url ? (
            <div className="text-center p-8 space-y-3">
              <ImageIcon className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">Image Preview Not Available</p>
              <p className="text-xs text-slate-600 dark:text-slate-500 max-w-sm">
                This image was recorded prior to live preview synchronization. Newly uploaded images will render directly here.
              </p>
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <FileText className="w-16 h-16 text-brand-600 dark:text-brand-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{attachment.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Document attachment ({attachment.size ? Math.round(attachment.size / 1024) + " KB" : "Unknown size"})
              </p>
              {attachment.url && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
