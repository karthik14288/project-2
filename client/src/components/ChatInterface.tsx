import React, { useState, useRef, useEffect } from 'react';
import { DomainLens, ChatMessage, Citation } from '../types/index.js';
import { queryReasoningEngineApi } from '../lib/api.js';
import { CitationBadge } from './CitationBadge.js';
import { Send, Sparkles, Bot, User, Layers, RefreshCw } from 'lucide-react';
import { LENS_CONFIGS } from './LensSelector.js';

interface ChatInterfaceProps {
  activeLens: DomainLens;
  onCitationClick: (citation: Citation) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  activeLens,
  onCitationClick
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRawChunks, setShowRawChunks] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message tailored to current lens
  useEffect(() => {
    const welcomeId = `welcome-${activeLens}`;
    const lensTitle = LENS_CONFIGS[activeLens]?.title || activeLens;

    setMessages([
      {
        id: welcomeId,
        sender: 'assistant',
        content: `**Welcome to Unify Reasoning Studio!** Currently operating under the **${lensTitle}** domain lens.

I can ingest and cross-reference your audio memos, video recordings, scanned PDFs, and drone or pathology images together into a unified vector space.

Ask a question to see real-time multimodal synthesis with verifiable citation trails.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lens: activeLens
      }
    ]);
  }, [activeLens]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (userQuery?: string) => {
    const textToSend = userQuery || queryInput.trim();
    if (!textToSend || isLoading) return;

    const userMsgId = crypto.randomUUID();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lens: activeLens
    };

    setMessages(prev => [...prev, newUserMsg]);
    setQueryInput('');
    setIsLoading(true);

    try {
      const response = await queryReasoningEngineApi(textToSend, activeLens);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: response.answer_markdown,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: response.citations,
        retrieved_chunks: response.retrieved_chunks,
        lens: activeLens
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Query error:', err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: `⚠️ **Cross-Modal Query Notice**: ${err.message || 'Unable to complete reasoning synthesis.'}\n\nPlease verify that files have been uploaded and indexed in the Ingest tab, or ensure backend connection is healthy.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lens: activeLens
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRawChunks = (msgId: string) => {
    setShowRawChunks(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Basic markdown styling renderer
  const renderFormattedMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold text-white mt-3 mb-1.5">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-bold text-white mt-4 mb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-bold text-white mt-4 mb-2">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 text-sm leading-relaxed my-0.5">
            {formatBoldText(line.substring(2))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-300 text-sm leading-relaxed my-0.5">
            {formatBoldText(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-sm text-slate-200 leading-relaxed">{formatBoldText(line)}</p>;
    });
  };

  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const suggestedQueries = LENS_CONFIGS[activeLens]?.suggestedQueries || [];

  return (
    <div className="flex flex-col h-[700px] max-h-[82vh] bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden glass-panel">
      {/* Reasoning Chat Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-brand-400" />
              </div>
            )}

            <div className={`max-w-[85%] sm:max-w-[78%] space-y-3`}>
              <div
                className={`p-4 rounded-2xl text-sm ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none shadow-md shadow-brand-600/20'
                    : 'bg-slate-950/80 border border-slate-800 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="space-y-1">{renderFormattedMarkdown(msg.content)}</div>
                )}
                <div
                  className={`text-[10px] mt-2 font-mono ${
                    msg.sender === 'user' ? 'text-brand-200' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* Citations Trail Pill Row */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-brand-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Verifiable Citation Trails ({msg.citations.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Click any badge to view original source</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.citations.map((citation, idx) => (
                      <CitationBadge
                        key={`${citation.file_id}-${idx}`}
                        citation={citation}
                        index={idx}
                        onClick={onCitationClick}
                      />
                    ))}
                  </div>

                  {/* Toggle raw retrieved chunks */}
                  {msg.retrieved_chunks && msg.retrieved_chunks.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleRawChunks(msg.id)}
                        className="text-[11px] text-slate-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                      >
                        <Layers className="w-3 h-3 text-slate-500" />
                        <span>{showRawChunks[msg.id] ? 'Hide' : 'Inspect'} Retrieved Vector Chunks ({msg.retrieved_chunks.length})</span>
                      </button>
                    </div>
                  )}

                  {/* Raw chunks drawer */}
                  {showRawChunks[msg.id] && msg.retrieved_chunks && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                      {msg.retrieved_chunks.map((chunk, cIdx) => (
                        <div key={chunk.id || cIdx} className="p-2 rounded bg-slate-950 border border-slate-800/60 font-mono text-[11px]">
                          <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-brand-400 font-semibold">{chunk.file_name || 'Document'}</span>
                            <span className="text-amber-400">Location: {chunk.location}</span>
                            {chunk.similarity !== undefined && (
                              <span className="text-emerald-400 font-sans text-[10px]">
                                Sim: {(chunk.similarity * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300">{chunk.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-brand-400 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-950/80 border border-slate-800 space-y-2.5 w-72 sm:w-96 animate-pulse">
              <div className="flex items-center gap-2 text-xs text-brand-400 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing cross-modal reasoning...</span>
              </div>
              <div className="h-3 bg-slate-800 rounded w-5/6"></div>
              <div className="h-3 bg-slate-800 rounded w-full"></div>
              <div className="h-3 bg-slate-800 rounded w-4/6"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pill Bar */}
      {suggestedQueries.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-400" /> Suggested:
          </span>
          {suggestedQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-brand-500 hover:text-white text-slate-300 text-xs transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Query Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
      >
        <input
          id="chat-query-input"
          type="text"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder={`Ask anything across your uploaded files under ${activeLens} lens...`}
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all disabled:opacity-50"
        />

        <button
          id="chat-submit-button"
          type="submit"
          disabled={isLoading || !queryInput.trim()}
          className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all cursor-pointer"
        >
          <span>Ask</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
