'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Send,
  Bot,
  BookOpen,
  FileText,
  Link,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

export default function AITutorRAG({ courseId, lessonId }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/ai/tutor-chat-rag', {
        message: question.trim(),
        courseId,
        lessonId
      });

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.reply,
        citations: response.data.citations || [],
        contextUsed: response.data.contextUsed || false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Tutor error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCitation = (citationId) => {
    setExpandedCitations(prev => ({
      ...prev,
      [citationId]: !prev[citationId]
    }));
  };

  const formatMessageWithCitations = (content, citations) => {
    if (!citations || citations.length === 0) {
      return content;
    }

    let formattedContent = content;
    
    // Replace citation markers with clickable elements
    citations.forEach((citation, index) => {
      const marker = `[Source ${index + 1}]`;
      if (formattedContent.includes(marker)) {
        formattedContent = formattedContent.replace(
          marker,
          `<span class="citation-marker" data-citation="${index}" style="background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #f59e0b;">
            ${index + 1}
          </span>`
        );
      }
    });

    return formattedContent;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">AI Tutor with RAG</h3>
          <p className="text-sm text-gray-500">Context-aware Q&A with citations</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Ask me anything about your course
            </h4>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              I'll search through your course materials to provide accurate answers with citations.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.error
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm">{message.content}</p>
                ) : (
                  <div>
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: formatMessageWithCitations(
                          message.content,
                          message.citations
                        )
                      }}
                    />
                    
                    {/* Citations Section */}
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                          <FileText className="w-3 h-3" />
                          <span>Sources ({message.citations.length})</span>
                        </div>
                        
                        {message.citations.map((citation, index) => (
                          <div
                            key={citation.id}
                            className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs"
                          >
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => toggleCitation(citation.id)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="bg-amber-200 text-amber-800 px-2 py-1 rounded font-semibold">
                                  {index + 1}
                                </span>
                                <span className="font-medium text-gray-800">
                                  {citation.lessonTitle}
                                </span>
                                <span className="text-gray-500">
                                  ({citation.contentType})
                                </span>
                              </div>
                              {expandedCitations[citation.id] ? (
                                <ChevronUp className="w-3 h-3 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-gray-500" />
                              )}
                            </div>
                            
                            {expandedCitations[citation.id] && (
                              <div className="mt-2 pt-2 border-t border-amber-200">
                                <p className="text-gray-700 mb-2">
                                  {citation.content}
                                </p>
                                <div className="flex items-center gap-2 text-gray-500">
                                  <span>Similarity: {(citation.similarity * 100).toFixed(1)}%</span>
                                  {citation.metadata?.documentName && (
                                    <span>• {citation.metadata.documentName}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {message.contextUsed && (
                      <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded inline-block">
                        ✓ Context from course materials used
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">Searching and thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your course materials..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Powered by RAG - I'll search through your actual course materials to provide accurate answers.
        </p>
      </form>
    </div>
  );
}
