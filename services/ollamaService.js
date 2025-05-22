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
 * Genera una respuesta usando el modelo Llama3.1
 * @param {string} prompt - El mensaje del usuario
 * @param {number} [timeout=DEFAULT_TIMEOUT] - Tiempo máximo de espera en ms
 * @returns {Promise<string>} La respuesta generada
 */
async function generateResponse(prompt, timeout = DEFAULT_TIMEOUT) {
  if (!prompt || prompt.trim() === '') {
    return 'Por favor, proporciona un mensaje para que pueda ayudarte.';
  }
  
  // Limpiar el prompt para evitar problemas
  const cleanedPrompt = prompt.trim();
  
  try {
    console.log('Generando respuesta para prompt:', cleanedPrompt);
    
    // Verificar disponibilidad (usando caché)
    const serviceAvailable = await isServiceAvailable();
    if (!serviceAvailable) {
      console.log('Servicio Ollama no disponible, retornando mensaje de error');
      return 'Lo siento, el servicio de IA no está disponible en este momento. Por favor, intenta más tarde.';
    }
    
    // Verificar disponibilidad del modelo (usando caché)
    const modelAvailable = await isModelAvailable();
    if (!modelAvailable) {
      console.log('Modelo Llama3.1 no disponible, retornando mensaje de error');
      return 'Lo siento, el modelo de IA no está disponible en este momento. Por favor, intenta más tarde.';
    }
    
    // Preparar contexto para el modelo
    const systemPrompt = 'Eres un asistente amigable y útil en un sistema de recomendación de películas. ' +
                        'Responde de manera concisa y amable. Proporciona información precisa sobre películas, ' +
                        'directores, actores y géneros cinematográficos. Si no conoces la respuesta, ' +
                        'admítelo honestamente y sugiere buscar en fuentes confiables.';
    
    console.log('Enviando solicitud a Ollama API...');
    
    // Realizar la solicitud a Ollama con axios
    const response = await ollamaClient.post('/api/generate', {
      model: `${MODEL_NAME}:latest`,
      prompt: cleanedPrompt,
      system: systemPrompt,
      stream: false
    }, {
      timeout: timeout
    });
    
    // Validar la respuesta
    if (response.status !== 200 || !response.data) {
      console.error('Error en la respuesta de Ollama:', response.statusText || 'Sin datos');
      // Invalidar caché para forzar nueva verificación
      serviceAvailableCache.timestamp = 0;
      return 'Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.';
    }
    
    const data = response.data;
    if (!data.response) {
      console.error('Respuesta de Ollama sin contenido');
      return 'No se pudo generar una respuesta. Por favor, intenta con otra pregunta.';
    }
    
    console.log('Respuesta recibida de Ollama:', data.response.substring(0, 50) + '...');
    return data.response;
    
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
