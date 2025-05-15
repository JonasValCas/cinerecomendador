// Sistema de favoritos - Funcionalidad compartida

// Función para verificar si una película está en favoritos
function checkFavoriteStatus(movieId, favoriteBtn) {
  if (!favoriteBtn || !movieId) return;
  
  fetch(`/favorites/check/${movieId}`)
    .then(response => response.json())
    .then(data => {
      console.log('Estado de favorito:', data);
      updateFavoriteButton(favoriteBtn, data.isFavorite);
    })
    .catch(error => {
      console.error('Error al verificar estado de favorito:', error);
    });
}

// Función para actualizar la apariencia del botón de favorito
function updateFavoriteButton(favoriteBtn, isFavorite) {
  if (!favoriteBtn) return;
  
  if (isFavorite) {
    // Cuando está en favoritos: corazón lleno, botón rojo
    favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Quitar de favoritos';
    favoriteBtn.classList.remove('btn-outline-danger');
    favoriteBtn.classList.add('btn-danger');
    favoriteBtn.setAttribute('data-is-favorite', 'true');
    
    // Añadir una pequeña animación para hacer más visible el cambio
    favoriteBtn.classList.add('favorite-btn-active');
    setTimeout(() => {
      favoriteBtn.classList.remove('favorite-btn-active');
    }, 500);
  } else {
    // Cuando no está en favoritos: corazón vacío, botón con borde rojo
    favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Añadir a favoritos';
    favoriteBtn.classList.remove('btn-danger');
    favoriteBtn.classList.add('btn-outline-danger');
    favoriteBtn.setAttribute('data-is-favorite', 'false');
  }
}

// Función para alternar estado de favorito
function toggleFavorite(movieId, favoriteBtn, showMessageCallback) {
  if (!favoriteBtn || !movieId) return;
  
  // Deshabilitar botón mientras se procesa
  favoriteBtn.disabled = true;
  
  fetch('/favorites/toggle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ movieId: movieId })
  })
    .then(response => response.json())
    .then(data => {
      console.log('Respuesta de toggle favorito:', data);
      if (data.success) {
        updateFavoriteButton(favoriteBtn, data.action === 'added');
        if (showMessageCallback) {
          showMessageCallback(data.message, 'success');
        }
      } else {
        if (showMessageCallback) {
          showMessageCallback(data.error || 'Error al procesar favorito', 'error');
        }
      }
    })
    .catch(error => {
      console.error('Error al alternar favorito:', error);
      if (showMessageCallback) {
        showMessageCallback('Error de conexión al procesar favorito', 'error');
      }
    })
    .finally(() => {
      // Habilitar botón nuevamente
      favoriteBtn.disabled = false;
    });
}

// Inicializar botones de favoritos en la página
function initFavoriteButtons() {
  // Buscar todos los botones de favoritos en la página
  const favoriteButtons = document.querySelectorAll('.favorite-btn, #favorite-btn');
  
  favoriteButtons.forEach(btn => {
    const movieId = btn.getAttribute('data-movie-id') || 
                   document.getElementById('movie-id')?.value;
    
    if (!movieId) {
      console.error('No se encontró el ID de película para el botón de favoritos');
      return;
    }
    
    // Verificar estado inicial
    checkFavoriteStatus(movieId, btn);
    
    // Configurar evento de clic
    btn.addEventListener('click', function() {
      toggleFavorite(movieId, btn, showMessage);
    });
  });
}

// Función para mostrar mensajes
function showMessage(text, type = 'info') {
  // Eliminar mensaje anterior si existe
  const oldMessage = document.querySelector('.alert');
  if (oldMessage) {
    oldMessage.remove();
  }
  
  // Crear y mostrar nuevo mensaje
  const messageContainer = document.createElement('div');
  messageContainer.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} mt-2`;
  messageContainer.textContent = text;
  
  // Intentar insertar en diferentes contenedores posibles
  const containers = [
    document.querySelector('.movie-detail-container'),
    document.querySelector('.rating-selector')?.parentNode,
    document.querySelector('.card-body'),
    document.querySelector('main')
  ];
  
  for (const container of containers) {
    if (container) {
      container.prepend(messageContainer);
      break;
    }
  }
  
  // Eliminar mensaje después de 3 segundos
  setTimeout(() => {
    messageContainer.remove();
  }, 3000);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando sistema de favoritos');
  initFavoriteButtons();
});

// Agregar estilos CSS para la animación del botón de favoritos
const style = document.createElement('style');
style.textContent = `
  .favorite-btn-active {
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }
  
  .btn-danger.favorite-btn {
    animation: heartbeat 1s ease-in-out;
  }
  
  @keyframes heartbeat {
    0% { transform: scale(1); }
    25% { transform: scale(1.1); }
    50% { transform: scale(1); }
    75% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);
