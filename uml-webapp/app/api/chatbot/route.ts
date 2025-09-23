import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Inicializar cliente de Groq solo en el servidor
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Variable de entorno del servidor
});

// Prompt del sistema para el asistente UML
const SYSTEM_PROMPT = `Eres un experto en UML y diseño de software. Tu trabajo es ayudar a crear diagramas de clases UML basados en descripciones de texto.

INSTRUCCIONES CRÍTICAS:
1. SIEMPRE responde con un mensaje de texto explicativo
2. LUEGO incluye ÚNICAMENTE el JSON con las sugerencias
3. NO agregues texto después del JSON
4. El JSON debe ser válido y parseable

Formato de respuesta OBLIGATORIO:
[Mensaje explicativo en español]

\`\`\`json
{
  "suggestions": [
    {
      "type": "class",
      "name": "NombreClase",
      "attributes": ["atributo1: tipo", "atributo2: tipo"],
      "methods": ["metodo1()", "metodo2(parametro: tipo)"],
      "relationships": [
        {
          "type": "generalization|association|composition|aggregation|dependency",
          "target": "ClaseDestino",
          "label": "nombre descriptivo de la relación",
          "multiplicity": "1|0..1|1..*|0..*|*",
          "sourceMultiplicity": "1|0..1|1..*|0..*|*"
        }
      ]
    }
  ]
}
\`\`\`

Tipos de relación UML:
- **generalization**: Herencia (extends/implements) - flecha hueca
- **association**: Relación entre clases - línea sólida
- **composition**: Parte-todo fuerte (diamante relleno) - "tiene" fuerte
- **aggregation**: Parte-todo débil (diamante hueco) - "tiene" débil  
- **dependency**: Una clase usa otra (línea punteada) - "usa"

Multiplicidades comunes:
- "1": exactamente uno
- "0..1": cero o uno
- "1..*": uno o más
- "0..*": cero o más
- "*": muchos

Ejemplos de relaciones:
- Usuario "tiene" Perfil (composición: 1 a 1)
- Cliente "compra" Producto (asociación: 1 a muchos)
- Empleado "es un" Persona (generalización)
- Orden "usa" ServicioPago (dependencia)

IMPORTANTE: El JSON debe estar en un bloque de código markdown y ser el último elemento de tu respuesta.`;

export async function POST(request: NextRequest) {
  try {
    // Verificar que la API key esté configurada
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { 
          message: 'Error: La API key de Groq no está configurada en el servidor',
          error: 'API_KEY_NOT_CONFIGURED'
        },
        { status: 500 }
      );
    }

    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { message: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Construir el historial de mensajes
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message }
    ];

    // Enviar mensaje a Groq
    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant',
      max_tokens: 2000,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'No se pudo obtener respuesta';

    console.log('Respuesta completa del chatbot:', assistantMessage.substring(0, 500) + '...');
    console.log('Longitud total de la respuesta:', assistantMessage.length);

    // Intentar extraer sugerencias JSON de la respuesta
    const { cleanMessage, suggestions } = extractMessageAndSuggestions(assistantMessage);

    console.log('Sugerencias extraídas:', suggestions.length);
    if (suggestions.length > 0) {
      console.log('Primera sugerencia:', JSON.stringify(suggestions[0], null, 2));
    }

    return NextResponse.json({
      message: cleanMessage,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    });

  } catch (error) {
    console.error('Error en API de chatbot:', error);
    return NextResponse.json(
      { 
        message: 'Error al comunicarse con el asistente de IA. Por favor, intenta de nuevo.',
        error: 'API_ERROR'
      },
      { status: 500 }
    );
  }
}

function extractMessageAndSuggestions(message: string) {
  try {
    // Buscar JSON en la respuesta - múltiples patrones
    const patterns = [
      /\{[\s\S]*?"suggestions"[\s\S]*?\}/,  // Buscar específicamente el objeto con "suggestions"
      /\{[\s\S]*?\}/,  // Buscar cualquier objeto JSON
      /```json\s*(\{[\s\S]*?\})\s*```/,  // Buscar JSON en bloques de código
      /```\s*(\{[\s\S]*?\})\s*```/  // Buscar JSON en bloques genéricos
    ];
    
    let jsonFound = false;
    let cleanMessage = message;
    let suggestions: any[] = [];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        jsonFound = true;
        let jsonStr = match[1] || match[0]; // Usar el grupo capturado o el match completo
        
        // Limpiar el JSON de caracteres problemáticos
        jsonStr = jsonStr
          .replace(/```json\s*/g, '')  // Remover marcadores de código
          .replace(/```\s*/g, '')      // Remover marcadores genéricos
          .replace(/\s*$/, '')         // Remover espacios al final
          .replace(/,\s*}/g, '}')      // Remover comas finales antes de }
          .replace(/,\s*]/g, ']')      // Remover comas finales antes de ]
          .replace(/\n/g, ' ')         // Reemplazar saltos de línea con espacios
          .replace(/\r/g, ' ')         // Reemplazar retornos de carro con espacios
          .replace(/\s+/g, ' ')        // Normalizar espacios múltiples
          .replace(/"\s+/g, '"')       // Remover espacios después de comillas
          .replace(/\s+"/g, '"')       // Remover espacios antes de comillas
          .replace(/:\s+/g, ': ')      // Normalizar espacios después de dos puntos
          .replace(/,\s+/g, ', ')      // Normalizar espacios después de comas
          .trim();                     // Remover espacios al inicio y final
        
        console.log('JSON extraído:', jsonStr.substring(0, 200) + '...');
        
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            console.log('Sugerencias encontradas:', parsed.suggestions.length);
            suggestions = parsed.suggestions;
            
            // Remover el JSON del mensaje para que no se muestre al usuario
            cleanMessage = message.replace(pattern, '').trim();
            break;
          }
        } catch (parseError) {
          console.warn('Error al parsear JSON limpio:', parseError);
          console.log('JSON problemático:', jsonStr.substring(0, 500) + '...');
          
          // Intentar reparar el JSON manualmente
          const repairedJson = repairJson(jsonStr);
          if (repairedJson) {
            try {
              const parsed = JSON.parse(repairedJson);
              if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                console.log('JSON reparado exitosamente');
                suggestions = parsed.suggestions;
                cleanMessage = message.replace(pattern, '').trim();
                break;
              }
            } catch (repairError) {
              console.warn('Error al parsear JSON reparado:', repairError);
            }
          }
        }
      }
    }
    
    // Si no se encuentra JSON válido, intentar extraer sugerencias del texto
    if (!jsonFound) {
      console.log('No se encontró JSON válido, intentando extraer del texto...');
      suggestions = extractSuggestionsFromText(message);
    }
    
    return { cleanMessage, suggestions };
    
  } catch (error) {
    console.warn('Error al parsear JSON:', error);
    console.log('Mensaje completo:', message.substring(0, 500) + '...');
    
    // Intentar extraer sugerencias del texto como fallback
    const suggestions = extractSuggestionsFromText(message);
    return { cleanMessage: message, suggestions };
  }
}

function extractSuggestions(message: string) {
  try {
    // Buscar JSON en la respuesta - múltiples patrones
    const patterns = [
      /\{[\s\S]*?"suggestions"[\s\S]*?\}/,  // Buscar específicamente el objeto con "suggestions"
      /\{[\s\S]*?\}/,  // Buscar cualquier objeto JSON
      /```json\s*(\{[\s\S]*?\})\s*```/,  // Buscar JSON en bloques de código
      /```\s*(\{[\s\S]*?\})\s*```/  // Buscar JSON en bloques genéricos
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        let jsonStr = match[1] || match[0]; // Usar el grupo capturado o el match completo
        
        // Limpiar el JSON de caracteres problemáticos
        jsonStr = jsonStr
          .replace(/```json\s*/g, '')  // Remover marcadores de código
          .replace(/```\s*/g, '')      // Remover marcadores genéricos
          .replace(/\s*$/, '')         // Remover espacios al final
          .replace(/,\s*}/g, '}')      // Remover comas finales antes de }
          .replace(/,\s*]/g, ']')      // Remover comas finales antes de ]
          .replace(/\n/g, ' ')         // Reemplazar saltos de línea con espacios
          .replace(/\r/g, ' ')         // Reemplazar retornos de carro con espacios
          .replace(/\s+/g, ' ')        // Normalizar espacios múltiples
          .replace(/"\s+/g, '"')       // Remover espacios después de comillas
          .replace(/\s+"/g, '"')       // Remover espacios antes de comillas
          .replace(/:\s+/g, ': ')      // Normalizar espacios después de dos puntos
          .replace(/,\s+/g, ', ')      // Normalizar espacios después de comas
          .trim();                     // Remover espacios al inicio y final
        
        console.log('JSON extraído:', jsonStr.substring(0, 200) + '...');
        
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            console.log('Sugerencias encontradas:', parsed.suggestions.length);
            return parsed.suggestions;
          }
        } catch (parseError) {
          console.warn('Error al parsear JSON limpio:', parseError);
          console.log('JSON problemático:', jsonStr.substring(0, 500) + '...');
          
          // Intentar reparar el JSON manualmente
          const repairedJson = repairJson(jsonStr);
          if (repairedJson) {
            try {
              const parsed = JSON.parse(repairedJson);
              if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                console.log('JSON reparado exitosamente');
                return parsed.suggestions;
              }
            } catch (repairError) {
              console.warn('Error al parsear JSON reparado:', repairError);
            }
          }
        }
      }
    }
    
    // Si no se encuentra JSON válido, intentar extraer sugerencias del texto
    console.log('No se encontró JSON válido, intentando extraer del texto...');
    return extractSuggestionsFromText(message);
    
  } catch (error) {
    console.warn('Error al parsear JSON:', error);
    console.log('Mensaje completo:', message.substring(0, 500) + '...');
    
    // Intentar extraer sugerencias del texto como fallback
    return extractSuggestionsFromText(message);
  }
}

function repairJson(jsonStr: string): string | null {
  try {
    // Intentar reparar JSON común malformado
    let repaired = jsonStr;
    
    // Reparar strings cortados por saltos de línea
    repaired = repaired.replace(/"\s*\n\s*([^"]*?)"/g, '"$1"');
    
    // Reparar arrays cortados
    repaired = repaired.replace(/\[\s*\n\s*([^\]]*?)\s*\n\s*\]/g, '[$1]');
    
    // Reparar objetos cortados
    repaired = repaired.replace(/\{\s*\n\s*([^}]*?)\s*\n\s*\}/g, '{$1}');
    
    // Asegurar que el JSON esté completo
    if (!repaired.includes('"suggestions"')) {
      return null;
    }
    
    // Buscar el final del objeto suggestions
    const suggestionsStart = repaired.indexOf('"suggestions"');
    const suggestionsEnd = repaired.lastIndexOf('}');
    
    if (suggestionsStart !== -1 && suggestionsEnd !== -1) {
      repaired = repaired.substring(0, suggestionsEnd + 1);
    }
    
    console.log('JSON reparado:', repaired.substring(0, 200) + '...');
    return repaired;
    
  } catch (error) {
    console.warn('Error al reparar JSON:', error);
    return null;
  }
}

function extractSuggestionsFromText(message: string) {
  try {
    // Buscar patrones de clases en el texto de manera más inteligente
    const classPatterns = [
      /(?:clase|class)\s+(\w+)/gi,
      /(\w+):\s*Clase que representa/gi,
      /(\w+):\s*Clase que/gi,
      /(\w+)\s*-\s*Clase/gi
    ];
    
    const classes = new Set<string>();
    
    for (const pattern of classPatterns) {
      const matches = [...message.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].length > 1) {
          classes.add(match[1]);
        }
      });
    }
    
    if (classes.size > 0) {
      const suggestions = Array.from(classes).map(className => ({
        type: 'class',
        name: className,
        attributes: [],
        methods: []
      }));
      
      console.log('Sugerencias extraídas del texto:', suggestions.length);
      console.log('Clases encontradas:', Array.from(classes));
      return suggestions;
    }
    
    return [];
  } catch (error) {
    console.warn('Error al extraer sugerencias del texto:', error);
    return [];
  }
}
