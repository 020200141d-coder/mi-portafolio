// main.js — interacciones del portafolio (sin frameworks)
//
// Flujo general al cargar:
//   DOMContentLoaded → se enganchan todos los módulos init*()
//   window.load      → se oculta el preloader, se añade body.cargado (dispara la entrada
//                      del hero en CSS) y arranca el texto que se escribe solo.
//
// Librerías opcionales por CDN: SweetAlert2 (alertas) y GSAP (parallax). Si un CDN falla,
// cada módulo tiene un plan B para que la página siga funcionando.

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const conMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------------------------ */
/* Alertas: SweetAlert2 con plan B si el CDN no cargó                 */
/* ------------------------------------------------------------------ */
const hayAlertas = typeof window.Swal !== 'undefined';

const Toast = hayAlertas
  ? Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2800,
      timerProgressBar: true,
      showClass: { popup: 'swal2-show' },
      didOpen: t => {
        t.addEventListener('mouseenter', Swal.stopTimer);
        t.addEventListener('mouseleave', Swal.resumeTimer);
      }
    })
  : null;

function toast(icon, title) {
  if (Toast) return Toast.fire({ icon, title });
  console.info(title);
}

function alerta(opciones) {
  if (hayAlertas) return Swal.fire({ confirmButtonText: 'Entendido', ...opciones });
  window.alert(`${opciones.title}\n\n${opciones.text || ''}`);
  return Promise.resolve();
}

/* ------------------------------------------------------------------ */
/* Preloader + entrada del hero                                       */
/* ------------------------------------------------------------------ */
function initPreloader() {
  const preloader = $('#preloader');
  let listo = false;

  const terminar = () => {
    if (listo) return;
    listo = true;
    preloader?.classList.add('oculto');
    document.body.classList.add('cargado');
    initTyped();
  };

  // Esperamos las imágenes, pero nunca más de 2.5 s: una foto lenta no debe bloquear la página.
  if (document.readyState === 'complete') setTimeout(terminar, 300);
  else window.addEventListener('load', () => setTimeout(terminar, 300));
  setTimeout(terminar, 2500);
}

/* ------------------------------------------------------------------ */
/* Tema claro / oscuro                                                */
/* ------------------------------------------------------------------ */
function initTema() {
  const boton = $('#btn-tema');
  const raiz = document.documentElement;

  boton.addEventListener('click', () => {
    const nuevo = raiz.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    raiz.setAttribute('data-theme', nuevo);
    try { localStorage.setItem('tema', nuevo); } catch (e) { /* modo privado: no pasa nada */ }
    toast('info', nuevo === 'light' ? 'Modo día activado' : 'Modo noche activado');
    document.dispatchEvent(new CustomEvent('tema-cambiado'));
  });
}

/* ------------------------------------------------------------------ */
/* Header: fondo al bajar, se esconde al bajar rápido y vuelve al subir */
/* ------------------------------------------------------------------ */
function initHeader() {
  const header = $('#header');
  const menu = $('#nav-links');
  let ultimoY = window.scrollY;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('con-fondo', y > 20);
    const bajando = y > ultimoY && y > 400;
    header.classList.toggle('escondido', bajando && !menu.classList.contains('abierto'));
    ultimoY = y;
  }, { passive: true });
}

function initMenuMovil() {
  const boton = $('#nav-toggle');
  const menu = $('#nav-links');

  const cerrar = () => {
    menu.classList.remove('abierto');
    boton.setAttribute('aria-expanded', 'false');
  };

  boton.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    boton.setAttribute('aria-expanded', String(abierto));
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
  document.addEventListener('click', e => {
    if (menu.classList.contains('abierto') && !menu.contains(e.target) && !boton.contains(e.target)) cerrar();
  });

  return cerrar;
}

/* ------------------------------------------------------------------ */
/* Scroll suave para todos los [data-scroll] + "Cotizar" rellena el formulario */
/* ------------------------------------------------------------------ */
function initScrollSuave(cerrarMenu) {
  document.addEventListener('click', e => {
    const enlace = e.target.closest('a[data-scroll]');
    if (!enlace) return;

    const hash = new URL(enlace.href).hash;
    const destino = hash && document.querySelector(hash);
    if (!destino) return;

    e.preventDefault();
    cerrarMenu();
    destino.scrollIntoView({ behavior: reducirMovimiento ? 'auto' : 'smooth' });
    history.replaceState(null, '', hash);

    // Si viene de "Cotizar <servicio>" o "Quiero algo así", dejamos el mensaje empezado.
    const tema = enlace.dataset.servicio || enlace.dataset.trabajoTitulo;
    if (tema) prellenarMensaje(`Hola Edson, me interesa: ${tema}. `);
  });
}

function prellenarMensaje(texto) {
  const area = $('#mensaje');
  if (!area) return;
  area.value = texto;
  area.dispatchEvent(new Event('input'));
  setTimeout(() => {
    area.focus({ preventScroll: true });
    area.setSelectionRange(texto.length, texto.length);
  }, 700);
  toast('success', 'Te dejé el mensaje empezado ✍️');
}

/* ------------------------------------------------------------------ */
/* Scroll spy: marca en el menú la sección visible                    */
/* ------------------------------------------------------------------ */
function initScrollSpy() {
  const enlaces = $$('.nav-links a');
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      enlaces.forEach(a => a.classList.toggle('activo', a.hash === `#${entrada.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  $$('main section[id]').forEach(s => observador.observe(s));
}

/* ------------------------------------------------------------------ */
/* Progreso de lectura (barra superior + anillo del botón subir)      */
/* ------------------------------------------------------------------ */
function initProgreso() {
  const barra = $('.progreso-lectura span');
  const botonSubir = $('#volver-arriba');
  let pendiente = false;

  const actualizar = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progreso = max > 0 ? window.scrollY / max : 0;
    barra.style.setProperty('--progreso', progreso.toFixed(4));
    botonSubir.style.setProperty('--progreso', progreso.toFixed(4));
    botonSubir.classList.toggle('visible', window.scrollY > 500);
    pendiente = false;
  };

  // requestAnimationFrame evita recalcular más de una vez por frame.
  window.addEventListener('scroll', () => {
    if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); }
  }, { passive: true });
  actualizar();

  botonSubir.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducirMovimiento ? 'auto' : 'smooth' }));
}

/* ------------------------------------------------------------------ */
/* Aparición al hacer scroll (con retraso escalonado en [data-stagger]) */
/* ------------------------------------------------------------------ */
function initReveal() {
  $$('[data-stagger]').forEach(grupo => {
    $$(':scope > [data-reveal]', grupo).forEach((el, i) => el.style.setProperty('--delay', `${i * 0.1}s`));
  });

  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      const el = entrada.target;
      el.classList.add('visible');
      observador.unobserve(el);
      // Quitamos el retraso después de aparecer: si no, el filtrado y el hover
      // heredarían ese delay y se sentirían lentos.
      setTimeout(() => el.style.setProperty('--delay', '0s'), 1200);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('[data-reveal]').forEach(el => observador.observe(el));
}

/* ------------------------------------------------------------------ */
/* Contadores animados de la franja de estadísticas                   */
/* ------------------------------------------------------------------ */
function animarNumero(el, hasta, { desde = 0, duracion = 1800, prefijo = '', sufijo = '' } = {}) {
  if (reducirMovimiento) { el.textContent = `${prefijo}${hasta}${sufijo}`; return; }
  const inicio = performance.now();
  const paso = ahora => {
    const t = Math.min((ahora - inicio) / duracion, 1);
    const suavizado = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
    el.textContent = `${prefijo}${Math.round(desde + (hasta - desde) * suavizado)}${sufijo}`;
    if (t < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

function initContadores() {
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      const el = entrada.target;
      animarNumero(el, Number(el.dataset.contador), {
        desde: Number(el.dataset.desde || 0),
        prefijo: el.dataset.prefijo || ''
      });
      observador.unobserve(el);
    });
  }, { threshold: 0.6 });

  $$('[data-contador]').forEach(el => observador.observe(el));
}

/* ------------------------------------------------------------------ */
/* Texto que se escribe y borra solo (roles del hero)                 */
/* ------------------------------------------------------------------ */
function initTyped() {
  const el = $('#typed');
  if (!el || el.dataset.iniciado) return;
  el.dataset.iniciado = '1';

  const roles = JSON.parse(el.dataset.roles || '[]');
  if (reducirMovimiento || !roles.length) { el.textContent = roles[0] || ''; return; }

  let rol = 0, letra = 0, borrando = false;
  const tick = () => {
    const texto = roles[rol];
    letra += borrando ? -1 : 1;
    el.textContent = texto.slice(0, letra);

    let espera = borrando ? 35 : 70;
    if (!borrando && letra === texto.length) { borrando = true; espera = 1800; }
    else if (borrando && letra === 0) { borrando = false; rol = (rol + 1) % roles.length; espera = 350; }
    setTimeout(tick, espera);
  };
  tick();
}

/* ------------------------------------------------------------------ */
/* Indicador deslizante compartido por tabs y filtros                 */
/* ------------------------------------------------------------------ */
function moverIndicador(indicador, activo) {
  if (!indicador || !activo) return;
  indicador.style.setProperty('--x', `${activo.offsetLeft}px`);
  indicador.style.setProperty('--ancho', `${activo.offsetWidth}px`);
}

/* ------------------------------------------------------------------ */
/* Tabs de habilidades con barras que se llenan                       */
/* ------------------------------------------------------------------ */
function initTabs() {
  const lista = $('.tabs-lista');
  if (!lista) return;
  const tabs = $$('.tab', lista);
  const indicador = $('.tabs-indicador', lista);

  const llenarBarras = panel => {
    panel.classList.remove('lleno');
    $$('[data-nivel]', panel).forEach(b => { b.textContent = '0%'; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      panel.classList.add('lleno');
      $$('[data-nivel]', panel).forEach(b => animarNumero(b, Number(b.dataset.nivel), { duracion: 1400, sufijo: '%' }));
    }));
  };

  const activar = (tab, enfocar = false) => {
    tabs.forEach(t => {
      const activo = t === tab;
      t.classList.toggle('activo', activo);
      t.setAttribute('aria-selected', String(activo));
      t.tabIndex = activo ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !activo;
      panel.classList.toggle('activo', activo);
      if (activo) {
        panel.classList.remove('entrando');
        void panel.offsetWidth; // reinicia la animación CSS
        panel.classList.add('entrando');
        llenarBarras(panel);
      }
    });
    moverIndicador(indicador, tab);
    if (enfocar) tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener('click', () => activar(tab));
    // Flechas izquierda/derecha para moverse entre pestañas (patrón ARIA de tabs).
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const siguiente = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      activar(siguiente, true);
    });
  });

  // Las barras del primer panel se llenan recién cuando la sección entra en pantalla.
  const observador = new IntersectionObserver(([entrada]) => {
    if (!entrada.isIntersecting) return;
    llenarBarras($('.tab-panel.activo'));
    observador.disconnect();
  }, { threshold: 0.3 });
  observador.observe($('.tabs-paneles'));

  const reposicionar = () => moverIndicador(indicador, $('.tab.activo', lista));
  reposicionar();
  window.addEventListener('resize', reposicionar);
  document.fonts?.ready.then(reposicionar);
}

/* ------------------------------------------------------------------ */
/* Filtros de trabajos con animación de salida/entrada                */
/* ------------------------------------------------------------------ */
let filtroActual = 'todos';

function initFiltros() {
  const barra = $('.filtros');
  if (!barra) return;
  const botones = $$('.filtro', barra);
  const indicador = $('.filtros-indicador', barra);
  const cards = $$('.trabajo-card');
  const vacio = $('#sin-resultados');
  let temporizador;

  const aplicar = boton => {
    filtroActual = boton.dataset.filtro;
    botones.forEach(b => {
      b.classList.toggle('activo', b === boton);
      b.setAttribute('aria-pressed', String(b === boton));
    });
    moverIndicador(indicador, boton);
    boton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    const coincide = card => filtroActual === 'todos' || card.dataset.categoria === filtroActual;

    // Paso 1: las que no coinciden se encogen y desvanecen.
    cards.forEach(card => { if (!coincide(card)) card.classList.add('saliendo'); });

    // Paso 2: tras la animación se ocultan, y las que sí coinciden entran una por una.
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      let visibles = 0;
      cards.forEach(card => {
        if (!coincide(card)) { card.hidden = true; return; }
        card.hidden = false;
        card.classList.add('saliendo', 'visible');
        card.style.setProperty('--delay', '0s');
        const orden = visibles++;
        setTimeout(() => card.classList.remove('saliendo'), 40 + orden * 80);
      });
      vacio.hidden = visibles > 0;
    }, reducirMovimiento ? 0 : 320);
  };

  botones.forEach(b => b.addEventListener('click', () => aplicar(b)));

  const reposicionar = () => moverIndicador(indicador, $('.filtro.activo', barra));
  reposicionar();
  window.addEventListener('resize', reposicionar);
  document.fonts?.ready.then(reposicionar);
}

/* ------------------------------------------------------------------ */
/* Modal de detalle con Anterior / Siguiente                          */
/* ------------------------------------------------------------------ */
function initModal() {
  const modal = $('#modal-trabajo');
  const datos = JSON.parse($('#datos-trabajos')?.textContent || '[]');
  if (!modal || !datos.length) return;

  const cuerpo = $('.modal-cuerpo', modal);
  const botonCotizar = $('.modal-nav .btn-primario', modal);
  let indice = 0;

  // Solo navegamos entre los trabajos que el filtro actual deja ver.
  const visibles = () => datos.filter(t => filtroActual === 'todos' || t.categoria === filtroActual);

  const pintar = t => {
    $('#modal-img').src = t.imagen;
    $('#modal-img').alt = t.titulo;
    $('#modal-img').style.display = '';
    $('#modal-cat').innerHTML = `<i class="${t.icono}"></i> ${t.categoriaLabel}`;
    $('#modal-titulo').textContent = t.titulo;
    $('#modal-detalle').textContent = t.detalle;
    $('#modal-puntos').replaceChildren(...t.puntos.map(p => Object.assign(document.createElement('li'), { textContent: p })));
    $('#modal-tags').replaceChildren(...t.tech.map(x => Object.assign(document.createElement('li'), { textContent: x })));
    botonCotizar.dataset.trabajoTitulo = t.titulo;
  };
  $('#modal-img').addEventListener('error', e => { e.target.style.display = 'none'; });

  const abrir = id => {
    const lista = visibles();
    indice = Math.max(0, lista.findIndex(t => t.id === id));
    pintar(lista[indice]);
    modal.showModal();
    document.body.classList.add('sin-scroll');
  };

  const cerrar = () => {
    if (!modal.open) return;
    modal.classList.add('cerrando');
    setTimeout(() => {
      modal.classList.remove('cerrando');
      modal.close();
      document.body.classList.remove('sin-scroll');
    }, reducirMovimiento ? 0 : 280);
  };

  const navegar = dir => {
    const lista = visibles();
    indice = (indice + dir + lista.length) % lista.length;
    cuerpo.style.setProperty('--dir', `${dir * 40}px`);
    cuerpo.classList.remove('cambiando');
    void cuerpo.offsetWidth;
    cuerpo.classList.add('cambiando');
    pintar(lista[indice]);
  };

  $$('[data-trabajo]').forEach(b => b.addEventListener('click', () => abrir(b.dataset.trabajo)));
  $$('[data-modal-nav]', modal).forEach(b => b.addEventListener('click', () => navegar(Number(b.dataset.modalNav))));
  $$('[data-cerrar-modal]', modal).forEach(b => b.addEventListener('click', cerrar));

  // Clic fuera del contenido (en el backdrop) cierra.
  modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
  // Esc: interceptamos el cierre nativo para usar nuestra animación.
  modal.addEventListener('cancel', e => { e.preventDefault(); cerrar(); });
  modal.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') navegar(1);
    if (e.key === 'ArrowLeft') navegar(-1);
  });
}

/* ------------------------------------------------------------------ */
/* Carrusel de servicios: flechas, puntos, arrastre y autoplay        */
/* ------------------------------------------------------------------ */
function initCarrusel() {
  const carrusel = $('#carrusel');
  if (!carrusel) return;
  const pista = $('.carrusel-pista', carrusel);
  const cards = $$('.servicio-card', pista);
  const puntos = $('#carrusel-puntos');
  const prev = $('[data-carrusel-prev]');
  const next = $('[data-carrusel-next]');
  let indice = 0, paginas = 1, paso = 0, autoplay;

  const medir = () => {
    const estilos = getComputedStyle(carrusel);
    const porVista = Number(estilos.getPropertyValue('--por-vista')) || 1;
    const gap = parseFloat(estilos.getPropertyValue('--gap')) || 0;
    paso = cards[0].getBoundingClientRect().width + gap;
    paginas = Math.max(1, cards.length - porVista + 1);
    indice = Math.min(indice, paginas - 1);

    // Un punto por "posición" posible del carrusel.
    puntos.replaceChildren(...Array.from({ length: paginas }, (_, i) => {
      const b = document.createElement('button');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Ir a la posición ${i + 1}`);
      b.addEventListener('click', () => { ir(i); reiniciarAutoplay(); });
      return b;
    }));
    ir(indice, false);
  };

  const ir = (i, animar = true) => {
    indice = (i + paginas) % paginas; // da la vuelta en los extremos
    if (!animar) pista.style.transition = 'none';
    pista.style.transform = `translateX(${-indice * paso}px)`;
    if (!animar) requestAnimationFrame(() => { pista.style.transition = ''; });
    $$('button', puntos).forEach((b, j) => b.setAttribute('aria-selected', String(j === indice)));
  };

  const reiniciarAutoplay = () => {
    clearInterval(autoplay);
    if (!reducirMovimiento) autoplay = setInterval(() => ir(indice + 1), 5000);
  };
  const pausar = () => clearInterval(autoplay);

  prev.addEventListener('click', () => { ir(indice - 1); reiniciarAutoplay(); });
  next.addEventListener('click', () => { ir(indice + 1); reiniciarAutoplay(); });
  carrusel.addEventListener('mouseenter', pausar);
  carrusel.addEventListener('mouseleave', reiniciarAutoplay);
  carrusel.addEventListener('focusin', pausar);

  // Arrastrar con mouse o deslizar con el dedo.
  let inicioX = 0, deltaX = 0, arrastrando = false, huboArrastre = false;
  carrusel.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    arrastrando = true; huboArrastre = false; inicioX = e.clientX; deltaX = 0;
    pausar();
  });
  window.addEventListener('pointermove', e => {
    if (!arrastrando) return;
    deltaX = e.clientX - inicioX;
    if (Math.abs(deltaX) > 5 && !huboArrastre) {
      huboArrastre = true;
      carrusel.classList.add('arrastrando');
    }
    if (huboArrastre) pista.style.transform = `translateX(${-indice * paso + deltaX}px)`;
  });
  window.addEventListener('pointerup', () => {
    if (!arrastrando) return;
    arrastrando = false;
    carrusel.classList.remove('arrastrando');
    if (Math.abs(deltaX) > 60) ir(indice + (deltaX < 0 ? 1 : -1));
    else ir(indice);
    reiniciarAutoplay();
  });
  // Si fue arrastre, no queremos que el soltar dispare el enlace "Cotizar".
  carrusel.addEventListener('click', e => { if (huboArrastre) { e.preventDefault(); e.stopPropagation(); } }, true);

  // Autoplay solo mientras el carrusel está en pantalla.
  new IntersectionObserver(([entrada]) => (entrada.isIntersecting ? reiniciarAutoplay() : pausar()), { threshold: 0.4 })
    .observe(carrusel);

  medir();
  let espera;
  window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(medir, 150); });
}

/* ------------------------------------------------------------------ */
/* Tilt 3D + brillo que sigue al mouse en cards y paneles             */
/* ------------------------------------------------------------------ */
function initTilt() {
  if (!conMouse || reducirMovimiento) return;
  const MAX_GRADOS = 7;

  $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.classList.add('inclinando');
      el.style.setProperty('--ry', `${(px - 0.5) * MAX_GRADOS * 2}deg`);
      el.style.setProperty('--rx', `${(0.5 - py) * MAX_GRADOS * 2}deg`);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('inclinando');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

/* ------------------------------------------------------------------ */
/* Botones magnéticos: se acercan al cursor                           */
/* ------------------------------------------------------------------ */
function initMagneticos() {
  if (!conMouse || reducirMovimiento) return;
  $$('.magnetico').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.translate = `${x}px ${y}px`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
  });
}

/* ------------------------------------------------------------------ */
/* Cursor personalizado (punto + anillo con retraso)                  */
/* ------------------------------------------------------------------ */
function initCursor() {
  if (!conMouse || reducirMovimiento) return;
  const punto = $('.cursor-punto');
  const anillo = $('.cursor-anillo');
  let mx = -100, my = -100, ax = -100, ay = -100;

  window.addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    punto.style.transform = `translate(${mx}px, ${my}px)`;
    document.body.classList.add('cursor-activo');
  });
  document.addEventListener('pointerleave', () => document.body.classList.remove('cursor-activo'));

  // El anillo persigue al punto con interpolación: da la sensación de "inercia".
  const seguir = () => {
    ax += (mx - ax) * 0.18;
    ay += (my - ay) * 0.18;
    anillo.style.transform = `translate(${ax}px, ${ay}px)`;
    requestAnimationFrame(seguir);
  };
  seguir();

  document.addEventListener('pointerover', e => {
    const interactivo = e.target.closest('a, button, .tilt, input, textarea');
    document.body.classList.toggle('cursor-hover', Boolean(interactivo));
  });
}

/* ------------------------------------------------------------------ */
/* Canvas del hero: partículas conectadas + ecualizador de fondo       */
/* ------------------------------------------------------------------ */
function initCanvasHero() {
  const canvas = $('#hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  let ancho, alto, dpr, particulas = [], acentoRGB = '255,122,24', corriendo = false, visible = true;

  const leerColor = () => {
    acentoRGB = getComputedStyle(document.documentElement).getPropertyValue('--acento-rgb').trim() || acentoRGB;
  };

  const redimensionar = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = hero.clientWidth; alto = hero.clientHeight;
    canvas.width = ancho * dpr; canvas.height = alto * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Menos partículas en pantallas chicas para cuidar la batería del celular.
    const cantidad = Math.round(Math.min(70, (ancho * alto) / 22000));
    particulas = Array.from({ length: cantidad }, () => ({
      x: Math.random() * ancho, y: Math.random() * alto,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6
    }));
  };

  const dibujar = tiempo => {
    ctx.clearRect(0, 0, ancho, alto);

    // Ecualizador tenue en la base del hero.
    const barras = Math.floor(ancho / 14);
    for (let i = 0; i < barras; i++) {
      const onda = Math.sin(i * 0.35 + tiempo * 0.0022) * 0.5 + Math.sin(i * 0.13 - tiempo * 0.0013) * 0.5;
      const h = (onda * 0.5 + 0.5) * alto * 0.16 + 6;
      ctx.fillStyle = `rgba(${acentoRGB}, ${0.05 + (onda * 0.5 + 0.5) * 0.07})`;
      ctx.fillRect(i * 14, alto - h, 8, h);
    }

    // Partículas que se unen con líneas cuando están cerca.
    for (const p of particulas) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > ancho) p.vx *= -1;
      if (p.y < 0 || p.y > alto) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${acentoRGB}, 0.55)`;
      ctx.fill();
    }
    for (let i = 0; i < particulas.length; i++) {
      for (let j = i + 1; j < particulas.length; j++) {
        const a = particulas[i], b = particulas[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) {
          ctx.strokeStyle = `rgba(${acentoRGB}, ${(1 - d / 120) * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
  };

  const bucle = t => {
    if (!visible || document.hidden) { corriendo = false; return; }
    dibujar(t);
    requestAnimationFrame(bucle);
  };
  const arrancar = () => {
    if (corriendo || reducirMovimiento) return;
    corriendo = true;
    requestAnimationFrame(bucle);
  };

  leerColor();
  redimensionar();
  if (reducirMovimiento) dibujar(0);
  else arrancar();

  // Pausamos la animación cuando el hero no se ve o la pestaña está oculta.
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) arrancar(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) arrancar(); });
  document.addEventListener('tema-cambiado', () => { leerColor(); if (reducirMovimiento) dibujar(0); });
  window.addEventListener('resize', () => { redimensionar(); if (reducirMovimiento) dibujar(0); });
}

/* ------------------------------------------------------------------ */
/* Parallax del hero con GSAP (opcional)                              */
/* ------------------------------------------------------------------ */
function initParallax() {
  if (reducirMovimiento || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const disparo = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 };
  gsap.to('.hero-texto', { yPercent: 18, opacity: 0.2, ease: 'none', scrollTrigger: disparo });
  gsap.to('.foto-marco', { y: 120, rotate: 6, ease: 'none', scrollTrigger: { ...disparo } });
  gsap.to('.chip-flotante', { y: i => -60 - i * 40, ease: 'none', scrollTrigger: { ...disparo } });
}

/* ------------------------------------------------------------------ */
/* Copiar correo al portapapeles                                      */
/* ------------------------------------------------------------------ */
function initCopiarEmail() {
  $$('.copiar-email').forEach(btn => btn.addEventListener('click', async () => {
    const email = btn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      toast('success', 'Correo copiado al portapapeles');
    } catch {
      // Sin permiso de portapapeles (http, navegador viejo): abrimos el cliente de correo.
      window.location.href = `mailto:${email}`;
    }
  }));
}

/* ------------------------------------------------------------------ */
/* Formulario de contacto → POST /api/contacto                        */
/* ------------------------------------------------------------------ */
function initFormulario() {
  const form = $('#form-contacto');
  if (!form) return;
  const boton = $('button[type="submit"]', form);
  const contador = $('#contador');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let intentado = false;

  const reglas = {
    nombre: v => (v.length >= 2 ? '' : 'Escribe tu nombre.'),
    email: v => (EMAIL_RE.test(v) ? '' : 'Ese correo no parece válido.'),
    mensaje: v => (v.length >= 10 ? '' : 'Cuéntame un poco más (mínimo 10 caracteres).')
  };

  const marcar = (nombre, error) => {
    const campo = form.elements[nombre].closest('.campo');
    campo.classList.toggle('error', Boolean(error));
    $('.campo-error', campo).textContent = error;
    if (error) {
      campo.classList.remove('sacudir');
      void campo.offsetWidth;
      campo.classList.add('sacudir');
    }
  };

  const validar = () => {
    let valido = true;
    for (const [nombre, regla] of Object.entries(reglas)) {
      const error = regla(form.elements[nombre].value.trim());
      marcar(nombre, error);
      if (error) valido = false;
    }
    return valido;
  };

  // Tras el primer intento, validamos en vivo mientras escribe.
  form.addEventListener('input', e => {
    if (e.target.name === 'mensaje') contador.textContent = e.target.value.length;
    if (intentado && reglas[e.target.name]) {
      const campo = e.target.closest('.campo');
      const error = reglas[e.target.name](e.target.value.trim());
      campo.classList.toggle('error', Boolean(error));
      $('.campo-error', campo).textContent = error;
    }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    intentado = true;
    if (!validar()) {
      toast('warning', 'Revisa los campos marcados');
      return;
    }

    boton.classList.add('cargando');
    const datos = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.ok) {
        form.reset();
        contador.textContent = '0';
        intentado = false;
        await alerta({
          icon: 'success',
          title: `¡Gracias, ${datos.nombre.split(' ')[0]}!`,
          text: 'Tu mensaje llegó. Te responderé lo antes posible.',
          confirmButtonText: 'Genial'
        });
      } else if (res.status === 429) {
        alerta({ icon: 'warning', title: 'Vas muy rápido', text: json.error });
      } else {
        Object.entries(json.campos || {}).forEach(([nombre, error]) => marcar(nombre, error));
        alerta({ icon: 'error', title: 'No se pudo enviar', text: json.error || 'Intenta de nuevo en un momento.' });
      }
    } catch {
      // Sin conexión con el servidor: ofrecemos WhatsApp como salida.
      const r = await alerta({
        icon: 'error',
        title: 'Sin conexión',
        text: 'No pude contactar al servidor. ¿Prefieres escribirme por WhatsApp?',
        showCancelButton: true,
        confirmButtonText: 'Abrir WhatsApp',
        cancelButtonText: 'Cerrar'
      });
      if (r?.isConfirmed) window.open($('a[href^="https://wa.me"]').href, '_blank', 'noopener');
    } finally {
      boton.classList.remove('cargando');
    }
  });
}

/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initTema();
  initHeader();
  const cerrarMenu = initMenuMovil();
  initScrollSuave(cerrarMenu);
  initScrollSpy();
  initProgreso();
  initReveal();
  initContadores();
  initTabs();
  initFiltros();
  initModal();
  initCarrusel();
  initTilt();
  initMagneticos();
  initCursor();
  initCanvasHero();
  initParallax();
  initCopiarEmail();
  initFormulario();
});
