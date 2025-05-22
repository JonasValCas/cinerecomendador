const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./auth');
const mongoose = require('mongoose');
const ChatMessage = require('../models/Chat');
const ollamaService = require('../services/ollamaService');

// API endpoint to save a chat message - with validation and logging
router.post('/message', isAuthenticated, async (req, res) => {
  console.log('Recibida solicitud POST a /chat/message');
  try {
    const { message } = req.body;
    console.log('Procesando mensaje:', req.body);

    // Validar que el mensaje no esté vacío y tenga un formato adecuado
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'El mensaje no puede estar vacío' });
    }

    // Limpiar mensaje para evitar inyecciones o texto no deseado
    const cleanedMessage = message.trim().replace(/[<>]/g, ''); // Eliminar etiquetas HTML peligrosas

    // Obtener el nombre de usuario y ID de la sesión
    const username = req.session.user.username;
    const userId = req.session.user._id;
    console.log('Usuario autenticado:', username);

    // Intentar generar respuesta del bot usando Ollama
    let botResponse;
    try {
      console.log('Iniciando proceso de generación de respuesta para:', cleanedMessage);
      
      // Intentar obtener respuesta de Ollama (el servicio ya maneja internamente las verificaciones)
      botResponse = await ollamaService.generateResponse(cleanedMessage);
      console.log('Respuesta recibida:', botResponse.substring(0, 50) + '...');
      
      // Verificar si la respuesta indica que el servicio no está disponible
      if (botResponse.includes('servicio de IA no está disponible') || 
          botResponse.includes('error al procesar tu solicitud') || 
          botResponse.includes('modelo de IA no está disponible') || 
          botResponse.includes('Lo siento, el servicio de IA no está disponible') || 
          botResponse.includes('No se pudo generar una respuesta')) {
        
        console.log('Respuesta de Ollama indica indisponibilidad, usando respaldo');
        botResponse = await getFallbackBotResponse(cleanedMessage);
        console.log('Respuesta de respaldo generada:', botResponse.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error('Error al obtener respuesta de Ollama:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      
      // Si Ollama falla, usar el sistema de respaldo
      console.log('Usando sistema de respaldo debido a error en Ollama');
      botResponse = await getFallbackBotResponse(cleanedMessage);
      console.log('Respuesta del bot generada con sistema de respaldo:', botResponse.substring(0, 50) + '...');
    }

    // Crear objetos de mensaje para usuario y bot
    const timestamp = new Date();
    const userMessageObj = {
      username,
      userId,
      message: cleanedMessage,
      timestamp,
      isBot: false
    };
    
    const botMessageObj = {
      username: 'Asistente',
      message: botResponse,
      timestamp: new Date(timestamp.getTime() + 1000), // 1 segundo después para mantener orden
      isBot: true
    };

    // Guardar ambos mensajes en la base de datos
    try {
      await ChatMessage.saveConversation(userMessageObj, botMessageObj);
      console.log('Mensajes guardados en la base de datos');
    } catch (dbError) {
      console.error('Error al guardar mensajes en la base de datos:', dbError.message);
      // Continuamos aunque falle la base de datos
    }

    // Devolver una respuesta exitosa con el mensaje del usuario y del bot
    return res.json({
      success: true,
      userMessage: {
        id: userMessageObj._id || new mongoose.Types.ObjectId(),
        username,
        message: cleanedMessage,
        timestamp: userMessageObj.timestamp.toISOString()
      },
      botMessage: {
        id: botMessageObj._id || new mongoose.Types.ObjectId(),
        username: 'Asistente',
        message: botResponse,
        timestamp: botMessageObj.timestamp.toISOString(),
        isBot: true
      }
    });
    
  } catch (error) {
    console.error('Error al procesar el mensaje:', error);
    // Proporcionar información más detallada sobre el error
    let errorMessage = 'Error al procesar el mensaje';
    if (error.name === 'ValidationError') {
      errorMessage = 'Error de validación: ' + Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'Error de formato: ' + error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// API endpoint to get chat history - ahora recupera datos de la base de datos
router.get('/history', isAuthenticated, async (req, res) => {
  try {
    // Recuperar historial de la base de datos (últimos 50 mensajes)
    const history = await ChatMessage.getHistory(50);
    console.log(`Recuperados ${history.length} mensajes del historial`);

    // Formatear los mensajes para el cliente
    const formattedHistory = history.map(msg => ({
      id: msg._id,
      username: msg.username,
      message: msg.message,
      timestamp: msg.timestamp,
      isBot: msg.isBot
    }));

    res.json({
      success: true,
      messages: formattedHistory
    });
    
  } catch (error) {
    console.error('Error al obtener historial de chat:', error);
    res.status(500).json({ success: false, error: 'Error al obtener historial de chat' });
  }
});

// Función de respaldo en caso de que Ollama no esté disponible
async function getFallbackBotResponse(message) {
  const movieKnowledge = {
    // Preguntas generales
    'hola': 'Hola, soy el asistente de películas. ¿En qué puedo ayudarte?',
    'quien eres': 'Soy el asistente virtual de películas, estoy aquí para responder tus preguntas sobre películas y recomendarte títulos.',
    
    // Géneros de películas
    'accion': 'Algunas películas de acción populares son "Die Hard", "Mad Max: Fury Road", "John Wick" y "Misión Imposible".',
    'comedia': 'Algunas comedias recomendadas son "Superbad", "Bridesmaids", "The Hangover" y "Deadpool".',
    'drama': 'Algunos dramas aclamados son "El Padrino", "Cadena Perpetua", "El club de la pelea" y "Forrest Gump".',
    'terror': 'Algunas películas de terror populares son "El Resplandor", "El Exorcista", "Hereditary" y "Get Out".',
    'ciencia ficcion': 'Algunas películas de ciencia ficción recomendadas son "Blade Runner", "Interestelar", "Matrix" y "La llegada".',
    'romance': 'Algunas películas románticas populares son "Titanic", "Diario de una pasión", "Antes del amanecer" y "La La Land".',
    
    // Directores famosos
    'spielberg': 'Steven Spielberg ha dirigido clásicos como "Jurassic Park", "E.T.", "Salvar al soldado Ryan" y "La lista de Schindler".',
    'nolan': 'Christopher Nolan es conocido por películas como "Inception", "Interestelar", "El caballero oscuro" y "Memento".',
    'tarantino': 'Quentin Tarantino ha dirigido "Pulp Fiction", "Kill Bill", "Django Desencadenado" y "Bastardos sin gloria".',
    'scorsese': 'Martin Scorsese es famoso por "El lobo de Wall Street", "Buenos muchachos", "Taxi Driver" y "El irlandés".',
    
    // Actores y actrices
    'mejor actor': 'Algunos de los actores más reconocidos son Leonardo DiCaprio, Tom Hanks, Daniel Day-Lewis y Denzel Washington.',
    'mejor actriz': 'Algunas de las actrices más reconocidas son Meryl Streep, Cate Blanchett, Viola Davis y Frances McDormand.',
    
    // Recomendaciones
    'recomienda': 'Te recomiendo ver "El Padrino", "Pulp Fiction", "El Señor de los Anillos" o "Interestelar". ¿Te interesa algún género en particular?',
    'mejor pelicula': 'Algunas de las películas mejor valoradas de todos los tiempos son "El Padrino", "Cadena Perpetua", "El Padrino II" y "El caballero oscuro".',
    'peliculas nuevas': 'Algunas películas recientes destacadas son "Oppenheimer", "Barbie", "Pobres criaturas" y "Dune: Parte Dos".',
    
    // Fallback
    'default': 'Lo siento, no tengo información sobre eso. ¿Puedes intentar con otra pregunta sobre películas?'
  };

  const cleanQuestion = message.toLowerCase()
    .replace(/[¿?¡!.,;:]/g, '') // Eliminar signos de puntuación
    .trim();
  
  // Buscar palabras clave en la pregunta
  for (const keyword in movieKnowledge) {
    if (keyword !== 'default' && cleanQuestion.includes(keyword)) {
      return movieKnowledge[keyword];
    }
  }
  
  // Buscar coincidencias parciales para preguntas más complejas
  if (cleanQuestion.includes('genero') || cleanQuestion.includes('tipo')) {
    if (cleanQuestion.includes('accion')) return movieKnowledge['accion'];
    if (cleanQuestion.includes('comedia')) return movieKnowledge['comedia'];
    if (cleanQuestion.includes('drama')) return movieKnowledge['drama'];
    if (cleanQuestion.includes('terror')) return movieKnowledge['terror'];
    if (cleanQuestion.includes('ciencia') || cleanQuestion.includes('ficcion')) return movieKnowledge['ciencia ficcion'];
    if (cleanQuestion.includes('romance') || cleanQuestion.includes('romantica')) return movieKnowledge['romance'];
  }
  
  if (cleanQuestion.includes('director')) {
    if (cleanQuestion.includes('spielberg')) return movieKnowledge['spielberg'];
    if (cleanQuestion.includes('nolan')) return movieKnowledge['nolan'];
    if (cleanQuestion.includes('tarantino')) return movieKnowledge['tarantino'];
    if (cleanQuestion.includes('scorsese')) return movieKnowledge['scorsese'];
  }
  
  if (cleanQuestion.includes('recomienda') || cleanQuestion.includes('recomendacion') || 
      cleanQuestion.includes('sugerencia') || cleanQuestion.includes('ver')) {
    return movieKnowledge['recomienda'];
  }
  
  if (cleanQuestion.includes('mejor') && cleanQuestion.includes('pelicula')) {
    return movieKnowledge['mejor pelicula'];
  }
  
  if (cleanQuestion.includes('nueva') || cleanQuestion.includes('reciente') || 
      cleanQuestion.includes('estreno') || cleanQuestion.includes('2023') || 
      cleanQuestion.includes('2024')) {
    return movieKnowledge['peliculas nuevas'];
  }
  
  // Si no hay coincidencias, devolver respuesta por defecto
  return movieKnowledge['default'];
}

module.exports = router;
