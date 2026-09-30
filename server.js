// server.js — punto de entrada del portafolio en Node.js
//
// Flujo de una petición:
//   navegador → Express
//     ├─ /css, /js, /img      → archivos estáticos de /public
//     ├─ GET /                → renderiza views/index.ejs con data/portafolio.json
//     ├─ GET /api/portafolio  → mismos datos en JSON (útil para otra app o pruebas)
//     ├─ POST /api/contacto   → routes/contacto.js (valida, envía correo o guarda)
//     └─ cualquier otra ruta  → 404 con estilo propio

const path = require('path');
const fs = require('fs');

// Cargamos .env ANTES de requerir las rutas, para que routes/contacto.js vea las
// credenciales SMTP. Node >= 20.12 lo trae nativo, así evitamos depender de dotenv.
const RUTA_ENV = path.join(__dirname, '.env');
if (fs.existsSync(RUTA_ENV)) process.loadEnvFile(RUTA_ENV);

const express = require('express');
const contactoRouter = require('./routes/contacto');

const app = express();
const PORT = process.env.PORT || 3000;
const ES_PRODUCCION = process.env.NODE_ENV === 'production';
const RUTA_DATOS = path.join(__dirname, 'data', 'portafolio.json');

// En desarrollo releemos el JSON en cada petición: editas un proyecto, recargas
// el navegador y ya aparece. En producción lo cacheamos porque no cambia.
let cacheDatos = null;
function leerDatos() {
  if (ES_PRODUCCION && cacheDatos) return cacheDatos;
  cacheDatos = JSON.parse(fs.readFileSync(RUTA_DATOS, 'utf8'));
  return cacheDatos;
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');
// Variables que ven todas las vistas. `base` es el prefijo de rutas (css, js, img):
// aquí es "/", y en la versión estática para GitHub Pages lo cambia scripts/build.js.
app.locals.base = '/';
app.locals.estatico = false;
// Detrás de Render/Railway la IP real llega en X-Forwarded-For; la necesitamos
// para el límite de mensajes por visitante en /api/contacto.
app.set('trust proxy', 1);

// Cabeceras básicas de seguridad (sin helmet para no bloquear los CDN que usamos).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: ES_PRODUCCION ? '7d' : 0 }));
app.use(express.json({ limit: '20kb' }));

app.get('/', (req, res) => {
  res.render('index', { d: leerDatos(), anioActual: new Date().getFullYear() });
});

app.get('/api/portafolio', (req, res) => {
  res.json(leerDatos());
});

app.use('/api/contacto', contactoRouter);

app.use((req, res) => {
  res.status(404).render('404', { d: leerDatos() });
});

// Manejador de errores: un JSON mal formado en /api/contacto cae aquí y
// respondemos JSON (el front lo muestra como alerta) en vez de una página HTML.
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({ ok: false, error: 'No se pudo procesar la solicitud.' });
  }
  res.status(500).send('Error interno del servidor');
});

app.listen(PORT, () => {
  console.log(`\n  ▶ Portafolio corriendo en http://localhost:${PORT}\n`);
});
