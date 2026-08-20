import React, { useState, useEffect, useRef } from 'react';
import { Check, Pencil } from 'lucide-react';

const ChatMessage = ({ message, onEdit }) => {
  const { sender, text, isTyping, id } = message;
  const isUser = sender === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== text) {
      onEdit(id, editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (isTyping) {
    return (
      <div className="flex justify-start mb-[12px] animate-[fadeIn_0.3s_ease-out]">
        <div className="bg-transparent py-[4px]">
          <div className="flex items-center gap-[6px]">
            <img src="/logo3.png" alt="logo" className="h-[18px] w-auto object-contain" />
            <span className="text-[#001243] text-[13px] font-[700]">Fam</span>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block rounded-full bg-[#22c55e] w-[6px] h-[6px]"
                style={{
                  animation: `typingBounce 1.2s infinite ease-in-out`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 group animate-[slideInRight_0.3s_ease-out]">
        <div className="flex items-center max-w-[80%]">
          {isEditing ? (
            <div className="flex items-center gap-2 bg-[#E6EEFF] rounded-full px-4 py-2 w-full shadow-sm border border-blue-200 animate-[expandIn_0.2s_ease-out]">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none !outline-none focus:ring-0 focus:border-none text-[#001243] font-semibold text-[15px] w-full min-w-[150px] shadow-none"
              />
              <button
                onClick={handleSave}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-[#001243] text-white hover:bg-[#152a6a] transition-colors shrink-0"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-[6px] bg-[rgba(174,196,255,0.35)] border border-[rgba(174,196,255,0.5)] backdrop-blur-[8px] rounded-full pl-[12px] pr-[6px] py-[6px] text-[14px] font-[600] text-[#001243] shadow-[0_2px_10px_rgba(174,196,255,0.2)] cursor-pointer hover:bg-[rgba(174,196,255,0.55)] transition-colors" 
              onClick={() => onEdit && setIsEditing(true)}
            >
              <span>{text}</span>
              {onEdit && (
                <div
                  className="flex items-center justify-center bg-[#001243]/[0.06] w-[22px] h-[22px] rounded-full shrink-0"
                  aria-label="Edit answer"
                >
                  <Pencil className="w-[10px] h-[10px] opacity-60" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message
  const isIntro = text === "I'll ask a few quick questions to personalize your matches.";
  const textColor = isIntro ? "text-[#4B5563]" : "text-[#0F1F52]";
  const mb = isIntro ? "mb-[20px]" : "mb-[12px]";

  return (
    <div className={`flex justify-start ${mb} animate-[slideInLeft_0.3s_ease-out]`}>
      <div className={`${textColor} text-[15px] font-[600] leading-[1.6]`}>
        {text}
      </div>
    </div>
  );
};

export default ChatMessage;

