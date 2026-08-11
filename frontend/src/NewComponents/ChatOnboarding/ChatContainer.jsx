// import React, { useState, useEffect, useRef } from 'react';
// import ChatMessage from './ChatMessage';
// import ChatInput from './ChatInput';
// import MatchesScreen from './MatchesScreen';
// import { useNavigate } from 'react-router-dom';
// 
// const INITIAL_QUESTIONS = [
//   { id: 'role', text: 'Are you a family or a nanny?', type: 'options', options: ['Family', 'Nanny'] },
//   { id: 'alreadyHaveNanny', text: 'Do you already have a nanny?', type: 'options', options: ['Yes', 'No'] },
//   { id: 'childAges', text: 'How old is your child?', type: 'children' },
//   { id: 'careNeeded', text: 'What type of care do you need?', type: 'options', options: ['Full-time', 'Part-time', 'Flexible'] },
//   { id: 'location', text: 'Where are you located? Enter your full address.', type: 'location' },
//   { id: 'fullName', text: "What's your full name?", type: 'text', placeholder: 'First and Last Name' },
//   { id: 'email', text: "And lastly, what's your email address?", type: 'email', placeholder: 'Enter your email' },
// ];
// 
// const NANNY_ROUTING_QUESTION = {
//   id: 'nannySituation',
//   text: 'Which of these best describes your situation?',
//   type: 'options',
//   options: [
//     'I already work with a family and want to add a share',
//     "I'm looking for a nanny share position"
//   ],
//   descriptions: {
//     'I already work with a family and want to add a share': 'Add a second family to your current role and earn more through nanny share.',
//     "I'm looking for a nanny share position": 'Get matched with two compatible families and explore nanny share roles.'
//   }
// };
// 
// const ChatContainer = ({ onFinalSubmit }) => {
//   const [messages, setMessages] = useState([]);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [answers, setAnswers] = useState({});
//   const [isTyping, setIsTyping] = useState(false);
//   const [isComplete, setIsComplete] = useState(false);
// 
//   // Nanny flow specific state
//   const [isNannyFlow, setIsNannyFlow] = useState(false);
// 
//   const messagesEndRef = useRef(null);
//   const navigate = useNavigate();
// 
//   // Active question logic
//   let activeQuestion = null;
//   if (!isComplete) {
//     if (isNannyFlow) {
//       activeQuestion = NANNY_ROUTING_QUESTION;
//     } else {
//       activeQuestion = INITIAL_QUESTIONS[currentQuestionIndex];
//     }
//   }
// 
//   // Scroll to bottom when messages change
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages, isTyping, activeQuestion]);
// 
//   // Initial greeting
//   useEffect(() => {
//     if (messages.length === 0) {
//       setIsTyping(true);
//       setTimeout(() => {
//         setMessages([{ id: Date.now(), sender: 'assistant', text: INITIAL_QUESTIONS[0].text }]);
//         setIsTyping(false);
//       }, 600);
//     }
//   }, []);
// 
//   const handleSend = (value, rawData = null) => {
//     // 1. Add user's message
//     const userMsgId = Date.now();
//     setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: value, questionId: activeQuestion.id }]);
// 
//     // 2. Save answer
//     setAnswers(prev => ({ ...prev, [activeQuestion.id]: rawData || value }));
// 
//     // 3. Handle Special Routing
//     if (activeQuestion.id === 'role' && value === 'Nanny') {
//       setIsTyping(true);
//       setIsNannyFlow(true);
//       setTimeout(() => {
//         setMessages(prev => [...prev, { id: Date.now(), sender: 'assistant', text: NANNY_ROUTING_QUESTION.text }]);
//         setIsTyping(false);
//       }, 1000);
//       return;
//     }
// 
//     if (activeQuestion.id === 'nannySituation') {
//       // End of Nanny flow
//       navigate('/caregiver/nannyshare');
//       return;
//     }
// 
//     // 4. Standard flow progression
//     const nextIndex = currentQuestionIndex + 1;
//     if (nextIndex < INITIAL_QUESTIONS.length) {
//       setIsTyping(true);
//       setCurrentQuestionIndex(nextIndex);
//       setTimeout(() => {
//         setMessages(prev => [...prev, { id: Date.now(), sender: 'assistant', text: INITIAL_QUESTIONS[nextIndex].text }]);
//         setIsTyping(false);
//       }, 1000);
//     } else {
//       // Completed family flow
//       setTimeout(() => {
//         setIsComplete(true);
//       }, 500);
//     }
//   };
// 
//   const handleEdit = (messageId, newValue) => {
//     // Find the message being edited
//     const msgIndex = messages.findIndex(m => m.id === messageId);
//     if (msgIndex === -1) return;
// 
//     const targetMsg = messages[msgIndex];
// 
//     // Update the message text
//     setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newValue } : m));
// 
//     // Update the answers object
//     setAnswers(prev => ({ ...prev, [targetMsg.questionId]: newValue }));
//   };
// 
//   const handleFinalComplete = () => {
//     // Trigger the backend API call and transition from NannyShareMatchForm
//     onFinalSubmit(answers);
//   };
// 
//   if (isComplete) {
//     return <MatchesScreen onComplete={handleFinalComplete} answers={answers} />;
//   }
// 
//   return (
//     <div className="w-full max-w-xl mx-auto flex flex-col min-h-screen pt-10 pb-20">
//       {/* Scrollable Area containing both Header and Messages */}
//       <div className="flex-1 flex flex-col w-full">
// 
//         {/* Header */}
//         <div className="flex flex-col items-center justify-center pb-6 bg-transparent z-10 text-center px-4">
//           <div className="inline-flex items-center gap-2 bg-white border border-[#AEC4FF] text-[#001243] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 shadow-sm">
//             <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
//             Meet Fam — your AI match assistant
//           </div>
//           <h1 className="text-[48px] sm:text-[64px] mb-5 font-black tracking-tight leading-[1.1] Livvic-Bold">
//             <span className="text-[#001243] block" style={{ WebkitTextStroke: '1.5px #001243' }}>Find your</span>
//             <span className="text-[#AEC4FF]" style={{ WebkitTextStroke: '1.5px #AEC4FF' }}>nanny share.</span>
//           </h1>
//           <p className="text-gray-500 text-[15px] sm:text-[16px] max-w-md mx-auto leading-relaxed">
//             Fam helps families and caregivers find compatible nanny share partners — no searching, no spreadsheets, no Facebook groups.
//           </p>
//         </div>
// 
//         {/* Chat Messages */}
//         {messages.map((msg) => (
//           <ChatMessage key={msg.id} message={msg} onEdit={handleEdit} />
//         ))}
//         {isTyping && <ChatMessage message={{ sender: 'assistant', isTyping: true }} />}
// 
//         {/* Inline Input Area */}
//         <div className="pt-2 pb-8">
//           {activeQuestion?.id === 'nannySituation' && (
//             <div className="mb-4 space-y-2">
//               {activeQuestion.options.map(opt => (
//                 <button
//                   key={opt}
//                   onClick={() => handleSend(opt)}
//                   className="w-full text-left bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl p-4 transition-all shadow-sm flex flex-col gap-1 group"
//                 >
//                   <span className="font-bold text-[#001243] group-hover:text-blue-700">{opt}</span>
//                   <span className="text-sm text-gray-500">{activeQuestion.descriptions[opt]}</span>
//                 </button>
//               ))}
//             </div>
//           )}
// 
//           {activeQuestion?.id !== 'nannySituation' && !isTyping && (
//             <ChatInput activeQuestion={activeQuestion} onSend={handleSend} />
//           )}
//           <div className="text-center mt-5">
//             <span className="text-xs text-gray-400 italic">These profiles update as you answer — the more Fam knows, the better your matches.</span>
//           </div>
//         </div>
// 
//         <div ref={messagesEndRef} className="h-4" />
//       </div>
//     </div>
//   );
// };
// 
// export default ChatContainer;
// 
