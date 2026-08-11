// import React, { useState, useEffect, useRef } from 'react';
// import { Check, Pencil } from 'lucide-react';
// 
// const ChatMessage = ({ message, onEdit }) => {
//   const { sender, text, isTyping, id } = message;
//   const isUser = sender === 'user';
//   const [isEditing, setIsEditing] = useState(false);
//   const [editValue, setEditValue] = useState(text);
//   const inputRef = useRef(null);
// 
//   useEffect(() => {
//     if (isEditing && inputRef.current) {
//       inputRef.current.focus();
//     }
//   }, [isEditing]);
// 
//   const handleSave = () => {
//     if (editValue.trim() && editValue !== text) {
//       onEdit(id, editValue);
//     }
//     setIsEditing(false);
//   };
// 
//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       handleSave();
//     }
//   };
// 
//   if (isTyping) {
//     return (
//       <div className="flex justify-start mb-4 animate-[fadeIn_0.3s_ease-out]">
//         <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-5 py-4">
//           <div className="flex gap-1.5 items-center h-4">
//             {[0, 1, 2].map((i) => (
//               <span
//                 key={i}
//                 className="block rounded-full bg-gray-400 w-2 h-2 animate-bounce"
//                 style={{ animationDelay: `${i * 0.15}s` }}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   }
// 
//   if (isUser) {
//     return (
//       <div className="flex justify-end mb-4 group animate-[slideInRight_0.3s_ease-out]">
//         <div className="flex items-center gap-2 max-w-[80%]">
//           {/* Edit Handle */}
//           {!isEditing && onEdit && (
//             <button
//               onClick={() => setIsEditing(true)}
//               className="w-6 h-6 flex items-center justify-center rounded-full bg-[#E6EEFF] text-[#001243] hover:bg-[#c7d9ff] transition-colors"
//               aria-label="Edit answer"
//             >
//               <Pencil className="w-3 h-3" />
//             </button>
//           )}
// 
//           {isEditing ? (
//             <div className="flex items-center gap-2 bg-[#E6EEFF] rounded-full px-4 py-2 w-full shadow-sm border border-blue-200 animate-[expandIn_0.2s_ease-out]">
//               <input
//                 ref={inputRef}
//                 type="text"
//                 value={editValue}
//                 onChange={(e) => setEditValue(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 className="bg-transparent border-none !outline-none focus:ring-0 focus:border-none text-[#001243] font-semibold text-[15px] w-full min-w-[150px] shadow-none"
//               />
//               <button
//                 onClick={handleSave}
//                 className="flex items-center justify-center w-7 h-7 rounded-full bg-[#001243] text-white hover:bg-[#152a6a] transition-colors shrink-0"
//               >
//                 <Check className="w-4 h-4" />
//               </button>
//             </div>
//           ) : (
//             <div className="bg-[#E6EEFF] text-[#001243] text-[15px] font-semibold rounded-full px-6 py-2 shadow-sm break-words">
//               {text}
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }
// 
//   // Assistant Message
//   return (
//     <div className="flex justify-start mb-6 animate-[slideInLeft_0.3s_ease-out]">
//       <div className="text-[#001243] text-[18px] font-bold max-w-[85%] break-words leading-relaxed">
//         {text}
//       </div>
//     </div>
//   );
// };
// 
// export default ChatMessage;
// 
