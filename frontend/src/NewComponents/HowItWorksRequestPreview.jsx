import { Send, MessageCircle } from "lucide-react";
import HowItWorksBrowsePreview from "./HowItWorksBrowsePreview";

export default function HowItWorksRequestPreview({ audience = "family" }) {
  return (
    <div className="relative overflow-hidden h-[380px] pointer-events-none">
      <div className="blur-[2px] opacity-70">
        <HowItWorksBrowsePreview audience={audience} />
      </div>
      <div className="absolute inset-0 bg-black/35 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl px-6 py-7 flex flex-col items-center text-center max-w-[280px] w-full">
          <span className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-[12px] text-gray-500">
            ×
          </span>
          <div className="flex items-center justify-center rounded-full mb-3 w-12 h-12 bg-blue-50">
            <MessageCircle className="text-blue-400" size={22} />
          </div>
          <h2 className="text-lg Livvic-Bold text-[#0D134C] mb-2 leading-snug">Send a Match Request</h2>
          <p className="text-gray-500 Livvic-Medium text-[12px] mb-4 leading-relaxed">
            Send a match request and start a conversation.{" "}
            <span className="Livvic-SemiBold text-gray-700">A quick connection can lead to the right match.</span>
          </p>
          <span className="w-full flex items-center justify-center gap-2 bg-[#AEC4FF] rounded-full py-2.5 text-sm Livvic-Bold text-[#0D134C]">
            <Send size={14} />
            Send Request
          </span>
        </div>
      </div>
    </div>
  );
}
