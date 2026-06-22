# HELIX — Portafolio comercial

Landing page corporativa para presentar los servicios de HELIX y generar conversaciones con empresas interesadas.

## Secciones

- Propuesta de valor y llamadas a la acción
- Seis líneas de servicio
- Diferenciales de HELIX
- Cuatro niveles de acompañamiento
- Metodología de trabajo
- Formulario de contacto por correo
- Acceso flotante a WhatsApp

## Configuración de contacto

Los canales se configuran al inicio de `js/main.js`:

```js
const CONTACT_EMAIL = "contacto@tihelix.com";
const WHATSAPP_NUMBER = "";
```

`WHATSAPP_NUMBER` debe contener el indicativo del país y el número, únicamente con dígitos. Por ejemplo, para Colombia: `573001234567`.

Mientras no se configure un número, los accesos de WhatsApp llevan al visitante a la sección de contacto. El formulario prepara un correo en la aplicación del visitante; no almacena información ni requiere backend.

## Vista local

Abre `index.html` o ejecuta un servidor estático desde esta carpeta:

```bash
python -m http.server 8080
```

Después visita `http://localhost:8080`.
