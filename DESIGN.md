# DESIGN — Red social estilo Fotolog

## Concepto

Red social centrada en contenido visual, inspirada en Fotolog. Cada usuario tiene un perfil público (su "fotolog") donde publica fotos, álbumes y videos cortos. Otros usuarios pueden seguirlo, darle like y dejar comentarios ("firmas").

## Stack

| Capa     | Tecnología                     | Carpeta              |
| -------- | ------------------------------ | -------------------- |
| Frontend | Angular 17                     | `redsocial_angular/` |
| Backend  | NestJS 12 (Express)            | `redsocial_api/`     |
| Base de datos | MongoDB                   | —                    |
| Auth     | JWT (`@nestjs/jwt`)           | —                    |
| Archivos | _a definir_ (disco local / cloud) | —                 |

## Funcionalidades

### Usuarios
- Registro e inicio de sesión.
- Perfil: nombre de usuario, nombre, bio, foto de perfil.
- Seguir / dejar de seguir a otros usuarios.

### Publicaciones
Una publicación puede ser de tres tipos:
- **Foto**: una imagen con descripción.
- **Álbum**: varias imágenes agrupadas, con título y descripción.
- **Video corto**: un video de duración limitada, con descripción.

Acciones sobre una publicación:
- Crear, editar descripción y eliminar (solo el autor).
- Like / quitar like.
- Comentar ("firmar") y eliminar comentarios propios.

### Feed
- **Inicio**: publicaciones de los usuarios que sigo, ordenadas por fecha.
- **Perfil**: publicaciones de un usuario en grilla.

## Modelo de datos

```
Usuario
  id, username (único), email (único), passwordHash,
  nombre, bio, fotoPerfilUrl, fechaAlta

Publicacion
  id, autorId -> Usuario, tipo (FOTO | ALBUM | VIDEO),
  titulo (solo álbum), descripcion, fechaCreacion

Media
  id, publicacionId -> Publicacion, tipo (IMAGEN | VIDEO),
  url, orden, duracionSegundos (solo video)

Comentario (embebido en Publicacion.comentarios)
  id, autorId -> Usuario, texto, fechaCreacion

Like
  usuarioId -> Usuario, publicacionId -> Publicacion   (PK compuesta)

Seguimiento
  seguidorId -> Usuario, seguidoId -> Usuario           (PK compuesta)
```

Una foto o video tiene un único `Media`; un álbum tiene varios `Media` ordenados por `orden`.

Los comentarios se guardan dentro del documento de la publicación. En los listados (feed, perfil) no se traen los comentarios, solo su cantidad.

## API (NestJS)

### Auth
| Método | Ruta             | Descripción        |
| ------ | ---------------- | ------------------ |
| POST   | `/auth/register` | Registro           |
| POST   | `/auth/login`    | Login, devuelve token |

### Usuarios
| Método | Ruta                          | Descripción               |
| ------ | ----------------------------- | ------------------------- |
| GET    | `/usuarios/:username`         | Perfil público            |
| PATCH  | `/usuarios/me`                | Editar perfil propio      |
| GET    | `/usuarios/:username/publicaciones` | Publicaciones del usuario |
| POST   | `/usuarios/:username/seguir`  | Seguir                    |
| DELETE | `/usuarios/:username/seguir`  | Dejar de seguir           |

### Publicaciones
| Método | Ruta                               | Descripción                         |
| ------ | ---------------------------------- | ----------------------------------- |
| GET    | `/publicaciones/feed`              | Feed de seguidos                    |
| POST   | `/publicaciones`                   | Crear (multipart con archivos)      |
| GET    | `/publicaciones/:id`               | Detalle                             |
| PATCH  | `/publicaciones/:id`               | Editar descripción/título           |
| DELETE | `/publicaciones/:id`               | Eliminar                            |
| POST   | `/publicaciones/:id/like`          | Dar like                            |
| DELETE | `/publicaciones/:id/like`          | Quitar like                         |
| GET    | `/publicaciones/:id/comentarios`   | Listar comentarios                  |
| POST   | `/publicaciones/:id/comentarios`   | Comentar                            |
| DELETE | `/publicaciones/:id/comentarios/:comentarioId` | Eliminar comentario propio |

### Módulos Nest
`AuthModule`, `UsuariosModule`, `PublicacionesModule` (incluye comentarios), `MediaModule` (subida y almacenamiento de archivos).

## Frontend (Angular)

### Rutas
| Ruta                 | Pantalla                          |
| -------------------- | --------------------------------- |
| `/login`             | Login                             |
| `/registro`          | Registro                          |
| `/`                  | Feed                              |
| `/subir`             | Nueva publicación (foto/álbum/video) |
| `/p/:id`             | Detalle de publicación + comentarios |
| `/:username`         | Perfil (grilla de publicaciones)  |
| `/ajustes`           | Editar perfil                     |

### Servicios
`AuthService`, `UsuariosService`, `PublicacionesService`.

## Decisiones abiertas
- ODM para MongoDB.
- Dónde se guardan los archivos (disco del servidor o servicio externo).
- Límites de subida: tamaño máximo de imagen, cantidad máxima de fotos por álbum, duración máxima del video.
- ¿Restricción estilo Fotolog clásico de una publicación por día?
- ¿Perfiles privados?
