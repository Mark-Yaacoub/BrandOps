"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Bot, User, Loader2, TrendingUp, DollarSign, Package, CheckSquare, BarChart3, Plus, MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: any[];
  _count: { messages: number };
}

const quickQuestions = [
  {
    icon: TrendingUp,
    label: "Sales Analysis",
    question: "Analyze my sales for the last 30 days",
  },
  {
    icon: DollarSign,
    label: "Expenses Report",
    question: "What are my biggest expenses?",
  },
  {
    icon: Package,
    label: "Product Performance",
    question: "Which products are most profitable?",
  },
  {
    icon: CheckSquare,
    label: "Task Overview",
    question: "Show me task completion rate",
  },
  {
    icon: BarChart3,
    label: "Business Summary",
    question: "Give me a business overview",
  },
];

export default function AIAssistantPage() {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI assistant for BrandOps. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch all sessions
  const { data: sessionsData } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/chat-sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      setCurrentSessionId(data.session.id);
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! I'm your AI assistant for BrandOps. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    },
  });

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await fetch(`/api/chat-sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (currentSessionId) {
        setCurrentSessionId(null);
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your AI assistant for BrandOps. How can I help you today?",
            timestamp: new Date(),
          },
        ]);
      }
    },
  });

  // Rename session
  const renameSessionMutation = useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: number; title: string }) => {
      const res = await fetch(`/api/chat-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to rename session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      setEditingSessionId(null);
      setEditingTitle("");
    },
  });

  // Load session messages
  const loadSession = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/chat-sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to load session");
      const data = await res.json();
      
      const loadedMessages: Message[] = data.session.messages.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));

      setMessages(loadedMessages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId: number | null }) => {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });
      if (!res.ok) throw new Error("Failed to get response");
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
      
      // Refresh sessions list to update timestamp
      if (currentSessionId) {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    const messageToSend = input;
    setInput("");

    // Create new session if none exists, then send message
    if (!currentSessionId) {
      try {
        const res = await fetch("/api/chat-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Chat" }),
        });
        const data = await res.json();
        if (data.success) {
          const newSessionId = data.session.id;
          setCurrentSessionId(newSessionId);
          queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
          // Send message with new session ID
          chatMutation.mutate({ message: messageToSend, sessionId: newSessionId });
        }
      } catch (error) {
        console.error("Error creating session:", error);
      }
    } else {
      chatMutation.mutate({ message: messageToSend, sessionId: currentSessionId });
    }
  };

  const handleQuickQuestion = async (question: string) => {
    if (chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Create new session if none exists, then send message
    if (!currentSessionId) {
      try {
        const res = await fetch("/api/chat-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Chat" }),
        });
        const data = await res.json();
        if (data.success) {
          const newSessionId = data.session.id;
          setCurrentSessionId(newSessionId);
          queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
          // Send message with new session ID
          chatMutation.mutate({ message: question, sessionId: newSessionId });
        }
      } catch (error) {
        console.error("Error creating session:", error);
      }
    } else {
      chatMutation.mutate({ message: question, sessionId: currentSessionId });
    }
  };

  const handleNewChat = () => {
    // Just reset to new chat UI, don't create session yet
    setCurrentSessionId(null);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm your AI assistant for BrandOps. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Chat History Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sessionsData?.sessions?.map((session: ChatSession) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 p-3 rounded-lg transition-colors ${
                  currentSessionId === session.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                {editingSessionId === session.id ? (
                  // Editing Mode
                  <div className="flex-1 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          renameSessionMutation.mutate({ sessionId: session.id, title: editingTitle });
                        } else if (e.key === "Escape") {
                          setEditingSessionId(null);
                          setEditingTitle("");
                        }
                      }}
                      className="flex-1 text-sm font-medium px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => renameSessionMutation.mutate({ sessionId: session.id, title: editingTitle })}
                      className="p-1 hover:bg-green-100 rounded transition-all"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSessionId(null);
                        setEditingTitle("");
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-all"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div
                      onClick={() => loadSession(session.id)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {session._count.messages} messages
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(session.id);
                          setEditingTitle(session.title);
                        }}
                        className="p-1 hover:bg-blue-100 rounded transition-all"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this chat?")) {
                            deleteSessionMutation.mutate(session.id);
                          }
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-sm text-gray-500">
                Ask me anything about products, tasks, or reports
              </p>
            </div>
          </div>
        </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Quick Questions - Show only when no messages except welcome */}
          {messages.length === 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Questions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quickQuestions.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(item.question)}
                      disabled={chatMutation.isPending}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                        <Icon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.question}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.role === "user"
                    ? "bg-blue-600"
                    : "bg-gradient-to-br from-blue-500 to-purple-600"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 max-w-2xl ${
                  message.role === "user" ? "text-right" : ""
                }`}
              >
                <div
                  className={`inline-block px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-2">
                  {message.timestamp.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {chatMutation.isPending && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={chatMutation.isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
