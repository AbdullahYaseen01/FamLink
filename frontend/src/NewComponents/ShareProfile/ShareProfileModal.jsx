import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Copy, Loader2, MessageSquare, Share2 } from "lucide-react";
import { getMyShareLinkThunk } from "../../Components/Redux/shareProfileSlice";
import { getShareProfileCopy, shareMessageFor } from "../../Config/shareProfileCopy";
import SharedProfileCard from "./SharedProfileCard";
import { fireToastMessage } from "../../toastContainer";

// The share sheet behind the "Share Profile" button.
//
// Members are already posting in Facebook groups, parent WhatsApp threads and
// Nextdoor to find a share. This does the writing for them: one tap produces a
// link to a ready-made, privacy-safe page, with the message body pre-filled per
// share type.
//
// It also shows the member exactly what a stranger will see. That preview isn't
// decoration — people hesitate to post anything about their children, and the
// fastest way past that is to let them look at the page and see there's no name
// and no photo on it.

// Inlined rather than imported from lucide: neither mark ships with the icon
// set, and both are recognisable enough that a generic "share" glyph would cost
// a tap of hesitation.
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.79 8.44-4.93 8.44-9.94Z" />
  </svg>
);

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37.99 2.53c.12.17 1.71 2.61 4.15 3.66.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
  </svg>
);

// The share targets that actually get used, in the order people reach for them.
// Facebook is deliberately URL-only: its sharer has ignored a `quote` parameter
// for years, so the page's own Open Graph tags are what the post shows.
const buildTargets = (url, message) => {
  const encodedUrl = encodeURIComponent(url);
  const body = encodeURIComponent(`${message} ${url}`);
  return {
    // "sms:?&body=" is the one spelling both iOS and Android accept.
    sms: `sms:?&body=${body}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${body}`,
  };
};

export const ShareProfileModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { link, preview, isLinkLoading, linkError } = useSelector((s) => s.shareProfile);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(getMyShareLinkThunk());
  }, [dispatch]);

  // Reset the confirmation so a second copy still reads as an action.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = getShareProfileCopy(preview?.variant);
  const message = shareMessageFor(preview?.variant, preview?.location);
  const targets = link ? buildTargets(link, message) : null;

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard access is blocked on insecure origins and in some in-app
      // browsers. The link is on screen and selectable, so say that rather than
      // failing silently.
      fireToastMessage({
        type: "error",
        message: "Couldn't copy — select the link and copy it manually",
      });
    }
  };

  // The native sheet is the shortest path to a text message or any app the
  // person already has, which is how most of these links will actually travel.
  // Desktop browsers largely lack it, so it's an addition to the buttons below
  // rather than a replacement for them.
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: "A nanny share opportunity on FamLink",
        text: message,
        url: link,
      });
    } catch {
      /* the user dismissed the sheet — nothing to report */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center backdrop-blur-md bg-black/35 p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl shadow-2xl px-5 sm:px-7 py-8 w-full max-w-2xl my-auto animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="text-center mb-6 pr-8 sm:pr-0">
          <h2 className="text-xl sm:text-2xl Livvic-SemiBold text-primary mb-2 leading-snug">
            Share your nanny share
          </h2>
          <p className="text-secondary Livvic-Medium text-sm sm:text-[15px] leading-relaxed">
            Post this anywhere you&apos;d look for a share — a parents&apos;
            group, a neighborhood thread, a text to a friend. Your name and photo
            stay off the page.
          </p>
        </div>

        {isLinkLoading && !link ? (
          <div className="flex items-center justify-center gap-2 h-[120px] rounded-2xl bg-gray-50 border border-gray-200 text-gray-400">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm">Building your share page…</span>
          </div>
        ) : linkError ? (
          <div className="rounded-2xl bg-gray-50 border border-gray-200 px-5 py-6 text-center">
            <p className="Livvic-Medium text-sm text-gray-600">{linkError}</p>
          </div>
        ) : (
          <>
            {/* What a stranger will see. The CTA is inert here — this is a
                preview of the page, not the page. */}
            {preview && (
              <div className="rounded-2xl bg-[#F7F9FA] border border-[#ECECEC] px-3 sm:px-4 py-4 mb-5">
                <p className="text-[11px] Livvic-SemiBold uppercase tracking-wide text-secondary text-center mb-3">
                  Preview
                </p>
                <p className="Livvic-Bold text-base sm:text-lg text-[#0D134C] text-center leading-snug">
                  {copy.headline}
                </p>
                <p className="Livvic-Medium text-secondary text-xs sm:text-sm text-center mb-4">
                  {copy.subheadline}
                </p>
                <div className="pointer-events-none">
                  <SharedProfileCard profile={preview} ctaText={copy.cta} />
                </div>
              </div>
            )}

            {/* The link */}
            <div className="flex items-center gap-2 rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 mb-4">
              <span
                className="flex-1 text-left text-sm text-gray-600 truncate"
                title={link || ""}
              >
                {link || "Link unavailable"}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!link}
                className="shrink-0 flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs Livvic-SemiBold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {targets && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <a
                  href={targets.sms}
                  className="flex items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-sm Livvic-SemiBold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare size={16} />
                  Text
                </a>
                <a
                  href={targets.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-sm Livvic-SemiBold text-[#1877F2] hover:bg-gray-50 transition-colors"
                >
                  <FacebookIcon />
                  Facebook
                </a>
                <a
                  href={targets.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-sm Livvic-SemiBold text-[#25D366] hover:bg-gray-50 transition-colors"
                >
                  <WhatsAppIcon />
                  WhatsApp
                </a>
              </div>
            )}

            {canShare && link && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 bg-[#AEC4FF] text-[#0D134C] transition-colors rounded-full py-3 text-base Livvic-Bold hover:brightness-95"
              >
                <Share2 size={16} />
                More sharing options
              </button>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes popIn { 0% { opacity:0; transform:scale(0.85) } 100% { opacity:1; transform:scale(1) } }
      `}</style>
    </div>
  );
};

export default ShareProfileModal;
