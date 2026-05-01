/**
 * server.js — Servidor HTTPS estático para SportyStyle
 *
 * Sirve los archivos del frontend con HTTPS usando los certificados
 * en /certs/. Auth0 exige HTTPS para el redirect URI en producción y
 * en muchos navegadores modernos incluso en desarrollo.
 *
 * Uso:
 *   node server.js
 *
 * Variables de entorno opcionales:
 *   PORT      Puerto HTTPS (default: 443)
 *   HTTP_PORT Puerto HTTP para redirección (default: 80). 0 = desactivar.
 */

'use strict';

const https    = require('https');
const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');

// ── Configuración ────────────────────────────────────────────────────────────

const HTTPS_PORT = parseInt(process.env.PORT      ?? '443',  10);
const HTTP_PORT  = parseInt(process.env.HTTP_PORT  ?? '80',  10);
const STATIC_DIR = path.resolve(__dirname);

// ── Certificados TLS ─────────────────────────────────────────────────────────

const CERT_KEY  = path.join(__dirname, 'certs', 'server.key');
const CERT_CERT = path.join(__dirname, 'certs', 'server.crt');

if (!fs.existsSync(CERT_KEY) || !fs.existsSync(CERT_CERT)) {
    console.error('[ERROR] No se encontraron los certificados TLS en /certs/.');
    console.error('        Genera un certificado autofirmado con:');
    console.error('        openssl req -x509 -newkey rsa:2048 -keyout certs/server.key -out certs/server.crt -days 365 -nodes');
    process.exit(1);
}

const tlsOptions = {
    key:  fs.readFileSync(CERT_KEY),
    cert: fs.readFileSync(CERT_CERT),
};

// ── MIME types ───────────────────────────────────────────────────────────────

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.webp': 'image/webp',
};

// ── Headers de seguridad ─────────────────────────────────────────────────────

function setSecurityHeaders(res) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options',    'nosniff');
    res.setHeader('X-Frame-Options',           'SAMEORIGIN');
    res.setHeader('Referrer-Policy',           'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy',        'geolocation=(), microphone=(), camera=()');
}

// ── Handler de solicitudes estáticas ────────────────────────────────────────

function requestHandler(req, res) {
    // Solo GET y HEAD
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        res.end();
        return;
    }

    // Decodificar URL y normalizar
    let urlPath;
    try {
        urlPath = decodeURIComponent(new URL(req.url, 'https://localhost').pathname);
    } catch {
        res.writeHead(400);
        res.end();
        return;
    }

    // Prevenir path traversal: la ruta resuelta debe quedar dentro de STATIC_DIR
    const resolved = path.normalize(path.join(STATIC_DIR, urlPath));
    if (!resolved.startsWith(STATIC_DIR + path.sep) && resolved !== STATIC_DIR) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Si apunta a un directorio, servir index.html (SPA)
    let filePath = resolved;
    try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
    } catch {
        // El archivo no existe: servir index.html para permitir rutas SPA
        filePath = path.join(STATIC_DIR, 'index.html');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext      = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] ?? 'application/octet-stream';

        setSecurityHeaders(res);
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(req.method === 'HEAD' ? undefined : data);
    });
}

// ── Servidor HTTPS principal ─────────────────────────────────────────────────

const httpsServer = https.createServer(tlsOptions, requestHandler);

httpsServer.listen(HTTPS_PORT, () => {
    const ifaces = Object.values(os.networkInterfaces())
        .flat()
        .filter(i => i.family === 'IPv4' && !i.internal)
        .map(i => `  https://${i.address}:${HTTPS_PORT}`);

    console.log(`\n SportyStyle — Servidor HTTPS corriendo`);
    console.log(`  https://localhost:${HTTPS_PORT}`);
    ifaces.forEach(url => console.log(url));
    console.log('\n  (Si ves "NET::ERR_CERT_AUTHORITY_INVALID" en Chrome,');
    console.log('   escribe "thisisunsafe" en esa página para aceptar el cert autofirmado.)\n');
});

httpsServer.on('error', err => {
    if (err.code === 'EACCES') {
        console.error(`[ERROR] Puerto ${HTTPS_PORT} requiere permisos de administrador.`);
        console.error('        Ejecuta con: sudo node server.js  — o usa PORT=8443 node server.js');
    } else {
        console.error('[ERROR] HTTPS server:', err.message);
    }
    process.exit(1);
});

// ── Servidor HTTP → redirige a HTTPS ────────────────────────────────────────

if (HTTP_PORT !== 0) {
    const httpServer = http.createServer((req, res) => {
        const host = req.headers.host?.replace(/:\d+$/, '') ?? 'localhost';
        const target = `https://${host}:${HTTPS_PORT}${req.url}`;
        res.writeHead(301, { Location: target });
        res.end();
    });

    httpServer.listen(HTTP_PORT, () => {
        console.log(` Redireccionando HTTP :${HTTP_PORT} → HTTPS :${HTTPS_PORT}`);
    });

    httpServer.on('error', err => {
        // El puerto 80 es opcional; solo avisa sin abortar
        if (err.code === 'EACCES') {
            console.warn(`[WARN] Puerto HTTP ${HTTP_PORT} sin permisos — redirección HTTP desactivada.`);
        } else {
            console.warn('[WARN] HTTP redirect server:', err.message);
        }
    });
}
