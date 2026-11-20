# Directrices del Proyecto: Sistema de Evaluaciones para Academia de Idiomas

## 1. Alcance y Tipología de Preguntas
- **Enfoque inicial (MVP):** Exclusivamente gramática, vocabulario y sintaxis. Excluir listening, speaking y reading extensos por ahora.
- **Tipos de preguntas soportadas:**
  1. **Tipo ICFES:** Opción múltiple con única respuesta y contexto corto.
  2. **Organizar la oración (Sentence Scramble):** Fichas/chips táctiles arrastrables o tocables para ordenar sintácticamente la oración en segundos.
  3. **Completar espacios (Fill in the blank / Cloze):** Menú desplegable incrustado (*inline dropdown*) o validación exacta de texto.

## 2. Modalidades de Examen (Fusión 3-en-1)
Toda evaluación debe permitir ejecutarse bajo tres modalidades seleccionables por el docente al abrir la sesión:
- **Modo 1: Ritmo Libre (Digital Individual):** Acceso por PIN de clase. Preguntas y opciones en orden aleatorio. Cada alumno avanza a su velocidad.
- **Modo 2: Bloques Sincronizados:** Emula la pantalla grupal (bloques de 5 preguntas) con temporizador visible y avance automático cuando todos envían o vence el tiempo.
- **Modo 3: Hoja de Papel + Escaneo Óptico (Plan B):** Generación de hoja de respuestas de 30 burbujas tipo ICFES en PDF imprimible y calificación instantánea con la cámara del docente.

## 3. Estructura Académica y Reglas de Negocio
- **Niveles e Idiomas:**
  - Estructura de niveles: `1A, 1B, 2A, 2B ... 10A, 10B` (20 subniveles regulares).
  - Fase final: `Training` (preparación para el examen internacional APTIS).
  - **Regla de exámenes por nivel:**
    - Niveles `1A` a `10B`: Tienen Examen Intermedio (Midterm) y Examen Final.
    - Nivel `Training`: **Únicamente tiene Examen Intermedio (Midterm)**, ya que la evaluación final es el examen oficial internacional APTIS.
- **Modalidades de Cursos:**
  - `REGULAR_GROUP`: Grupos estándar (típicamente 6 a 8 estudiantes).
  - `PERSONALIZED_1ON1`: Clases particulares individuales (capacidad: 1 estudiante).
  - `SEMI_PERSONALIZED`: Clases de 2 a 3 estudiantes.
- **Horarios:**
  - Estructurados por bloques de días (ej. Martes, Miércoles y Jueves) y rangos horarios (ej. 10:00 AM - 12:00 PM).

## 4. Asistencia y Gestión de Ausencias
- Las sesiones de examen están vinculadas a la lista oficial de estudiantes del curso.
- Check-in en tiempo real: los alumnos pasan de "Pendiente" a "En Examen" al ingresar con el PIN.
- Detección inmediata de ausentes con botón de notificación rápida vía WhatsApp.
- Al cerrar la sesión, los ausentes se registran automáticamente como `No Presentó (N/P)`.
- Soporte para habilitar exámenes extemporáneos/supletorios individuales.

## 5. Gestión Multicurso para Docentes
- Los docentes pueden dictar múltiples niveles y modalidades en distintos horarios.
- El panel docente organiza el acceso mediante tarjetas de cursos asignados con filtro por día.
- Los exámenes oficiales están estandarizados por la Coordinación Académica en la nube; el profesor solo selecciona el examen oficial correspondiente a su nivel sin crearlo desde cero.

## 6. Stack Tecnológico y Arquitectura Frontend
- **Framework:** Next.js (App Router, TypeScript).
- **Estilos y Componentes:** Tailwind CSS, Radix UI / Shadcn UI primitives, Lucide React Icons.
- **Ubicación:** Carpeta independiente `frontend/`, comunicándose con `backend/` en `http://localhost:3001/api/v1`.
- **Estrategia de Puertos:** Backend corre en `3001`, Frontend en `3000`.

## 7. Experiencia de Usuario (UI/UX) y Diseño Responsivo
- **Enfoque Mobile-First (BYOD):** La interfaz del estudiante debe ser 100% fluida en smartphones y tablets, con botones grandes y tipografía legible.
- **Interactividad de Reactivos:**
  1. **Tipo ICFES:** Tarjetas de selección táctiles grandes con estado activo claro.
  2. **Sentence Scramble (Ordenar Frase):** Mecánica "Tap-to-Move" accesible (tocar una ficha en el banco la mueve a la oración armada; tocarla en la oración la regresa al banco), además de soporte de reordenamiento visual.
  3. **Completar Espacios (Cloze):** Menús desplegables incrustados directamente en el flujo del texto (*inline*), adaptables al ancho del contenido.
  4. **Completar Oración:** Campo de texto limpio con validación en tiempo real.
- **Seguridad y Anti-Copia en Cliente:**
  - Ocultamiento de soluciones en el cliente (el payload recibido nunca contiene `isCorrect` ni `correctPosition`).
  - Detección de pérdida de foco (`visibilitychange` / `blur`) con alerta visible al estudiante si intenta cambiar de pestaña o aplicación durante el examen.

## 8. Panel Docente y Modos de Presentación
- **Dashboard de Cursos:** Tarjetas organizadas por día y horario, con estado del grupo y botón para iniciar examen.
- **Monitor de Asistencia en Tiempo Real:** Lista de estudiantes clasificados en `Pendiente`, `En Examen`, `Completado` y `Ausente`.
- **Botón WhatsApp Instantáneo:** Acceso directo a `wa.me` con mensaje de alerta preconfigurado para cada estudiante ausente.
- **Proyector para Bloques Sincronizados:** Interfaz de pantalla completa con temporizador visual regresivo y contador en vivo de alumnos que han enviado el bloque actual.

## 9. Estándar de Diseño Activo: Hallmark v2 (`nutlope/hallmark`)
El frontend debe adherirse **siempre y de forma activa** a las directrices de diseño y anti-slop de **Hallmark** (`nutlope/hallmark` ubicado en `.agents/skills/hallmark/`):
- **The Floor (Reglas Inquebrantables):**
  - **Cero "AI Slop":** Prohibido el uso de gradientes morado-a-cian genéricos, tarjetas anidadas dentro de tarjetas (*cards-in-cards*), emojis decorativos como iconos, métricas inventadas y números falsos.
  - **Tokens de Diseño:** Todo color, fuente y radio se gestiona mediante tokens declarados (`tokens.css` / variables de Tailwind). Cero valores literales dispersos.
  - **Tipografía y Jerarquía:** Prohibido el uso de *eyebrows* y mayúsculas sostenidas espaciadas (*tracked capitals*) en etiquetas. Tipografía clara, jerárquica y con alto contraste para legibilidad en exámenes.
  - **Seguridad en Interacciones y Accesibilidad:** Prohibido `transition: all` (usar propiedades específicas como `color`, `background-color`, `transform`). Todo elemento interactivo debe tener `:focus-visible` inmediato. Soporte para `prefers-reduced-motion`.
  - **Job-Driven Layout:** Cada pantalla se estructura exclusivamente alrededor de la acción real que el usuario viene a realizar (Estudiante: rendir evaluación sin distracciones; Docente: gestionar grupos, verificar asistencia, notificar ausentes por WhatsApp y controlar bloques).
  - **Economía de Pantalla:** ~80 palabras por pantalla principal. El hero o acción principal debe ser visible en 1280x800 sin scroll. Contenedores con ancho máximo y centrados con márgenes responsivos.
- **Tema y Materialidad:** Inspirado en materiales editoriales / de academia (papel cálido, tinta de alto contraste, acentos precisos azul cobalto o índigo académico, reglas limpias y microinteracciones nítidas).
