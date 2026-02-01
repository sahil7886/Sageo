import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

// API base URL - uses relative path (works with Vite proxy in dev)
const API_BASE_URL = '';

const AGENT_NAME = "WeatherBot";
const AGENT_AVATAR = "🌤️";
const AGENT_SAGEO_ID = "agent_1";
const DEFAULT_PROMPT = "Should I invest in outdoor equipment?";

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  interactionId?: string | null;
}

const Demo = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState(DEFAULT_PROMPT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentsReady, setAgentsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if agents are running on mount and periodically
  useEffect(() => {
    checkAgentsStatus();
    const interval = setInterval(checkAgentsStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkAgentsStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/demo/status`);
      const data = await res.json();
      setAgentsReady(data.running);
    } catch (err) {
      console.error('Failed to check agent status:', err);
      setAgentsReady(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    if (!agentsReady) {
      setError('Please start the A2A agents first (see instructions below)');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    setError(null);

    // Show loading state
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'agent',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Send to real WeatherBot agent
      const res = await fetch(`${API_BASE_URL}/demo/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Request failed: ${res.status}`);
      }

      const data = await res.json();

      // Remove loading and add real response
      const agentResponse: Message = {
        id: `response-${Date.now()}`,
        role: 'agent',
        content: data.message,
        timestamp: new Date(),
        interactionId: data.interactionId
      };

      setMessages(prev => 
        prev.filter(m => !m.isLoading).concat(agentResponse)
      );
    } catch (err) {
      setMessages(prev => prev.filter(m => !m.isLoading));
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInputValue(DEFAULT_PROMPT);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                to="/" 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#17a1cf]/20 to-[#17a1cf]/5 flex items-center justify-center text-2xl">
                {AGENT_AVATAR}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-gray-900">{AGENT_NAME}</h1>
                  {agentsReady && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Live
                    </span>
                  )}
                  {!agentsReady && !isChecking && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      Offline
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {agentsReady ? 'Connected to A2A agents' : 'Agents not running'}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Reset conversation"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Setup Instructions Banner */}
      {!agentsReady && !isChecking && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 mt-0.5">info</span>
              <div className="flex-1">
                <h3 className="font-medium text-amber-900 mb-1">Start the A2A Agents</h3>
                <p className="text-sm text-amber-800 mb-2">
                  To use this demo, you need to start the A2A flow agents in a separate terminal:
                </p>
                <code className="block bg-amber-100 text-amber-900 px-3 py-2 rounded text-sm font-mono mb-2">
                  cd a2a-flow && npm run start
                </code>
                <p className="text-xs text-amber-700">
                  This starts WeatherBot on port 4101 and StockTrader on port 4102
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-red-700">
            <span className="material-symbols-outlined">error</span>
            <span className="text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#17a1cf]/20 to-[#17a1cf]/5 flex items-center justify-center text-3xl mb-4">
                {AGENT_AVATAR}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {AGENT_NAME}
              </h2>
              <p className="text-gray-500 max-w-sm mb-4">
                Real A2A agent demo powered by Sageo SDK on MOI blockchain.
              </p>
              {!agentsReady && (
                <div className="text-sm text-gray-400">
                  Waiting for agents to start...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 
                    message.role === 'system' ? 'justify-center' : 'justify-start'
                  }`}
                >
                  {message.role === 'system' ? (
                    <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm">
                      {message.content}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-[#17a1cf] text-white rounded-2xl rounded-tr-sm'
                          : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'
                      } px-4 py-3`}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-sm text-gray-600 italic">
                            Consulting StockTrader for market sentiment...
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                          {message.interactionId && (
                            <Link 
                              to={`/agent/${AGENT_SAGEO_ID}`}
                              className="inline-flex items-center gap-1 text-xs text-[#17a1cf] hover:underline"
                            >
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              Sageo: {message.interactionId}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-gray-100 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-[#17a1cf] focus-within:ring-2 focus-within:ring-[#17a1cf]/20 transition-all">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={agentsReady ? "Type your message..." : "Start agents to begin..."}
              rows={1}
              disabled={!agentsReady || isProcessing}
              className="flex-1 bg-transparent px-4 py-3 text-gray-900 placeholder-gray-400 resize-none outline-none text-sm disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isProcessing || !agentsReady}
              className="h-11 w-11 shrink-0 flex items-center justify-center bg-[#17a1cf] text-white rounded-xl hover:bg-[#0f6b8a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {agentsReady ? 'Press Enter to send, Shift+Enter for new line' : 'Start agents to enable messaging'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Demo;
