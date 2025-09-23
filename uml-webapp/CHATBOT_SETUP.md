# Configuración del Chatbot UML

## Configuración de Groq API (Servidor)

1. Ve a [Groq Console](https://console.groq.com/)
2. Crea una cuenta gratuita
3. Genera una API key
4. Crea un archivo `.env.local` en la raíz del proyecto con:

```
GROQ_API_KEY=tu_api_key_aqui
```

**IMPORTANTE**: La API key ahora se configura en el servidor, no en el frontend, para mayor seguridad.

## Características del Chatbot

- **Generación automática de diagramas**: Describe tu sistema en texto natural
- **Asistencia UML**: Te ayuda con generalización, normalización, clases y relaciones
- **Sugerencias inteligentes**: Proporciona recomendaciones basadas en mejores prácticas
- **Integración directa**: Aplica las sugerencias directamente al diagrama
- **Seguridad**: La API key se mantiene segura en el servidor

## Ejemplos de uso

- "Crear un sistema de gestión de biblioteca con libros, usuarios y préstamos"
- "Diseñar un sistema de e-commerce con productos, carrito y pedidos"
- "Modelar un sistema bancario con cuentas, transacciones y clientes"
- "Crear un sistema de reservas de hotel con habitaciones y huéspedes"

## Tipos de relaciones soportadas

- **Generalización**: Herencia entre clases
- **Asociación**: Relaciones entre clases
- **Composición**: Relación parte-todo fuerte
- **Agregación**: Relación parte-todo débil
- **Dependencia**: Una clase usa otra

## Arquitectura de Seguridad

- **Frontend**: Solo maneja la interfaz de usuario
- **Backend**: Maneja la comunicación con Groq de forma segura
- **API Route**: `/api/chatbot` procesa las peticiones
- **Variables de entorno**: Solo en el servidor, nunca expuestas al cliente

## Notas

- El chatbot usa el modelo `llama-3.1-8b-instant` de Groq (gratuito)
- Las respuestas están optimizadas para generar diagramas UML válidos
- El historial de conversación se mantiene durante la sesión
- La API key está protegida y nunca se expone al cliente
