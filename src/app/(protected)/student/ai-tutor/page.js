"use client";

import { useState, useRef, useEffect } from "react";
import {
  MdSearch,
  MdSmartToy,
  MdSend,
  MdAdd,
  MdDelete,
  MdMessage,
  MdMenu,
  MdClose,
  MdHourglassEmpty,
  MdArticle,
  MdKeyboardArrowDown,
  MdAutoAwesome,
  MdSchool,
  MdInfoOutline,
} from "react-icons/md";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { C, T, S, R, pageStyle } from "@/constants/studentTokens";

// ─── Action cards config ──────────────────────────────────────────────────────
const ACTION_CARDS = [
  {
    title: "Explain",
    subtitle: "Newton's Laws",
    icon: "🍎",
    from: "#ddd6fe",
    to: "#a5b4fc",
  },
  {
    title: "Generate",
    subtitle: "Quiz",
    icon: "📝",
    from: "#a5b4fc",
    to: "#7dd3fc",
  },
  {
    title: "Summarize",
    subtitle: "Chapter",
    icon: "📄",
    from: "#fde68a",
    to: "#fcd34d",
  },
  {
    title: "Solve Math",
    subtitle: "Problem",
    icon: "¼",
    from: "#6ee7b7",
    to: "#86efac",
  },
  {
    title: "Create",
    subtitle: "Flashcards",
    icon: "📇",
    from: "#7dd3fc",
    to: "#60a5fa",
  },
  {
    title: "Prepare",
    subtitle: "Exam Plan",
    icon: "📋",
    from: "#fca5a5",
    to: "#f9a8d4",
  },
];

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 0.15, 0.3].map((d, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full animate-bounce"
          style={{
            backgroundColor: C.btnPrimary,
            opacity: 0.5,
            animationDelay: `${d}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AITutorPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const courseRes = await api.get("/enrollments/my-enrollments");
        setCourses(
          courseRes.data.enrollments?.map((e) => ({
            _id: e.courseId._id,
            title: e.courseId.title,
          })) || [],
        );
        fetchSessions();
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitialData();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/ai/chat-sessions");
      if (res.data.success) setSessions(res.data.sessions);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response?.data?.message || "Institute context missing. Cannot verify subscription features.");
      } else {
        console.error(err);
      }
    }
  };

  const loadSession = async (sessionId) => {
    try {
      setActiveSessionId(sessionId);
      const res = await api.get(`/ai/chat-sessions/${sessionId}`);
      if (res.data.success) {
        setMessages(res.data.session.messages || []);
        setSelectedCourse(res.data.session.courseId?._id || "");
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      }
    } catch {
      toast.error("Failed to load chat history");
    }
  };

  const createNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setQuestion("");
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/chat-sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (activeSessionId === sessionId) createNewSession();
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  const handleSubmit = async (e, overrideQuestion = null) => {
    if (e) e.preventDefault();
    const text = (overrideQuestion || question).trim();
    if (!text || isLoading) return;

    const tempMsg = {
      _id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setQuestion("");
    setIsLoading(true);

    try {
      let sid = activeSessionId;
      if (!sid) {
        const createRes = await api.post("/ai/chat-sessions", {
          courseId: selectedCourse || undefined,
        });
        sid = createRes.data.session._id;
        setActiveSessionId(sid);
      }
      const res = await api.post(`/ai/chat-sessions/${sid}/message`, {
        message: text,
      });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.reply]);
        fetchSessions();
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response?.data?.message || "Institute context missing. Cannot verify subscription features.");
      }
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now() + "err",
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessageWithCitations = (content, citations) => {
    if (!citations?.length) return content;
    let out = content;
    citations.forEach((_, i) => {
      out = out.replace(
        `[Source ${i + 1}]`,
        `<span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin-left:4px;font-size:9px;font-weight:900;color:white;background-color:${C.btnPrimary};border-radius:9999px;cursor:pointer;">${i + 1}</span>`,
      );
    });
    return out;
  };

  // ─── Toolbar Component ────────────────────────────────────────────────────
  const Toolbar = () => (
    <div className="w-full max-w-3xl flex items-center justify-between px-1 mb-3 flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Model Selector Badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-2 shrink-0 select-none"
          style={{
            backgroundColor: C.cardBg,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: R.xl,
            fontFamily: T.fontFamily,
            fontSize: T.size.xs,
            fontWeight: T.weight.bold,
            color: C.heading,
            boxShadow: S.card,
          }}
        >
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ backgroundColor: C.innerBg }}
          >
            <MdMessage style={{ width: 12, height: 12, color: C.btnPrimary }} />
          </div>
          GPT-4{" "}
          <MdKeyboardArrowDown
            style={{ width: 16, height: 16, color: C.textFaint }}
          />
        </div>

        {/* Course Context Dropdown */}
        <div className="relative shrink-0">
          <MdArticle
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: 14, height: 14, color: C.textFaint }}
          />
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              if (activeSessionId) toast.success("Context updated");
            }}
            className="appearance-none pl-8 pr-8 py-2 rounded-xl focus:outline-none transition-all cursor-pointer"
            style={{
              backgroundColor: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              color: C.heading,
              fontFamily: T.fontFamily,
              fontSize: T.size.xs,
              fontWeight: T.weight.bold,
              boxShadow: S.card,
            }}
          >
            <option value="">Ask from Course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
          <MdKeyboardArrowDown
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: 14, height: 14, color: C.textFaint }}
          />
        </div>
      </div>

      {/* Platform AI Badge */}
      <div
        className="flex items-center gap-1.5 px-3 py-2 text-white shadow-sm select-none"
        style={{
          background: C.gradientBtn,
          borderRadius: R.xl,
          fontFamily: T.fontFamily,
          fontSize: T.size.xs,
          fontWeight: T.weight.bold,
          boxShadow: S.btn,
        }}
      >
        <MdAutoAwesome style={{ width: 14, height: 14 }} />
        Sapience AI
      </div>
    </div>
  );

  return (
    <div
      className="flex h-[calc(100vh-64px)] overflow-hidden relative"
      style={{
        backgroundColor: C.pageBg,
        borderRadius: R["2xl"],
        fontFamily: T.fontFamily,
        ...pageStyle,
      }}
    >
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ══ SIDEBAR (CHAT HISTORY) ══════════════════════════════════════════ */}
      <aside
        className={`
    fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out
    md:relative md:translate-x-0 shrink-0
    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
`}
        style={{
          backgroundColor: "#4338CA",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          borderTopRightRadius: R["2xl"],
          borderBottomRightRadius: R["2xl"],
        }}
      >
        {/* Sidebar Header */}
        <div
          className="p-4 flex items-center gap-2 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <MdSchool style={{ width: 18, height: 18, color: "#ffffff" }} />
            </div>
            <span
              className="truncate"
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.base,
                fontWeight: T.weight.black,
                color: "#ffffff",
              }}
            >
              Sapience AI
            </span>
          </div>
          <button
            onClick={createNewSession}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer border-none"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#ffffff",
              fontFamily: T.fontFamily,
              fontSize: T.size.xs,
              fontWeight: T.weight.bold,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
            }}
          >
            <MdAdd style={{ width: 16, height: 16 }} /> New
          </button>
          <button
            className="md:hidden p-2 rounded-xl border-none cursor-pointer flex items-center justify-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "#ffffff",
            }}
            onClick={() => setIsSidebarOpen(false)}
          >
            <MdClose style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Session Stream Log List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          <p
            style={{
              fontFamily: T.fontFamily,
              fontSize: "10px",
              fontWeight: T.weight.black,
              textTransform: "uppercase",
              letterSpacing: T.tracking.widest,
              color: "rgba(255,255,255,0.4)",
              paddingLeft: 8,
              marginBottom: 12,
            }}
          >
            Chat History
          </p>

          {sessions.map((session) => (
            <div
              key={session._id}
              onClick={() => loadSession(session._id)}
              className="group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all"
              style={{
                backgroundColor:
                  activeSessionId === session._id
                    ? "rgba(255,255,255,0.15)"
                    : "transparent",
                color:
                  activeSessionId === session._id
                    ? "#ffffff"
                    : "rgba(255,255,255,0.6)",
              }}
              onMouseEnter={(e) => {
                if (activeSessionId !== session._id)
                  e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                if (activeSessionId !== session._id)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                <MdMessage
                  className="shrink-0"
                  style={{
                    width: 16,
                    height: 16,
                    color:
                      activeSessionId === session._id
                        ? "#ffffff"
                        : "rgba(255,255,255,0.4)",
                  }}
                />
                <span
                  style={{
                    fontFamily: T.fontFamily,
                    fontSize: T.size.xs,
                    fontWeight:
                      activeSessionId === session._id
                        ? T.weight.bold
                        : T.weight.medium,
                  }}
                  className="truncate"
                >
                  {session.title}
                </span>
              </div>

              <button
                onClick={(e) => deleteSession(e, session._id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#F87171";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                }}
              >
                <MdDelete style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div
          className="h-12 flex items-center px-4 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span
            style={{
              fontFamily: T.fontFamily,
              fontSize: "10px",
              fontWeight: T.weight.bold,
              color: "rgba(255,255,255,0.25)",
              textTransform: "uppercase",
              letterSpacing: T.tracking.widest,
            }}
          >
            Sapience AI v2.0
          </span>
        </div>
      </aside>

      <main
        className="flex-1 flex flex-col min-w-0 relative"
        style={{ backgroundColor: C.pageBg }}
      >
        {/* Mobile Navigation Header */}
        <div
          className="md:hidden flex items-center px-4 py-3 sticky top-0 z-10 shrink-0"
          style={{
            backgroundColor: C.cardBg,
            borderBottom: `1px solid ${C.cardBorder}`,
          }}
        >
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-1 rounded-xl border-none bg-transparent cursor-pointer flex items-center justify-center"
            style={{ color: C.btnPrimary }}
          >
            <MdMenu style={{ width: 20, height: 20 }} />
          </button>
          <div
            className="flex-1 text-center"
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size.base,
              fontWeight: T.weight.black,
              color: C.heading,
            }}
          >
            Sapience AI
          </div>
          <div className="w-8" />
        </div>

        {/* Screen Scroll Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 pt-8 pb-48 relative custom-scrollbar">
          {/* Gradient Ray Aura */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[700px] h-[350px] pointer-events-none -z-10"
            style={{
              background: `radial-gradient(ellipse at center top, ${C.innerBg} 0%, transparent 70%)`,
              opacity: 0.6,
            }}
          />

          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center max-w-3xl mx-auto w-full">
              {/* Empty State Presentation */}
              <div className="text-center mb-8">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md"
                  style={{ background: C.gradientBtn }}
                >
                  <MdAutoAwesome
                    style={{ width: 28, height: 28, color: "#ffffff" }}
                  />
                </div>
                <h1
                  style={{
                    fontFamily: T.fontFamily,
                    fontSize: T.size["2xl"],
                    fontWeight: T.weight.black,
                    color: C.heading,
                    marginBottom: 6,
                  }}
                >
                  Sapience AI Tutor
                </h1>
                <p
                  style={{
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    fontWeight: T.weight.medium,
                    color: C.textMuted,
                  }}
                >
                  Ask questions, generate notes, and solve complex problems
                  instantly.
                </p>
              </div>

              {/* Center Bar Layout input */}
              <div className="w-full mb-8">
                <div className="relative mb-4">
                  <MdSearch
                    className="absolute left-5 top-1/2 -translate-y-1/2"
                    style={{ width: 18, height: 18, color: C.textFaint }}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask anything..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmit(e);
                    }}
                    className="w-full h-14 pl-12 pr-14 rounded-2xl focus:outline-none transition-all"
                    style={{
                      backgroundColor: C.cardBg,
                      border: `1.5px solid ${C.cardBorder}`,
                      color: C.heading,
                      boxShadow: S.card,
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      fontWeight: T.weight.semibold,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.btnPrimary;
                      e.currentTarget.style.boxShadow = S.cardHover;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.cardBorder;
                      e.currentTarget.style.boxShadow = S.card;
                    }}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!question.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-white rounded-xl transition-all border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: C.gradientBtn }}
                  >
                    <MdSend style={{ width: 16, height: 16 }} />
                  </button>
                </div>
                <Toolbar />
              </div>

              {/* Suggestion Tokens */}
              <div className="w-full">
                <p
                  style={{
                    fontFamily: T.fontFamily,
                    fontSize: "11px",
                    fontWeight: T.weight.bold,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                    color: C.statLabel,
                    marginBottom: 12,
                    paddingLeft: 4,
                  }}
                >
                  Quick Prompt Templates
                </p>
                <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory custom-scrollbar">
                  {ACTION_CARDS.map((card, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        handleSubmit(
                          null,
                          `${card.title} ${card.subtitle}`,
                        ).trim()
                      }
                      className="shrink-0 flex items-center gap-3 w-[154px] p-4 rounded-2xl border transition-all snap-start text-left group border-none cursor-pointer"
                      style={{
                        backgroundColor: C.cardBg,
                        border: `1px solid ${C.cardBorder}`,
                        boxShadow: S.card,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = S.cardHover;
                        e.currentTarget.style.borderColor = C.btnPrimary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = S.card;
                        e.currentTarget.style.borderColor = C.cardBorder;
                      }}
                    >
                      <div
                        className="text-2xl transition-transform group-hover:scale-110"
                        style={{
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.06))",
                        }}
                      >
                        {card.icon}
                      </div>
                      <div className="flex flex-col leading-tight min-w-0 flex-1">
                        <span
                          className="truncate"
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.black,
                            color: C.heading,
                          }}
                        >
                          {card.title}
                        </span>
                        <span
                          className="truncate"
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: "11px",
                            fontWeight: T.weight.bold,
                            color: C.textMuted,
                          }}
                        >
                          {card.subtitle}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Flow Message Container logs */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className="w-full">
                  {msg.role === "user" ? (
                    <div className="flex justify-end w-full">
                      <div className="max-w-[85%]">
                        <div
                          className="px-5 py-3.5 text-white shadow-sm"
                          style={{
                            background: C.gradientBtn,
                            borderRadius: "20px 24px 4px 20px",
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.semibold,
                            lineHeight: T.leading.relaxed,
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3.5 w-full">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                        style={{ background: C.gradientBtn }}
                      >
                        <MdSmartToy
                          style={{ width: 18, height: 18, color: "#ffffff" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: T.size.xs,
                              fontWeight: T.weight.black,
                              color: C.heading,
                            }}
                          >
                            Sapience AI
                          </span>
                          {msg.contextUsed && (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full select-none"
                              style={{
                                backgroundColor: C.successBg,
                                color: C.success,
                                border: `1px solid ${C.successBorder}`,
                                fontFamily: T.fontFamily,
                                fontSize: "10px",
                                fontWeight: T.weight.black,
                                textTransform: "uppercase",
                                letterSpacing: T.tracking.wider,
                              }}
                            >
                              <MdArticle style={{ width: 12, height: 12 }} />{" "}
                              RAG Context
                            </span>
                          )}
                        </div>
                        <div
                          className="rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm"
                          style={{
                            backgroundColor: C.cardBg,
                            border: `1px solid ${C.cardBorder}`,
                            color: C.text,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            lineHeight: T.leading.relaxed,
                          }}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: formatMessageWithCitations(
                                msg.content.replace(/\n/g, "<br />"),
                                msg.citations,
                              ),
                            }}
                          />
                        </div>

                        {/* Citations block footprint */}
                        {msg.citations?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.citations.map((c, ci) => (
                              <div
                                key={ci}
                                className="flex items-start gap-2 px-3 py-2 rounded-xl"
                                style={{
                                  backgroundColor: C.innerBg,
                                  border: `1px solid ${C.cardBorder}`,
                                }}
                              >
                                <span
                                  className="text-white rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                  style={{
                                    backgroundColor: C.btnPrimary,
                                    width: 16,
                                    height: 16,
                                    fontFamily: T.fontFamily,
                                    fontSize: "9px",
                                    fontWeight: T.weight.black,
                                  }}
                                >
                                  {ci + 1}
                                </span>
                                <span
                                  style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                    color: C.btnPrimary,
                                  }}
                                >
                                  {c.text || c}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator Status */}
              {isLoading && (
                <div className="flex items-start gap-3.5 w-full">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: C.gradientBtn }}
                  >
                    <MdSmartToy
                      style={{ width: 18, height: 18, color: "#ffffff" }}
                    />
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm flex items-center justify-center"
                    style={{
                      backgroundColor: C.cardBg,
                      border: `1px solid ${C.cardBorder}`,
                    }}
                  >
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Lower Output Console Input bar */}
        {messages.length > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-3 shrink-0"
            style={{
              background: `linear-gradient(to top, ${C.pageBg} 75%, transparent)`,
            }}
          >
            <div className="max-w-3xl mx-auto">
              <Toolbar />
              <div
                className="flex items-center gap-2 rounded-2xl px-4 py-2 transition-all duration-200 focus-within:border-indigo-500"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1.5px solid ${C.cardBorder}`,
                  boxShadow: S.card,
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="flex-1 bg-transparent focus:outline-none py-2 px-1"
                  style={{
                    color: C.heading,
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    fontWeight: T.weight.semibold,
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!question.trim() || isLoading}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl transition-all border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  style={{
                    background: C.gradientBtn,
                    fontFamily: T.fontFamily,
                    fontSize: T.size.sm,
                    fontWeight: T.weight.bold,
                  }}
                >
                  {isLoading ? (
                    <MdHourglassEmpty className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <MdSend style={{ width: 14, height: 14 }} />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2.5 opacity-40 select-none">
                <MdInfoOutline
                  style={{ width: 12, height: 12, color: C.text }}
                />
                <p
                  className="text-center m-0"
                  style={{
                    fontFamily: T.fontFamily,
                    fontSize: "10px",
                    fontWeight: T.weight.bold,
                    color: C.text,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                  }}
                >
                  Sapience AI can make mistakes. Verify important metrics.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
