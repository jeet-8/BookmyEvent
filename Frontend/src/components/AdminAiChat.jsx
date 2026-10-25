import React, { useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaRobot, FaTimes } from "react-icons/fa";
import { adminApi, AdminApiError } from "../services/adminApi";

const AdminAiChat = ({ onUnauthorized }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hi! I can help you understand your BookMyEvent dashboard and movie, booking, and revenue trends.",
    },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const conversationRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, error, isSending, isOpen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (text = input.trim(), isRetry = false) => {
    if (!text || isSending) return;
    const history = isRetry ? messages.slice(0, -1) : messages;
    if (!isRetry) {
      setMessages((current) => [...current, { role: "user", text }]);
      setInput("");
    }
    setError("");
    setIsSending(true);

    try {
      const result = await adminApi.sendAiChat(
        text,
        history
          .filter((message) => message.role === "user" || message.role === "model")
          .slice(-12)
          .map(({ role, text: messageText }) => ({ role, text: messageText }))
      );
      setMessages((current) => [...current, { role: "model", text: result.reply }]);
    } catch (requestError) {
      if (requestError instanceof AdminApiError && [401, 403].includes(requestError.status)) {
        onUnauthorized();
      }
      setError(requestError.message || "Could not reach the AI assistant.");
    } finally {
      setIsSending(false);
    }
  };

  const retryLastMessage = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") sendMessage(lastMessage.text, true);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <section
          aria-label="Admin AI chat"
          className="flex h-[min(34rem,calc(100vh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500/20 text-indigo-300"><FaRobot /></span>
              <div>
                <h2 className="text-sm font-semibold">Admin AI assistant</h2>
                <p className="text-xs text-slate-400">BookMyEvent insights</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close AI chat" className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white"><FaTimes /></button>
          </header>

          <div ref={conversationRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-6 ${message.role === "user" ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm bg-slate-800 text-slate-100"}`}>
                  {message.text}
                </p>
              </div>
            ))}
            {isSending && <p className="text-xs text-slate-400">Assistant is thinking...</p>}
            {error && (
              <div role="alert" className="rounded-lg border border-red-900 bg-red-950/60 p-3 text-sm text-red-200">
                <p>{error}</p>
                {messages[messages.length - 1]?.role === "user" && (
                  <button type="button" onClick={retryLastMessage} disabled={isSending} className="mt-2 font-semibold underline hover:text-white disabled:opacity-50">Try again</button>
                )}
              </div>
            )}
          </div>

          <form
            noValidate
            className="flex items-end gap-2 border-t border-slate-800 bg-slate-900 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <label className="sr-only" htmlFor="admin-ai-message">Message the admin assistant</label>
            <textarea
              ref={inputRef}
              id="admin-ai-message"
              rows="1"
              maxLength="4000"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about your dashboard..."
              className="max-h-28 min-h-10 flex-1 resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
              disabled={isSending}
            />
            <button type="submit" aria-label="Send message" disabled={isSending || !input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"><FaPaperPlane /></button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close admin AI chat" : "Open admin AI chat"}
        className="flex h-14 items-center gap-3 rounded-full border border-indigo-400/30 bg-slate-900 px-5 text-sm font-semibold text-white shadow-xl transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {isOpen ? <FaTimes /> : <FaRobot className="text-indigo-300" />}
        {isOpen ? "Close chat" : "AI assistant"}
      </button>
    </div>
  );
};

export default AdminAiChat;
