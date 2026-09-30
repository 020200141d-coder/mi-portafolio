# Portafolio — Edson Aguirre

Mi portafolio personal, hecho con **Node.js + Express + EJS**, con el tema oscuro *Stage Black* (carbón, acero y ámbar de escenario).

## Cómo verlo en tu computadora

Necesitas **Node.js 20.12 o superior**.

```bash
npm install
npm run dev
```

Luego abre **http://localhost:3000**. Con `npm run dev` el servidor se reinicia solo cada vez que guardas un archivo.

## Estructura

```
server.js              → servidor Express (rutas, vistas, API)
routes/contacto.js     → POST /api/contacto (valida, envía correo o guarda el mensaje)
data/portafolio.json   → TODO el contenido: perfil, servicios, habilidades y trabajos
views/                 → plantillas EJS (index, 404 y partials)
public/css/styles.css  → estilos y animaciones
public/js/main.js      → interacciones: carrusel, filtros, modal, tabs, alertas...
public/img/            → imágenes
```

**Para agregar o cambiar un trabajo, servicio o habilidad, solo edita `data/portafolio.json`.** No hay que tocar el HTML.
Para usar fotos propias, colócalas en `public/img/` y cambia el campo `imagen` por `/img/mi-foto.jpg`.

## Formulario de contacto

1. Copia `.env.example` como `.env`.
2. Escribe tu Gmail en `SMTP_USER` y una **contraseña de aplicación** en `SMTP_PASS`. Se crea en tu Cuenta de Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones.

Si no configuras el correo, los mensajes se guardan en `mensajes/mensajes.jsonl`, así que no se pierde ninguno.

## Publicarlo en internet (gratis)

GitHub Pages solo sirve sitios estáticos y **no ejecuta Node.js**. Para publicarlo puedes usar [Render](https://render.com):

1. New → **Web Service** → conecta este repositorio.
2. Build command: `npm install` · Start command: `npm start`
3. En *Environment* agrega `NODE_ENV=production` y, si quieres correo, las variables `SMTP_*`.

## Qué incluye

- Hero con partículas y ecualizador animado en canvas, texto que se escribe solo y parallax con GSAP
- Contadores animados, barra de progreso de lectura y botón "volver arriba" con anillo de progreso
- Carrusel de servicios con flechas, puntos, arrastre táctil y autoplay
- Tabs de habilidades con barras animadas
- Trabajos con filtros animados y modal con Anterior/Siguiente
- Cards con inclinación 3D y brillo que sigue al mouse, botones magnéticos y cursor personalizado
- Alertas con SweetAlert2: envío, errores, validación, correo copiado y cambio de tema
- Modo día/noche, diseño adaptado a celulares y respeto a "reducir movimiento"
