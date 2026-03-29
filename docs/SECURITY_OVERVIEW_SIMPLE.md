# Seguridad en Rootsy (resumen simple)

Este texto explica **cómo protegemos los datos de cada punto de venta (POP)** y **quién puede hacer qué**, sin entrar en detalles técnicos de implementación.

---

## Tres lugares donde actúa la seguridad

Imaginá la app en tres capas:

1. **Cliente (navegador / pantalla)** — lo que ve el usuario.
2. **Servidor (Rootsy / Next.js)** — la lógica que prepara datos y envía órdenes a la base.
3. **Base de datos (Supabase / Postgres)** — donde viven los datos y las **reglas fuertes** de quién puede leer o modificar qué.

Ninguna capa reemplaza a la otra: trabajan en conjunto.

---

## Idea general

- Cada negocio opera dentro de un **punto de venta (POP)**. Los datos “del negocio” están asociados a ese POP.
- Cada usuario puede estar vinculado a un POP con un **rol** (por ejemplo: cajero, encargado).
- Ese rol tiene **permisos** concretos (por ejemplo: “puede ver ventas”, “puede editar ajustes”).
- El **dueño del punto de venta** es un caso especial: para su propio POP tiene **acceso amplio**, sin tener que listar permiso por permiso en la base (así simplificamos y evitamos errores).

La **verdad oficial** de quién puede qué está en la **base de datos** (roles, permisos y reglas automáticas llamadas RLS). El resto ayuda a la experiencia de uso y a no hacer cosas inútiles.

---

## Qué hace cada capa (en lenguaje simple)

### Cliente (pantalla)

- **Muestra u oculta** botones, menús y secciones según lo que el usuario **debería** poder hacer.
- Sirve para que la app sea **cómoda y clara**: no ofrecemos acciones obvias que luego van a fallar.
- **No basta por sí solo** para seguridad: alguien muy técnico podría intentar llamar al servidor sin usar la pantalla. Por eso la base debe estar bien protegida igual.

**En una frase:** el cliente es la **comodidad y la guía**; no es el candado principal.

---

### Servidor (Rootsy)

- **Prepara** la información que necesita cada pantalla (datos del POP, listados, etc.).
- Puede incluir, **en un mismo envío**, un resumen de **qué permisos tiene** ese usuario en ese POP, para que el cliente no tenga que preguntar veinte veces.
- Cuando el usuario confirma una acción (guardar, invitar, borrar), el servidor **le pide a la base** que ejecute el cambio usando la **sesión del mismo usuario** (como si el usuario firmara la operación).

**En una frase:** el servidor **orquesta** y **habla con la base en nombre del usuario autenticado**, sin saltarse las reglas.

---

### Base de datos (Supabase)

- Guarda usuarios, POPs, roles, permisos y todo el dato del negocio.
- Aplica **reglas automáticas (RLS)** en cada lectura y escritura: por ejemplo, “solo podés ver filas de POPs a los que pertenecés” o “solo podés insertar una invitación si te corresponde”.
- En operaciones más complejas puede usar **funciones especiales** que agrupan varios pasos y vuelven a comprobar permisos por dentro.

**En una frase:** la base es donde está el **candado real**: aunque alguien intente saltarse la pantalla, las reglas siguen aplicando.

---

## Flujo típico (ejemplo simple)

1. El usuario entra al POP y abre una pantalla (por ejemplo Recursos humanos).
2. El **servidor** carga los datos necesarios y, si hace falta, un **listado de permisos** del usuario en ese POP (idealmente **una vez** por pantalla, no una consulta por cada botón).
3. El **cliente** muestra solo lo que corresponde (menús, botones).
4. Si el usuario hace clic en “Guardar” o “Invitar”, el **servidor** envía la orden a la **base** con la **identidad del usuario**.
5. La **base** aplica **RLS** (y funciones si aplica): si no corresponde, **rechaza** la operación.

Así la experiencia es fluida y la seguridad no depende de que el usuario “no toque” lo que no debe.

---

## Qué evitamos a propósito

- **No** confiar solo en ocultar cosas en pantalla.
- **No** usar una “llave maestra” de base en el navegador para acciones normales de usuario (eso saltaría las reglas).
- **No** repetir la misma regla en muchos lugares del código si ya está bien definida en la base (así hay **una sola verdad** y menos errores al cambiar el producto).

---

## Próximos pasos del plan (a alto nivel)

1. **Inventariar** qué pantallas y acciones tocan datos de cada POP y cómo hablan hoy con la base.
2. **Alinear** permisos (nombres de recursos y acciones) con lo que ya existe en menú y en tablas de permisos.
3. **Reforzar reglas en la base (RLS)** para que coincidan con lo que el negocio quiere (incluido delegar tareas que hoy solo hace el dueño, si el producto lo pide).
4. **Pasar a las pantallas** un resumen de permisos al cargar, para una buena UX sin muchas consultas extra.

---

## Lectura complementaria (equipo técnico)

- `SECURITY_ACTION_PLAN.md` — fases y checklist.
- `FEATURE_DEVELOPMENT_GUIDE.md` — patrones de código y prompts para nuevas features.
- `DATABASE_RLS_RPC_INVENTORY.md` — tablas RLS y RPC en Supabase.
