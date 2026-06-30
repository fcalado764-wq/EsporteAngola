# Bot de Gestao de Equipa de Andebol

Dashboard e API para clubes, escolas e treinadores acompanharem atletas, treinos, assiduidade, estatisticas e relatorios de desempenho com apoio de IA via Groq.

## Stack

- Backend: Node.js + Express
- Base de dados: Supabase/PostgreSQL
- Frontend: HTML, CSS e JavaScript
- IA: Groq API
- Relatorios: PDFKit

## Como correr localmente

```bash
npm install
cp .env.example .env
npm run dev
```

Depois abre:

```text
http://localhost:3000
```

Sem variaveis Supabase/Groq configuradas, a aplicacao usa dados mockados para demonstracao.

## Funcionalidades incluidas

- Dashboard com indicadores da equipa.
- Registo e listagem de atletas.
- Planeamento e historico de treinos.
- Estatisticas de golos, assistencias, assiduidade e risco fisico.
- Estatisticas de jogo: golos, assistencias, remates, remates a baliza, defesas e perdas de bola.
- Chat do treinador com IA, preparado para Groq.
- Chat IA Groq no dashboard do treinador e do diretor desportivo.
- Validacao de treino realizado e marcacao de presencas por atleta.
- Conta de treinador em modo demo, preparada para Supabase Auth.
- Painel de administrador/diretor desportivo para criar equipas.
- Endpoint para gerar relatorio PDF.
- Schema SQL inicial para Supabase em `database/schema.sql`.

## Endpoints principais

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/athletes`
- `POST /api/athletes`
- `GET /api/trainings`
- `POST /api/trainings`
- `GET /api/trainings/:id/attendance`
- `POST /api/trainings/:id/complete`
- `GET /api/stats`
- `GET /api/match-stats`
- `POST /api/match-stats`
- `GET /api/match-stats/summary`
- `POST /api/ai/chat`
- `GET /api/teams`
- `POST /api/teams`
- `GET /api/coaches`
- `POST /api/auth/register-trainer`
- `POST /api/reports/performance`

## Proximos passos sugeridos

1. Criar projeto no Supabase.
2. Executar `database/schema.sql`.
3. Se a base ja existia antes das estatisticas de jogo, executar `database/add_match_stats_columns.sql`.
4. Se existirem equipas duplicadas, executar `database/fix_duplicate_teams.sql` uma unica vez.
5. Colocar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env`.
6. Criar chave Groq e preencher `GROQ_API_KEY`.
7. Publicar o repositorio no GitHub.
