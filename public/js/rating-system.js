// Sistema de calificación de películas - Versión mejorada con colecciones
window.addEventListener('DOMContentLoaded', function() {
  console.log('Sistema de calificación mejorado cargado');
  
  // Obtener elementos del DOM
  const stars = document.querySelectorAll('.rating-star');
  const ratingNumbers = document.querySelectorAll('.rating-number');
  const selectedRating = document.getElementById('selected-rating');
  const movieIdElement = document.getElementById('movie-id');
  
  // Verificar si estamos en la página de detalle de película
  if (!stars.length || !selectedRating || !movieIdElement) {
    console.log('No estamos en la página de detalle de película o faltan elementos');
    return;
  }
  
  const movieId = movieIdElement.value;
  const avgRatingStars = document.querySelectorAll('.avg-rating-star');
  const avgRatingValue = document.querySelector('.avg-rating-value');
  const ratingCountElement = document.querySelector('.rating-count');
  
  // Elementos para favoritos y colecciones
  const favoriteBtn = document.getElementById('favorite-btn');
  const collectionSelector = document.getElementById('collection-selector');
  const addToCollectionBtn = document.getElementById('add-to-collection-btn');
  
  console.log('Elementos encontrados:', {
    estrellas: stars.length,
    numeros: ratingNumbers.length,
    movieId: movieId,
    avgStars: avgRatingStars.length,
    favoriteBtn: !!favoriteBtn,
    collectionSelector: !!collectionSelector
  });
  
  // Función para actualizar las estrellas y botones numéricos de calificación del usuario
  function updateUserStars(rating) {
    // Actualizar estrellas
    stars.forEach(s => {
      const starRating = parseInt(s.getAttribute('data-rating'));
      if (starRating <= rating) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
    
    // Actualizar botones numéricos
    ratingNumbers.forEach(btn => {
      const btnRating = parseInt(btn.getAttribute('data-rating'));
      if (btnRating === rating) {
        btn.classList.add('active');
        btn.classList.remove('btn-outline-primary');
        btn.classList.add('btn-primary');
      } else {
        btn.classList.remove('active');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
      }
    });
  }
  
  // Función para actualizar las estrellas de calificación promedio
  function updateAverageRating(avgRating) {
    // Actualizar el valor numérico
    if (avgRatingValue) {
      avgRatingValue.textContent = avgRating;
    }
    
    // Actualizar las estrellas
    if (avgRatingStars.length > 0) {
      avgRatingStars.forEach((star, index) => {
        if (index + 1 <= avgRating) {
          star.classList.add('text-warning');
          star.classList.remove('text-secondary');
        } else {
          star.classList.add('text-secondary');
          star.classList.remove('text-warning');
        }
      });
    }
  }
  
  // Función para mostrar mensaje de éxito
  function showSuccessMessage() {
    // Eliminar mensaje anterior si existe
    const oldMessage = document.querySelector('.alert');
    if (oldMessage) {
      oldMessage.remove();
    }
    
    // Crear y mostrar nuevo mensaje
    const messageContainer = document.createElement('div');
    messageContainer.className = 'alert alert-success mt-2';
    messageContainer.textContent = '¡Calificación guardada correctamente!';
    
    const ratingSelector = document.querySelector('.rating-selector');
    if (ratingSelector && ratingSelector.parentNode) {
      ratingSelector.parentNode.appendChild(messageContainer);
      
      // Eliminar mensaje después de 3 segundos
      setTimeout(() => {
        messageContainer.remove();
      }, 3000);
    }
  }
  
  // Función para mostrar mensaje de error
  function showErrorMessage(errorText) {
    // Eliminar mensaje anterior si existe
    const oldMessage = document.querySelector('.alert');
    if (oldMessage) {
      oldMessage.remove();
    }
    
    // Crear y mostrar nuevo mensaje de error
    const messageContainer = document.createElement('div');
    messageContainer.className = 'alert alert-danger mt-2';
    messageContainer.textContent = errorText || 'Error al guardar la calificación';
    
    const ratingSelector = document.querySelector('.rating-selector');
    if (ratingSelector && ratingSelector.parentNode) {
      ratingSelector.parentNode.appendChild(messageContainer);
      
      // Eliminar mensaje después de 5 segundos
      setTimeout(() => {
        messageContainer.remove();
      }, 5000);
    }
  }
  
  // Función común para enviar calificación
  function sendRating(rating) {
    console.log('Enviando calificación al servidor:', { movieId, rating });
    
    // Guardar la calificación anterior en caso de error
    const previousRating = document.querySelector('.rating-star.active') ? 
      parseInt(document.querySelector('.rating-star.active').getAttribute('data-rating')) : null;
    
    // Mostrar indicador de carga con animación
    selectedRating.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Aplicar efecto visual inmediato para mejor UX
    updateUserStars(rating);
    
    // Verificar que tenemos un ID de película válido
    if (!movieId) {
      console.error('Error: ID de película no disponible');
      showErrorMessage('No se pudo identificar la película. Por favor, recarga la página.');
      return;
    }
    
    // Mostrar indicador visual de que se está procesando la solicitud
    const ratingSelector = document.querySelector('.rating-selector');
    if (ratingSelector) {
      ratingSelector.classList.add('rating-processing');
    }
    
    // Usar fetch para enviar la calificación
    fetch(`/movies/${movieId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rating }),
      credentials: 'same-origin' // Importante para enviar cookies de sesión
    })
    .then(response => {
      console.log('Respuesta recibida:', response.status, response.statusText);
      if (!response.ok) {
        console.error('Error en la respuesta HTTP:', response.status, response.statusText);
        // Si hay error, restaurar la calificación anterior
        if (previousRating) {
          updateUserStars(previousRating);
        } else {
          // Si no había calificación previa, quitar todas las estrellas
          stars.forEach(s => s.classList.remove('active'));
          ratingNumbers.forEach(btn => {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline-primary');
          });
          selectedRating.textContent = 'Sin calificar';
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Datos recibidos:', data);
      
      // Quitar indicador de procesamiento
      const ratingSelector = document.querySelector('.rating-selector');
      if (ratingSelector) {
        ratingSelector.classList.remove('rating-processing');
      }
      
      if (data.success) {
        // Ya actualizamos las estrellas antes, solo actualizar el texto
        selectedRating.textContent = rating;
        
        // Aplicar clase para efecto de éxito en estrellas
        stars.forEach(s => {
          if (parseInt(s.getAttribute('data-rating')) <= rating) {
            s.classList.add('rating-success');
            setTimeout(() => {
              s.classList.remove('rating-success');
            }, 500);
          }
        });
        
        // Aplicar clase para efecto de éxito en botones numéricos
        ratingNumbers.forEach(btn => {
          const btnRating = parseInt(btn.getAttribute('data-rating'));
          if (btnRating === rating) {
            btn.classList.add('rating-success');
            setTimeout(() => {
              btn.classList.remove('rating-success');
            }, 500);
          }
        });
        
        // Actualizar la calificación promedio
        updateAverageRating(data.avgRating);
        
        // Actualizar contador de calificaciones
        if (ratingCountElement) {
          ratingCountElement.textContent = data.ratingCount;
        }
        
        // Mostrar mensaje de éxito
        showSuccessMessage();
      } else {
        // En caso de error, restaurar el texto original
        console.error('Error en la respuesta:', data.error);
        
        // Restaurar la calificación anterior o limpiar la selección
        const userRating = document.querySelector('.rating-star.active');
        if (userRating) {
          selectedRating.textContent = userRating.getAttribute('data-rating');
        } else {
          selectedRating.textContent = 'Sin calificar';
        }
        
        // Mostrar mensaje de error
        showErrorMessage(data.error || 'Error desconocido al calificar la película');
      }
    })
    .catch(error => {
      console.error('Error en la petición:', error);
      
      // Quitar indicador de procesamiento
      const ratingSelector = document.querySelector('.rating-selector');
      if (ratingSelector) {
        ratingSelector.classList.remove('rating-processing');
      }
      
      // En caso de error, restaurar el texto original
      const userRating = document.querySelector('.rating-star.active');
      selectedRating.textContent = userRating ? userRating.getAttribute('data-rating') : 'Sin calificar';
      
      // Mostrar mensaje de error amigable
      showErrorMessage('Error de conexión. Por favor, verifica tu conexión a internet e inténtalo de nuevo.');
    });
  }
  
  // Función para actualizar la visualización de estrellas al hacer hover
  function updateStarsHover(rating) {
    stars.forEach(s => {
      const starRating = parseInt(s.getAttribute('data-rating'));
      if (starRating <= rating) {
        s.classList.add('hover');
      } else {
        s.classList.remove('hover');
      }
    });
  }

  // Función para actualizar la visualización de números al hacer hover
  function updateNumbersHover(rating) {
    ratingNumbers.forEach(btn => {
      const btnRating = parseInt(btn.getAttribute('data-rating'));
      if (btnRating <= rating) {
        btn.classList.add('btn-hover');
      } else {
        btn.classList.remove('btn-hover');
      }
    });
  }
  
  // Función para quitar todos los efectos hover
  function removeAllHoverEffects() {
    stars.forEach(s => s.classList.remove('hover'));
    ratingNumbers.forEach(btn => btn.classList.remove('btn-hover'));
  }

  // Función para previsualizar la calificación antes de enviarla
  function previewRating(rating) {
    // Actualizar visualmente las estrellas y números sin enviar al servidor
    updateStarsHover(rating);
    updateNumbersHover(rating);
    
    // Mostrar la calificación seleccionada temporalmente
    selectedRating.textContent = rating;
  }
  
  // Manejar clic en estrellas
  stars.forEach(star => {
    star.addEventListener('click', function() {
      console.log('Estrella clickeada');
      const rating = parseInt(this.getAttribute('data-rating'));
      console.log('Calificación seleccionada:', rating);
      
      // Actualizar inmediatamente la interfaz para mejor UX
      updateUserStars(rating);
      
      // Enviar la calificación al servidor
      sendRating(rating);
    });
    
    // Efecto hover en estrellas
    star.addEventListener('mouseenter', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      previewRating(rating);
    });
    
    star.addEventListener('mouseleave', function() {
      removeAllHoverEffects();
    });
  });
  
  // Manejar clic en botones numéricos
  ratingNumbers.forEach(button => {
    button.addEventListener('click', function() {
      console.log('Botón numérico clickeado');
      const rating = parseInt(this.getAttribute('data-rating'));
      console.log('Calificación numérica seleccionada:', rating);
      
      // Actualizar inmediatamente la interfaz para mejor UX
      updateUserStars(rating);
      
      // Enviar la calificación al servidor
      sendRating(rating);
    });
    
    // Efecto hover en botones numéricos
    button.addEventListener('mouseenter', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      previewRating(rating);
    });
    
    button.addEventListener('mouseleave', function() {
      removeAllHoverEffects();
    });
  });
  // La funcionalidad de favoritos ahora se maneja en favorites.js
  // No es necesario configurar aquí el botón de favoritos
  
  // Las funciones de favoritos se han movido a favorites.js
  
  console.log('Eventos de calificación y colecciones configurados correctamente');
});
