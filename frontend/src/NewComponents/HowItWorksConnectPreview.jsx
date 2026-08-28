import { ArrowLeft, Ban, Flag, Laugh, Mic, Send, Star } from "lucide-react";
import Avatar from "react-avatar";

const BUBBLE = { backgroundColor: "#F5F5F5", color: "#555555" };

export default function HowItWorksConnectPreview() {
  return (
    <div className="flex flex-col h-[380px] w-full bg-white pointer-events-none overflow-hidden">
      <div className="flex justify-between items-center px-3 sm:px-4 border-b border-gray-100 h-14 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ArrowLeft size={18} className="text-gray-600 shrink-0" />
          <Avatar size="36" color="#F2F4FE" fgColor="#0D134C" name="Priya N." className="rounded-full shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="Livvic-SemiBold text-sm text-gray-900 truncate">Priya N.</span>
            <span className="Livvic text-[11px] text-gray-400">Family</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg border border-[#0D134C] text-[#0D134C] Livvic-SemiBold text-[11px]">
            View Profile
          </span>
          <Flag size={16} className="text-gray-500" />
          <Ban size={16} className="text-gray-500" />
          <Star size={16} fill="white" color="#AEC4FF" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3 sm:px-4 py-3 space-y-2">
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl px-3 py-2" style={BUBBLE}>
            <p className="Livvic text-[10px] mb-0.5" style={{ color: "#AFB8CF" }}>10:31 PM</p>
            <p className="Livvic text-[12px] leading-relaxed">Hi, excited we matched. I would love to know more about your kids.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl px-3 py-2" style={BUBBLE}>
            <p className="Livvic text-[10px] mb-0.5" style={{ color: "#AFB8CF" }}>10:34 PM</p>
            <p className="Livvic text-[12px] leading-relaxed">Nice to meet you Priya. Can we find a time that works for both families?</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-3 min-h-[56px] flex items-center gap-2 bg-white">
        <Laugh size={20} fill="#AEC4FF" color="white" />
        <span className="flex-1 text-[13px] text-gray-400 Livvic-Medium">Type a message...</span>
        <Send size={18} color="#AEC4FF" />
        <Mic size={18} color="#AEC4FF" />
      </div>
    </div>
  );
}
