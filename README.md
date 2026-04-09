# VitalSync — SaaS de Saúde, Anamnese e Performance

MVP completo de plataforma SaaS para profissionais de saúde e fitness.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Estilização | Tailwind CSS + CSS Variables |
| Ícones | Lucide React |
| Backend / Auth / DB | Supabase |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |

---

## Configuração do Projeto

### 1. Clonar e instalar dependências

```bash
git clone <repo>
cd saas-saude
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Copie as variáveis de ambiente:

```bash
cp .env.local.example .env.local
```

Preencha no `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Executar migrations no Supabase

No painel do Supabase → **SQL Editor**, cole e execute o conteúdo de:

```
supabase/migrations/001_initial_schema.sql
```

Isso irá criar:
- Todas as tabelas (`profiles`, `anamneses`, `avaliacoes_fisicas`, `treinos`)
- Triggers automáticos
- Políticas de Row Level Security (RLS)
- Bucket de storage para avatares

### 4. Configurar Google OAuth (opcional)

No painel Supabase → **Authentication → Providers → Google**:
1. Ative o provider Google
2. Crie credenciais OAuth no [Google Cloud Console](https://console.cloud.google.com)
3. Adicione `https://seu-projeto.supabase.co/auth/v1/callback` como Redirect URI

### 5. Criar usuário admin

Após criar um usuário via cadastro normal, execute no SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'seu-email-admin@exemplo.com';
```

### 6. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Arquitetura de Rotas

```
/                           → Redirect para /dashboard ou /login
/login                      → Autenticação (Email/Senha + Google OAuth)
/register                   → Cadastro de novos usuários
/onboarding                 → Primeiro acesso: definir nome de perfil
/auth/callback              → Callback OAuth

/dashboard                  → Home do usuário (stats + treinos + feedbacks)
/dashboard/anamnese         → Histórico de anamneses
/dashboard/anamnese/nova    → Formulário multi-step de anamnese
/dashboard/treinos          → Treinos atribuídos pelo admin
/dashboard/perfil           → Perfil do usuário

/admin                      → Dashboard admin (somente role: admin)
/admin/anamneses            → Inbox estilo Gmail de anamneses
/admin/anamneses/[id]       → Detalhes + formulário de feedback
/admin/usuarios             → Lista de todos os alunos
/admin/usuarios/[id]        → Perfil do aluno + gráficos + avaliação física
/admin/treinos              → Gestor: criar e atribuir treinos
/admin/avaliacoes           → Histórico de avaliações físicas
```

---

## Segurança (RLS)

| Tabela | User | Admin |
|--------|------|-------|
| `profiles` | Lê/edita apenas o próprio | Lê/edita todos |
| `anamneses` | Cria e lê as próprias | CRUD completo |
| `avaliacoes_fisicas` | **Sem acesso** | CRUD completo |
| `treinos` | Lê os próprios | CRUD completo |

---

## Funcionalidades Implementadas

### Usuário
- [x] Login com Google OAuth e Email/Senha
- [x] Onboarding (definição do nome no primeiro acesso)
- [x] Dashboard com resumo de treinos e feedbacks
- [x] Formulário de anamnese multi-step (4 etapas) com validação Zod
- [x] Histórico de anamneses com feedbacks do profissional
- [x] Visualização de treinos ativos com exercícios detalhados
- [x] Dark mode com persistência via localStorage

### Administrador
- [x] Dashboard com métricas gerais
- [x] Inbox de anamneses estilo Gmail (pendentes/respondidas)
- [x] Detalhamento de anamnese + envio/edição de feedback
- [x] Lista de alunos com busca
- [x] Perfil individual do aluno com:
  - Métricas da última avaliação
  - Gráficos de evolução de peso e composição corporal (Recharts)
  - Formulário de avaliação física com cálculo automático de IMC
- [x] Gestor de treinos com exercícios dinâmicos (adicionar/remover)
- [x] Proteção de rotas via middleware Next.js

---

## Estrutura de Arquivos

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Estilos globais + dark mode
│   ├── login/page.tsx          # Página de login
│   ├── onboarding/page.tsx     # Onboarding first-time
│   ├── auth/callback/route.ts  # OAuth callback
│   ├── dashboard/
│   │   ├── layout.tsx          # Layout com sidebar
│   │   ├── page.tsx            # Home do usuário
│   │   ├── anamnese/
│   │   │   ├── page.tsx        # Histórico
│   │   │   └── nova/page.tsx   # Formulário multi-step
│   │   └── treinos/page.tsx    # Treinos do usuário
│   └── admin/
│       ├── layout.tsx          # Layout admin (proteção de role)
│       ├── page.tsx            # Dashboard admin
│       ├── anamneses/
│       │   ├── page.tsx        # Inbox
│       │   └── [id]/page.tsx   # Detalhe + feedback
│       ├── usuarios/
│       │   ├── page.tsx        # Lista de alunos
│       │   └── [id]/page.tsx   # Perfil + gráficos + avaliação
│       ├── treinos/page.tsx    # Gestor de treinos
│       └── avaliacoes/page.tsx # Lista de avaliações
├── components/
│   ├── dashboard/
│   │   ├── Sidebar.tsx         # Navegação lateral colapsável
│   │   └── Header.tsx          # Header com dark mode + user menu
│   └── admin/
│       ├── FeedbackForm.tsx    # Formulário de feedback client-side
│       ├── AvaliacaoForm.tsx   # Formulário de avaliação física
│       └── EvolutionCharts.tsx # Gráficos Recharts
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Supabase Browser Client
│   │   └── server.ts           # Supabase Server Client
│   ├── validations.ts          # Schemas Zod
│   └── utils.ts                # cn() helper
├── middleware.ts               # Proteção de rotas + onboarding check
└── types/index.ts              # TypeScript types
```
