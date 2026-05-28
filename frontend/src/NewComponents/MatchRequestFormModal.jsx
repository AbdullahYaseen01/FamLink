import { Send, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fireToastMessage } from "../toastContainer";
import { sentMatchRequestThunk } from "../Components/Redux/matchSlice";
import { increaseMatchRequestSent } from "../Components/Redux/authSlice";

export const MatchRequestFormModal = ({ setIsRequestSubmitModal, senderId, receiverId }) => {
    const { isMatchLoading, message } = useSelector((state) => state.matchRequest);
    const dispatch = useDispatch();
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleRequest = async () => {
        setLoading(true);
        try {
            await dispatch(sentMatchRequestThunk({ senderId, receiverId, message: text }));
            await dispatch(increaseMatchRequestSent());
            setSuccess(true);
        } catch (error) {
            fireToastMessage({ type: "error", message: "Error while trying to send request" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/35">
            <div className="relative bg-white rounded-3xl shadow-2xl px-7 py-8 flex flex-col items-center text-center max-w-sm w-full mx-4 animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both]">

                {/* Close button */}
                <button
                    type="button"
                    onClick={() => setIsRequestSubmitModal(false)}
                    className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label="Close"
                >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2L12 12M12 2L2 12" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                {success ? (
                    /* ── Success state ── */
                    <div className="flex flex-col items-center text-center py-4 animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both]">
                        <div className="flex items-center justify-center rounded-full w-16 h-16 bg-green-50 mb-4">
                            <CheckCircle2 className="text-green-400" size={30} />
                        </div>

                        <p className="text-[11px] uppercase tracking-widest text-gray-400 Livvic-SemiBold mb-2">
                            Request sent
                        </p>

                        <h2 className="text-xl Livvic-Bold text-primary mb-2 leading-snug">
                            Message sent! 🎉
                        </h2>

                        <p className="text-gray-500 Livvic-Medium text-sm mb-6 leading-relaxed">
                            Your intro is on its way.{" "}
                            <span className="Livvic-SemiBold text-gray-700">We'll notify you</span>{" "}
                            as soon as they respond.
                        </p>

                        <button
                            type="button"
                            onClick={() => setIsRequestSubmitModal(false)}
                            className="w-full flex items-center justify-center gap-2 bg-[#38AEE3] hover:bg-[#2e9fd4] transition-colors rounded-full py-3 text-sm Livvic-Bold text-white"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    /* ── Form state ── */
                    <>
                        {/* Icon */}
                        <div className="flex items-center justify-center rounded-full mb-4 w-16 h-16 bg-blue-50 animate-[scaleIn_0.4s_0.1s_cubic-bezier(0.34,1.56,0.64,1)_both]">
                            <MessageCircle className="text-blue-400" size={26} />
                        </div>

                        {/* Eyebrow */}
                        <p className="text-[11px] uppercase tracking-widest text-gray-400 Livvic-SemiBold mb-2">
                            Intro message
                        </p>

                        {/* Heading */}
                        <h2 className="text-xl Livvic-Bold text-primary mb-2 leading-snug">
                            Send an intro message
                        </h2>

                        {/* Body */}
                        <p className="text-gray-500 Livvic-Medium text-sm mb-5 leading-relaxed">
                            Break the ice with a warm, personal message.{" "}
                            <span className="Livvic-SemiBold text-gray-700">Families and caregivers respond faster</span>{" "}
                            when your first message feels genuine and friendly.
                        </p>

                        {/* Input */}
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={4}
                            maxLength={300}
                            placeholder="Hi! I came across your profile and think we'd be a great match. I'd love to connect…"
                            className="w-full rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none py-3 px-4 text-sm text-gray-700 resize-none shadow-sm transition-colors placeholder:!text-gray-400"
                        />

                        {/* Char count + hint */}
                        <div className="w-full flex items-center justify-between mt-1 mb-4">
                            <p className="text-xs text-gray-400">Be yourself — keep it warm &amp; brief</p>
                            <p className={`text-xs ${text.length >= 300 ? "text-red-400" : "text-gray-400"}`}>
                                {text.length} / 300
                            </p>
                        </div>

                        {/* Send button */}
                        <button
                            type="button"
                            onClick={handleRequest}
                            disabled={loading || text.trim().length === 0}
                            className="w-full flex items-center justify-center gap-2 bg-[#38AEE3] hover:bg-[#2e9fd4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-full py-3 text-sm Livvic-Bold text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending…
                                </>
                            ) : (
                                <>
                                    <Send size={15} />
                                    Send message
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>

            <style>{`
                @keyframes popIn { 0% { opacity:0; transform:scale(0.85) } 100% { opacity:1; transform:scale(1) } }
                @keyframes scaleIn { 0% { transform:scale(0) } 100% { transform:scale(1) } }
            `}</style>
        </div>
    );
};