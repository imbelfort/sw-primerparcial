"use client";

import React, { useState, useEffect } from 'react';
import * as joint from 'jointjs';
import { CanvasAnalysisService, CanvasAnalysis } from '../lib/canvasAnalysisService';
import { ChatbotService } from '../lib/groqService';

interface ContextualSuggestionsProps {
  paper: joint.dia.Paper | null;
  onApplySuggestion: (suggestion: any) => void;
  onClose: () => void;
}

export function ContextualSuggestions({ paper, onApplySuggestion, onClose }: ContextualSuggestionsProps) {
  const [analysis, setAnalysis] = useState<CanvasAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
  const [chatbotService] = useState(() => ChatbotService.getInstance());

  useEffect(() => {
    if (paper) {
      const canvasAnalysis = CanvasAnalysisService.analyzeCanvas(paper);
      setAnalysis(canvasAnalysis);
      setQuickSuggestions(CanvasAnalysisService.generateQuickSuggestions(canvasAnalysis));
    }
  }, [paper]);

  const handleQuickSuggestion = async (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(suggestion);
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error al obtener sugerencias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailedAnalysis = async () => {
    if (!analysis) return;
    
    setIsLoading(true);
    try {
      const analysisPrompt = CanvasAnalysisService.generateAnalysisPrompt(analysis);
      const response = await chatbotService.sendMessage(analysisPrompt);
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error al obtener análisis detallado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    // Asegurar que la sugerencia tenga la estructura correcta
    const safeSuggestion = {
      ...suggestion,
      attributes: Array.isArray(suggestion.attributes) ? suggestion.attributes : [],
      methods: Array.isArray(suggestion.methods) ? suggestion.methods : [],
      relationships: Array.isArray(suggestion.relationships) ? suggestion.relationships : [],
      name: suggestion.name || 'NuevaClase',
      type: suggestion.type || 'class'
    };
    
    onApplySuggestion(safeSuggestion);
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleApplyAllSuggestions = () => {
    suggestions.forEach(suggestion => {
      // Asegurar que cada sugerencia tenga la estructura correcta
      const safeSuggestion = {
        ...suggestion,
        attributes: Array.isArray(suggestion.attributes) ? suggestion.attributes : [],
        methods: Array.isArray(suggestion.methods) ? suggestion.methods : [],
        relationships: Array.isArray(suggestion.relationships) ? suggestion.relationships : [],
        name: suggestion.name || 'NuevaClase',
        type: suggestion.type || 'class'
      };
      
      onApplySuggestion(safeSuggestion);
    });
    setSuggestions([]);
  };

  if (!analysis) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Analizando el diagrama...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Sugerencias Inteligentes</h2>
              <p className="text-sm text-gray-500">Basadas en tu diagrama actual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Análisis del diagrama */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Análisis del Diagrama</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysis.summary.totalElements}</div>
                <div className="text-gray-600">Elementos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysis.summary.totalRelationships}</div>
                <div className="text-gray-600">Relaciones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(analysis.summary.elementTypes).length}
                </div>
                <div className="text-gray-600">Tipos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(analysis.summary.relationshipTypes).length}
                </div>
                <div className="text-gray-600">Rel. Tipos</div>
              </div>
            </div>
          </div>

          {/* Sugerencias rápidas */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sugerencias Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  disabled={isLoading}
                  className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Análisis detallado */}
          <div className="mb-6">
            <button
              onClick={handleDetailedAnalysis}
              disabled={isLoading}
              className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Análisis Detallado con IA</span>
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Generando sugerencias...</p>
            </div>
          )}

          {/* Sugerencias generadas */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Sugerencias Generadas ({suggestions.length})
                </h3>
                <button
                  onClick={handleApplyAllSuggestions}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                >
                  Aplicar Todas
                </button>
              </div>

              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm text-gray-900">{suggestion.name}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        {suggestion.type}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {suggestion.attributes && Array.isArray(suggestion.attributes) && suggestion.attributes.length > 0 && (
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
                      
                      {suggestion.methods && Array.isArray(suggestion.methods) && suggestion.methods.length > 0 && (
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
                      
                      {suggestion.relationships && Array.isArray(suggestion.relationships) && suggestion.relationships.length > 0 && (
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
                      Aplicar Sugerencia
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

