"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChatbotService, ChatMessage, DiagramSuggestion } from '../lib/groqService';

interface ChatbotProps {
  onApplySuggestion: (suggestion: DiagramSuggestion) => void;
  onApplyAllSuggestions?: (suggestions: DiagramSuggestion[]) => void;
  onClose: () => void;
  onResponse?: (response: any) => void;
}

export function Chatbot({ onApplySuggestion, onApplyAllSuggestions, onClose, onResponse }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<DiagramSuggestion[]>([]);
  const [chatbotService] = useState(() => ChatbotService.getInstance());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Agregar mensaje del usuario inmediatamente
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await chatbotService.sendMessage(userMessage);
      
      // Agregar respuesta del asistente
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      
      // Llamar a la función de respuesta si existe
      if (onResponse) {
        onResponse(response);
      }

      // Guardar las sugerencias actuales
      if (response.suggestions && response.suggestions.length > 0) {
        setCurrentSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplySuggestion = (suggestion: DiagramSuggestion) => {
    onApplySuggestion(suggestion);
    // Remover la sugerencia aplicada de la lista actual
    setCurrentSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleApplyAllSuggestions = () => {
    if (onApplyAllSuggestions && currentSuggestions.length > 0) {
      onApplyAllSuggestions(currentSuggestions);
      setCurrentSuggestions([]);
    }
  };

  const clearHistory = () => {
    chatbotService.clearHistory();
    setMessages([]);
  };

  const examplePrompts = [
    "Crear un sistema de gestión de biblioteca con libros, usuarios y préstamos",
    "Diseñar un sistema de e-commerce con productos, carrito y pedidos",
    "Modelar un sistema bancario con cuentas, transacciones y clientes",
    "Crear un sistema de reservas de hotel con habitaciones y huéspedes"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header minimalista */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Asistente UML con IA</h2>
              <p className="text-sm text-gray-500">Describe tu sistema y te ayudo a crear el diagrama</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearHistory}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <div className="mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Hola! Soy tu asistente UML</h3>
                <p className="text-gray-600">Puedo ayudarte a crear diagramas de clases basados en descripciones de texto</p>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Ejemplos de lo que puedes pedir:</p>
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(prompt)}
                    className="block w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors border border-gray-200 hover:border-gray-300"
                  >
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>"{prompt}"</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-800 border border-gray-200'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                
                {/* Mostrar sugerencias después del último mensaje del asistente */}
                {message.role === 'assistant' && index === messages.length - 1 && currentSuggestions.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        Sugerencias de diagrama ({currentSuggestions.length})
                      </span>
                    </div>
                    
                    {/* Botón para aplicar todas las sugerencias */}
                    <div className="mb-4">
                      <button
                        onClick={handleApplyAllSuggestions}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Aplicar Todo el Diagrama ({currentSuggestions.length} elementos)</span>
                      </button>
                    </div>
                    
                    {/* Lista de sugerencias individuales */}
                    <div className="space-y-3">
                      {currentSuggestions.map((suggestion, suggestionIndex) => (
                        <div key={suggestionIndex} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm text-gray-900">{suggestion.name}</h4>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                              {suggestion.type}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            {suggestion.attributes.length > 0 && (
                              <div className="flex items-start space-x-2">
                                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <div>
                                  <span className="text-xs text-gray-600 font-medium">Atributos: </span>
                                  <span className="text-xs text-gray-700">
                                    {suggestion.attributes.slice(0, 2).join(', ')}
                                    {suggestion.attributes.length > 2 && ` +${suggestion.attributes.length - 2} más`}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {suggestion.methods.length > 0 && (
                              <div className="flex items-start space-x-2">
                                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                  <span className="text-xs text-gray-600 font-medium">Métodos: </span>
                                  <span className="text-xs text-gray-700">
                                    {suggestion.methods.slice(0, 2).join(', ')}
                                    {suggestion.methods.length > 2 && ` +${suggestion.methods.length - 2} más`}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {suggestion.relationships && suggestion.relationships.length > 0 && (
                              <div className="flex items-start space-x-2">
                                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <div>
                                  <span className="text-xs text-gray-600 font-medium">Relaciones: </span>
                                  <span className="text-xs text-gray-700">
                                    {suggestion.relationships.length} relación(es)
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleApplySuggestion(suggestion)}
                            className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                          >
                            Aplicar Solo Esta
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-gray-600">Pensando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input minimalista */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe el sistema que quieres modelar..."
              className="flex-1 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Enviar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar sugerencias de diagramas
export function DiagramSuggestionCard({ 
  suggestion, 
  onApply 
}: { 
  suggestion: DiagramSuggestion; 
  onApply: (suggestion: DiagramSuggestion) => void;
}) {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-lg">{suggestion.name}</h4>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {suggestion.type}
        </span>
      </div>
      
      {suggestion.attributes.length > 0 && (
        <div className="mb-2">
          <h5 className="text-sm font-medium text-gray-600">Atributos:</h5>
          <ul className="text-sm text-gray-700">
            {suggestion.attributes.map((attr, index) => (
              <li key={index}>• {attr}</li>
            ))}
          </ul>
        </div>
      )}
      
      {suggestion.methods.length > 0 && (
        <div className="mb-2">
          <h5 className="text-sm font-medium text-gray-600">Métodos:</h5>
          <ul className="text-sm text-gray-700">
            {suggestion.methods.map((method, index) => (
              <li key={index}>• {method}</li>
            ))}
          </ul>
        </div>
      )}
      
      {suggestion.relationships && suggestion.relationships.length > 0 && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-gray-600">Relaciones:</h5>
          <ul className="text-sm text-gray-700">
            {suggestion.relationships.map((rel, index) => (
              <li key={index}>
                • {rel.type} → {rel.target}
                {rel.label && ` (${rel.label})`}
                {rel.multiplicity && ` [${rel.multiplicity}]`}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <button
        onClick={() => onApply(suggestion)}
        className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 text-sm"
      >
        Aplicar al Diagrama
      </button>
    </div>
  );
}
