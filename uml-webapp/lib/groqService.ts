// Tipos para el chatbot
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DiagramSuggestion {
  type: 'class' | 'interface' | 'abstract' | 'enum';
  name: string;
  attributes: string[];
  methods: string[];
  relationships?: {
    type: 'generalization' | 'association' | 'composition' | 'aggregation' | 'dependency';
    target: string;
    label?: string;
    multiplicity?: string;
  }[];
}

export interface ChatResponse {
  message: string;
  suggestions?: DiagramSuggestion[];
  error?: string;
}

export class ChatbotService {
  private static instance: ChatbotService;
  private messages: ChatMessage[] = [];

  private constructor() {
    // No necesitamos el prompt del sistema aquí, se maneja en el servidor
  }

  public static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  public async sendMessage(userMessage: string): Promise<ChatResponse> {
    try {
      // Agregar mensaje del usuario al historial local
      this.messages.push({
        role: 'user',
        content: userMessage
      });

      // Enviar petición a nuestra API route
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: this.messages.slice(0, -1) // Enviar historial sin el último mensaje
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Agregar respuesta del asistente al historial local
      this.messages.push({
        role: 'assistant',
        content: data.message
      });

      return {
        message: data.message,
        suggestions: data.suggestions,
        error: data.error
      };

    } catch (error) {
      console.error('Error al comunicarse con el chatbot:', error);
      return {
        message: 'Error al comunicarse con el asistente de IA. Por favor, intenta de nuevo.',
        error: 'API_ERROR'
      };
    }
  }

  public clearHistory(): void {
    this.messages = [];
  }

  public getHistory(): ChatMessage[] {
    return [...this.messages];
  }
}
