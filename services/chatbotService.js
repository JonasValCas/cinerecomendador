/**
 * @module services/chatbotService
 * @description This service provides functionalities for generating chatbot responses.
 * It includes a helper function to select random responses and the main function
 * to process user messages and generate appropriate bot replies based on keywords.
 */

/**
 * Selects a random response from an array of responses.
 * @param {string[]} responses - An array of possible string responses.
 * @returns {string} A randomly selected response from the array.
 */
function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Generates a chatbot response based on the user's message.
 * The function processes the message, identifies keywords, and returns a relevant
 * and varied response. It covers greetings, recommendations, movie queries by genre,
 * director, actor, and other common interactions.
 *
 * @param {string} message - The user's input message.
 * @returns {string} The chatbot's generated response.
 */
function generateBotResponse(message) {
  // Convertir mensaje a minúsculas para facilitar la comparación
  const lowerMessage = message.toLowerCase();

  // --- Saludos ---
  if (lowerMessage.includes('hola') || lowerMessage.includes('saludos') || lowerMessage.includes('hey') || lowerMessage.includes('buenas')) {
    const greetings = [
      '¡Hola! Soy CineBot, tu asistente de películas. ¿En qué puedo ayudarte hoy?',
      '¡Saludos! ¿Listo para hablar de cine? Pregúntame lo que quieras.',
      '¡Hey! Soy CineBot. ¿Buscas alguna recomendación o información sobre películas?',
      '¡Buenas! ¿Qué película te interesa hoy o qué te gustaría saber?'
    ];
    return getRandomResponse(greetings);
  }

  // --- Recomendaciones ---
  if (lowerMessage.includes('recomienda') || lowerMessage.includes('recomendación') || lowerMessage.includes('recomendar')) {
    // Check for specific recommendation types before general
    if (lowerMessage.includes('género') || lowerMessage.includes('categoria')) {
       return 'Claro, puedo recomendarte por género. ¿Tienes alguno en mente? Por ejemplo, acción, comedia, drama, etc.';
    }
    if (lowerMessage.includes('director')) {
        return 'Entendido. ¿Hay algún director cuyas películas te gusten especialmente para basar la recomendación?';
    }
    if (lowerMessage.includes('actor') || lowerMessage.includes('actriz')) {
        return '¡Buena idea! Dime un actor o actriz y buscaré películas suyas que podrían gustarte.';
    }
    // General recommendation
    const recommendations = [
      'Puedo recomendarte películas basadas en tus calificaciones previas. ¡Visita la sección de recomendaciones para ver sugerencias personalizadas!',
      'Para darte una buena recomendación, me ayuda saber qué te gusta. ¿Hay algún género o actor que prefieras?',
      '¡Claro! Si calificas algunas películas que ya has visto, mis recomendaciones serán mucho más acertadas para ti.',
      'Una buena forma de encontrar tu próxima película favorita es explorar nuestra sección de "Películas Populares" o "Mejor Calificadas".'
    ];
    return getRandomResponse(recommendations);
  }

  // --- Mejor Película / Favorita ---
  if (lowerMessage.includes('mejor película') || lowerMessage.includes('película favorita')) {
    const bestMovieResponses = [
      'Esa es una pregunta difícil, ¡hay tantas películas geniales! Según nuestros usuarios, algunas de las más aclamadas son El Padrino, Pulp Fiction, y El Caballero de la Noche. ¿Has visto alguna?',
      'Muchos usuarios adoran películas como Sueños de Fuga (The Shawshank Redemption) o Forrest Gump. ¿Qué tipo de películas suelen ser tus favoritas?',
      'La "mejor película" es muy subjetiva. ¿Qué película consideras tú que es la mejor y por qué? Me encantaría escucharlo.'
    ];
    return getRandomResponse(bestMovieResponses);
  }

  // --- Géneros Específicos ---
  const genres = {
    'acción': '¡Acción! Perfecto para una dosis de adrenalina. Películas como "Mad Max: Furia en el Camino" o la saga de "John Wick" suelen ser muy populares.',
    'comedia': '¡Comedia! Nada como unas buenas risas. "Superbad" o "La Vida de Brian" son clásicos. ¿Buscas algo más nuevo o un clásico?',
    'drama': '¡Drama! Para emociones intensas. "Forrest Gump" o "La Lista de Schindler" son ejemplos poderosos. ¿Qué tipo de drama te interesa?',
    'ciencia ficción': '¡Ciencia Ficción! Explorando otros mundos y futuros. "Blade Runner 2049" o "Interestelar" son visualmente impresionantes.',
    'terror': '¡Terror! ¿Te atreves? "El Exorcista" o "Hereditary" pueden quitarte el sueño. ¿Prefieres el terror psicológico o algo más gráfico?',
    'animación': '¡Animación! No solo para niños. "Spider-Man: Un Nuevo Universo" o las obras de Studio Ghibli son fantásticas.',
    'romance': '¡Romance! Ideal para una tarde tranquila. "Titanic" o "Diario de una Pasión" son muy conocidas. ¿Alguna película romántica que te encante?',
    'documental': '¡Documentales! Aprendiendo sobre el mundo real. "Mi Maestro el Pulpo" o "Planeta Tierra" son excelentes opciones.',
    'musical': '¡Musicales! Donde la música cuenta la historia. "La La Land" o "El Gran Showman" te harán cantar.'
  };

  for (const genre in genres) {
    if (lowerMessage.includes(genre)) {
      return genres[genre] + " También puedes usar nuestro filtro de géneros en la página principal.";
    }
  }

  // --- Pregunta General sobre Géneros/Categorías ---
  if (lowerMessage.includes('género') || lowerMessage.includes('categoría')) {
    const genreGeneral = [
      'Tenemos películas de varios géneros: Acción, Comedia, Drama, Ciencia Ficción, Terror, Animación, Romance, ¡y más! ¿Qué género te interesa explorar hoy?',
      'Puedes buscar películas por género en nuestro catálogo. ¿Hay alguno en particular que te llame la atención?'
    ];
    return getRandomResponse(genreGeneral);
  }

  // --- Directores ---
  if (lowerMessage.includes('director') || lowerMessage.includes('dirigida')) {
    const directors = [
      'Algunos directores populares son: Christopher Nolan, Quentin Tarantino, Steven Spielberg y Martin Scorsese. ¿Te gusta alguno en particular o buscas información sobre un director específico?',
      'Los directores tienen estilos únicos. ¿Hay alguna película cuya dirección te haya impresionado últimamente?'
    ];
    return getRandomResponse(directors);
  }

  // --- Actores / Actrices ---
  if (lowerMessage.includes('actor') || lowerMessage.includes('actriz')) {
    const actors = [
      'Tenemos películas con grandes actores como Tom Hanks, Leonardo DiCaprio, Meryl Streep y Jennifer Lawrence. ¿Tienes algún actor o actriz favorita?',
      'La actuación es clave en una película. ¿Hay algún intérprete cuyo trabajo sigas de cerca?'
    ];
    return getRandomResponse(actors);
  }

  // --- Estrenos / Novedades ---
  if (lowerMessage.includes('estreno') || lowerMessage.includes('nueva') || lowerMessage.includes('reciente')) {
    const releases = [
      'Constantemente actualizamos nuestro catálogo con los últimos estrenos. ¡Revisa la sección de películas para ver las más recientes!',
      'Para ver lo más nuevo, te recomiendo visitar la página principal y filtrar por "Últimos Estrenos".'
    ];
    return getRandomResponse(releases);
  }

  // --- Calificaciones / Puntuaciones ---
  if (lowerMessage.includes('calificar') || lowerMessage.includes('puntuación') || lowerMessage.includes('rating')) {
    const ratingsInfo = [
      'Puedes calificar cualquier película con 1 a 5 estrellas. ¡Tus calificaciones nos ayudan a ofrecerte mejores recomendaciones y ayudan a otros usuarios!',
      'Dar tu puntuación a las películas es muy útil. Así, podemos refinar las sugerencias que te hacemos.'
    ];
    return getRandomResponse(ratingsInfo);
  }

  // --- Agradecimientos ---
  if (lowerMessage.includes('gracias') || lowerMessage.includes('thanks')) {
    const thanks = [
      '¡De nada! Estoy aquí para ayudarte con todo lo relacionado a películas.',
      '¡Un placer! Si tienes más preguntas, no dudes en consultar.',
      '¡No hay de qué! Disfruta explorando las películas.'
    ];
    return getRandomResponse(thanks);
  }

  // --- Despedidas ---
  if (lowerMessage.includes('adios') || lowerMessage.includes('chao') || lowerMessage.includes('hasta luego') || lowerMessage.includes('nos vemos')) {
    const goodbyes = [
      '¡Hasta pronto! Regresa cuando quieras hablar sobre películas.',
      '¡Adiós! Que tengas un buen día y disfrutes de tus próximas películas.',
      '¡Nos vemos! Espero haberte ayudado.'
    ];
    return getRandomResponse(goodbyes);
  }

  // --- Fallback / Respuestas Genéricas ---
  // (Si no hay coincidencias específicas, dar una respuesta genérica)
  const genericResponses = [
    '¡Interesante! ¿Qué tipo de películas te gustan?',
    'Cuéntame más sobre tus películas favoritas.',
    'Si buscas recomendaciones personalizadas, no olvides calificar las películas que ya has visto.',
    '¿Necesitas ayuda para encontrar alguna película en particular?',
    '¡El cine es una forma maravillosa de arte! ¿Qué aspecto te gusta más de las películas?',
    'Puedes preguntarme sobre géneros, directores, o cómo usar el sitio.',
    'No estoy seguro de cómo responder a eso. ¿Podrías reformular tu pregunta?',
    'Hmm, buena pregunta. Intenta ser un poco más específico si buscas algo en particular.',
    'Explora nuestro catálogo, ¡seguro encuentras algo que te guste!'
  ];
  return getRandomResponse(genericResponses);
}

module.exports = {
  generateBotResponse
};
