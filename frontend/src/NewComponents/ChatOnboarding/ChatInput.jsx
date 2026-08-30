import React, { useState } from 'react';
import { Send, Plus, X } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';
import { Input, Select, Spin } from 'antd';
import { fireToastMessage } from '../../toastContainer';
import { zipFromPlace } from '../../Config/serviceArea';

const ChatInput = ({ activeQuestion, onSend, currentQuestionIndex, totalQuestions, hideFreeText = false, hideChips = false }) => {
  const [text, setText] = useState('');

  // Child Ages State
  const defaultChild = () => ({ id: Date.now() + Math.random(), age: '', unit: 'years' });
  const [children, setChildren] = useState([defaultChild()]);

  // Location State
  const [locationLoading, setLocationLoading] = useState(false);
  const [autocompleteValue, setAutocompleteValue] = useState('');

  // Multi-select State
  const [selectedMultiOptions, setSelectedMultiOptions] = useState([]);

  React.useEffect(() => {
    setSelectedMultiOptions([]);
  }, [activeQuestion?.id]);

  if (!activeQuestion) return null;

  const { type, options, id, instruction, placeholder } = activeQuestion;

  const current = (currentQuestionIndex || 0) + 1;
  const total = totalQuestions || 7;
  const counterText = `Question ${current} of ${total}`;
  const baseInstruction = instruction || placeholder || "Type your answer";

  const handleSendText = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleSendMulti = () => {
    if (selectedMultiOptions.length === 0) {
      fireToastMessage({ type: 'error', message: 'Please select at least one option.' });
      return;
    }
    onSend(selectedMultiOptions.join(', '));
  };

  const handleSendChildren = () => {
    // Validate
    const invalid = children.some((c) => !c.age);
    if (invalid) {
      fireToastMessage({ type: 'error', message: 'Please enter an age for each child.' });
      return;
    }
    const formatted = children.map(c => `${c.age} ${c.unit}`).join(' and ');
    onSend(formatted);
    // Keep state in case they edit, or reset it
    setChildren([defaultChild()]);
  };

  const updateChild = (id, field, value) => {
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };
  const addChild = () => setChildren((prev) => [...prev, defaultChild()]);
  const removeChild = (id) => { if (children.length > 1) setChildren((prev) => prev.filter((c) => c.id !== id)); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 bg-transparent animate-[fadeIn_0.3s_ease-out]">
      {/* Dynamic Upper Area for Options or Custom Forms */}
      {type === 'options' && options && options.length > 0 && !hideChips && (
        <div className="flex flex-col gap-3 mb-2 px-1">
          <div className="flex flex-wrap gap-3">
            {options.map((opt) => {
              const isSelected = selectedMultiOptions.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (activeQuestion.allowMultiple) {
                      setSelectedMultiOptions(prev =>
                        prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
                      );
                    } else {
                      onSend(opt);
                    }
                  }}
                  className={`border font-medium py-2 px-6 rounded-full transition-colors text-[15px] shadow-sm flex items-center justify-center gap-2 ${activeQuestion.allowMultiple && isSelected
                    ? 'bg-[#001243] text-white border-[#001243]'
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-[#001243]'
                    }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {activeQuestion.allowMultiple && (
            <div className="flex justify-start mt-1">
              <button
                onClick={handleSendMulti}
                className="bg-[#AEC4FF] hover:bg-[#9BB4F5] text-[#001243] font-bold py-2 px-8 rounded-full transition-colors text-[15px] shadow-sm"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}

      {type === 'children' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 w-full mb-2">
          <div className="flex flex-col gap-3">
            {children.map((child, index) => (
              <div key={child.id} className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="font-semibold text-sm text-[#001243] w-16 sm:w-16 shrink-0">
                  Child {index + 1}
                </span>
                <Input
                  type="number"
                  min={0}
                  placeholder="Age"
                  value={child.age}
                  onChange={(e) => updateChild(child.id, "age", e.target.value)}
                  className="!w-20 rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#AEC4FF] focus:outline-none"
                />
                <Select
                  value={child.unit}
                  onChange={(val) => updateChild(child.id, "unit", val)}
                  className="w-28 h-[34px]"
                >
                  <Select.Option value="months">Months Old</Select.Option>
                  <Select.Option value="years">Years Old</Select.Option>
                </Select>
                {children.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChild(child.id)}
                    className="flex items-center justify-center w-7 h-7 rounded-full text-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-5">
            <button
              type="button"
              onClick={addChild}
              className="flex items-center gap-2 text-[#001243] font-semibold text-sm hover:opacity-70 transition-opacity"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E6EEFF] transition-colors">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
              </span>
              Add another child
            </button>
            <button
              onClick={handleSendChildren}
              className="px-6 py-2 bg-[#001243] hover:bg-[#152a6a] text-white rounded-full transition-colors font-semibold shadow-md"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {type === "options" || type === "children" ? (
        <div className="relative flex items-center w-full bg-white rounded-[16px] border border-gray-200 shadow-md pl-5 pr-2 py-2 pointer-events-none select-none">
          <span className="text-gray-400 text-[13px] whitespace-nowrap">
            {counterText}: Select an answer above
          </span>
          <span className="flex-1" />
          <span className="w-11 h-11 flex items-center justify-center bg-transparent text-[#D1D5DB] rounded-[12px] ml-2 shrink-0">
            <Send className="w-5 h-5 ml-0.5" />
          </span>
        </div>
      ) : type === 'location' ? (
        <div className="relative flex items-center w-full bg-white rounded-[16px] border border-gray-200 shadow-md pl-5 pr-2 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Spin spinning={locationLoading} size="small" className="mr-2" />
          <span className="text-gray-400 text-[13px] whitespace-nowrap mr-1 select-none pointer-events-none">
            {locationLoading ? "Locating..." : `${counterText} ·`}
          </span>
          <Autocomplete
            apiKey={import.meta.env.VITE_GOOGLE_KEY}
            className="flex-1 bg-transparent border-none outline-none py-2 text-gray-800 placeholder-[#9CA3AF] placeholder:text-[14px] text-[15px]"
            value={autocompleteValue}
            onChange={(e) => setAutocompleteValue(e.target.value)}
            onPlaceSelected={async (place) => {
              if (!place || !place.geometry) return;
              try {
                setLocationLoading(true);
                
                const { processGooglePlaceSelection } = await import('../../Services/locationServices');
                const locationObj = await processGooglePlaceSelection(place);
                
                // Add legacy compatibility fields
                locationObj.type = "Point";
                locationObj.neighborhood = locationObj.neighborhoodDisplayName;
                locationObj.zip = locationObj.zipCode;

                const displayValue = locationObj.neighborhoodDisplayName && locationObj.neighborhoodDisplayName !== locationObj.city 
                    ? `${locationObj.neighborhoodDisplayName}, ${locationObj.city}` 
                    : locationObj.city;

                setAutocompleteValue('');
                setLocationLoading(false);

                onSend(displayValue, locationObj);
              } catch (error) {
                setLocationLoading(false);
                fireToastMessage({ type: "error", message: "We couldn't verify that location. Please ensure you select a full valid address." });
              }
            }}
            options={{ types: ["geocode"], componentRestrictions: { country: "us" } }}
            placeholder={baseInstruction}
          />
        </div>
      ) : (
        <div className="relative flex items-center w-full bg-white rounded-[16px] border border-gray-200 shadow-md pl-5 pr-2 py-2 focus-within:border-[#AEC4FF] focus-within:ring-2 focus-within:ring-[#e1e9ff] transition-all">
          <span className="text-gray-400 text-[13px] whitespace-nowrap mr-1 select-none pointer-events-none">
            {counterText} ·
          </span>
          <input
            type={type === 'email' ? 'email' : 'text'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={baseInstruction.replace(/\?$/, '')}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none py-2 text-[#001243] placeholder-[#9CA3AF] placeholder:font-normal placeholder:text-[14px] text-[15px] font-medium"
          />
          <button
            onClick={handleSendText}
            disabled={!text.trim() && type !== 'children'}
            className="w-11 h-11 flex items-center justify-center bg-[#001243] hover:bg-[#152a6a] text-white rounded-[12px] transition-colors ml-2 shrink-0 shadow-sm"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;

