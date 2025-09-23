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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Asistente UML con IA</h2>
            <p className="text-sm text-gray-600">Describe tu sistema y te ayudo a crear el diagrama</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearHistory}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Limpiar
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="mb-4">
                <div className="text-4xl mb-2">🤖</div>
                <h3 className="text-lg font-medium">¡Hola! Soy tu asistente UML</h3>
                <p className="text-sm">Puedo ayudarte a crear diagramas de clases basados en descripciones de texto</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Ejemplos de lo que puedes pedir:</p>
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(prompt)}
                    className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded text-sm"
                  >
                    "{prompt}"
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
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Mostrar sugerencias después del último mensaje del asistente */}
                {message.role === 'assistant' && index === messages.length - 1 && currentSuggestions.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Sugerencias de diagrama ({currentSuggestions.length}):
                    </div>
                    
                    {/* Botón para aplicar todas las sugerencias */}
                    <div className="mb-3">
                      <button
                        onClick={handleApplyAllSuggestions}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        🚀 Aplicar Todo el Diagrama ({currentSuggestions.length} elementos)
                      </button>
                    </div>
                    
                    {/* Lista de sugerencias individuales */}
                    <div className="space-y-2">
                      {currentSuggestions.map((suggestion, suggestionIndex) => (
                        <div key={suggestionIndex} className="bg-white border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm">{suggestion.name}</h4>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {suggestion.type}
                            </span>
                          </div>
                          
                          {suggestion.attributes.length > 0 && (
                            <div className="mb-1">
                              <span className="text-xs text-gray-600">Atributos: </span>
                              <span className="text-xs text-gray-700">
                                {suggestion.attributes.slice(0, 2).join(', ')}
                                {suggestion.attributes.length > 2 && ` +${suggestion.attributes.length - 2} más`}
                              </span>
                            </div>
                          )}
                          
                          {suggestion.methods.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs text-gray-600">Métodos: </span>
                              <span className="text-xs text-gray-700">
                                {suggestion.methods.slice(0, 2).join(', ')}
                                {suggestion.methods.length > 2 && ` +${suggestion.methods.length - 2} más`}
                              </span>
                            </div>
                          )}
                          
                          {suggestion.relationships && suggestion.relationships.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs text-gray-600">Relaciones: </span>
                              <span className="text-xs text-gray-700">
                                {suggestion.relationships.length} relación(es)
                              </span>
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleApplySuggestion(suggestion)}
                            className="w-full bg-blue-500 text-white py-1 px-3 rounded text-xs hover:bg-blue-600"
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
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>Pensando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe el sistema que quieres modelar..."
              className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar
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
