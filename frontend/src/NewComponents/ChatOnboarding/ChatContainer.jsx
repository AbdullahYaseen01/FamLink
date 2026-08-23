import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { fireToastMessage } from '../../toastContainer';

import {
  addMessage,
  setMessages,
  setAnswer,
  setCurrentQuestionIndex,
  setIsTyping,
  setIsComplete,
  setPotentialMatches,
  resetChat
} from '../../Components/Redux/chatOnboardingSlice';
import JoinNowMatchesScreen from './JoinNowMatchesScreen';
import LandingMatchesCarousel from './LandingMatchesCarousel';
import FamLandingChat from './FamLandingChat';
import { captureOnboardingLead, ONBOARDING_SOURCE } from '../../Config/onboardingLead';
import { api } from '../../Config/api';
import { OPTIONS as FAMILY_OPTIONS } from '../NannyShare/FamilyWizard/onboardingConfig';
import { EXPERIENCE_OPTIONS as NANNY_EXPERIENCE_OPTIONS } from '../NannyShare/NannyShareWizard/onboardingConfig';
import { OPTIONS as NANNY_FAMILY_OPTIONS } from '../NannyShare/NannyFamilyWizard/onboardingConfig';

const INITIAL_QUESTIONS = [
  { id: 'role', text: 'Are you a family or a nanny?', type: 'options', options: ['Family', 'Nanny'], instruction: 'Family or Nanny?' },
  { id: 'alreadyHaveNanny', text: 'Do you already have a nanny?', type: 'options', options: FAMILY_OPTIONS.q2, instruction: 'Select an option' },
  { id: 'childAges', text: 'How old is your child?', type: 'children', instruction: 'e.g. 3 months or 3 years old' },
  { id: 'careNeeded', text: 'What type of care do you need?', type: 'options', options: FAMILY_OPTIONS.q1, instruction: 'Select an option' },
  { id: 'location', text: 'Where are you located? Enter your zip code or address.', type: 'location', instruction: 'Enter zip code or address' },
  { id: 'fullName', text: "What's your full name?", type: 'text', placeholder: 'First and Last Name', instruction: 'Enter your full name' },
  { id: 'email', text: "And lastly, what's your email address?", type: 'email', placeholder: 'Enter your email', instruction: 'Enter your email address' },
];

const NANNY_ROUTING_QUESTION = {
  id: 'nannySituation',
  text: 'What type of nanny share opportunity are you looking for?',
  type: 'options',
  options: [
    'I already work with a family and want to add a share',
    "I'm looking for a nanny share position"
  ],
  descriptions: {
    'I already work with a family and want to add a share': 'Add a second family to your current role and earn more through nanny share.',
    "I'm looking for a nanny share position": 'Get matched with two compatible families and explore nanny share roles.'
  }
};

const NANNY_BRANCH_A_QUESTIONS = [
  { id: 'forWho', text: 'Who is this for?', type: 'options', options: NANNY_FAMILY_OPTIONS.q1, instruction: 'Select an option' },
  { id: 'numChildren', text: 'How many children?', type: 'options', options: ["1", "2", "3+"], instruction: 'Select number of children' },
  { id: 'ages', text: 'What are their ages?', type: 'options', options: ["Infant", "Toddler", "Preschool", "School-age"], instruction: 'Select all that apply', allowMultiple: true },
  { id: 'schedule', text: 'What is your schedule?', type: 'options', options: ["Full-time", "Part-time", "Flexible"], instruction: 'Select schedule' },
  { id: 'joinTiming', text: 'How will they join?', type: 'options', options: ["Same schedule", "Partially overlapping", "Filling gaps", "Flexible"], instruction: 'Select timing' },
  { id: 'together', text: 'Will they be together?', type: 'options', options: ["Yes", "Sometimes", "No"], instruction: 'Select option' },
  { id: 'location', text: 'Where are you located? Enter your zip code or address.', type: 'location', instruction: 'Enter zip code or address' },
  { id: 'fullName', text: "What's your full name?", type: 'text', placeholder: 'First and Last Name', instruction: 'Enter your full name' },
  { id: 'email', text: "And lastly, what's your email address?", type: 'email', placeholder: 'Enter your email', instruction: 'Enter your email address' },
];

const NANNY_BRANCH_B_QUESTIONS = [
  { id: 'experience', text: 'What is your experience level?', type: 'options', options: NANNY_EXPERIENCE_OPTIONS, instruction: 'Select experience' },
  { id: 'schedule', text: 'What schedule are you looking for?', type: 'options', options: ["Full-time", "Part-time", "Flexible"], instruction: 'Select schedule' },
  { id: 'distance', text: 'How far are you willing to travel?', type: 'options', options: NANNY_FAMILY_OPTIONS.q12, instruction: 'Select distance' },
  { id: 'location', text: 'Where are you located? Enter your zip code or address.', type: 'location', instruction: 'Enter zip code or address' },
  { id: 'fullName', text: "What's your full name?", type: 'text', placeholder: 'First and Last Name', instruction: 'Enter your full name' },
  { id: 'email', text: "And lastly, what's your email address?", type: 'email', placeholder: 'Enter your email', instruction: 'Enter your email address' },
];

const ChatContainer = ({ onFinalSubmit, isFullScreen = false, variant = 'family' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const flowState = useSelector(state => state.chatOnboarding[variant]) || {};
  const { isTyping } = useSelector(state => state.chatOnboarding);
  
  const {
    messages = [],
    currentQuestionIndex = 0,
    answers: rawAnswers = {},
    isComplete = false,
    hasStarted = false,
    potentialMatches = []
  } = flowState || {};

  const answers = rawAnswers || {};

  const otherVariant = variant === 'family' ? 'caregiver' : 'family';
  const otherFlowState = useSelector(state => state.chatOnboarding[otherVariant]) || {};

  const { user, accessToken } = useSelector(state => state.auth);
  const isLoggedIn = !!(user && accessToken);

  // Nanny flow specific state derived from answers
  const isNannyFlow = answers.role === 'Nanny';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cityStatus, setCityStatus] = useState(null);

  useEffect(() => {
    if (!isComplete || isFullScreen || isLoggedIn || !answers?.email) return;
    let active = true;
    api.post("/landing/matches", { answers })
      .then(({ data }) => {
        if (!active) return;
        setCityStatus(data.cityStatus || "waitlist");
        dispatch(setPotentialMatches({ variant, matches: data.profiles || [] }));
      })
      .catch(() => {
        if (!active) return;
        setCityStatus("waitlist");
      });
    return () => { active = false; };
  }, [isComplete, isFullScreen, isLoggedIn, answers?.email, dispatch, variant]);

  const messagesEndRef = useRef(null);

  // Mismatch logic removed per user request: flows are independent

  // Active question logic
  const getQuestionFlow = () => {
    const base = [INITIAL_QUESTIONS[0]];
    if (answers.role === 'Nanny') {
      base.push(NANNY_ROUTING_QUESTION);
      if (answers.nannySituation === 'I already work with a family and want to add a share') {
        base.push(...NANNY_BRANCH_A_QUESTIONS);
      } else if (answers.nannySituation === "I'm looking for a nanny share position") {
        base.push(...NANNY_BRANCH_B_QUESTIONS);
      }
    } else {
      base.push(...INITIAL_QUESTIONS.slice(1));
    }
    return base;
  };

  const activeQuestionArray = getQuestionFlow();
  let activeQuestion = null;
  if (!isComplete && currentQuestionIndex < activeQuestionArray.length) {
    activeQuestion = activeQuestionArray[currentQuestionIndex];
  }

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, activeQuestion]);

  // Initial greeting
  useEffect(() => {
    if (!hasStarted) {
      dispatch(setIsTyping(true));
      setTimeout(() => {
        dispatch(addMessage({ variant, message: { id: Date.now(), sender: 'assistant', text: "I'll ask a few quick questions to personalize your matches." } }));

        setTimeout(() => {
          dispatch(addMessage({ variant, message: { id: Date.now() + 1, sender: 'assistant', text: INITIAL_QUESTIONS[0].text } }));
          dispatch(setIsTyping(false));
        }, 1000);
      }, 600);
    }
  }, [hasStarted, dispatch]);

  const handleSend = (value, rawData = null) => {
    // Intercept cross-role selection before modifying state (Only on inline landing pages)
    if (activeQuestion.id === 'role' && !isFullScreen) {
      if (variant === 'family' && value === 'Nanny') {
        navigate('/jobSeekers');
        return;
      } else if (variant === 'caregiver' && value === 'Family') {
        navigate('/');
        return;
      }
    }

    // Reset both flows if the user had already started the other flow but hasn't completed it
    if (otherFlowState && otherFlowState.hasStarted && !otherFlowState.isComplete) {
      dispatch(resetChat());
      fireToastMessage({ type: 'info', message: 'You previously started onboarding on the other page. Both sessions have been reset.' });
      return;
    }

    // 1. Add user's message
    const userMsgId = Date.now();
    dispatch(addMessage({ variant, message: { id: userMsgId, sender: 'user', text: value, questionId: activeQuestion.id } }));

    // 2. Save answer
    dispatch(setAnswer({ variant, key: activeQuestion.id, value: rawData || value }));

    // 4. Standard flow progression
    const nextIndex = currentQuestionIndex + 1;
    // Re-evaluate the question flow in case they just answered a branching question
    const updatedFlow = [...activeQuestionArray];
    if (activeQuestion.id === 'role' || activeQuestion.id === 'nannySituation') {
      // Flow might have expanded, but nextIndex correctly points to the next question in the new flow
    }

    if (nextIndex < activeQuestionArray.length || (activeQuestion.id === 'role' && value === 'Nanny') || activeQuestion.id === 'nannySituation') {
      // Since activeQuestionArray will update on next render, we trust nextIndex points to the next question.
      // Wait, actually, activeQuestionArray is computed on render. If we just advance the index, the next render will have the new array.
      const targetIndex = nextIndex;
      dispatch(setIsTyping(true));
      dispatch(setCurrentQuestionIndex({ variant, index: targetIndex }));

      // To get the next question text safely right now before render:
      let nextQText = "";
      if (activeQuestion.id === 'role' && value === 'Nanny') {
        nextQText = NANNY_ROUTING_QUESTION.text;
      } else if (activeQuestion.id === 'nannySituation') {
        nextQText = value === 'I already work with a family and want to add a share' ? NANNY_BRANCH_A_QUESTIONS[0].text : NANNY_BRANCH_B_QUESTIONS[0].text;
      } else {
        nextQText = activeQuestionArray[targetIndex].text;
      }

      setTimeout(() => {
        dispatch(addMessage({ variant, message: { id: Date.now(), sender: 'assistant', text: nextQText } }));
        dispatch(setIsTyping(false));
      }, 1000);
    } else {
      // Completed flow
      dispatch(setIsTyping(true)); // Show typing indicator while fetching
      const fetchMatches = async () => {
        const completedAnswers = { ...answers, [activeQuestion.id]: rawData || value };
        try {
          const { data } = await api.post(`/landing/matches`, { answers: completedAnswers });
          setCityStatus(data.cityStatus || "waitlist");
          dispatch(setPotentialMatches({ variant, matches: data.profiles || [] }));
        } catch (error) {
          console.error("Error fetching landing matches:", error);
          setCityStatus("waitlist");
          dispatch(setPotentialMatches({ variant, matches: [] }));
        } finally {
          dispatch(setIsTyping(false));
          dispatch(setIsComplete({ variant, isComplete: true }));
        }
      };

      setTimeout(() => {
        fetchMatches();
      }, 500);
    }
  };

  const handleEdit = (messageId, newValue) => {
    // Find the message being edited
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = messages[msgIndex];

    // Update the message text
    const updatedMessages = messages.map(m => m.id === messageId ? { ...m, text: newValue } : m);
    dispatch(setMessages({ variant, messages: updatedMessages }));

    // Update the answers object
    dispatch(setAnswer({ variant, key: targetMsg.questionId, value: newValue }));
  };

  const handleFinalComplete = async () => {
    if (!isComplete) {
      fireToastMessage({ type: 'info', message: 'Please complete the questions above before creating your account.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    if (onFinalSubmit) {
      await onFinalSubmit(answers);
      setIsSubmitting(false);
    } else {
      const newRecordId = crypto.randomUUID();
      const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

      if (answers.role === 'Nanny') {
        const data = {
          action: "create",
          Timestamp: new Date().toISOString(),
          Id: newRecordId,
          Name: answers.fullName || "",
          Email: answers.email || "",
          Path: answers.nannySituation === 'I already work with a family and want to add a share' ? "Already works with a family" : "Looking for nanny share position",
          Type: "Nanny share caregiver",
        };

        if (scriptUrl) {
          try {
            await fetch(scriptUrl, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams(data).toString(),
            });
          } catch (err) {
            console.error("Google script err:", err);
          }
        }

        const pathParam = answers.nannySituation === 'I already work with a family and want to add a share'
          ? 'looking-for-another-family'
          : 'looking-for-nanny-share-job';

        setIsSubmitting(false);
        navigate(`/caregiver/nanny-share/${pathParam}/${newRecordId}`, { state: { skipMatches: true, chatAnswers: answers } });
      } else {
        // Generate new ID and submit lead for Family flow before navigating
        const data = {
          action: "create",
          Timestamp: new Date().toISOString(),
          Id: newRecordId,
          Name: answers.fullName || "",
          Email: answers.email || "",
          "Already have nanny": answers.alreadyHaveNanny || "",
          "Child age(s)": answers.childAges || "",
          "Care needed": answers.careNeeded || "",
          Type: answers.careNeeded || "",
          "Number of children": answers.childAges ? answers.childAges.split(',').length : 0,
          Location: typeof answers.location === 'object' ? JSON.stringify(answers.location) : answers.location || "",
          Details: "",
        };

        if (scriptUrl) {
          try {
            await fetch(scriptUrl, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams(data).toString(),
            });
          } catch (err) {
            console.error("Google script err:", err);
          }
        }

        captureOnboardingLead({
          email: answers.email || "",
          name: answers.fullName || "",
          source: ONBOARDING_SOURCE.FAMILY_MATCH,
          sheetId: newRecordId,
          location: answers.location,
          details: `Care needed: ${answers.careNeeded}\nAlready have nanny: ${answers.alreadyHaveNanny}\nChild age(s): ${answers.childAges}`
        });

        setIsSubmitting(false);
        navigate(`/find-nanny-share/family/${newRecordId}`, { state: { skipMatches: true } });
      }
    }
  };

  const hasUserResponded = messages.some(m => m.sender === 'user');
  const isInitialHeroState = isFullScreen && !hasUserResponded;

  return (
    <div className={`w-full flex flex-col relative ${(isLoggedIn && !isFullScreen) ? 'pt-10' : 'min-h-[580px] pt-10 pb-20'}`}>

      {/* Explicit Back Button for Full Screen Mode */}
      {isFullScreen && (
        <button
          onClick={() => {
            if (answers.role === 'Nanny') {
              navigate('/jobSeekers');
            } else if (answers.role === 'Family') {
              navigate('/find-nanny-share');
            } else {
              navigate(-1);
            }
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 text-gray-500 hover:text-[#001243] font-medium text-[14px] transition-all z-[100] bg-white/80 backdrop-blur-sm py-2 px-5 rounded-full border border-gray-200 shadow-sm hover:shadow-md"
        >
          Back
        </button>
      )}
      {/* Scrollable Area containing both Header and Messages */}
      {!(isFullScreen && isComplete) && (
        <div className={`flex-1 flex flex-col w-full px-4 md:px-0 mx-auto text-left ${isInitialHeroState ? 'max-w-[800px]' : 'max-w-[680px]'}`}>

          {/* Header - Landing Page Mode */}
          {!isFullScreen && (
            <div className="flex flex-col items-center justify-center bg-transparent z-10 text-center px-4">
              {!isLoggedIn && (
                <div className="inline-flex items-center gap-2 bg-[#EEF3FF] border border-[#C8D8FF] rounded-full px-4 py-1.5 text-[14px] font-bold text-[#001243] mb-8 shadow-sm">
                  Meet Fam
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
                  your AI match assistant
                </div>
              )}
              <h1 className="text-[52px] sm:text-[72px] mb-6 font-black leading-[1.05] tracking-tight text-center Livvic-Bold">
                {variant === 'caregiver' ? (
                  <>
                    <span className="text-[#001243]" style={{ WebkitTextStroke: '1.5px #001243' }}>Earn More as a</span>
                    <br />
                    <span className="text-[#AEC4FF]" style={{ WebkitTextStroke: '1.5px #AEC4FF' }}>Nanny Share Nanny.</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#001243]" style={{ WebkitTextStroke: '1.5px #001243' }}>Find your</span>
                    <br />
                    <span className="text-[#AEC4FF]" style={{ WebkitTextStroke: '1.5px #AEC4FF' }}>nanny share.</span>
                  </>
                )}
              </h1>
              <p className={`text-[#6b7280] text-[16px] font-[400] max-w-[640px] mx-auto leading-[1.7] text-center ${isLoggedIn ? '' : 'mb-[52px]'}`}>
                {variant === 'caregiver'
                  ? "Fam helps families and nannies find compatible nanny share partners. No searching, no spreadsheets, no Facebook groups."
                  : "Save up to 50% compared to hiring your own nanny. Fam continuously searches for compatible nanny share matches, so you don't have to."}
              </p>
            </div>
          )}

          {/* Hero View - Full Screen Initial State */}
          {!isLoggedIn && (
            isInitialHeroState ? (
            <div className="flex flex-col items-center justify-center pt-8 pb-12 w-full text-center relative mt-6">
              {/* Background Ripples */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 opacity-40">
                <div className="w-[300px] h-[300px] rounded-full border-[1.5px] border-gray-200 absolute"></div>
                <div className="w-[500px] h-[500px] rounded-full border-[1.5px] border-gray-200 absolute"></div>
                <div className="w-[700px] h-[700px] rounded-full border-[1.5px] border-gray-100 absolute"></div>
                <div className="w-[900px] h-[900px] rounded-full border-[1.5px] border-gray-50 absolute"></div>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-white border border-gray-100 text-gray-500 text-[13px] font-medium px-4 py-1.5 rounded-full mb-12 shadow-sm shadow-gray-100 relative z-10">
                <img src="/logo3.png" alt="logo" className="w-3.5 h-3.5 object-contain opacity-80" />
                <span className="font-bold text-[#001243]">Fam</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mx-0.5"></span>
                AI Match Assistant
              </div>

              <h1 className="text-[36px] sm:text-[44px] font-black text-[#001243] mb-10 leading-tight Livvic-Bold tracking-tight relative z-10">
                Are you a family or a nanny?
              </h1>

              <div className="w-full max-w-[500px] mx-auto relative z-10">
                <ChatInput
                  activeQuestion={activeQuestion}
                  onSend={handleSend}
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={activeQuestionArray.length}
                  hideFreeText={isFullScreen}
                  isBranching={isNannyFlow}
                />
              </div>

              <div
                className="mt-8 flex items-center justify-center text-[12px] text-gray-400 font-medium relative z-10 cursor-pointer hover:text-gray-600 transition-colors"
                onClick={() => navigate(-1)}
              >
                <img src="/logo3.png" alt="Famlink" className="w-3 h-3 mr-1 opacity-50" />
                <span className="font-bold text-gray-500 mr-1 hover:text-[#001243]">Famlink</span> Nanny share made simple.
              </div>
            </div>
          ) : (
            <>
              {/* Header - Full Screen (JoinNow) Mode (Subsequent Questions) */}
              {isFullScreen && (
                <div className="flex flex-col items-center justify-center pb-6 pt-0 bg-transparent z-10 text-center px-4">
                  <div className="inline-flex items-center gap-1.5 bg-white border border-gray-100 text-gray-500 text-[13px] font-medium px-4 py-1.5 rounded-full mb-12 shadow-sm shadow-gray-100">
                    <img src="/logo3.png" alt="logo" className="w-3.5 h-3.5 object-contain opacity-80" />
                    <span className="font-bold text-[#001243]">Fam</span>
                    <span className="w-1 h-1 rounded-full bg-[#10B981] mx-0.5"></span>
                    AI Match Assistant
                  </div>
                </div>
              )}

              <div className="relative w-full">

                {/* Fixed Greeting Message */}
                <div className="pb-2">
                  <ChatMessage message={{ id: 'fixed-greeting', sender: 'assistant', text: "I'll ask a few quick questions to personalize your matches." }} />
                </div>

                <div
                  className="flex flex-col w-full pr-1 pb-4"
                >
                  {messages.filter(msg => msg.text !== "I'll ask a few quick questions to personalize your matches.").map((msg) => (
                    <ChatMessage key={msg.id} message={msg} onEdit={handleEdit} />
                  ))}
                  {isTyping && <ChatMessage message={{ sender: 'assistant', isTyping: true }} />}
                  <div ref={messagesEndRef} className="h-2 shrink-0" />
                </div>

                {/* Inline Input Area */}
                {!isComplete && (
                  <div className="pt-2 pb-8 relative">
                    <div className="">
                      {activeQuestion?.id === 'nannySituation' && (
                        <div className="mb-4 space-y-2">
                          {activeQuestion.options.map(opt => (
                            <button
                              key={opt}
                              onClick={() => handleSend(opt)}
                              className="w-full text-left bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl p-4 transition-all shadow-sm flex flex-col gap-1 group"
                            >
                              <span className="font-bold text-[#001243] group-hover:text-blue-700">{opt}</span>
                              <span className="text-sm text-gray-500">{activeQuestion.descriptions[opt]}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {activeQuestion?.id !== 'nannySituation' && !isTyping && (
                        <ChatInput
                          activeQuestion={activeQuestion}
                          onSend={handleSend}
                          currentQuestionIndex={currentQuestionIndex}
                          totalQuestions={activeQuestionArray.length}
                          hideFreeText={isFullScreen}
                          isBranching={isNannyFlow}
                        />
                      )}
                    </div>
                    <div className="text-center mt-5 relative z-[50]">
                      {!isFullScreen ? (
                        <>
                          {/* Removed inline feature highlights per user request */}
                        </>
                      ) : (
                        <span
                          className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1 cursor-pointer hover:text-gray-600 transition-colors"
                          onClick={() => navigate(-1)}
                        >
                          <img src="/logo3.png" alt="logo" className="w-3.5 h-3.5" />
                          <span className="font-bold text-[#001243]">Famlink</span>
                          <span className="mx-1">·</span>
                          Nanny share made simple.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ))}

        </div>
      )}

      <div className="relative w-full">
        {isFullScreen ? (
          isComplete && (
            <JoinNowMatchesScreen matches={potentialMatches} onJoin={handleFinalComplete} isSubmitting={isSubmitting} />
          )
        ) : (
          !isLoggedIn && isComplete && (
            <>
              <LandingMatchesCarousel
                matches={potentialMatches}
                onJoin={handleFinalComplete}
                isSubmitting={isSubmitting}
                isComplete={isComplete}
                cityStatus={cityStatus}
              />
              <FamLandingChat answers={answers} />
            </>
          )
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
