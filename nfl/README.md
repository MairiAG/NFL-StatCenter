🏈 NFL StatCenter

Aplicación web para consultar estadísticas, equipos y temporadas de la National Football League (NFL), desarrollada con Node.js, Express y JavaScript.


📋 Descripción

Este proyecto es una aplicación web dedicada a la NFL que permite consultar estadísticas por temporada, información de equipos y resultados de juegos. Los datos abarcan desde la temporada 2015 hasta 2026. El objetivo principal es aplicar conocimientos de desarrollo web con Node.js, Express y manejo de bases de datos.


🚀 Tecnologías Utilizadas


HTML5 / CSS3 – Estructura y estilos del sitio
JavaScript – Interactividad y dinamismo
Node.js – Entorno de ejecución del servidor
Express.js – Framework para el servidor y rutas API
MySQL – Base de datos relacional
CSV – Archivos de datos por temporada (2015–2026)



📁 Estructura del Proyecto

NFL-StatCenter/
│
├── nfl/
│   ├── config/
│   │   └── db.js                  # Conexión a la base de datos
│   │
│   ├── controllers/
│   │   ├── gamesController.js     # Lógica de juegos
│   │   ├── seasonsController.js   # Lógica de temporadas
│   │   ├── statsController.js     # Lógica de estadísticas
│   │   └── teamsController.js     # Lógica de equipos
│   │
│   ├── datos/
│   │   ├── 2015.csv               # Datos temporada 2015
│   │   ├── 2016.csv
│   │   └── ...                    # Hasta 2026.csv
│   │
│   ├── frontend/
│   │   ├── index.html             # Página principal
│   │   ├── seasons.html           # Página de temporadas
│   │   ├── script.js              # Lógica del frontend
│   │   ├── seasons.js
│   │   └── style.css              # Estilos del sitio
│   │
│   ├── routes/
│   │   ├── gamesRoutes.js         # Rutas de juegos
│   │   ├── seasonsRoutes.js       # Rutas de temporadas
│   │   ├── statsRoutes.js         # Rutas de estadísticas
│   │   └── teamsRoutes.js         # Rutas de equipos
│   │
│   ├── importGames.js             # Script para importar datos CSV
│   ├── nfl_db.sql                 # Estructura de la base de datos
│   ├── package.json               # Dependencias del proyecto
│   ├── server.js                  # Servidor principal
│   ├── .env                       # Variables de entorno
│   └── README.md


▶️ Cómo ejecutar el proyecto


Clona el repositorio:


bash   git clone https://github.com/MairiAG/NFL-StatCenter.git


Entra a la carpeta del proyecto:


bash   cd NFL-StatCenter/nfl


Instala las dependencias:


bash   npm install


Configura el archivo .env con tus credenciales de base de datos.
Importa la base de datos con nfl_db.sql en MySQL.
Inicia el servidor:


bash   node server.js


Abre tu navegador en http://localhost:3000



👤 Autor

Mairi Aranda 
Estudiante de Actuaría

🔗 github.com/MairiAG
Este proyecto fue desarrollado con fines educativos.
