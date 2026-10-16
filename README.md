# AlocaSalas 1.34 | Ars Technia

> **Sistema Inteligente de Alocação Explicável de Espaços e Gestão de Conflitos**
> Projeto desenvolvido para a Unidade 1.34.

Aplicação web responsiva (mobile + desktop) para centralizar salas e reservas, impedir conflitos e duplicidades, dar visibilidade à ocupação e **recomendar a melhor sala com justificativa**. A justificativa pode ser gerada pela IA do Google (**Gemini**).

---

## Funcionalidades

| Área | O que faz |
| --- | --- |
| **Acesso** | Criar conta (perfil Professor) e login. Perfis **Professor** e **Gestão** (JWT). |
| **Início** | Situação de cada sala *agora* (Aberta, Reservada, Fechada, Em manutenção), resumo da semana, próximas reservas e avisos de manutenção. |
| **Salas** | Busca por nome/recursos, filtros de assentos, porte (poucos/médios/muitos), tipo, computadores, projetor, ar-condicionado, acessibilidade e **disponibilidade em um horário**. |
| **Detalhes do local** | Recursos, capacidade, agenda semanal, comunicação/aviso, **histórico de utilização** (gráfico de 12 semanas) e taxa de ocupação de 30 dias. |
| **Agendamento** | O professor escolhe a turma (cadastrada com nº de alunos). Só aparecem **salas compatíveis**. Validação de conflito em tempo real, presets de período (manhã, tarde, noite, integral SEDUC) e repetição semanal para planejar o semestre. |
| **Recomendação inteligente** | Ranking das salas livres com % de compatibilidade, nota por critério, motivos e lista de salas descartadas com o motivo. Justificativa em texto pelo Gemini. |
| **Assistente Gemini** | "Laboratório para 28 alunos terça à noite" → preenche o formulário automaticamente. |
| **Solicitações** | O professor solicita; a gestão aprova ou recusa (com motivo). Na análise, o sistema revalida conflitos e sugere salas alternativas. |
| **Reservas** | Lista (próximas, histórico e status) e **mapa de ocupação diário** (salas × horário, com conflitos destacados). |
| **Cadastro de salas** (gestão) | Capacidade, recursos, acessibilidade, foto, situação (ativa, manutenção, desativada) com aviso, e **ambientes divisíveis** (ex.: Sala Cyber com 2 ambientes, Sala de Reunião desmembrável). |
| **Histórico** (gestão) | Crescimento semanal de uso, ocupação por sala, salas subutilizadas, horários de pico, uso por dia da semana, tipos de agendamento e **registro de alterações** (auditoria). |

## Regras de negócio

- **Funcionamento:** segunda a sexta, 07:45–22:30; sábado, 09:00–18:00; fechado aos domingos.
- **Períodos:** Manhã 07:45–12:00 · Tarde 13:00–17:30 · Noite 18:00–22:30 · Integral SEDUC 08:00–17:00 (configuráveis em `server/src/schedule.ts`).
- **Trava anti-conflito:**
  - Não é permitido sobrepor reservas *aprovadas ou pendentes* na mesma sala.
  - Ambientes vinculados se bloqueiam mutuamente: reservar o ambiente inteiro bloqueia as divisões, e vice-versa.
  - A mesma turma não pode ter duas reservas no mesmo horário (duplicidade).
  - O professor é avisado quando ele mesmo já tem outra reserva no horário.
  - Também são validados: capacidade, sala em manutenção ou desativada (só a gestão agenda manutenção nela), horário passado e horário de funcionamento.
- **Fluxo:** reservas de professores ficam *pendentes* até a gestão aprovar. Reservas da gestão são aprovadas na hora. A aprovação revalida conflitos.

## Como a recomendação funciona (explicável)

1. **Restrições obrigatórias** descartam salas em manutenção, sem capacidade, sem computadores suficientes, sem projetor/TV, sem acessibilidade ou ocupadas. O motivo de cada descarte é mostrado.
2. **Pontuação (0–100)** das salas restantes:

| Critério | Peso | Lógica |
| --- | --- | --- |
| Capacidade | 45 | Nota máxima com ocupação ≥ 85%. Salas grandes demais perdem pontos (evita desperdício). |
| Recursos | 25 | Laboratórios recebem nota máxima quando a turma precisa de computadores. Turmas que não precisam são direcionadas a salas comuns, para preservar os laboratórios. |
| Equilíbrio de uso | 15 | Favorece salas pouco usadas na semana. |
| Continuidade | 10 | Favorece a sala em que o professor já tem aula antes ou depois. |
| Conforto | 5 | Ar-condicionado e acessibilidade. |

3. **Justificativa:** com `GEMINI_API_KEY` configurada, o Gemini recebe o ranking calculado e escreve a explicação (sem inventar dados). Sem chave, o sistema gera uma justificativa por regras.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + Recharts (pasta `web/`)
- **Backend:** Node.js + Express 5 + SQLite (better-sqlite3) + Zod + JWT (pasta `server/`)
- **IA:** Google Gemini via `@google/genai`

## Como rodar

Pré-requisito: **Node.js 20+**.

```bash
npm install
cp server/.env.example server/.env   # opcional: coloque sua GEMINI_API_KEY
npm run dev                           # API em :3001 e web em http://localhost:5173
```

Na primeira execução o banco é criado com **dados de demonstração** (17 salas, turmas e cerca de 12 semanas de histórico).

- `npm run seed`: recria o banco de demonstração.
- `npm test`: testes das regras de conflito e da recomendação.
- `npm run build && npm start`: build de produção. A API serve o frontend em http://localhost:3001.

### Usuários de demonstração (senha `senha123`)

| Perfil | E-mail |
| --- | --- |
| Gestão | samanta@alocasalas.com |
| Gestão | juscelino@alocasalas.com |
| Professor(a) | alexia@alocasalas.com, eduardo@alocasalas.com, patrick@alocasalas.com, jessica@alocasalas.com, marcos@alocasalas.com |

### Gemini (opcional)

Gere uma chave gratuita em https://aistudio.google.com/apikey e defina `GEMINI_API_KEY` em `server/.env`. Sem chave, tudo funciona; apenas a justificativa em texto e o assistente de linguagem natural ficam desativados.

---

## Persona

**Samanta Giulia**, Coordenadora Pedagógica. Precisa de uma ferramenta ágil e confiável para alocar turmas sem sobrepor horários, respeitando as exigências de infraestrutura dos docentes.

## Equipe Ars Technia

- **Product Owner (PO):** gestão de backlog, escopo do MVP e regras de negócio
- **UI/UX & Dev Team:** prototipagem e desenvolvimento
