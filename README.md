# HELIX — Portafolio comercial

Landing corporativa para presentar los servicios tecnológicos de HELIX, con secciones informativas, acceso a WhatsApp y formulario de contacto conectado a un backend propio.

## Tecnologías utilizadas

- HTML5 semántico.
- CSS modular con archivos separados para base, componentes, secciones y variables.
- JavaScript vanilla para navegación, animaciones, configuración pública y envío del formulario.
- Node.js nativo con módulos ES para servir la aplicación y exponer endpoints internos.
- API de Resend para el envío de correos transaccionales desde el formulario.
- Render para despliegue del servidor Node.js.

## Arquitectura

El proyecto usa un frontend liviano sin framework y un backend pequeño en Node.js.

- El frontend renderiza la landing, maneja el menú móvil, animaciones, enlaces de contacto y envío del formulario.
- El backend sirve los archivos estáticos y expone:
  - `GET /api/config`: entrega configuración pública necesaria para la interfaz.
  - `POST /api/contact`: recibe solicitudes del formulario y las envía por correo mediante Resend.
- Los datos sensibles se administran mediante variables de entorno y no deben escribirse directamente en el README ni en el código público.

## Estructura principal

```text
.
├── assets/          # Logos y recursos gráficos
├── css/             # Estilos organizados por responsabilidad
├── js/              # Interacciones del frontend
├── index.html       # Página principal
├── server.mjs       # Servidor Node.js y endpoints internos
├── render.yaml      # Configuración de despliegue en Render
├── package.json     # Scripts y versión mínima de Node
└── README.md
```

## Ejecución local

Requisitos:

- Node.js 20 o superior.

Pasos generales:

1. Instalar dependencias si el proyecto las requiere en el futuro.
2. Configurar las variables de entorno necesarias para correo y canales públicos.
3. Ejecutar el servidor:

```bash
npm start
```

4. Abrir la URL local indicada por la consola.

> Nota: se recomienda ejecutar el proyecto desde el servidor Node.js y no abrir `index.html` directamente, porque el formulario depende de los endpoints internos.

## Variables de entorno

El proyecto espera variables para:

- Puerto de ejecución.
- Entorno de ejecución.
- Clave privada de Resend.
- Correo receptor del formulario.
- Remitente verificado para Resend.
- Correo público mostrado en la interfaz.
- Número y mensaje inicial para WhatsApp.

Las variables sensibles deben configurarse en un archivo `.env` local o en el panel del proveedor de hosting. El archivo `.env` no debe subirse al repositorio.

## Seguridad y buenas prácticas

El backend incluye medidas básicas para proteger el formulario:

- Validación de datos en cliente y servidor.
- Honeypot antispam.
- Límite básico de solicitudes por IP.
- Límite de tamaño del cuerpo de la solicitud.
- Headers de seguridad.
- Uso de `Reply-To` para responder al visitante sin exponer credenciales.

## Despliegue

El proyecto está preparado para ejecutarse como servicio web Node.js. En producción, las credenciales y datos privados deben configurarse desde el proveedor de hosting o como variables secretas.

Para el envío de correos, el dominio remitente debe estar verificado en Resend y contar con la configuración DNS recomendada por el proveedor.
