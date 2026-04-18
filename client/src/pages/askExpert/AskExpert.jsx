import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import "./askExpert.css";
import { Context } from "../../context/Context";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AI_NAME = "AgroAI Expert";
const AI_AVATAR = "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=agroai&backgroundColor=d1fae5";

const SUGGESTED = [
  "How do I deal with aphid infestations?",
  "Best crops for clay soil?",
  "Organic fertilizer recommendations",
  "How to improve crop yield?",
  "Irrigation tips for dry seasons",
  "Signs of nutrient deficiency in plants",
];

const TOPICS = [
  { icon: "fas fa-bug", label: "Pest Control" },
  { icon: "fas fa-seedling", label: "Crop Growth" },
  { icon: "fas fa-tint", label: "Irrigation" },
  { icon: "fas fa-leaf", label: "Soil Health" },
  { icon: "fas fa-cloud-sun", label: "Weather & Climate" },
  { icon: "fas fa-microscope", label: "Plant Disease" },
];

export default function AskExpert() {
  const { user } = useContext(Context);
  const navigate = useNavigate();

  const getInitialMessages = () => ([
    {
      id: 1,
      from: "ai",
      text: "Hello! I'm **AgroAI**, your personal agricultural expert. I'm here to help you with crop management, soil health, pest control, irrigation, and much more. What would you like to know today?",
      time: new Date(),
    },
  ]);

  const [activeTab, setActiveTab] = useState("chatbot"); // "chatbot" | "experts"
  const [messages, setMessages] = useState(getInitialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeConv, setActiveConv] = useState(null); // conversation _id

  const [chatConversations, setChatConversations] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [expertQuestionText, setExpertQuestionText] = useState("");
  const [expertQuestions, setExpertQuestions] = useState([]);
  const [expertLoading, setExpertLoading] = useState(false);
  const [expertError, setExpertError] = useState("");
  const [highlightQuestionId, setHighlightQuestionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const ignoreNextConversationLoadRef = useRef(false);

  const getOrCreateGuestKey = () => {
    try {
      const keyName = "agrolink_guest_key";
      const existing = localStorage.getItem(keyName);
      if (existing) return existing;
      const created = (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + Math.random().toString(16).slice(2));
      localStorage.setItem(keyName, created);
      return created;
    } catch {
      return "guest";
    }
  };

  const ownerKey = user?._id ? `user:${user._id}` : `guest:${getOrCreateGuestKey()}`;

  useEffect(() => {
    // Owner changed (login/logout) — reset chat UI state to avoid mixing histories
    setActiveConv(null);
    setChatConversations([]);
    setChatError("");
    setMessages(getInitialMessages());
  }, [ownerKey]);

  const fetchChatConversations = useCallback(async ({ silent } = { silent: false }) => {
    if (!silent) {
      setChatLoading(true);
      setChatError("");
    }

    try {
      const res = await axios.get("/chatbot/conversations", {
        params: { ownerKey, limit: 50 }
      });
      const convs = Array.isArray(res.data) ? res.data : [];
      setChatConversations(convs);
      if (!activeConv && convs.length > 0) {
        setActiveConv(convs[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
      if (!silent) setChatError("Failed to load chat history.");
    } finally {
      if (!silent) setChatLoading(false);
    }
  }, [ownerKey, activeConv]);

  const loadConversation = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages(getInitialMessages());
      return;
    }

    try {
      const res = await axios.get(`/chatbot/conversations/${conversationId}`, {
        params: { ownerKey }
      });
      const conv = res.data;
      const convMessages = Array.isArray(conv?.messages) ? conv.messages : [];
      const mapped = convMessages
        .filter((m) => m?.text)
        .map((m, idx) => ({
          id: Date.now() + idx,
          from: m.from,
          text: m.text,
          time: m.createdAt ? new Date(m.createdAt) : new Date(),
        }));
      setMessages([...getInitialMessages(), ...mapped]);
    } catch (err) {
      console.error("Failed to load conversation", err);
      setMessages(getInitialMessages());
    }
  }, [ownerKey]);

  const createNewConversation = useCallback(async () => {
    try {
      const res = await axios.post("/chatbot/conversations", {
        ownerKey,
        username: user?.username || "Guest",
        title: "New Conversation",
      });
      const conv = res.data;
      await fetchChatConversations({ silent: true });
      if (conv?._id) {
        ignoreNextConversationLoadRef.current = true;
        setActiveConv(conv._id);
      } else {
        setActiveConv(null);
      }
      setMessages(getInitialMessages());
    } catch (err) {
      console.error("Failed to create conversation", err);
      ignoreNextConversationLoadRef.current = false;
      // fallback: still allow chatting in-memory
      setMessages(getInitialMessages());
    }
  }, [ownerKey, user?.username, fetchChatConversations]);

  const deleteConversation = useCallback(async (convId, e) => {
    e.stopPropagation(); // don't trigger the select-conversation click
    if (!convId) return;
    try {
      await axios.delete(`/chatbot/conversations/${convId}`, { params: { ownerKey } });
      // If the deleted conv was active, reset to empty chat
      if (activeConv === convId) {
        setActiveConv(null);
        setMessages(getInitialMessages());
      }
      await fetchChatConversations({ silent: true });
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  }, [ownerKey, activeConv, fetchChatConversations]);

  useEffect(() => {
    if (activeTab !== "chatbot") return;
    fetchChatConversations({ silent: false });
    const interval = setInterval(() => {
      fetchChatConversations({ silent: true });
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab, fetchChatConversations]);

  useEffect(() => {
    if (activeTab !== "chatbot") return;
    if (ignoreNextConversationLoadRef.current) return;
    loadConversation(activeConv);
  }, [activeTab, activeConv, loadConversation]);

  useEffect(() => {
    if (!ignoreNextConversationLoadRef.current) return;
    ignoreNextConversationLoadRef.current = false;
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!user) return;
    const pending = sessionStorage.getItem("pendingExpertQuestion");
    if (pending && !expertQuestionText) {
      setExpertQuestionText(pending);
      sessionStorage.removeItem("pendingExpertQuestion");
    }
  }, [user, expertQuestionText]);

  const normalizeForMatch = (text) => (text || "")
    .toString()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  const isDontKnowResponse = (botResponse) => {
    const t = normalizeForMatch(botResponse);
    if (!t) return false;

    const patterns = [
      "don't have a specific answer",
      "im not sure",
      "i'm not sure",
      "don't have detailed information",
      "consulting with local agricultural experts",
      "reach out to agricultural extension",
      "extension services",
      "please rephrase your question",
      "specialized advice",
    ];

    return patterns.some((p) => t.includes(p));
  };

  const formatDateTime = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString([], { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const pickBestAnswer = (q) => {
    const answers = Array.isArray(q?.answers) ? q.answers : [];
    if (answers.length === 0) return null;
    return answers.find((a) => a?.isAccepted) || answers[0];
  };

  const fetchExpertQuestions = useCallback(async ({ silent } = { silent: false }) => {
    const username = user?.username;
    if (!username) return;
    if (!silent) {
      setExpertLoading(true);
      setExpertError("");
    }

    try {
      const res = await axios.get("/questions", {
        params: { username, limit: 50 }
      });
      setExpertQuestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch expert questions", err);
      if (!silent) setExpertError("Failed to load expert questions.");
    } finally {
      if (!silent) setExpertLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    if (activeTab !== "experts" || !user?.username) return;
    fetchExpertQuestions({ silent: false });
    const interval = setInterval(() => {
      fetchExpertQuestions({ silent: true });
    }, 12000);
    return () => clearInterval(interval);
  }, [activeTab, user?.username, fetchExpertQuestions]);

  const submitExpertQuestion = async (questionText) => {
    const q = (questionText || "").trim();
    if (!q) return null;

    if (!user?.username) {
      sessionStorage.setItem("pendingExpertQuestion", q);
      setActiveTab("experts");
      return null;
    }

    setExpertError("");
    try {
      const res = await axios.post("/chatbot/ask-expert", {
        question: q,
        username: user.username,
        category: "General",
      });

      const createdId = res?.data?.question?._id || null;
      if (createdId) setHighlightQuestionId(createdId);
      await fetchExpertQuestions({ silent: true });
      return createdId;
    } catch (err) {
      console.error("Failed to submit expert question", err);
      setExpertError("Failed to submit your question to experts.");
      return null;
    }
  };


  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    // Ensure we have a conversation id so messages can be persisted
    let conversationId = activeConv;
    if (!conversationId) {
      try {
        const res = await axios.post("/chatbot/conversations", {
          ownerKey,
          username: user?.username || "Guest",
          title: "New Conversation",
        });
        conversationId = res.data?._id || null;
        if (conversationId) {
          ignoreNextConversationLoadRef.current = true;
          setActiveConv(conversationId);
        }
        await fetchChatConversations({ silent: true });
      } catch (err) {
        console.error("Failed to initialize conversation", err);
      }
    }

    const userMsg = { id: Date.now(), from: "user", text: msg, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await axios.get("/chatbot/chat", {
        params: {
          message: msg,
          username: user?.username || "Guest",
          conversationId: conversationId || undefined,
          ownerKey: conversationId ? ownerKey : undefined,
        }
      });

      const aiMsg = {
        id: Date.now() + 1,
        from: "ai",
        text: res.data.botResponse || "Sorry, I could not understand that.",
        time: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Refresh chat list ordering (updatedAt)
      if (conversationId) {
        fetchChatConversations({ silent: true });
      }
    } catch (err) {
      console.error("Chatbot Error:", err);
      const serverMsg = err?.response?.data?.error;
      const errorMsg = {
        id: Date.now() + 1,
        from: "ai",
        text: serverMsg || "Sorry, I am having trouble connecting to my service right now. Please try again later.",
        time: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ── Code copy helper ──────────────────────────────────────────────────────
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyCode = (code, idx) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // ── Markdown renderer ─────────────────────────────────────────────────────
  const renderMarkdown = (text, msgId) => {
    if (!text) return null;
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    const elements = [];
    let lastIndex = 0;
    let blockIdx = 0;
    let match;

    const renderInline = (str) => {
      const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="ae-inline-code">{part.slice(1, -1)}</code>;
        }
        return part;
      });
    };

    const renderTextBlock = (block, keyPrefix) => {
      const lines = block.split("\n");
      return lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const isNumbered = /^\d+\.\s/.test(trimmed);
        const isBullet = /^[-*]\s/.test(trimmed);
        const content = isNumbered
          ? trimmed.replace(/^\d+\.\s/, "")
          : isBullet
            ? trimmed.replace(/^[-*]\s/, "")
            : trimmed;
        return (
          <span key={`${keyPrefix}-${i}`} className={isNumbered || isBullet ? "ae-md-list-item" : "ae-md-p"}>
            {isNumbered && <span className="ae-md-list-num">{trimmed.match(/^\d+/)[0]}.</span>}
            {isBullet && <span className="ae-md-list-bullet">•</span>}
            {renderInline(content)}
          </span>
        );
      }).filter(Boolean);
    };

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const lang = (match[1] || "code").toLowerCase();
      const code = match[2];
      const copyKey = `${msgId}-${blockIdx}`;

      if (match.index > lastIndex) {
        const before = text.slice(lastIndex, match.index);
        elements.push(
          <span key={`text-${blockIdx}`} className="ae-md-text">
            {renderTextBlock(before, `b-${blockIdx}`)}
          </span>
        );
      }

      elements.push(
        <div key={`code-${blockIdx}`} className="ae-code-block">
          <div className="ae-code-header">
            <span className="ae-code-lang">{lang}</span>
            <button
              className={"ae-code-copy" + (copiedIndex === copyKey ? " copied" : "")}
              onClick={() => copyCode(code, copyKey)}
              title="Copy code"
              type="button"
            >
              <i className={copiedIndex === copyKey ? "fas fa-check" : "fas fa-copy"}></i>
              {copiedIndex === copyKey ? " Copied!" : " Copy"}
            </button>
          </div>
          <pre className="ae-code-pre"><code className={`ae-code-content lang-${lang}`}>{code}</code></pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
      blockIdx++;
    }

    if (lastIndex < text.length) {
      const after = text.slice(lastIndex);
      elements.push(
        <span key="text-end" className="ae-md-text">
          {renderTextBlock(after, "end")}
        </span>
      );
    }

    return elements.length > 0 ? elements : renderTextBlock(text, "only");
  };

  return (
    <div className="ae-page-wrapper fadeIn">
      <div className="ae-root">
        {/* Left Sidebar */}
        <aside className="ae-sidebar glass-panel">
          <div className="ae-sidebar-header">
            <div className="ae-sidebar-logo">
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <h3 className="ae-sidebar-title">AgroAI</h3>
              <span className="ae-sidebar-subtitle">Expert Assistant</span>
            </div>
          </div>

          {/* Mode Switcher in Sidebar */}
          <div className="ae-sidebar-tabs">
            <button
              className={"ae-sidebar-tab-btn" + (activeTab === "chatbot" ? " active" : "")}
              onClick={() => setActiveTab("chatbot")}
              type="button"
            >
              <i className="fas fa-robot"></i>
              <span>Chatbot</span>
            </button>
            <button
              className={"ae-sidebar-tab-btn" + (activeTab === "experts" ? " active" : "")}
              onClick={() => setActiveTab("experts")}
              type="button"
            >
              <i className="fas fa-user-graduate"></i>
              <span>Experts</span>
            </button>
          </div>

          {activeTab === "chatbot" && (
            <>
              <button
                className="ae-new-btn"
                onClick={() => {
                  ignoreNextConversationLoadRef.current = true;
                  createNewConversation();
                }}
                type="button"
              >
                <i className="fas fa-plus"></i> New Conversation
              </button>

              <div className="ae-sidebar-section">
                <p className="ae-sidebar-section-label">Recent Chats</p>
                {chatError && <p className="ae-sidebar-error">{chatError}</p>}
                {chatLoading && <p className="ae-sidebar-loading">Loading…</p>}
                {chatConversations.map((c) => (
                  <div
                    key={c._id}
                    className={"ae-conv-item" + (activeConv === c._id ? " active" : "")}
                    onClick={() => {
                      setActiveTab("chatbot");
                      setActiveConv(c._id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setActiveConv(c._id)}
                  >
                    <i className="fas fa-comment-dots"></i>
                    <span className="ae-conv-title">{c.title || "Conversation"}</span>
                    <button
                      className="ae-conv-delete"
                      onClick={(e) => deleteConversation(c._id, e)}
                      title="Delete conversation"
                      type="button"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="ae-sidebar-section">
                <p className="ae-sidebar-section-label">Browse Topics</p>
                <div className="ae-topics-grid">
                  {TOPICS.map((t) => (
                    <button
                      key={t.label}
                      className="ae-topic-chip"
                      onClick={() => {
                        setActiveTab("chatbot");
                        sendMessage("Tell me about " + t.label);
                      }}
                      type="button"
                    >
                      <i className={t.icon}></i>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="ae-sidebar-footer">
            <div className="ae-user-row">
              <div className="ae-user-avatar">
                {user?.profilePic ? (
                  <img src={user.profilePic.startsWith("http") ? user.profilePic : "http://localhost:5000/images/" + user.profilePic} alt="You" />
                ) : (
                  <i className="fas fa-user"></i>
                )}
              </div>
              <div>
                <p className="ae-user-name">{user?.username || "Guest"}</p>
                <p className="ae-user-role">Community Member</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="ae-main">


          {/* Chat Header */}
          <div className="ae-chat-header glass-panel">
            <div className="ae-chat-header-left">
              {activeTab === "chatbot" ? (
                <img src={AI_AVATAR} alt="AI" className="ae-ai-avatar" />
              ) : (
                <div className="ae-expert-avatar">
                  <i className="fas fa-user-graduate"></i>
                </div>
              )}
              <div>
                <h4 className="ae-chat-name">{activeTab === "chatbot" ? AI_NAME : "Expert Farmers"}</h4>
                {activeTab === "chatbot" ? (
                  <span className="ae-chat-status">
                    <span className="ae-status-dot"></span> Online &amp; Ready
                  </span>
                ) : (
                  <span className="ae-chat-status">Ask a question and get replies from experts</span>
                )}
              </div>
            </div>
            <div className="ae-chat-header-right">
              {activeTab === "chatbot" && (
                <button
                  className="ae-header-icon-btn"
                  title="Clear chat"
                  onClick={async () => {
                    setMessages(getInitialMessages());
                    if (activeConv) {
                      try {
                        await axios.put(`/chatbot/conversations/${activeConv}/clear`, null, {
                          params: { ownerKey }
                        });
                        fetchChatConversations({ silent: true });
                      } catch (err) {
                        console.error("Failed to clear conversation", err);
                      }
                    }
                  }}
                  type="button"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              )}
            </div>
          </div>

          {activeTab === "chatbot" ? (
            <>
              {/* Messages */}
              <div className="ae-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={"ae-msg-row" + (msg.from === "user" ? " user" : "")}>
                    {msg.from === "ai" && (
                      <img src={AI_AVATAR} alt="AI" className="ae-msg-avatar" />
                    )}
                    <div className={"ae-bubble" + (msg.from === "user" ? " user" : " ai")}>
                      {msg.from === "user" ? (
                        <p className="ae-bubble-text">{msg.text}</p>
                      ) : (
                        <div className="ae-bubble-text ae-bubble-markdown">
                          {renderMarkdown(msg.text, msg.id)}
                        </div>
                      )}
                      <span className="ae-bubble-time">{formatTime(msg.time)}</span>
                    </div>
                    {msg.from === "user" && (
                      <div className="ae-user-msg-avatar">
                        {user?.profilePic ? (
                          <img src={user.profilePic.startsWith("http") ? user.profilePic : "http://localhost:5000/images/" + user.profilePic} alt="You" />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="ae-msg-row">
                    <img src={AI_AVATAR} alt="AI" className="ae-msg-avatar" />
                    <div className="ae-bubble ai ae-typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {messages.length === 1 && (
                <div className="ae-suggestions">
                  <p className="ae-suggestions-label">Suggested questions</p>
                  <div className="ae-suggestions-chips">
                    {SUGGESTED.map((s) => (
                      <button key={s} className="ae-suggestion-chip" onClick={() => sendMessage(s)} type="button">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Bar */}
              <div className="ae-input-bar glass-panel">
                <textarea
                  ref={inputRef}
                  className="ae-input"
                  placeholder="Ask about crops, pests, soil, irrigation..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                  disabled={isTyping}
                />
                <button
                  className={"ae-send-btn" + (input.trim() ? " active" : "")}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  aria-label="Send message"
                  type="button"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
              <p className="ae-disclaimer">AgroAI may produce inaccurate information. Always consult a certified agronomist for critical decisions.</p>
            </>
          ) : (
            <section className="ae-experts">
              {!user ? (
                <div className="ae-expert-login glass-panel">
                  <h3 className="ae-expert-title">Log in to ask experts</h3>
                  <p className="ae-expert-subtitle">Expert answers are linked to your account so you can view replies later.</p>
                  <button className="ae-expert-login-btn" onClick={() => navigate("/login")} type="button">
                    Go to Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="ae-expert-ask glass-panel">
                    <h3 className="ae-expert-title">Ask an expert</h3>
                    <p className="ae-expert-subtitle">If the chatbot can’t answer, experts will respond here.</p>
                    <div className="ae-expert-form">
                      <textarea
                        className="ae-expert-input"
                        value={expertQuestionText}
                        onChange={(e) => setExpertQuestionText(e.target.value)}
                        placeholder="Type your question for expert farmers…"
                        rows={3}
                      />
                      <div className="ae-expert-actions">
                        <button
                          className="ae-expert-submit"
                          disabled={!expertQuestionText.trim()}
                          onClick={async () => {
                            const q = expertQuestionText;
                            setExpertQuestionText("");
                            await submitExpertQuestion(q);
                          }}
                          type="button"
                        >
                          Submit
                        </button>
                      </div>
                      {expertError && <p className="ae-expert-error">{expertError}</p>}
                    </div>
                  </div>

                  <div className="ae-expert-list">
                    <div className="ae-expert-list-header">
                      <h3>Your expert questions</h3>
                      {expertLoading && <span className="ae-expert-loading">Loading…</span>}
                    </div>

                    {expertQuestions.length === 0 && !expertLoading ? (
                      <div className="ae-expert-empty glass-panel">
                        <p>No expert questions yet.</p>
                      </div>
                    ) : (
                      expertQuestions.map((q) => {
                        const best = pickBestAnswer(q);
                        const isHighlighted = highlightQuestionId && q?._id === highlightQuestionId;

                        return (
                          <div
                            key={q._id}
                            className={"ae-expert-card glass-panel" + (isHighlighted ? " highlight" : "")}
                          >
                            <div className="ae-expert-qhead">
                              <div>
                                <p className="ae-expert-question">{q.question}</p>
                                <p className="ae-expert-meta">
                                  <span className={"ae-expert-status status-" + (q.status || "Pending").toLowerCase()}>{q.status || "Pending"}</span>
                                  <span className="ae-expert-date">{formatDateTime(q.createdAt)}</span>
                                </p>
                              </div>
                            </div>

                            {best ? (
                              <div className="ae-expert-answer">
                                <p className="ae-expert-answer-label">Expert reply</p>
                                <p className="ae-expert-answer-text">{best.answer}</p>
                                <p className="ae-expert-meta">By {best.username}{best.createdAt ? ` • ${formatDateTime(best.createdAt)}` : ""}</p>
                              </div>
                            ) : (
                              <div className="ae-expert-answer pending">
                                <p className="ae-expert-answer-label">No reply yet</p>
                                <p className="ae-expert-answer-text">An expert will respond soon.</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
