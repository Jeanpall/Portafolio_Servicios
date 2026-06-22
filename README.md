# HELIX — Portafolio comercial

Landing corporativa con formulario de contacto transaccional y acceso directo a WhatsApp.

## Arquitectura

- Frontend: HTML, CSS y JavaScript sin framework.
- Backend: servidor Node.js nativo, sin dependencias externas.
- Correo: API de Resend desde `/api/contact`.
- Seguridad: validación en cliente y servidor, honeypot, límite básico de solicitudes, tamaño máximo y claves solo en variables de entorno.

No se usa React, Vue ni Angular porque la página no necesita estado complejo. Mantener el frontend estático reduce peso y mantenimiento; Node aporta únicamente la funcionalidad que sí debe permanecer privada.

## Configuración local

1. Instala Node.js 20 o superior.
2. Copia `.env.example` como `.env`.
3. Completa las variables con los datos de Resend.
4. Ejecuta:

```bash
npm start
```

5. Abre `http://localhost:8080`.

No abras `index.html` directamente: el formulario necesita el endpoint del servidor Node.

## Variables de entorno

```env
PORT=8080
RESEND_API_KEY=re_xxxxxxxxx
CONTACT_TO=jeanpall2020@gmail.com
CONTACT_PUBLIC_EMAIL=jdag0698@gmail.com
CONTACT_FROM=HELIX Web <onboarding@resend.dev>
WHATSAPP_NUMBER=573143935964
WHATSAPP_MESSAGE=Hola, vi el portafolio de HELIX y me gustaría conocer más sobre sus servicios.
```

- `CONTACT_TO`: bandeja donde HELIX recibe las solicitudes.
- `CONTACT_PUBLIC_EMAIL`: correo que se muestra en el portafolio.
- `CONTACT_FROM`: remitente verificado en Resend. Debe pertenecer al dominio configurado.
- La clave real va únicamente en `.env` o en las variables secretas del hosting. Nunca debe escribirse en `js/main.js`.

Para la prueba inicial puede usarse `onboarding@resend.dev` y enviar al correo asociado con la cuenta de Resend. Al publicar, reemplázalo por un remitente del dominio verificado.

## Configuración recomendada para entregabilidad

1. Verifica un subdominio de envío, por ejemplo `notificaciones.tihelix.com`, en Resend.
2. Añade en el DNS los registros SPF y DKIM indicados por Resend.
3. Añade una política DMARC para el dominio y comienza con `p=none` mientras revisas reportes.
4. Mantén `CONTACT_FROM` en el dominio verificado y usa el correo del visitante solo como `Reply-To`.
5. Prueba la entrega en Gmail y Outlook antes de publicar.

SPF, DKIM y DMARC mejoran la autenticación y reputación, pero ningún proveedor puede garantizar por completo la ubicación en bandeja principal.

## WhatsApp

El número configurado es `+57 314 3935964`, convertido al formato internacional `573143935964`. Los dos accesos de WhatsApp abren una conversación con un mensaje inicial.
