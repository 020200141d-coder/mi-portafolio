// script.js — proyectos, menú móvil, scroll suave y formulario de contacto

const proyectos = [
  {
    titulo: 'AeeS Acústico — App',
    tech: 'Flutter · Dart · Firebase',
    desc: 'App para digitalizar el alquiler de equipos de audio, luces y pantallas LED de mi negocio. Maneja roles de admin, operaciones y cliente.',
    icono: '🎚️'
  },
  {
    titulo: 'Tecnicentro Flores',
    tech: 'Comercio tecnológico · Electricidad industrial · Audiovisuales',
    desc: 'Aplicación de comercio tecnológico para una tienda de electrónica: venta de equipos y servicios de electricidad industrial y audiovisuales.',
    icono: '🛠️'
  },
  {
    titulo: 'AeeS Acústico — Trabajo de Campo',
    tech: 'Sonido · Diseño acústico · Pantallas LED',
    desc: 'Detrás de la app hay años de trabajo real: diseño acústico para espectáculos en vivo, una pantalla LED de 8x4m instalada en Ollantaytambo, sonido para la Feria de la Justicia de la Corte Suprema del Cusco, y capacitaciones con la Corte Superior de Sullana.',
    icono: '🔊'
  }
];

function renderProyectos() {
  const contenedor = document.querySelector('.grid-proyectos');

  proyectos.forEach(proyecto => {
    const card = document.createElement('article');
    card.className = 'proyecto-card';

    const icono = document.createElement('div');
    icono.className = 'proyecto-icono';
    icono.textContent = proyecto.icono;

    const titulo = document.createElement('h3');
    titulo.textContent = proyecto.titulo;

    const tech = document.createElement('span');
    tech.className = 'proyecto-tech';
    tech.textContent = proyecto.tech;

    const desc = document.createElement('p');
    desc.className = 'proyecto-desc';
    desc.textContent = proyecto.desc;

    card.append(icono, titulo, tech, desc);
    contenedor.appendChild(card);
  });
}

function initNavToggle() {
  const boton = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  boton.addEventListener('click', () => {
    const abierto = links.classList.toggle('activo');
    boton.setAttribute('aria-expanded', String(abierto));
  });
}

function initSmoothScroll() {
  const links = document.querySelector('.nav-links');

  document.querySelectorAll('nav a[href^="#"]').forEach(enlace => {
    enlace.addEventListener('click', e => {
      e.preventDefault();
      const destino = document.querySelector(enlace.getAttribute('href'));
      destino.scrollIntoView({ behavior: 'smooth' });

      if (links.classList.contains('activo')) {
        links.classList.remove('activo');
      }
    });
  });
}

function initScrollSpy() {
  const secciones = document.querySelectorAll('main section');
  const enlaces = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let actual = '';

    secciones.forEach(seccion => {
      const top = seccion.offsetTop - 100;
      if (window.scrollY >= top) actual = seccion.id;
    });

    enlaces.forEach(enlace => {
      enlace.classList.toggle('activo', enlace.getAttribute('href') === `#${actual}`);
    });
  });
}

function initModoOscuro() {
  const boton = document.querySelector('.modo-oscuro');
  const guardado = localStorage.getItem('tema');

  if (guardado === 'oscuro') {
    document.documentElement.setAttribute('data-theme', 'dark');
    boton.textContent = 'Día';
    boton.setAttribute('aria-label', 'Cambiar a modo día');
  }

  boton.addEventListener('click', () => {
    const activarOscuro = document.documentElement.getAttribute('data-theme') !== 'dark';

    if (activarOscuro) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    boton.textContent = activarOscuro ? 'Día' : 'Noche';
    boton.setAttribute('aria-label', activarOscuro ? 'Cambiar a modo día' : 'Cambiar a modo noche');
    localStorage.setItem('tema', activarOscuro ? 'oscuro' : 'claro');
  });
}

function initScrollReveal() {
  const elementos = document.querySelectorAll('.reveal');

  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15 });

  elementos.forEach(el => observador.observe(el));
}

function initFormularioContacto() {
  const CORREO_DESTINO = '020200141d@uandina.edu.pe';
  const form = document.querySelector('#contacto form');
  const mensaje = document.createElement('p');
  mensaje.className = 'form-mensaje';
  form.appendChild(mensaje);

  form.addEventListener('submit', e => {
    e.preventDefault();

    const nombre = form.querySelector('#nombre').value.trim();
    const email = form.querySelector('#email').value.trim();
    const texto = form.querySelector('#mensaje').value.trim();

    if (!nombre || !email) {
      mensaje.textContent = 'Completa al menos tu nombre y correo.';
      mensaje.classList.add('error');
      return;
    }

    // Sitio estático sin backend: usamos mailto para abrir el correo del visitante ya redactado.
    const asunto = encodeURIComponent(`Contacto desde el portafolio — ${nombre}`);
    const cuerpo = encodeURIComponent(`Nombre: ${nombre}\nCorreo: ${email}\n\n${texto}`);
    window.location.href = `mailto:${CORREO_DESTINO}?subject=${asunto}&body=${cuerpo}`;

    mensaje.classList.remove('error');
    mensaje.textContent = `Se abrió tu programa de correo con el mensaje listo, ${nombre}. Solo falta que le des enviar.`;
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderProyectos();
  initNavToggle();
  initSmoothScroll();
  initScrollSpy();
  initFormularioContacto();
  initModoOscuro();
  initScrollReveal();
});
