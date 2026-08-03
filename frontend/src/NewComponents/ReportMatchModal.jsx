import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { fireToastMessage } from "../toastContainer";
import { reportUserThunk } from "../Components/Redux/reportSlice";

// The report dialog, opened from the chat header next to Block.
//
// Two fields, and both earn their place. The CATEGORY is what routes the case —
// the backend puts harassment and safety concerns at the top of the moderation
// queue unread, and a free-text-only form would mean a child safety report
// waiting behind a complaint about spam. The REASON is what makes it
// actionable: "inappropriate" tells a moderator nothing they can decide on,
// where "kept asking me to move to WhatsApp and send a deposit" is the whole
// case in one line.
//
// The reason is required rather than optional for that reason. It is the
// difference between a report a moderator can resolve and one they have to
// come back to the reporter about.

const REASONS = [
  {
    value: "harassment",
    label: "Harassment or abuse",
    hint: "Threats, insults, or unwanted contact after being asked to stop",
  },
  {
    value: "inappropriate_content",
    label: "Inappropriate or sexual content",
    hint: "Explicit messages, images, or sexual advances",
  },
  {
    value: "scam",
    label: "Scam or fraud",
    hint: "Asked for money, bank details, or sent a suspicious payment",
  },
  {
    value: "fake_profile",
    label: "Fake profile",
    hint: "Pretending to be someone else, or details that don't add up",
  },
  {
    value: "spam",
    label: "Spam",
    hint: "Advertising, repeated unsolicited messages, or bot-like behaviour",
  },
  {
    value: "safety_concern",
    label: "Safety concern",
    hint: "Anything that made you worry about a child's or someone's safety",
  },
  { value: "other", label: "Something else", hint: "Tell us what happened" },
];

// Long enough that "bad" or "creepy" won't submit, short enough that a real
// sentence clears it without the counter becoming an obstacle.
const MIN_DETAILS = 15;

const ReportMatchModal = ({
  reportedUserId,
  name,
  chatId,
  messageId,
  setIsReportModal,
  onReported,
}) => {
  const dispatch = useDispatch();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const trimmed = details.trim();
  const canSubmit = Boolean(reason) && trimmed.length >= MIN_DETAILS && !loading;

  const handleReport = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const result = await dispatch(
        reportUserThunk({ reportedUserId, reason, details: trimmed, chatId, messageId })
      ).unwrap();

      fireToastMessage({
        type: "success",
        message: result?.message || "Report submitted. Our team will review it.",
      });
      onReported?.();
      setIsReportModal(false);
    } catch (error) {
      fireToastMessage({
        type: "error",
        message: error?.message || "Could not submit the report",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] w-screen h-screen flex items-center justify-center backdrop-blur-md bg-black/35 p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl px-6 sm:px-7 py-8 flex flex-col max-w-md w-full max-h-[90vh] overflow-y-auto animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both]">

        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsReportModal(false)}
          className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center rounded-full mb-4 w-16 h-16 bg-amber-50 self-center">
          <Flag className="text-amber-500" size={28} />
        </div>

        <p className="text-[11px] uppercase tracking-widest text-gray-400 Livvic-SemiBold mb-2 text-center">
          Report profile
        </p>

        <h2 className="text-xl Livvic-Bold text-primary mb-2 leading-snug text-center">
          Report {name || "this profile"}
        </h2>

        <p className="text-gray-500 Livvic-Medium text-sm mb-5 leading-relaxed text-center">
          Our team reviews every report.{" "}
          <span className="Livvic-SemiBold text-gray-700">
            They will never be told who reported them.
          </span>
        </p>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm Livvic-SemiBold text-gray-700 mb-2">
            What's happening?
          </label>
          <div className="flex flex-col gap-2">
            {REASONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setReason(option.value)}
                className={`text-left px-4 py-2.5 rounded-2xl border-2 transition-colors ${
                  reason === option.value
                    ? "border-[#AEC4FF] bg-[#AEC4FF]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="block text-sm Livvic-SemiBold text-gray-800">
                  {option.label}
                </span>
                <span className="block text-xs Livvic text-gray-500 mt-0.5">
                  {option.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="mb-5">
          <label
            htmlFor="report-details"
            className="block text-sm Livvic-SemiBold text-gray-700 mb-2"
          >
            Tell us what happened
          </label>
          <textarea
            id="report-details"
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={2000}
            placeholder="What did they say or do? Include anything that would help our team understand."
            className="w-full rounded-2xl border-2 border-gray-200 focus:border-[#AEC4FF] focus:outline-none px-4 py-3 text-sm Livvic text-gray-800 resize-none transition-colors"
          />
          <p className="text-xs Livvic text-gray-400 mt-1.5">
            {trimmed.length < MIN_DETAILS
              ? `${MIN_DETAILS - trimmed.length} more characters needed`
              : `${trimmed.length}/2000`}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            type="button"
            onClick={handleReport}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-full py-3 text-sm Livvic-Bold text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Flag size={16} />
                Submit report
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsReportModal(false)}
            disabled={loading}
            className="w-full py-3 rounded-full border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50 text-sm Livvic-Bold text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* If someone is in danger, a moderation queue is the wrong tool and
            saying so costs one line. */}
        <p className="text-[11px] Livvic text-gray-400 mt-4 text-center leading-relaxed">
          If someone is in immediate danger, contact your local emergency
          services first.
        </p>
      </div>

      <style>{`
        @keyframes popIn { 0% { opacity:0; transform:scale(0.85) } 100% { opacity:1; transform:scale(1) } }
      `}</style>
    </div>
  );
};

export default ReportMatchModal;
