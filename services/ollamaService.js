/**
 * Servicio para interactuar con Ollama y el modelo Llama3.1
 * Versión optimizada con caché de verificación y mejor manejo de errores
 */

const axios = require('axios');

// Configuración
const OLLAMA_BASE_URL = 'http://localhost:11434';
const MODEL_NAME = 'llama3.1';
const DEFAULT_TIMEOUT = 30000; // 30 segundos
const VERIFICATION_TIMEOUT = 5000; // Timeout para verificaciones (más corto)

// Crear una instancia de axios con configuración base
const ollamaClient = axios.create({
  baseURL: OLLAMA_BASE_URL,
  timeout: DEFAULT_TIMEOUT
});

// Caché para evitar verificaciones repetidas en un corto período de tiempo
let serviceAvailableCache = {
  available: null,
  timestamp: 0
};

let modelAvailableCache = {
  available: null,
  timestamp: 0
};

// Tiempo de validez del caché en milisegundos (30 segundos)
const CACHE_TTL = 30000;

/**
 * Verifica si el servicio Ollama está disponible
 * Utiliza caché para evitar verificaciones repetidas en un corto período
 * @returns {Promise<boolean>} true si el servicio está disponible
 */
async function isServiceAvailable() {
  const now = Date.now();
  
  // Si tenemos un resultado en caché válido, lo usamos
  if (serviceAvailableCache.available !== null && (now - serviceAvailableCache.timestamp) < CACHE_TTL) {
    console.log('Usando caché para verificación de servicio Ollama. Disponible:', serviceAvailableCache.available);
    return serviceAvailableCache.available;
  }
  
  try {
    console.log('Verificando disponibilidad del servicio Ollama...');
    const response = await ollamaClient.get('/api/tags', {
      timeout: VERIFICATION_TIMEOUT
    });
    
    // Actualizar caché
    serviceAvailableCache = {
      available: response.status === 200,
      timestamp: now
    };
    
    console.log('Servicio Ollama respondió con status:', response.status);
    return serviceAvailableCache.available;
  } catch (error) {
    console.error('Error al verificar disponibilidad de Ollama:', error.message);
    
    // Actualizar caché con resultado negativo
    serviceAvailableCache = {
      available: false,
      timestamp: now
    };
    
    return false;
  }
}

/**
 * Verifica si el modelo especificado está disponible
 * Utiliza caché para evitar verificaciones repetidas en un corto período
 * @returns {Promise<boolean>} true si el modelo está disponible
 */
async function isModelAvailable() {
  const now = Date.now();
  
  // Si tenemos un resultado en caché válido, lo usamos
  if (modelAvailableCache.available !== null && (now - modelAvailableCache.timestamp) < CACHE_TTL) {
    console.log(`Usando caché para verificación del modelo ${MODEL_NAME}. Disponible:`, modelAvailableCache.available);
    return modelAvailableCache.available;
  }
  
  // Si el servicio no está disponible, el modelo tampoco lo estará
  const serviceAvailable = await isServiceAvailable();
  if (!serviceAvailable) {
    modelAvailableCache = {
      available: false,
      timestamp: now
    };
    return false;
  }
  
  try {
    console.log(`Verificando disponibilidad del modelo ${MODEL_NAME}...`);
    const response = await ollamaClient.get('/api/tags', {
      timeout: VERIFICATION_TIMEOUT
    });
    
    if (response.status !== 200) {
      console.error('Error al verificar disponibilidad del modelo: respuesta no ok');
      modelAvailableCache = {
        available: false,
        timestamp: now
      };
      return false;
    }
    
    const data = response.data;
    
    // Verificar si el modelo existe, considerando tanto el nombre exacto como con el sufijo ':latest'
    const modelExists = data.models && data.models.some(model => 
      model.name === MODEL_NAME || model.name === `${MODEL_NAME}:latest`);
    
    // Actualizar caché
    modelAvailableCache = {
      available: modelExists,
      timestamp: now
    };
    
    console.log(`Modelo ${MODEL_NAME} disponible:`, modelExists);
    return modelExists;
  } catch (error) {
    console.error('Error al verificar disponibilidad del modelo:', error.message);
    
    // Actualizar caché con resultado negativo
    modelAvailableCache = {
      available: false,
      timestamp: now
    };
    
    return false;
  }
}

/**
 * Genera una respuesta usando el modelo Llama3.1 a través del endpoint de chat.
 * @param {Array<object>|string} context - El historial de la conversación o un simple prompt.
 * @param {number} [timeout=DEFAULT_TIMEOUT] - Tiempo máximo de espera en ms.
 * @returns {Promise<string>} La respuesta generada.
 */
async function generateResponse(context, timeout = DEFAULT_TIMEOUT) {
  if (!context || (Array.isArray(context) && context.length === 0) || (typeof context === 'string' && context.trim() === '')) {
    return 'Por favor, proporciona un mensaje para que pueda ayudarte.';
  }

  try {
    // Verificar disponibilidad (usando caché)
    const serviceAvailable = await isServiceAvailable();
    if (!serviceAvailable) {
      console.log('Servicio Ollama no disponible, retornando mensaje de error');
      return 'Lo siento, el servicio de IA no está disponible en este momento. Por favor, intenta más tarde.';
    }

    const modelAvailable = await isModelAvailable();
    if (!modelAvailable) {
      console.log(`Modelo ${MODEL_NAME} no disponible, retornando mensaje de error`);
      return `Lo siento, el modelo de IA (${MODEL_NAME}) no está disponible en este momento. Por favor, intenta más tarde.`;
    }

    // Preparar el payload para la API de chat de Ollama
    const systemMessage = {
      role: 'system',
      content: 'Eres un asistente experto en cine para un recomendador de películas. ' +
               'Tu objetivo es ayudar a los usuarios a descubrir películas. ' +
               'Responde de forma concisa, amigable y directa. ' +
               'Utiliza el historial de la conversación para entender el contexto y dar respuestas coherentes. ' +
               'Si no sabes algo, admítelo con naturalidad.'
    };

    let messages;
    if (Array.isArray(context)) {
      messages = [systemMessage, ...context];
      console.log('Generando respuesta para el contexto:', JSON.stringify(context.slice(-2), null, 2));
    } else {
      // Mantener compatibilidad si se envía un string
      messages = [systemMessage, { role: 'user', content: String(context) }];
      console.log('Generando respuesta para prompt (modo compatibilidad):', String(context));
    }

    console.log(`Enviando solicitud a la API /api/chat de Ollama con el modelo ${MODEL_NAME}...`);

    // Realizar la solicitud a Ollama con el endpoint de chat
    const response = await ollamaClient.post('/api/chat', {
      model: `${MODEL_NAME}:latest`,
      messages: messages,
      stream: false
    }, {
      timeout: timeout
    });

    // Validar la respuesta
    if (response.status !== 200 || !response.data || !response.data.message || !response.data.message.content) {
      console.error('Error o respuesta inválida de Ollama:', response.statusText || 'Sin datos o formato incorrecto');
      serviceAvailableCache.timestamp = 0; // Invalidar caché
      return 'Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.';
    }

    const botResponse = response.data.message.content;
    console.log('Respuesta recibida de Ollama:', botResponse.substring(0, 70) + '...');
    return botResponse;

  } catch (error) {
    // Invalidar caché para forzar nueva verificación en caso de error
    serviceAvailableCache.timestamp = 0;
    modelAvailableCache.timestamp = 0;

    if (error.code === 'ECONNABORTED') {
      console.error('La solicitud a Ollama excedió el tiempo de espera');
      return 'La solicitud tomó demasiado tiempo. Por favor, intenta con una pregunta más simple o intenta más tarde.';
    }

    console.error('Error al generar respuesta con Ollama:', error.message);
    return 'Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.';
  }
}

module.exports = {
  isServiceAvailable,
  isModelAvailable,
  generateResponse
};
