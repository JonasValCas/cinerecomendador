/**
 * Script para inicializar la base de datos con películas de ejemplo
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');

// Películas de ejemplo
const peliculasEjemplo = [
  {
    titulo: "El Padrino",
    genero: "Drama",
    descripcion: "La historia de la familia Corleone, una de las más poderosas familias de la mafia de Nueva York en los años 40.",
    anio: 1972,
    rating: 4.9,
    imagen: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg"
  },
  {
    titulo: "Titanic",
    genero: "Romance",
    descripcion: "Un joven artista y una joven rica se conocen y se enamoran a bordo del Titanic en su viaje inaugural.",
    anio: 1997,
    rating: 4.5,
    imagen: "https://m.media-amazon.com/images/M/MV5BMDdmZGU3NDQtY2E5My00ZTliLWIzOTUtMTY4ZGI1YjdiNjk3XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_.jpg"
  },
  {
    titulo: "El Señor de los Anillos: La Comunidad del Anillo",
    genero: "Fantasía",
    descripcion: "Un hobbit de la Comarca y ocho compañeros emprenden un viaje para destruir el poderoso Anillo Único y salvar la Tierra Media del Señor Oscuro Sauron.",
    anio: 2001,
    rating: 4.8,
    imagen: "https://m.media-amazon.com/images/M/MV5BN2EyZjM3NzUtNWUzMi00MTgxLWI0NTctMzY4M2VlOTdjZWRiXkEyXkFqcGdeQXVyNDUzOTQ5MjY@._V1_.jpg"
  },
  {
    titulo: "Matrix",
    genero: "Ciencia Ficción",
    descripcion: "Un programador de computadoras descubre que la realidad es una simulación creada por máquinas inteligentes para subyugar a la humanidad.",
    anio: 1999,
    rating: 4.7,
    imagen: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg"
  },
  {
    titulo: "Interestelar",
    genero: "Ciencia Ficción",
    descripcion: "Un equipo de exploradores viaja a través de un agujero de gusano en el espacio en un intento de asegurar la supervivencia de la humanidad.",
    anio: 2014,
    rating: 4.6,
    imagen: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg"
  },
  {
    titulo: "El Rey León",
    genero: "Animación",
    descripcion: "Un joven príncipe león huye de su reino solo para aprender el verdadero significado de la responsabilidad y la valentía.",
    anio: 1994,
    rating: 4.8,
    imagen: "https://m.media-amazon.com/images/M/MV5BYTYxNGMyZTYtMjE3MS00MzNjLWFjNmYtMDk3N2FmM2JiM2M1XkEyXkFqcGdeQXVyNjY5NDU4NzI@._V1_.jpg"
  },
  {
    titulo: "Pulp Fiction",
    genero: "Crimen",
    descripcion: "Las vidas de dos asesinos a sueldo, un boxeador, un gángster y su esposa, y un par de bandidos se entrelazan en cuatro historias de violencia y redención.",
    anio: 1994,
    rating: 4.7,
    imagen: "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg"
  },
  {
    titulo: "Forrest Gump",
    genero: "Drama",
    descripcion: "Las presidencias de Kennedy y Johnson, la guerra de Vietnam, el escándalo Watergate y otros eventos históricos se desarrollan a través de la perspectiva de un hombre de Alabama con un coeficiente intelectual de 75.",
    anio: 1994,
    rating: 4.8,
    imagen: "https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg"
  },
  {
    titulo: "El Caballero de la Noche",
    genero: "Acción",
    descripcion: "Cuando la amenaza conocida como el Joker causa estragos y caos en Gotham City, Batman debe aceptar una de las mayores pruebas psicológicas y físicas de su capacidad para luchar contra la injusticia.",
    anio: 2008,
    rating: 4.9,
    imagen: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg"
  },
  {
    titulo: "La Lista de Schindler",
    genero: "Historia",
    descripcion: "En la Polonia ocupada por los alemanes durante la Segunda Guerra Mundial, el industrial Oskar Schindler se preocupa por sus trabajadores judíos después de presenciar su persecución por los nazis.",
    anio: 1993,
    rating: 4.9,
    imagen: "https://m.media-amazon.com/images/M/MV5BNDE4OTMxMTctNmRhYy00NWE2LTg3YzItYTk3M2UwOTU5Njg4XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg"
  }
];

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-recommender')
  .then(async () => {
    console.log('Conectado a MongoDB');
    
    try {
      // Eliminar películas existentes
      await Movie.deleteMany({});
      console.log('Colección de películas limpiada');
      
      // Insertar películas de ejemplo
      const result = await Movie.insertMany(peliculasEjemplo);
      console.log(`${result.length} películas insertadas con éxito`);
      
      // Cerrar conexión
      mongoose.connection.close();
      console.log('Conexión cerrada');
    } catch (error) {
      console.error('Error al sembrar la base de datos:', error);
    }
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
  });
