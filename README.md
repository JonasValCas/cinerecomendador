# Sistema de Recomendación de Películas con Chatbot Inteligente

Una aplicación web que permite a los usuarios explorar, calificar y recibir recomendaciones de películas, ahora mejorada con un chatbot inteligente para una experiencia de usuario más interactiva.

## ✨ Características Principales

### Para Usuarios
- **Registro e Inicio de Sesión**: Sistema de autenticación seguro.
- **Exploración de Catálogo**: Navega y busca películas por título o género.
- **Calificaciones y Reseñas**: Califica películas (1-5 estrellas) y deja tus reseñas.
- **Recomendaciones Personalizadas**: Recibe sugerencias de películas basadas en tus géneros favoritos y calificaciones.
- **Perfil de Usuario**: Visualiza tu historial de calificaciones y películas favoritas.
- **Chatbot Inteligente**:
    - **Asistencia Conversacional**: Pregúntale al chatbot sobre películas, actores o directores.
    - **Consciente del Contexto**: Mantiene el hilo de la conversación y responde a preguntas de seguimiento.
    - **Conocimiento del Catálogo (RAG)**: Utiliza la información de la base de datos del proyecto para dar respuestas precisas y contextualizadas.
    - **Enfocado en Cine**: El chatbot está especializado y restringido a temas de cine, declinando amablemente preguntas fuera de su dominio.

### Para Administradores
- **Gestión de Contenido**: Administra el catálogo de películas directamente (vía MongoDB Compass o similar).
- **Visualización de Estadísticas**: Accede a recomendaciones generales y datos de uso.
- **Administración de Usuarios**: Gestiona los usuarios registrados en el sistema.

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express
- **Base de Datos**: MongoDB con Mongoose
- **Frontend**: EJS, HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Autenticación**: `express-session` con almacenamiento en MongoDB
- **IA & Chatbot**: Ollama (con modelo `llama3.1`)
- **Comunicación en Tiempo Real**: Socket.IO (para notificar usuarios conectados)

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MongoDB (local o en la nube como Atlas)
- **Ollama**: Debes tener [Ollama](https://ollama.com/) instalado y ejecutándose en tu máquina.
- **Modelo de Lenguaje**: Debes haber descargado el modelo `llama3.1` en Ollama:
  ```bash
  ollama pull llama3.1
  ```

## 🚀 Instalación y Puesta en Marcha

1.  **Clona el repositorio**:
    ```bash
    git clone https://github.com/JonasValCas/cinerecomendador.git
    cd cinerecomendador
    ```

2.  **Instala las dependencias del proyecto**:
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno**: Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
    ```env
    MONGODB_URI=mongodb://localhost:27017/movie-recommender
    SESSION_SECRET=tu_clave_secreta_aqui_muy_segura
    PORT=3000
    ```
    *(Nota: La URL del servicio Ollama está configurada en `services/ollamaService.js` como `http://localhost:11434`)*

4.  **Inicializa la base de datos** (opcional): Si deseas poblar la base de datos con películas de ejemplo, ejecuta:
    ```bash
    node seed.js
    ```

5.  **Inicia el servidor**:
    - Para producción:
      ```bash
      npm start
      ```
    - Para desarrollo con recarga automática (recomendado):
      ```bash
      npm run dev
      ```

6.  **Accede a la aplicación**: Abre tu navegador y ve a `http://localhost:3000`.

## 📁 Estructura del Proyecto

```
/
├── models/         # Esquemas de Mongoose para la base de datos
├── routes/         # Rutas de la API y de las vistas (Express)
├── services/       # Lógica de negocio (ej. servicio de Ollama)
├── views/          # Plantillas EJS para el frontend
├── public/         # Archivos estáticos (CSS, JS del cliente, imágenes)
├── .env.example    # Ejemplo de variables de entorno
├── server.js       # Punto de entrada principal de la aplicación
├── seed.js         # Script para poblar la base de datos
└── package.json
```

## Licencia

Este proyecto es de código abierto y está disponible para uso educativo.
