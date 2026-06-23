import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Send, AlertTriangle, ShieldCheck, HeartPulse, User, Trash2 } from "lucide-react";
import { sendMessage, getChatHistory, clearChatHistory } from "../../api/chatApi";
import Button from "../../components/ui/Button";

const WELCOME = {
  role: "model",
  content:
    "Hello! I am your AI Health Companion. I can explain your biomarker metrics (Hemoglobin, Glucose, Cholesterol) and offer lifestyle guidance based strictly on the medical reports you upload. How can I help you today?",
};

const fmtTime = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { ...WELCOME, timestamp: fmtTime(new Date()) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const seedHandledRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load persisted conversation on open (skip when arriving with a seeded question)
  useEffect(() => {
    if (location.state?.seed) return;
    let active = true;
    (async () => {
      try {
        const history = await getChatHistory();
        if (active && Array.isArray(history) && history.length > 0) {
          setMessages(
            history.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: m.created_at ? fmtTime(new Date(m.created_at)) : "",
            }))
          );
        }
      } catch {
        /* keep the default welcome message on failure */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleClear = async () => {
    try {
      await clearChatHistory();
    } catch {
      /* ignore */
    }
    setMessages([{ ...WELCOME, timestamp: fmtTime(new Date()) }]);
    setError(null);
  };

  const doSend = async (text) => {
    const userMessage = (text || "").trim();
    if (!userMessage || loading) return;

    setError(null);
    setLoading(true);

    // History excludes the welcome message and the about-to-be-added user message
    const chatHistory = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: fmtTime(new Date()) },
    ]);

    try {
      const data = await sendMessage({ message: userMessage, history: chatHistory });
      setMessages((prev) => [
        ...prev,
        { role: "model", content: data.reply, timestamp: fmtTime(new Date()) },
      ]);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Failed to get a response from your AI Companion. Please check your network or API Key setup."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = input;
    setInput("");
    doSend(text);
  };

  // Auto-send a seeded question (from "Ask about this report")
  useEffect(() => {
    const seed = location.state?.seed;
    if (seed && !seedHandledRef.current) {
      seedHandledRef.current = true;
      doSend(seed);
      window.history.replaceState({}, document.title); // prevent resend on refresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  return (
    <div className="glass-panel flex flex-col h-[580px] w-full bg-[#0f172a]/20 border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 px-6 py-3.5 bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 items-center justify-center flex rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 glow-active">
            <HeartPulse className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-display font-bold text-white text-xs tracking-wide">Aura AI Advisor</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wide">Sync'd Context</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            title="Clear conversation"
            className="flex items-center gap-1 text-[9.5px] font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            Clear
          </button>
          <div className="flex items-center gap-1 text-[9.5px] font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            Secure Client
          </div>
        </div>
      </div>

      {/* Message Pane */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={index}
              className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div className="h-7 w-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <HeartPulse className="h-4 w-4" />
                </div>
              )}

              <div className="flex flex-col gap-1 max-w-[75%]">
                <div
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-[12.5px] leading-relaxed ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-500/5 font-medium"
                      : "bg-[#0F172A] text-slate-200 rounded-tl-none border border-slate-850"
                  }`}
                >
                  {msg.content.split("\n").map((paragraph, i) => (
                    <p key={i} className={i > 0 ? "mt-2" : ""}>
                      {paragraph}
                    </p>
                  ))}
                </div>
                {/* Timestamp */}
                <span className={`text-[8.5px] font-bold text-slate-500 mt-0.5 ${isUser ? "text-right" : "text-left"}`}>
                  {msg.timestamp}
                </span>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Dots */}
        {loading && (
          <div className="flex w-full gap-3 justify-start">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="bg-[#0F172A] border border-slate-850 text-slate-200 rounded-2xl rounded-tl-none px-4 py-3.5 text-xs flex items-center gap-1.5 w-16">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }}></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }}></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center my-2">
            <span className="text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5" />
              {error}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Safety Banner */}
      <div className="px-6 py-2 bg-[#050816]/70 border-t border-slate-900 text-[9px] text-slate-500 text-center font-bold tracking-wide">
        CLINICAL COMPLIANCE: SYSTEM ANALYSIS IS NOT A SUBSTITUTE FOR PHYSICIAN COUNSEL.
      </div>

      {/* Inputs */}
      <form onSubmit={handleSend} className="p-4 bg-slate-900/20 border-t border-slate-900 flex gap-2 w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Aura AI about lab trends, hydration, or sleep advice..."
          className="flex-1 premium-input px-4 py-2.5 text-xs font-medium"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="disabled:opacity-40 p-2.5 shrink-0 hover:shadow-indigo-500/20"
          icon={<Send className="h-4 w-4" />}
        />
      </form>
    </div>
  );
};

export default Chatbot;
