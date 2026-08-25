import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getChatsThunk } from "../Components/Redux/chatSlice";
import { clearSelectedContact, setSelectedContact } from "../Components/Redux/selectedContactSlice";
import { useChats } from "../Config/useChat";
import ChatView from "../Components/subComponents/chatView";
import Loader from "../Components/subComponents/loader";
import MatchesEmptyState from "./MatchesEmptyState";
import { formatShareTypeLine, resolveShareType } from "./matchesCompatibility";
import "./matchesTab.css";

const participantTypeLine = (person) =>
  formatShareTypeLine(
    resolveShareType({
      type: person?.type,
      hasNanny: person?.hasNanny,
      hasFamily: person?.hasFamily,
    }),
    person?.type
  );

const MatchesMessages = ({ onViewRequests }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useSelector((s) => s.auth);
  const selectedContact = useSelector((s) => s.selectedContact.selectedContact);
  const {
    chatList,
    handleSendMessage,
    messages,
    handleCloseChat,
    isLoading,
    isOtherUserTyping,
    emitTyping,
  } = useChats({
    chatId: selectedContact?._id,
    data: selectedContact,
  });

  useEffect(() => {
    dispatch(getChatsThunk());
    dispatch(clearSelectedContact());
  }, [dispatch]);

  const conversations = useMemo(
    () => (chatList || []).filter((c) => c?.otherParticipant?.name !== "Admin"),
    [chatList]
  );

  const handleSelect = useCallback(
    (contact) => {
      dispatch(setSelectedContact(contact));
    },
    [dispatch]
  );

  const handleBack = useCallback(() => {
    handleCloseChat();
    dispatch(clearSelectedContact());
  }, [dispatch, handleCloseChat]);

  const viewProfile = () => {
    const person = selectedContact?.otherParticipant;
    if (!person?._id) return;
    if (person.type === "Nanny") navigate(`/family/profileNanny/${person._id}`);
    else if (person.type === "Parents" && user?.type === "Parents") {
      navigate(`/family/profileFamily/${person._id}`);
    } else {
      navigate(`/nanny/profileFamily/${person._id}`);
    }
  };

  if (isLoading && conversations.length === 0 && !selectedContact) {
    return <Loader />;
  }

  if (selectedContact) {
    const typeLine = participantTypeLine(selectedContact.otherParticipant);
    return (
      <div className="fl-matches-thread">
        <div className="fl-matches-thread-head">
          <button
            type="button"
            className="fl-matches-thread-head__back"
            onClick={handleBack}
            aria-label="Back to conversations"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="fl-matches-thread-head__copy">
            <p className="fl-matches-thread-head__name Livvic-Bold">
              {selectedContact.otherParticipant?.name}
            </p>
            {typeLine && (
              <p className="fl-matches-thread-head__type Livvic">{typeLine}</p>
            )}
          </div>
          <button
            type="button"
            className="fl-matches-thread-head__profile Livvic-SemiBold"
            onClick={viewProfile}
          >
            View Profile
          </button>
        </div>
        <ChatView
          messages={messages}
          handleSendMessage={handleSendMessage}
          selectedContact={selectedContact}
          user={user}
          pathname={pathname}
          handleCloseChat={handleBack}
          isOtherUserTyping={isOtherUserTyping}
          emitTyping={emitTyping}
          headerMode="matches"
        />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <MatchesEmptyState
        variant="messages"
        headline="No conversations yet"
        line="Once you accept a match request, your conversation will appear here."
        cta="View Requests"
        onCta={onViewRequests}
      />
    );
  }

  return (
    <div>
      {conversations.map((contact) => (
        <button
          type="button"
          key={contact._id}
          className="fl-msg-row"
          onClick={() => handleSelect(contact)}
        >
          <div className="fl-msg-copy">
            <p className="fl-msg-name Livvic-Bold">{contact.otherParticipant?.name}</p>
            <p className="fl-msg-type Livvic">
              {participantTypeLine(contact.otherParticipant)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default MatchesMessages;
