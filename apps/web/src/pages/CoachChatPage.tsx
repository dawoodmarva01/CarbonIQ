import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { ChatMessage } from "../lib/types";

const SUGGESTED_PROMPTS = [
  "Why was my footprint high this week?",
  "Which category should I focus on first?",
  "How do I compare to last month?",
];

export function CoachChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getChatHistory().then((history) => {
      setMessages(history.map((m: any) => ({ role: m.role, content: m.content })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const { reply } = await api.chatWithCoach(text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "I couldn't reach the server. Try again in a moment." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="mb-6">
        <h1 className="font-display text-[24px] font-semibold text-cream">AI climate coach</h1>
        <p className="text-[14px] text-sage mt-1">Grounded in your real logged data — not generic tips.</p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-lime/10 flex items-center justify-center">
              <Sparkles size={20} className="text-lime" />
            </div>
            <p className="text-[14px] text-sage max-w-[280px]">Ask about your footprint — I'll look at your actual logged activities.</p>
            <div className="flex flex-col gap-2 w-full max-w-[320px]">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-[13px] text-cream bg-panel2 border border-line rounded-lg px-3.5 py-2.5 hover:border-lime transition-colors text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                m.role === "user" ? "bg-lime text-white" : "bg-panel border border-line text-cream"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-panel border border-line rounded-2xl px-4 py-2.5">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 mt-4 pt-4 border-t border-line"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your footprint…"
          className="flex-1 px-4 py-3 rounded-xl border border-line bg-panel text-[14px] text-cream placeholder:text-sage/60 focus:outline-none focus:border-lime transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="w-11 h-11 rounded-xl bg-lime text-white flex items-center justify-center disabled:opacity-40 hover:bg-lime/90 transition-colors"
          aria-label="Send message"
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
