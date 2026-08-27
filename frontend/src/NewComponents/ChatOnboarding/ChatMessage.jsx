import React, { useState, useEffect, useRef } from 'react';
import { Check, Pencil } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';
import { Spin } from 'antd';
import { fireToastMessage } from '../../toastContainer';
import { zipFromPlace } from '../../Config/serviceArea';

const ChatMessage = ({ message, onEdit, question }) => {
  const { sender, text, isTyping, id } = message;
  const isUser = sender === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const [locationLoading, setLocationLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== text) {
      if (question?.type === 'children') {
        const val = editValue.toLowerCase();
        if (!val.includes('month') && !val.includes('mo') && !val.includes('year') && !val.includes('yr')) {
          fireToastMessage({ type: 'error', message: 'Please include "months" or "years" (e.g., "3 months" or "2 years")' });
          return;
        }
      }
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
            question?.type === 'options' ? (
              <div className="flex flex-wrap gap-2 justify-end animate-[expandIn_0.2s_ease-out] w-full mt-1">
                {question.options.map((opt) => {
                  // For multi-select, just allowing single selection on edit is safest, 
                  // or they can just pick one to replace. 
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        setEditValue(opt);
                        onEdit(id, opt);
                        setIsEditing(false);
                      }}
                      className="px-3 py-1.5 rounded-full text-[13px] font-medium border border-blue-200 bg-white hover:bg-blue-50 text-[#001243] transition-colors shadow-sm"
                    >
                      {opt}
                    </button>
                  );
                })}
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-full text-[13px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : question?.type === 'location' ? (
              <div className="flex items-center gap-2 bg-[#E6EEFF] rounded-[16px] px-4 py-2 w-full shadow-sm border border-blue-200 animate-[expandIn_0.2s_ease-out]">
                <Spin spinning={locationLoading} size="small" className="mr-2" />
                <Autocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_KEY}
                  className="bg-transparent border-none outline-none py-1 text-[#001243] placeholder-[#9CA3AF] text-[15px] w-full min-w-[200px]"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onPlaceSelected={async (place) => {
                    if (!place || !place.geometry) return;
                    try {
                      setLocationLoading(true);
                      const address = place.formatted_address;
                      const components = place?.address_components || [];
                      const get = (type) => components.find((c) => c.types.includes(type))?.long_name || "";
                      const extractedCity = get("locality") || get("administrative_area_level_2");
                      const extractedNeighborhood = get("neighborhood") || get("sublocality_level_1") || get("sublocality") || extractedCity || "";
                      const lat = place?.geometry?.location?.lat();
                      const lng = place?.geometry?.location?.lng();
                      const extractedZip = await zipFromPlace(place);

                      const locationObj = { type: "Point", coordinates: [lng, lat], format_location: address, city: extractedCity, neighborhood: extractedNeighborhood, zip: extractedZip };
                      const displayValue = extractedNeighborhood !== extractedCity ? `${extractedCity}, ${extractedNeighborhood}` : extractedCity;

                      setLocationLoading(false);
                      setEditValue(displayValue);
                      onEdit(id, displayValue, locationObj);
                      setIsEditing(false);
                    } catch (error) {
                      setLocationLoading(false);
                      fireToastMessage({ type: "error", message: "We couldn't verify that location. Please try typing it." });
                    }
                  }}
                  options={{ types: ["geocode"], componentRestrictions: { country: "us" } }}
                  placeholder="Enter full address"
                />
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-full text-[13px] font-medium text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
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
            )
          ) : (
            <div 
              className="flex items-center gap-[6px] bg-[#EEF3FF] border border-[#C8D8FF] rounded-full pl-[12px] pr-[6px] py-[6px] text-[14px] font-medium text-[#001243] shadow-sm cursor-pointer hover:bg-[#E6EDFF] transition-colors" 
              onClick={() => onEdit && setIsEditing(true)}
            >
              <span>{text}</span>
              {onEdit && (
                <div
                  className="flex items-center justify-center bg-[#DDE5FF] w-[22px] h-[22px] rounded-full shrink-0"
                  aria-label="Edit answer"
                >
                  <Pencil className="w-[10px] h-[10px] text-[#001243] opacity-60" />
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
  const mb = isIntro ? "mb-[20px]" : "mb-[12px]";

  return (
    <div className={`flex justify-start ${mb} animate-[slideInLeft_0.3s_ease-out]`}>
      <div className="text-[#001243] text-[16px] font-medium leading-[1.5] Livvic-Medium">
        {text}
      </div>
    </div>
  );
};

export default ChatMessage;

