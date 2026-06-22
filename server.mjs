import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const REQUEST_LIMIT_BYTES = 20_000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const rateLimits = new Map();

await loadLocalEnvironment();
const PORT = Number(process.env.PORT || 8080);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
};

const server = createServer(async (request, response) => {
  setSecurityHeaders(response);

  try {
    const url = new URL(request.url, "http://localhost");

    if (request.method === "GET" && url.pathname === "/api/config") {
      sendJson(response, 200, publicConfiguration());
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/contact") {
      await handleContact(request, response);
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(url.pathname, request, response);
      return;
    }

    sendJson(response, 405, { message: "Método no permitido." });
  } catch (error) {
    console.error("Request error:", error instanceof Error ? error.message : error);
    sendJson(response, 500, { message: "Ocurrió un error inesperado." });
  }
});

server.listen(PORT, () => {
  console.log(`HELIX disponible en http://localhost:${PORT}`);
  if (!emailConfiguration().ready) {
    console.warn("Correo no configurado. Completa RESEND_API_KEY, CONTACT_TO y CONTACT_FROM en .env.");
  }
});

async function handleContact(request, response) {
  const clientAddress = getClientAddress(request);
  if (!consumeRateLimit(clientAddress)) {
    sendJson(response, 429, { message: "Recibimos varios intentos. Espera unos minutos y vuelve a intentarlo." });
    return;
  }

  const config = emailConfiguration();
  if (!config.ready) {
    sendJson(response, 503, { message: "El canal de correo aún no está configurado. Escríbenos por WhatsApp." });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readRequestBody(request));
  } catch {
    sendJson(response, 400, { message: "La solicitud no tiene un formato válido." });
    return;
  }

  if (String(payload.website || "").trim()) {
    sendJson(response, 200, { ok: true });
    return;
  }

  const contact = normalizeContact(payload);
  const validationError = validateContact(contact);
  if (validationError) {
    sendJson(response, 422, { message: validationError });
    return;
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      reply_to: contact.email,
      subject: `Nueva consulta HELIX — ${contact.empresa || contact.nombre}`,
      text: buildPlainText(contact),
      html: buildHtml(contact),
      tags: [{ name: "source", value: "portfolio-contact" }],
    }),
  });

  if (!emailResponse.ok) {
    const providerErrorText = await emailResponse.text();
    let providerMessage = "";
    try {
      providerMessage = JSON.parse(providerErrorText).message || "";
    } catch {
      providerMessage = providerErrorText;
    }
    console.error("Email provider rejected request:", emailResponse.status, providerErrorText.slice(0, 500));
    const publicMessage = process.env.NODE_ENV === "production"
      ? "No pudimos entregar el correo. Intenta nuevamente o contáctanos por WhatsApp."
      : `Resend rechazó el envío: ${providerMessage || `error ${emailResponse.status}`}`;
    sendJson(response, 502, { message: publicMessage });
    return;
  }

  sendJson(response, 200, { ok: true });
}

function normalizeContact(payload) {
  return {
    nombre: cleanText(payload.nombre, 100),
    empresa: cleanText(payload.empresa, 120),
    email: cleanText(payload.email, 180).toLowerCase(),
    servicio: cleanText(payload.servicio, 120),
    mensaje: cleanText(payload.mensaje, 3000),
  };
}

function validateContact(contact) {
  if (contact.nombre.length < 2) return "Escribe un nombre válido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return "Escribe un correo válido.";
  if (contact.mensaje.length < 10) return "Cuéntanos un poco más sobre tu necesidad.";
  return "";
}

function buildPlainText(contact) {
  return [
    "Nueva consulta desde el portafolio de HELIX",
    "",
    `Nombre: ${contact.nombre}`,
    `Empresa: ${contact.empresa || "No indicada"}`,
    `Correo: ${contact.email}`,
    `Servicio: ${contact.servicio || "Por definir"}`,
    "",
    "Mensaje:",
    contact.mensaje,
  ].join("\n");
}

function buildHtml(contact) {
  const rows = [
    ["Nombre", contact.nombre],
    ["Empresa", contact.empresa || "No indicada"],
    ["Correo", contact.email],
    ["Servicio", contact.servicio || "Por definir"],
  ]
    .map(([label, value]) => `<tr><td style="padding:8px 14px;color:#718095">${escapeHtml(label)}</td><td style="padding:8px 14px;font-weight:600">${escapeHtml(value)}</td></tr>`)
    .join("");

  return `<!doctype html>
  <html lang="es"><body style="margin:0;background:#f2f6f9;font-family:Arial,sans-serif;color:#08172b">
    <div style="max-width:640px;margin:30px auto;padding:28px;background:#fff;border-radius:16px;border:1px solid #e3eaf1">
      <p style="margin:0 0 8px;color:#0799ad;font-size:12px;font-weight:700;letter-spacing:1px">PORTAFOLIO HELIX</p>
      <h1 style="margin:0 0 22px;font-size:24px">Nueva consulta comercial</h1>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px">${rows}</table>
      <h2 style="margin:24px 0 8px;font-size:16px">Mensaje</h2>
      <p style="margin:0;white-space:pre-wrap;line-height:1.6">${escapeHtml(contact.mensaje)}</p>
      <p style="margin:28px 0 0;color:#718095;font-size:12px">Responde este correo para escribir directamente a ${escapeHtml(contact.nombre)}.</p>
    </div>
  </body></html>`;
}

async function serveStatic(pathname, request, response) {
  const requestedPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = resolve(ROOT, `.${requestedPath}`);
  const normalizedRoot = ROOT.endsWith(sep) ? ROOT : `${ROOT}${sep}`;

  if (filePath !== resolve(ROOT, "index.html") && !filePath.startsWith(normalizedRoot)) {
    sendJson(response, 403, { message: "Ruta no permitida." });
    return;
  }

  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) throw new Error("Not a file");
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Cache-Control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=3600",
      "Content-Type": MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    sendJson(response, 404, { message: "Recurso no encontrado." });
  }
}

function readRequestBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > REQUEST_LIMIT_BYTES) {
        rejectBody(new Error("Payload too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolveBody(body));
    request.on("error", rejectBody);
  });
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function emailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY || "";
  const to = process.env.CONTACT_TO || "";
  const from = process.env.CONTACT_FROM || "";
  return { apiKey, to, from, ready: Boolean(apiKey && to && from) };
}

function publicConfiguration() {
  return {
    contactEmail: process.env.CONTACT_PUBLIC_EMAIL || process.env.CONTACT_TO || "",
    whatsappNumber: String(process.env.WHATSAPP_NUMBER || "").replace(/\D/g, ""),
    whatsappMessage: process.env.WHATSAPP_MESSAGE || "Hola, vi el portafolio de HELIX y me gustaría conocer más sobre sus servicios.",
  };
}

function getClientAddress(request) {
  const forwarded = request.headers["x-forwarded-for"];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.socket.remoteAddress || "unknown").split(",")[0].trim();
}

function consumeRateLimit(key) {
  const now = Date.now();
  const recent = (rateLimits.get(key) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_REQUESTS) return false;
  recent.push(now);
  rateLimits.set(key, recent);
  return true;
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function setSecurityHeaders(response) {
  response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
}

async function loadLocalEnvironment() {
  try {
    const file = await readFile(resolve(ROOT, ".env"), "utf8");
    file.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) return;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    });
  } catch {
    // .env es opcional; en producción se usan variables del proveedor de hosting.
  }
}
