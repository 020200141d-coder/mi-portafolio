// scripts/build.js — genera la versión estática del portafolio para GitHub Pages
//
// GitHub Pages solo sirve archivos (no ejecuta Node), así que "congelamos" el sitio:
//   views/index.ejs + data/portafolio.json → dist/index.html
//   views/404.ejs                          → dist/404.html
//   public/ (css, js, img)                 → dist/
//
// `npm run build` y abre dist/index.html, o deja que el workflow
// .github/workflows/pages.yml lo publique solo en cada push a main.
//
// BASE_PATH: prefijo del sitio en Pages (ej. "/mi-portafolio/"). El index usa rutas
// relativas ("./"), pero 404.html se sirve en cualquier URL rota (/mi-portafolio/a/b),
// y ahí solo funcionan las rutas absolutas.

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const RAIZ = path.join(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const VISTAS = path.join(RAIZ, 'views');

function normalizarBase(valor) {
  if (!valor) return './';
  return valor.endsWith('/') ? valor : `${valor}/`;
}

async function construir() {
  const d = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'portafolio.json'), 'utf8'));
  const base404 = normalizarBase(process.env.BASE_PATH);
  const comun = { d, anioActual: new Date().getFullYear(), estatico: true };

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.cpSync(path.join(RAIZ, 'public'), DIST, { recursive: true });

  const index = await ejs.renderFile(path.join(VISTAS, 'index.ejs'), { ...comun, base: './' });
  const pagina404 = await ejs.renderFile(path.join(VISTAS, '404.ejs'), { ...comun, base: base404 });

  fs.writeFileSync(path.join(DIST, 'index.html'), index);
  fs.writeFileSync(path.join(DIST, '404.html'), pagina404);
  // Sin esto, GitHub Pages pasa el sitio por Jekyll, que ignora archivos que empiezan con "_".
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

  console.log(`✔ Sitio estático generado en dist/ (base del 404: ${base404})`);
}

construir().catch(err => {
  console.error(err);
  process.exit(1);
});
