// Funcionalidades para la página de detalle de película
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando funcionalidades de detalle de película');
  
  // Elementos del DOM
  const movieIdElement = document.getElementById('movie-id');
  const favoriteBtn = document.getElementById('favorite-btn');
  const collectionSelector = document.getElementById('collection-selector');
  const nuevaColeccionContainer = document.getElementById('nueva-coleccion-container');
  
  if (!movieIdElement) {
    console.log('No estamos en la página de detalle de película');
    return;
  }
  
  const movieId = movieIdElement.value;
  console.log('ID de película:', movieId);
  
  // La funcionalidad de favoritos ahora se maneja en favorites.js
  // No es necesario configurar aquí el botón de favoritos
  
  // Configurar selector de colección
  if (collectionSelector && nuevaColeccionContainer) {
    console.log('Configurando selector de colección');
    
    const nuevaColeccionInput = nuevaColeccionContainer.querySelector('input');
    
    collectionSelector.addEventListener('change', function() {
      if (this.value === 'nueva') {
        nuevaColeccionContainer.classList.remove('d-none');
        nuevaColeccionInput.required = true;
      } else {
        nuevaColeccionContainer.classList.add('d-none');
        nuevaColeccionInput.required = false;
      }
    });
  }
  
  // Las funciones de favoritos se han movido a favorites.js
  
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
    
    const movieDetailContainer = document.querySelector('.movie-detail-container');
    if (movieDetailContainer) {
      movieDetailContainer.prepend(messageContainer);
      
      // Eliminar mensaje después de 3 segundos
      setTimeout(() => {
        messageContainer.remove();
      }, 3000);
    }
  }
});
