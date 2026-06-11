🏈 NFL StatCenter

Aplicación web para consultar estadísticas, equipos y temporadas de la National Football League (NFL), desarrollada con Node.js, Express y JavaScript.


Descripción

Este proyecto es una aplicación web  dedicada a la NFL que permite consultar estadísticas por temporada, información de equipos y resultados de juegos. Los datos abarcan desde la temporada 2015 hasta 2026.

Tecnologías Utilizadas

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
│   │   └── db.js
│   ├── controllers/
│   │   ├── gamesController.js
│   │   ├── seasonsController.js
│   │   ├── statsController.js
│   │   └── teamsController.js
│   ├── datos/
│   │   ├── 2015.csv
│   │   └── ...hasta 2026.csv
│   ├── frontend/
│   │   ├── index.html
│   │   ├── seasons.html
│   │   ├── script.js
│   │   ├── seasons.js
│   │   └── style.css
│   ├── routes/
│   │   ├── gamesRoutes.js
│   │   ├── seasonsRoutes.js
│   │   ├── statsRoutes.js
│   │   └── teamsRoutes.js
│   ├── importGames.js
│   ├── nfl_db.sql
│   ├── package.json
│   ├── server.js
│   └── .env
└── README.md


Cómo ejecutar el proyecto


Clona el repositorio:

bashgit clone https://github.com/MairiAG/NFL-StatCenter.git


Entra a la carpeta:

bashcd NFL-StatCenter/nfl

Instala las dependencias:

bashnpm install

Importa nfl_db.sql en MySQL.
Inicia el servidor:

bashnode server.js


Abre tu navegador en http://localhost:3000

👤 Autor

Mairi Aranda 
Estudiante de Actuaría
🔗 github.com/MairiAG
