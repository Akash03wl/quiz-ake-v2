# FASE 0 — Análise do Projeto Quiz AKE v2

Data: 2026-08-31
Repositório: `quiz-ake-v2` (Cloudflare Pages + Functions + D1 + Workers AI)

## 1. Stack existente
- **Frontend**: SPA vanilla JS (`index.html` 561 linhas, `js/script.js` ~2500 linhas, `js/data.js` banco estático, `js/api.js` cliente API). Sem bundler/framework. CSS puro com design system (dark/light/system).
- **Backend**: Cloudflare Pages Functions catch-all `functions/api/[[path]].js` 993 linhas. Router declarativo, helpers em `functions/lib/` (db, auth, validacao, respostas, ratelimit, ai).
- **Banco**: Cloudflare D1 (SQLite). Migrations em `migrations/` (0001_init.sql, 0002_seed.sql). Helper D1 `functions/lib/db.js` com prepared statements.
- **IA**: `functions/lib/ai.js` com Workers AI (`AI` binding) + fallback OpenAI-compatível + banco local offline. Modelo padrão `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- **Infra**: `wrangler.toml` compat `2024-11-01` nodejs_compat, D1 binding `DB`, vars `ENVIRONMENT/AI_MODEL/SITE_URL`. Deploy via `wrangler pages deploy`.
- **Testes**: `test/backend.test.js` (6 testes) + `test/smoke.js` (integração com D1 em memória via `node:sqlite` DatabaseSync). Helpers em `test/helpers/d1.cjs`.
- **Segurança**: `/_headers` com CSP, HSTS, X-Frame-Options; `functions/lib/respostas.js` duplica headers de segurança.

## 2. Arquivos e configurações
```
package.json: type module, scripts dev/deploy/db:migrate/test, dep wrangler ^4.120.0
wrangler.toml: name quiz-ake-v2, pages_build_output_dir ., d1 database_id b9df1729..., vars ENVIRONMENT/AI_MODEL/SITE_URL
.dev.vars.example, _headers, favicon.svg, robots.txt, sitemap.xml
functions/lib/*.js (5 libs), functions/api/[[path]].js, migrations/*.sql
js/*.js (3), css/style.css (2501 linhas), index.html
test/*.js + helpers
.gitignore, AGENTS.md (regras commit/push)
```
`js/data.js:401` contém 71 perguntas estáticas; `migrations/0002_seed.sql:10` replica metadados de quizzes.

## 3. Dependências
- Única dep: `wrangler@4.120.0`. Sem libs frontend. Backend usa WebCrypto (PBKDF2), fetch, D1.

## 4. Conflitos e riscos identificados
- **Smoke falhando (5 falhas)** antes do patch: `desafioDia` usava `isoHoje()` (local BRT) vs `criado_em` ISO UTC → mismatch `date()` → 0 jogadores. Corrigido para `new Date().toISOString().slice(0,10)` + `substr(criado_em,1,10)`.
- **Gabarito exposto**: `functions/api/[[path]].js:404` retorna `correta` no detalhe de quiz. Para simulados, será necessário ocultar gabarito até finalização (regra #17).
- **Quizzes oficiais sem persistência de perguntas**: perguntas no `js/data.js`, não em D1. Simulados exigirão persistência real (regra #10, #25).
- **Salas existentes**: `salas`/`sala_jogadores` são multiplayer casual (polling REST), sem estados de simulado (DRAFT etc) e sem proteção de tentativa única.
- **Sem RBAC granular**: `auth.js:127` só distingue `admin` vs `usuario`; spec exige `ADMIN/USER` com verificação backend em `/admin`.
- **Sem scoring central**: pontos hardcoded em `js/script.js:16` (PONTOS_CERTA=10). Spec exige `SCORING_CORRECT/SCORING_SPEED_MAX` centralizados.
- **Sem migrations para simulados**: faltam subjects, rooms com 6 estados, attempts, answers, ai_generations, admin_logs.

## 5. Arquitetura proposta (compatível com Cloudflare atual)
```
Frontend (Pages) → Cloudflare Pages (static)
Backend/API      → Pages Functions (Workers runtime) em /api/*
Database         → Cloudflare D1 (SQLite)
IA              → Workers AI (binding AI) + OpenRouter/Gemini fallback + mock local
Auth            → PBKDF2 + sessões em D1 + cookie HttpOnly Secure SameSite=Lax
```
Manter Pages Functions (não migrar para Workers isolado) para preservar compatibilidade. Estrutura modular:
```
functions/lib/config.js          # SCORING, LIMITES, STATUS (central)
functions/lib/scoring.js         # pontosDaQuestao, calcularResultado, ordenarRanking
functions/lib/simulados/validation.js # validarSimulado/Questao
functions/lib/simulados/ai-service.js # AIService com providers trocáveis
migrations/0003_simulados.sql    # novas entidades
docs/FASE-*.md
```
Frontend continuará SPA, mas novas telas de simulado usarão `js/api.js` expandido. Gabarito nunca vai para `localStorage`/HTML antes de `finalizada`.

## 6. Modelo inicial do banco (0003)
- `materias(id, nome, slug, descricao, cor, emoji)`
- `simulados(id, titulo, descricao, materia_id, assuntos JSON, quantidade, dificuldade, tempo_por_questao, status CHECK 6 estados, codigo UNIQUE, criador_id, publicado_em)`
- `simulado_questoes(id, simulado_id FK CASCADE, enunciado, explicacao, dificuldade, assunto, ordem, correta_idx, validada)`
- `questao_alternativas(id, questao_id FK CASCADE, texto, ordem)`
- `tentativas(id, usuario_id FK, simulado_id FK, iniciado_em, finalizado_em, acertos, erros, total, pontuacao, tempo_total, status, UNIQUE(usuario_id, simulado_id))`
- `tentativa_respostas(id, tentativa_id FK, questao_id FK, alternativa_idx, correta, tempo_gasto, UNIQUE(tentativa, questao))`
- `ai_generations(id, simulado_id, usuario_id, provedor, modelo, prompt, resposta_raw, status, tentativas)`
- `admin_logs(id, usuario_id, acao, alvo_tipo, alvo_id, detalhes JSON)`

## 7. Modelo de autenticação
- Cadastro: nick (2-40), email único, senha 8-72 chars, hash PBKDF2 100k SHA-256 `pbkdf2$salt$hash`.
- Login gera token 32 bytes hex, D1 `sessoes(token, usuario_id, expira 30d)`, cookie `qake_sessao` HttpOnly Secure Lax.
- RBAC: `papel IN (usuario,moderador,admin)`, `auth.exigirAdmin()` verifica no backend, nunca só frontend `/admin`.
- Recuperação: token 32 bytes, expira 30min, só exposto em `http://` dev local, nunca em `https`.

## 8. Arquitetura da integração com IA
```
AIService
 ├─ WorkersAIProvider  (env.AI.run)
 ├─ OpenRouterProvider (fetch https://openrouter.ai/api/v1, model gemini)
 └─ MockLocalProvider  (banco offline garantido)
```
Prompt robusto (`montarPromptIA`) com matéria, assuntos, dificuldade, quantidade, idioma, regras 9+10. Fluxo: `generateQuestions() → validateQuestions() → regenerateQuestion()` com limite 3 tentativas, sem loops infinitos.

## 9. Arquitetura da API (novas rotas previstas)
```
POST /api/simulados              # criar (admin)
GET  /api/simulados              # listar (filtro status)
GET  /api/simulados/:id          # detalhe (sem gabarito se não finalizado)
PATCH/DELETE /api/simulados/:id  # admin
POST /api/simulados/:id/gerar    # IA gera questões (admin)
POST /api/simulados/:id/publicar # DRAFT→REVIEW→PUBLISHED→ACTIVE
POST /api/simulados/:id/iniciar  # cria tentativa (1 por user)
POST /api/simulados/:id/responder
POST /api/simulados/:id/finalizar # servidor calcula pontuação/ranking
GET  /api/simulados/:id/ranking
GET  /api/me/historico, /api/me/estatisticas
GET  /api/admin/dashboard, /api/admin/logs
```

## 10. Estrutura de pastas planejada
```
quiz-ake-v2/
 ├─ functions/
 │   ├─ api/[[path]].js
 │   └─ lib/
 │       ├─ config.js, scoring.js, auth.js, db.js, validacao.js, ai.js
 │       └─ simulados/{validation.js, ai-service.js, scoring.js}
 ├─ migrations/0003_simulados.sql
 ├─ js/api.js, js/script.js, js/data.js
 ├─ css/style.css, index.html
 ├─ docs/FASE-0-ANALISE.md
 ├─ .env.example, .dev.vars.example, wrangler.toml
 └─ test/
```

## 11. Plano de execução (fases)
Fase 1 Fundação → Fase 2 Auth → Fase 3 Banco → Fase 4 Simulados → Fase 5 IA → Fase 6 Execução → Fase 7 Pontuação → Fase 8 Histórico → Fase 9 Segurança → Fase 10 UI/UX → Fase 11 Testes → Fase 12 Deploy.
Cada fase: implementar → testar (`npm test` + smoke) → corrigir → documentar checkpoint → só então avançar.

## 12. Decisão técnica (autonomia)
- Manter vanilla JS + Pages Functions para simplicidade, custo baixo e compatibilidade D1.
- Centralizar scoring/config para evitar valores espalhados.
- Novos estados de simulado em CHECK constraint, não enum separado, para D1 leve.
- Mock IA local garante offline-first e economia de API.
