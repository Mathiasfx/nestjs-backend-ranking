
# Backend — Desarrollo completo (NestJS + Prisma + MongoDB + WebSockets)
Guía paso a paso para levantar en **desarrollo** tu backend del juego: autenticación JWT, ranking (mejor total por juego), top-10, posición individual, módulos **trivia** y **memotest**, y WebSockets para actualizaciones en tiempo real. Incluye comandos listos para ejecutar.

---

## Resumen técnico
- Framework: **NestJS**
- ORM: **Prisma** (con MongoDB)
- DB: **MongoDB Atlas** (o servidor Mongo)
- WebSockets: **socket.io** (via `@nestjs/websockets`)
- Deploy: pensado para Vercel (configurar env vars)
- Cliente: Unity / Web / Construct3

---

## Requisitos
- Node.js ≥ 18
- npm (o pnpm)
- Git
- Cuenta en MongoDB Atlas (o Mongo accesible)
- (Opcional) `socket.io-client` para pruebas WebSocket

---

## Estructura recomendada del repo
```
juego-backend/
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ auth/
│  ├─ prisma/
│  ├─ score/
│  ├─ trivia/
│  ├─ memotest/
│  ├─ users/
│  └─ main.ts
├─ .env
├─ package.json
└─ README.md
```

---

## 1 — Crear / clonar proyecto
Si ya tenés repo:
```bash
git clone <tu-repo-url>
cd <tu-repo-folder>
```

Si empezás desde cero:
```bash
npm i -g @nestjs/cli
nest new juego-backend
cd juego-backend
```

---

## 2 — Variables de entorno
Crea `.env` en la raíz con este contenido (ejemplo):
```
PORT=3000
DATABASE_URL="mongodb+srv://<USER>:<PASSWORD>@cluster0.xxxxx.mongodb.net/juego?retryWrites=true&w=majority"
JWT_SECRET="cambia_esta_clave_por_una_segura"
JWT_EXPIRES_IN="3600s"
```
Guarda un `.env.example` con las mismas claves sin valores.

---

## 3 — Instalar dependencias
Desde la raíz:
```bash
npm install
# Si necesitás instalar dependencias clave:
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs prisma @prisma/client @nestjs/websockets @nestjs/platform-socket.io socket.io socket.io-client @nestjs/mongoose mongoose class-validator class-transformer
# Dev
npm install -D prisma
```

Inicializa prisma (si no existe):
```bash
npx prisma init
```

---

## 4 — Prisma: schema para MongoDB
Copia en `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  username      String   @unique
  password      String
  displayName   String?
  totalScore    Int      @default(0)
  currentScores Json     @default("{}")
  createdAt     DateTime @default(now())
}

model TriviaSettings {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  timeLimit     Int      @default(15)
  maxQuestions  Int      @default(10)
  pointsBase    Int      @default(100)
  updatedAt     DateTime @updatedAt
}

model TriviaQuestion {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  question      String
  options       String[]
  correctAnswer String
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
}

model MemotestSettings {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  pairs           Int      @default(6)
  timeLimit       Int      @default(60)
  pointsPerMatch  Int      @default(10)
  penaltyPerError Int      @default(-2)
  updatedAt       DateTime @updatedAt
}

model MemotestCard {
  id        String  @id @default(auto()) @map("_id") @db.ObjectId
  imageUrl  String
  active    Boolean @default(true)
  createdAt DateTime @default(now())
}
```

---

## 5 — Generar cliente Prisma y sincronizar esquema
```bash
npx prisma generate
npx prisma db push
```
> Con MongoDB usamos `db push` para reflejar esquema.

---

## 6 — Scripts `package.json`
Asegurate:
```json
"scripts": {
  "start": "nest start",
  "start:dev": "nest start --watch",
  "build": "nest build"
}
```
Levantar modo dev:
```bash
npm run start:dev
```
Deberías ver: `Server running on http://localhost:3000`

---

## 7 — Módulos clave y endpoints (resumen)

### Auth
- `POST /auth/register` → { username, password, displayName? }
- `POST /auth/login` → { username, password } => { access_token }

Implemeta con JWT (`@nestjs/jwt`) y bcrypt para hash.

### Scores & Ranking
- `POST /scores/submit` (Bearer) → { game, points }  // general fallback
- `GET /scores/ranking` → top 10 por `totalScore`
- `GET /scores/position/:userId` → { username, position, totalScore }

Lógica: cada usuario guarda `currentScores` (por juego). `totalScore` = mejor total histórico (suma de mejores por juego), sólo se actualiza si el nuevo total supera el anterior.

### Trivia
- `GET /trivia` → { settings, questions } (questions sin `correctAnswer`)
- `POST /trivia/answer` (Bearer) → { questionId, selectedAnswer, timeTaken } => respuesta: { correct, pointsGained, newTotal }
  - Backend valida `correctAnswer`, calcula puntos por tiempo: `points = round(pointsBase * (timeRemaining / timeLimit))`
  - Actualiza `currentScores.TRIVIA` y `totalScore` si supera récord.

### Memotest
- `GET /memotest/init` → { timeLimit, pairs, board }  // backend selecciona `pairs` cartas activas, duplica y mezcla
- `POST /memotest/finish` (Bearer) → { matches, errors, time } => backend calcula `score = matches*pointsPerMatch + errors*penaltyPerError`, actualiza `currentScores.MEMOTEST` y `totalScore` si aplica.

---

## 8 — WebSockets (socket.io) — Gateway
Implementar un `ScoreGateway` que:
- Emita `rankingUpdates` con top 10 cuando el top cambie.
- Emita `myPosition` o `userPosition:<id>` cuando cambie la posición de un usuario.
- Exponga `getRanking` y `getPosition` para consultas desde cliente.

Ejemplo de emisión para posición:
```ts
async getUserPosition(userId: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  const better = await this.prisma.user.count({ where: { totalScore: { gt: user.totalScore } } });
  return better + 1;
}
```

En `submit` o cuando se actualiza un score: llamar `gateway.emitRankingUpdate()` y `gateway.emitUserPosition(userId)`.

---

## 9 — Seguridad y anti-cheat (recomendado)
- **No enviar** `correctAnswer` en `GET /trivia`.
- Verificar `timeTaken` desde servidor si querés robustez extra: registrar `sentAt` y comparar.
- Validar DTOs con `class-validator` y `class-transformer`.
- Rate limit en endpoints de submit.
- Sanitizar entradas y manejar errores centralizados.

---

## 10 — Integración con Unity (puntos clave)
- **Memotest**: usar AssetBundle para imágenes; Unity descarga bundle una vez y cachea. Backend devuelve board con `image` que puede ser path/filename dentro del bundle o URL al CDN.
- **Trivia**: Backend entrega preguntas en JSON; Unity muestra texto y si hay imagen usa cache/CDN (o bundle si preferís).
- WebSockets: Unity puede usar `BestHTTP` o `NativeWebSocket` + cliente socket.io compatible para recibir `rankingUpdates` y `myPosition`.
- Para imágenes: preferir CDN y cache-control; en Unity cachear en `Application.persistentDataPath`.

---

## 11 — Comandos útiles (todo junto)
```bash
# 1. instalar dependencias
npm install

# 2. inicializar prisma client y push
npx prisma generate
npx prisma db push

# 3. levantar servidor dev
npm run start:dev

# 4. registrar usuario
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{"username":"raul","password":"1234"}'

# 5. login
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"username":"raul","password":"1234"}'

# 6. guardar token (ejemplo)
TOKEN="<PEGA_AQUI_EL_TOKEN>"

# 7. enviar puntaje genérico
curl -X POST http://localhost:3000/scores/submit -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"game":"MEMOTEST","points":120}'

# 8. top 10
curl http://localhost:3000/scores/ranking

# 9. posición
curl http://localhost:3000/scores/position/<USER_ID>

# 10. iniciar memotest
curl http://localhost:3000/memotest/init

# 11. finalizar memotest
curl -X POST http://localhost:3000/memotest/finish -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"matches":6,"errors":1,"time":45}'

# 12. pedir preguntas trivia
curl http://localhost:3000/trivia

# 13. responder trivia
curl -X POST http://localhost:3000/trivia/answer -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"questionId":"<ID>","selectedAnswer":"X","timeTaken":4.2}'
```

---

## 12 — Tests / Seeds (sugerencia)
Crear un script `scripts/seed.js` o endpoint admin para poblar:
- 10-20 preguntas de trivia
- 20-30 memotest cards
- 5 usuarios de prueba con puntajes variados

---

## 13 — Deploy (Vercel)
- Subir repo a GitHub.
- Crear proyecto en Vercel y vincular repo.
- Establecer Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`.
- Considerar que WebSockets en Vercel tienen limitaciones; si necesitás WebSockets persistentes puede ser mejor un proveedor con soporte full WebSocket (Heroku, Railway, Render, Fly, DigitalOcean App Platform, etc.) o usar un servidor dedicado y Vercel solo para funciones.

---

## 14 — Siguientes pasos sugeridos
- Añadir DTOs con `class-validator`.
- Añadir logs y manejo de errores centralizado.
- Implementar seed + scripts de prueba.
- Preparar tests unitarios y de integración para Auth y ScoreService.
- Integrar AssetBundle en Unity para memotest.

---

## Contacto / notas
Si querés, te puedo generar:
- `env.example`
- `scripts/seed.js` con datos de prueba
- DTOs y controladores completos listos para copiar/pegar
- Ejemplos de cliente Unity (C#) para WebSocket y descarga/cache de imágenes

---

Fin del README.
