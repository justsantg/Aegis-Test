# Aegis Test — Sistema de Evaluaciones para Academia de Idiomas

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.1-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Design Standard](https://img.shields.io/badge/Design-Hallmark_v2-1e40af?style=for-the-badge)](https://github.com/nutlope/hallmark)

**Aegis Test** es una plataforma integral de gestión, proyección y ejecución de evaluaciones estandarizadas para academias de idiomas. Diseñada bajo un enfoque *Mobile-First (BYOD)* para los estudiantes y herramientas especializadas de aula para la coordinación académica y los docentes.

---

## 📋 Tabla de Contenidos
1. [Arquitectura y Estructura del Proyecto](#-arquitectura-y-estructura-del-proyecto)
2. [Los 3 Roles del Sistema](#-los-3-roles-del-sistema)
   - [1. Rol Administrador (Coordinación Académica)](#1-rol-administrador-coordinación-académica)
   - [2. Rol Docente (Teacher)](#2-rol-docente-teacher)
   - [3. Rol Estudiante (Student)](#3-rol-estudiante-student)
3. [Modalidades de Examen (Fusión 3-en-1)](#-modalidades-de-examen-fusión-3-en-1)
4. [Estructura Académica y Reglas de Negocio](#-estructura-académica-y-reglas-de-negocio)
5. [Seguridad y Anti-Fraude en Tiempo Real](#-seguridad-y-anti-fraude-en-tiempo-real)
6. [Estándar de Diseño: Hallmark v2](#-estándar-de-diseño-hallmark-v2)
7. [Instalación y Puesta en Marcha Local](#-instalación-y-puesta-en-marcha-local)
8. [Credenciales y Usuarios de Prueba](#-credenciales-y-usuarios-de-prueba)

---

## 🏗 Arquitectura y Estructura del Proyecto

El repositorio está estructurado como un monorepo modular de dos capas independientes:

```text
Tests_Cambridge/
├── backend/                  # API REST construida con NestJS
│   ├── src/
│   │   ├── auth/             # Autenticación JWT, guards y estrategias
│   │   ├── users/            # Gestión de usuarios, perfiles y códigos de estudiante
│   │   ├── roles/            # RBAC (Admin = 1, Teacher = 2, Student = 3)
│   │   ├── courses/          # Cursos, niveles, horarios, modalidades y matrículas
│   │   ├── levels/           # Definición de niveles (1A - 10B y Training)
│   │   ├── exams/            # Plantillas, preguntas, opciones y parser PPTX/Texto
│   │   ├── exam-sessions/    # Sesiones en vivo, monitor, bloques y auditoría
│   │   └── database/         # Migraciones TypeORM y Seeds relacionales
│   └── docker-compose.yaml   # Servicios locales (PostgreSQL, Maildev)
│
├── frontend/                 # Aplicación Web Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                    # Landing y acceso rápido por roles
│   │   │   ├── admin/page.tsx              # Panel de Coordinación Académica
│   │   │   ├── teacher/page.tsx            # Dashboard docente y cursos asignados
│   │   │   ├── teacher/sessions/[id]/      # Proyector de aula y monitor en vivo
│   │   │   ├── student/page.tsx            # Portal del estudiante y mapa de fases
│   │   │   ├── exam/join/page.tsx          # Ingreso a examen por PIN de clase
│   │   │   ├── exam/[sessionId]/page.tsx   # Evaluador interactivo del estudiante
│   │   │   └── exam/[sessionId]/result/    # Resultados y retroalimentación
│   │   ├── components/
│   │   │   ├── exam/         # Componentes de reactivos (ICFES, Scramble, Cloze)
│   │   │   ├── auth/         # RoleGuard con control estricto de acceso
│   │   │   └── ui/           # Primitivas de interfaz Hallmark v2
│   │   └── lib/api.ts        # Cliente tipado de conexión con el backend
│   └── tailwind.config.js    # Tokens declarados de diseño editorial
│
└── README.md                 # Documentación oficial del proyecto
```

---

## 👥 Los 3 Roles del Sistema

### 1. Rol Administrador (Coordinación Académica)
- **Ruta:** `/admin`
- **Métricas Globales:** Visualización en vivo de evaluaciones realizadas, porcentaje de aprobación, incidentes de seguridad y promedio general de la academia.
- **Filtro Multidocente:** Capacidad de supervisar las métricas y sesiones de cualquier docente o filtrar por curso específico.
- **Gestión de Plantillas Oficiales:** Creación y estandarización de exámenes (`Midterm` y `Final`) por cada uno de los 20 subniveles y fase `Training`.
- **Importador Inteligente desde PowerPoint (`.pptx`):** Convierte diapositivas de clase en reactivos estructurados automáticamente mediante extracción de texto y detección de opciones.
- **Editor y Creador de Reactivos:** Soporte nativo para 4 tipologías:
  1. *ICFES Opción Múltiple* (Contexto + Prompt + 4 opciones únicas).
  2. *Sentence Scramble* (Ordenar sintácticamente con chips táctiles).
  3. *Fill in the Blank / Cloze* (Menú desplegable incrustado o texto exacto).
  4. *Sentence Completion* (Validación de texto exacto).

### 2. Rol Docente (Teacher)
- **Ruta:** `/teacher` y `/teacher/sessions/[id]`
- **Aislamiento Estricto por Docente:** Cada profesor visualiza exclusivamente sus cursos asignados, clasificados por día y rango horario.
- **Directorio de Estudiantes por Fases:** Búsqueda en tiempo real por nombre, correo, código institucional o teléfono, y gestión inmediata de matrícula.
- **Lanzador de Evaluaciones Fusión 3-en-1:** Apertura de sesiones en cualquiera de los 3 modos oficiales.
- **Proyector de Aula (Bloques Sincronizados):**
  - Muestra directamente en pantalla los puntos a realizar de **5 en 5 reactivos**.
  - Sin necesidad de código PIN para los alumnos (ellos resuelven mirando la pantalla o en sus hojas).
  - Pestañas directas de salto entre bloques (`Bloque 1 [1-5]`, `Bloque 2 [6-10]`, etc.).
  - Controles de avance (`Avanzar Bloque ▶`, `Bloque Anterior ◀` y `Finalizar Evaluación`).
  - **Modo Pantalla Completa:** Vista inmersiva de proyección en Modo Claro (Editorial), montada mediante Portal sin desbordamientos ni scrollbars duplicados.
- **Monitor de Asistencia y Gestión de Ausentes:**
  - Clasificación en vivo de alumnos: *Pendiente*, *En Examen*, *Completado* y *Ausente*.
  - **Botón Instantáneo de WhatsApp (`wa.me`):** Redacción automática de mensaje de notificación al estudiante ausente con un solo clic.
  - **Cierre de Sesión:** Al finalizar, los alumnos que no ingresaron se asientan automáticamente como `Ausente (No Presentó - N/P)` con nota `0.0`.

### 3. Rol Estudiante (Student)
- **Rutas:** `/student`, `/exam/join`, `/exam/[sessionId]`, `/exam/[sessionId]/result`
- **Portal del Estudiante:**
  - **Mapa Académico Interactivo:** Visualización del progreso por niveles regulares (`1A` a `10B`) agrupados en 5 Fases, culminando en la **Fase Training (APTIS Prep)**.
  - **Historial de Calificaciones:** Registro oficial de notas de exámenes intermedios y finales, promedios y estado académico (*Aprobado* / *Reprobado*).
  - Acceso directo para unirse a exámenes activos mediante PIN de clase.
- **Evaluador de Exámenes (*Exam Runner*):**
  - **Diseño Mobile-First (BYOD):** 100% responsive, diseñado para teléfonos inteligentes y tabletas con áreas táctiles generosas.
  - **Mecánica Táctil "Tap-to-Move":** En *Sentence Scramble*, tocar una palabra la sube a la oración y tocarla arriba la regresa al banco, con soporte táctil intuitivo.
  - **Sincronización en Modo Bloques:** El alumno responde los 5 puntos asignados, envía el bloque y entra en una pantalla de espera sincronizada; cuando el docente avanza en el proyector, el teléfono desbloquea automáticamente el siguiente bloque.
  - **Anti-Cheat Guard:** Detección de pérdida de foco, cambio de pestaña, atajos de desarrollador o aplicaciones externas con advertencia visual y reporte en vivo al docente.
  - **Resultados Inmediatos:** Al enviar la evaluación o expirar el temporizador, calcula la nota sobre 5.0 y muestra el desglose de preguntas evaluadas.

---

## 🎯 Modalidades de Examen (Fusión 3-en-1)

Toda evaluación oficial puede ejecutarse bajo cualquiera de las siguientes modalidades:

| Modalidad | Descripción | Mecánica de Presentación |
| :--- | :--- | :--- |
| **Modo 1: Ritmo Libre** | Digital individual por dispositivo del estudiante. | Se proyecta un PIN de 6 dígitos. Cada alumno ingresa desde su móvil/PC y avanza a su propio ritmo por las 30 preguntas con temporizador individual. |
| **Modo 2: Bloques Sincronizados** | Proyección grupal en pantalla/televisor de aula. | La pantalla del profesor es directamente el proyector de aula mostrando los reactivos **de 5 en 5 puntos**. El docente controla el paso entre bloques. No requiere PIN de alumnos. |
| **Modo 3: Hoja de Papel + OMR (Plan B)** | Formato físico tradicional para contingencias. | Generación de hoja de respuestas de 30 burbujas tipo ICFES en PDF imprimible y calificación óptica instantánea con la cámara del docente. |

---

## 📚 Estructura Académica y Reglas de Negocio

- **Estructura de Niveles:**
  - 20 Subniveles regulares: `1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B, 5A, 5B, 6A, 6B, 7A, 7B, 8A, 8B, 9A, 9B, 10A, 10B`.
  - Fase Final: `Training` (preparación intensiva para el examen internacional APTIS).
- **Regla Estricta de Evaluaciones:**
  - Niveles `1A` a `10B`: Cuentan obligatoriamente con **Examen Intermedio (Midterm)** y **Examen Final**.
  - Nivel `Training`: **Únicamente cuenta con Examen Intermedio (Midterm)**, ya que la evaluación final del nivel corresponde al examen oficial internacional APTIS presentado ante el ente certificador.
- **Modalidades de Cursos:**
  - `REGULAR_GROUP`: Grupos estándar (capacidad de 6 a 8 estudiantes).
  - `PERSONALIZED_1ON1`: Clases particulares personalizadas (capacidad de 1 estudiante).
  - `SEMI_PERSONALIZED`: Clases de grupos reducidos (capacidad de 2 a 3 estudiantes).

---

## 🛡️ Seguridad y Anti-Fraude en Tiempo Real

1. **Ocultamiento de Soluciones en Cliente:** El payload de preguntas entregado al navegador del estudiante nunca incluye `isCorrect`, `correctPosition` ni las respuestas verdaderas. La calificación se realiza de forma atómica en el servidor.
2. **Anti-Cheat Guard Activo:**
   - Monitoreo de eventos `visibilitychange`, `blur` y salidas de ventana.
   - Detección de atajos de teclado para herramientas de desarrollo (`F12`, `Ctrl+Shift+I`).
   - Pantalla de advertencia instantánea (*Blackout*) en el dispositivo del estudiante con contador regresivo.
   - Registro cronológico inmediato en el panel docente indicando hora, estudiante, reincidencia y detalle del evento.

---

## 🎨 Estándar de Diseño: Hallmark v2

El frontend se adhiere a las directrices de diseño editorial y anti-slop de **Hallmark v2**:
- **Cero "AI Slop":** Prohibido el uso de gradientes genéricos morado-cian, tarjetas dentro de tarjetas anidadas artificialmente y emojis como iconos.
- **Tokens de Diseño Declarados:** Toda la paleta utiliza tokens semánticos en `globals.css` (`bg-paper`, `bg-paper-card`, `bg-paper-muted`, `text-ink`, `text-ink-muted`, `border-rule`, `accent`).
- **Materialidad Editorial:** Inspirada en papel académico cálido, tinta de alto contraste y acentos azul cobalto (`#1e40af`).
- **Seguridad en Interacciones:** Sin `transition: all`; uso exclusivo de propiedades explícitas (`color`, `background-color`, `transform`), soporte a `:focus-visible` y `prefers-reduced-motion`.
- **Modales Nativos:** Cero uso de diálogos nativos del navegador (`alert()` o `confirm()`), reemplazados por modales accesibles con backdrop blur.

---

## 🚀 Instalación y Puesta en Marcha Local

### Prerrequisitos
- **Node.js** v20.x o superior.
- **npm** v10.x o superior.
- **PostgreSQL** v16 instalado localmente o mediante Docker.

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/Tests_Cambridge.git
cd Tests_Cambridge
```

### 2. Configurar y Ejecutar el Backend (Puerto 3001)
```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env-example-relational .env

# Ejecutar migraciones y seeds automáticos
npm run migration:run
npm run seed:run:relational

# Iniciar servidor en modo desarrollo
npm run start:dev
```
El backend estará disponible en `http://localhost:3001` y la documentación interactiva Swagger en `http://localhost:3001/docs`.

### 3. Configurar y Ejecutar el Frontend (Puerto 3000)
```bash
cd ../frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```
El frontend estará disponible en `http://localhost:3000`.

---

## 🔑 Credenciales y Usuarios de Prueba

La base de datos cuenta con usuarios semilla preconfigurados y botones de **Acceso Rápido** en la pantalla principal:

| Rol | Correo Electrónico | Contraseña | Acceso Rápido |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@example.com` | `secret` | Botón *"Acceso Rápido Administrador"* |
| **Docente** | `teacher@example.com` | `secret` | Botón *"Acceso Rápido Docente"* |
| **Estudiante** | `student@example.com` | `secret` | Botón *"Acceso Rápido Estudiante"* |

---

## 📄 Licencia

Este proyecto es propiedad privada y está desarrollado para la gestión académica y evaluación de idiomas bajo el estándar de **Aegis Test**. Todos los derechos reservados © 2026.
