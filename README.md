# VIP Training Gym

Sitio web estático de VIP Training Gym (Portugal 681, Santiago), con panel de administración en `/admin`. HTML + CSS + JS, sin proceso de compilación.

- `index.html` — estructura de la página
- `styles.css` — estilos (tema neón, responsive)
- `app.js` — lee `data/*.json`, arma cada sección y la anima (GSAP + ScrollTrigger + Lenis desde CDN)
- `data/` — todo el contenido editable (textos, fotos, videos, coaches, flyer, horarios)
- `admin/` — panel Sveltia CMS
- `img/` — fotos del sitio; `img/uploads` y `img/flyer` reciben lo que se sube desde el panel

## Panel de administración

Entra a `https://TU-DOMINIO/admin` e inicia sesión con GitHub (o con un token personal de GitHub con acceso al repo `Bemol69/viptraining_cl`). Cada cambio guardado crea un commit y Vercel publica la web en ~30 segundos.

Qué se puede editar:

| En el panel | Archivo | Qué cambia |
| --- | --- | --- |
| Flyer y promociones | `data/flyer.json` | Flyer (imagen o video), ventana emergente, fecha de término, botón de WhatsApp |
| Portada y franjas | `data/portada.json` | Título, texto, historias del teléfono (fotos/videos), frases de las franjas |
| 01 · Disciplinas | `data/disciplinas.json` | Disciplinas con foto/video, texto y etiquetas |
| 02 · Equipo | `data/equipo.json` | Coaches: agregar, quitar, ordenar, foto, descripción, Instagram |
| 03 · Tu primer día | `data/primer-dia.json` | Frase y pasos |
| 04 · El espacio | `data/espacio.json` | Galería de fotos y videos con tamaño en la grilla |
| 05 · Familia VIP | `data/comunidad.json` | Muro de publicaciones (fotos/videos + link a Instagram) |
| Cierre | `data/cierre.json` | Textos del "Empieza hoy" |
| Contacto y horarios | `data/ajustes.json` | WhatsApp, Instagram, dirección, estacionamiento, horarios |

Los videos (MP4/WebM) se reproducen solos, sin sonido y en loop mientras están en pantalla.

## Despliegue

Vercel: importar el repo, framework **Other**, sin comando de build, directorio raíz del proyecto.
