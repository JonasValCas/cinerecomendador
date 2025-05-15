# Sistema de Recomendación de Películas

Una aplicación web simple que permite a los usuarios explorar, calificar y recibir recomendaciones de películas basadas en sus preferencias.

## Características

### Administrador
- Registro e inicio de sesión
- Gestión de contenido (vía MongoDB Compass)
- Visualización de estadísticas y recomendaciones generales
- Administración de usuarios

### Usuario
- Registro e inicio de sesión
- Exploración del catálogo de películas
- Búsqueda por título o género
- Calificación de películas (1-5 estrellas)
- Recomendaciones personalizadas basadas en géneros favoritos
- Perfil de usuario con historial de calificaciones

## Tecnologías
- **Backend**: Node.js, Express
- **Base de datos**: MongoDB
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Plantillas**: EJS
- **Autenticación**: Express-session con almacenamiento en MongoDB

## Requisitos previos

- Node.js (v14 o superior)
- MongoDB (local o Atlas)
- npm o yarn

## Instalación

1. Clona este repositorio o descarga los archivos

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura las variables de entorno creando un archivo `.env` en la raíz del proyecto:
   ```
   MONGODB_URI=mongodb://localhost:27017/movie-recommender
   SESSION_SECRET=tu_clave_secreta_aqui
   PORT=3000
   ```

4. Inicializa la base de datos con películas de ejemplo:
   ```
   node seed.js
   ```

5. Inicia el servidor:
   ```
   npm start
   ```
   O en modo desarrollo con recarga automática:
   ```
   npm run dev
   ```

6. Accede a la aplicación en tu navegador:
   ```
   http://localhost:3000
   ```

## Uso

### Primer usuario
El primer usuario que se registre en el sistema será automáticamente asignado como administrador.

### Administración de películas
Los administradores pueden gestionar el catálogo de películas directamente desde MongoDB Compass con los siguientes campos:
- titulo: Nombre de la película
- genero: Género principal
- descripcion: Sinopsis o descripción
- anio: Año de lanzamiento
- rating: Calificación promedio (0-5)
- imagen: URL de la imagen de portada

### Calificaciones
Los usuarios pueden calificar películas en una escala de 1 a 5 estrellas. Estas calificaciones se utilizan para generar recomendaciones personalizadas.

## Estructura del proyecto

- `/models`: Esquemas de MongoDB
- `/routes`: Rutas de Express
- `/views`: Plantillas EJS
- `/public`: Archivos estáticos (CSS, JS, imágenes)
- `server.js`: Punto de entrada principal
- `seed.js`: Script para inicializar la base de datos

## Licencia

Este proyecto es de código abierto y está disponible para uso educativo.
