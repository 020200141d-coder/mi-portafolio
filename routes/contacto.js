// routes/contacto.js — API del formulario de contacto
//
// Flujo de POST /api/contacto:
//   1. Honeypot: si el campo oculto "web" viene lleno es un bot → respondemos ok y no hacemos nada.
//   2. Límite por IP: máx. 5 mensajes cada 15 min para evitar spam.
//   3. Validación de nombre, correo y mensaje (el front valida igual, pero nunca confiamos en él).
//   4. Si hay SMTP configurado en .env → enviamos el correo con Nodemailer.
//      Si no hay SMTP, o el envío falla → guardamos el mensaje en mensajes/mensajes.jsonl
//      para no perderlo nunca.

const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VENTANA_MS = 15 * 60 * 1000;
const MAX_ENVIOS = 5;
const CARPETA_MENSAJES = path.join(__dirname, '..', 'mensajes');

// Memoria simple ip → [timestamps]. Suficiente para un portafolio de un solo servidor;
// se reinicia al reiniciar el proceso, y eso está bien.
const intentos = new Map();

function permitirEnvio(ip) {
  const ahora = Date.now();
  const recientes = (intentos.get(ip) || []).filter(t => ahora - t < VENTANA_MS);
  const permitido = recientes.length < MAX_ENVIOS;
  if (permitido) recientes.push(ahora);
  intentos.set(ip, recientes);
  return permitido;
}

// El transporte se crea al primer uso (no al cargar el módulo) para que siempre
// lea las variables de entorno ya cargadas.
let transporte;
function obtenerTransporte() {
  if (transporte !== undefined) return transporte;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    transporte = null;
    return transporte;
  }
  const puerto = Number(SMTP_PORT) || 465;
  transporte = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: puerto,
    secure: puerto === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return transporte;
}

function guardarLocal(registro) {
  fs.mkdirSync(CARPETA_MENSAJES, { recursive: true });
  fs.appendFileSync(path.join(CARPETA_MENSAJES, 'mensajes.jsonl'), JSON.stringify(registro) + '\n');
}

function validar({ nombre, email, mensaje }) {
  const campos = {};
  if (nombre.length < 2 || nombre.length > 80) campos.nombre = 'Escribe tu nombre (2 a 80 caracteres).';
  if (!EMAIL_RE.test(email) || email.length > 150) campos.email = 'Ese correo no parece válido.';
  if (mensaje.length < 10 || mensaje.length > 3000) campos.mensaje = 'El mensaje debe tener entre 10 y 3000 caracteres.';
  return campos;
}

router.post('/', async (req, res) => {
  const cuerpo = req.body || {};

  if (cuerpo.web) return res.json({ ok: true });

  if (!permitirEnvio(req.ip)) {
    return res.status(429).json({ ok: false, error: 'Enviaste varios mensajes seguidos. Intenta de nuevo en unos minutos.' });
  }

  // Quitamos saltos de línea del nombre: va en el asunto del correo.
  const datos = {
    nombre: String(cuerpo.nombre || '').replace(/[\r\n]+/g, ' ').trim(),
    email: String(cuerpo.email || '').trim(),
    mensaje: String(cuerpo.mensaje || '').trim()
  };

  const campos = validar(datos);
  if (Object.keys(campos).length) {
    return res.status(400).json({ ok: false, error: 'Revisa los campos marcados.', campos });
  }

  const registro = { fecha: new Date().toISOString(), ...datos };
  const smtp = obtenerTransporte();

  if (smtp) {
    try {
      await smtp.sendMail({
        from: `"Portafolio" <${process.env.SMTP_USER}>`,
        to: process.env.CONTACT_TO || process.env.SMTP_USER,
        replyTo: datos.email,
        subject: `Nuevo mensaje del portafolio — ${datos.nombre}`,
        text: `Nombre: ${datos.nombre}\nCorreo: ${datos.email}\n\n${datos.mensaje}`
      });
      return res.json({ ok: true, via: 'correo' });
    } catch (err) {
      // El SMTP falló (clave vencida, sin red...). Guardamos igual para no perder el mensaje.
      console.error('Error enviando correo:', err.message);
    }
  }

  try {
    guardarLocal(registro);
    res.json({ ok: true, via: 'archivo' });
  } catch (err) {
    console.error('Error guardando mensaje:', err.message);
    res.status(500).json({ ok: false, error: 'No pudimos registrar tu mensaje. Escríbeme por WhatsApp.' });
  }
});

module.exports = router;
