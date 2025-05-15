/**
 * Script para el chat flotante con respuestas a preguntas básicas
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando chat flotante con respuestas a preguntas básicas');
  
  // Elementos para el chat flotante
  const chatContainer = document.getElementById('chat-container');
  const chatFloatBtn = document.getElementById('chat-float-btn');
  const chatCloseBtn = document.getElementById('chat-close-btn');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const chatMessages = document.getElementById('chat-messages');
  
  // Base de conocimiento para respuestas básicas sobre películas
  const movieKnowledge = {
    // Preguntas generales
    'hola': 'Hola, soy el asistente de películas. ¿En qué puedo ayudarte?',
    'quien eres': 'Soy el asistente virtual de películas, estoy aquí para responder tus preguntas sobre películas y recomendarte títulos.',
    'ayuda': 'Puedes preguntarme sobre géneros de películas, directores famosos, o pedirme recomendaciones. ¡Estoy aquí para ayudarte!',
    
    // Géneros de películas
    'accion': 'Algunas películas de acción populares son "Duro de Matar", "Mad Max: Fury Road", "John Wick" y "Misión Imposible".',
    'comedia': 'Algunas comedias recomendadas son "Superbad", "Anchorman", "Bridesmaids" y "La resaca".',
    'drama': 'Algunos dramas aclamados son "El Padrino", "Cadena Perpetua", "Forrest Gump" y "El club de la pelea".',
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
  
  // Si no existen los elementos necesarios, salir
  if (!chatContainer || !chatFloatBtn || !chatForm || !messageInput || !chatMessages) {
    console.log('No se encontraron los elementos necesarios para el chat flotante');
    return;
  }
  
  console.log('Elementos del chat encontrados');
  
  // Manejar apertura del chat - con prevención de eventos predeterminados
  chatFloatBtn.addEventListener('click', function(e) {
    // Prevenir comportamiento predeterminado
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Botón de chat clickeado');
    
    // Mostrar el chat flotante
    chatContainer.classList.add('show');
    
    // Enfocar el campo de entrada
    setTimeout(() => messageInput.focus(), 100);
    
    return false;
  });
  
  // Manejar cierre del chat - con prevención de eventos predeterminados
  if (chatCloseBtn) {
    chatCloseBtn.addEventListener('click', function(e) {
      // Prevenir comportamiento predeterminado
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Cerrando chat');
      chatContainer.classList.remove('show');
      
      return false;
    });
  }
  
  // Añadir manejador para tecla ESC para cerrar el chat
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && chatContainer.classList.contains('show')) {
      chatContainer.classList.remove('show');
    }
  });

  // Añadir mensaje inicial al chat
  // Limpiar mensajes existentes
  chatMessages.innerHTML = '';
  
  // Añadir mensaje de bienvenida
  const welcomeMessage = document.createElement('div');
  welcomeMessage.className = 'system-message my-2';
  welcomeMessage.innerHTML = `
    <div class="alert alert-info py-1 px-3">
      Bienvenido al chat de películas. ¡Haz preguntas sobre películas, géneros, directores o pide recomendaciones!
    </div>
  `;
  chatMessages.appendChild(welcomeMessage);
  
  // Función para agregar mensaje del usuario al chat
  function addUserMessage(message, timestamp = new Date(), animate = true) {
    const div = document.createElement('div');
    div.className = 'message own-message mb-2';
    div.style.alignSelf = 'flex-end';
    div.style.maxWidth = '80%';
    
    if (animate) {
      div.style.animation = 'fadeIn 0.3s ease-out';
    }
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    const header = document.createElement('div');
    header.className = 'message-header d-flex justify-content-between';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'fw-bold';
    nameSpan.textContent = 'Tú';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'text-muted ms-2 small';
    timeSpan.textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    header.appendChild(nameSpan);
    header.appendChild(timeSpan);
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message;
    
    bubble.appendChild(header);
    bubble.appendChild(content);
    div.appendChild(bubble);
    
    chatMessages.appendChild(div);
    scrollToBottom();
  }
  
  // Función para agregar mensaje del bot al chat
  function addBotMessage(message, timestamp = new Date(), animate = true) {
    // Función para agregar el mensaje (con o sin retraso)
    const addMessage = () => {
      const div = document.createElement('div');
      div.className = 'message other-message bot-message mb-2';
      div.style.alignSelf = 'flex-start';
      div.style.maxWidth = '80%';
      
      if (animate) {
        div.style.animation = 'fadeIn 0.3s ease-out';
      }
      
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      
      const header = document.createElement('div');
      header.className = 'message-header d-flex justify-content-between';
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'fw-bold';
      nameSpan.innerHTML = '<i class="fas fa-robot me-1"></i> Asistente';
      
      const timeSpan = document.createElement('span');
      timeSpan.className = 'text-muted ms-2 small';
      timeSpan.textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      header.appendChild(nameSpan);
      header.appendChild(timeSpan);
      
      const content = document.createElement('div');
      content.className = 'message-content';
      content.textContent = message;
      
      bubble.appendChild(header);
      bubble.appendChild(content);
      div.appendChild(bubble);
      
      chatMessages.appendChild(div);
      scrollToBottom();
    };
    
    // Si se debe animar, agregar con retraso, de lo contrario agregar inmediatamente
    if (animate) {
      setTimeout(addMessage, 800); // Retraso de 800ms para simular escritura
    } else {
      addMessage();
    }
  }
  
  // Función para hacer scroll al fondo del chat
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Función para obtener respuesta a una pregunta
  function getResponse(question) {
    // Convertir a minúsculas y eliminar signos de puntuación
    const cleanQuestion = question.toLowerCase()
      .replace(/[¿?¡!.,;:]/g, '')
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
  
  // Cargar historial de chat al abrir
  function loadChatHistory() {
    fetch('/chat/history')
      .then(response => response.json())
      .then(data => {
        if (data.success && data.messages && data.messages.length > 0) {
          // Limpiar mensajes existentes
          chatMessages.innerHTML = '';
          
          // Mostrar los últimos 10 mensajes como máximo
          const recentMessages = data.messages.slice(-10);
          
          recentMessages.forEach(msg => {
            if (msg.isBot) {
              addBotMessage(msg.message, new Date(msg.timestamp), false);
            } else {
              addUserMessage(msg.message, new Date(msg.timestamp), false);
            }
          });
          
          // Añadir mensaje de bienvenida si no hay mensajes recientes
          if (recentMessages.length === 0) {
            showWelcomeMessage();
          }
        } else {
          showWelcomeMessage();
        }
      })
      .catch(error => {
        console.error('Error al cargar historial de chat:', error);
        showWelcomeMessage();
      });
  }
  
  // Mostrar mensaje de bienvenida
  function showWelcomeMessage() {
    chatMessages.innerHTML = '';
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'system-message my-2';
    welcomeMessage.innerHTML = `
      <div class="alert alert-info py-1 px-3">
        Bienvenido al chat de películas. ¡Haz preguntas sobre películas, géneros, directores o pide recomendaciones!
      </div>
    `;
    chatMessages.appendChild(welcomeMessage);
  }
  
  // Cargar historial al abrir el chat
  chatFloatBtn.addEventListener('click', function() {
    if (!chatContainer.classList.contains('show')) {
      loadChatHistory();
    }
  });
  
  // Manejar envío de mensajes
  chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Agregar mensaje del usuario al chat (temporal hasta recibir confirmación)
    addUserMessage(message);
    
    // Mostrar indicador de escritura
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message other-message bot-message mb-2 typing-indicator';
    typingIndicator.style.alignSelf = 'flex-start';
    typingIndicator.style.maxWidth = '80%';
    typingIndicator.innerHTML = `
      <div class="message-bubble">
        <div class="message-header d-flex justify-content-between">
          <span class="fw-bold"><i class="fas fa-robot me-1"></i> Asistente</span>
        </div>
        <div class="message-content">
          <span class="typing-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </div>
      </div>
    `;
    chatMessages.appendChild(typingIndicator);
    scrollToBottom();
    
    // Enviar mensaje a la API
    console.log('Enviando mensaje a la API:', { message });
    fetch('/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    })
    .then(response => {
      console.log('Respuesta recibida del servidor:', response.status, response.statusText);
      return response.json();
    })
    .then(data => {
      console.log('Datos recibidos del servidor:', data);
      // Eliminar indicador de escritura
      const typingElement = document.querySelector('.typing-indicator');
      if (typingElement) {
        typingElement.remove();
      }
      
      if (data.success) {
        console.log('Mensaje guardado exitosamente. IDs:', {
          userMessageId: data.userMessage.id,
          botMessageId: data.botMessage.id
        });
        // Mostrar respuesta del bot
        addBotMessage(data.botMessage.message, new Date(data.botMessage.timestamp));
      } else {
        console.error('Error en la respuesta:', data.error);
        // Mostrar mensaje de error
        const errorMessage = document.createElement('div');
        errorMessage.className = 'system-message my-2';
        errorMessage.innerHTML = `
          <div class="alert alert-danger py-1 px-3">
            Error: No se pudo procesar tu mensaje. Inténtalo de nuevo.
          </div>
        `;
        chatMessages.appendChild(errorMessage);
        scrollToBottom();
      }
    })
    .catch(error => {
      console.error('Error al enviar mensaje:', error);
      // Eliminar indicador de escritura
      const typingElement = document.querySelector('.typing-indicator');
      if (typingElement) {
        typingElement.remove();
      }
      
      // Mostrar mensaje de error
      const errorMessage = document.createElement('div');
      errorMessage.className = 'system-message my-2';
      errorMessage.innerHTML = `
        <div class="alert alert-danger py-1 px-3">
          Error de conexión. Inténtalo de nuevo más tarde.
        </div>
      `;
      chatMessages.appendChild(errorMessage);
      scrollToBottom();
    });
    
    // Limpiar campo de entrada
    messageInput.value = '';
    messageInput.focus();
  });
});
