import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número'),
})

export const onboardingSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
})

const regiaoDolorSchema = z.object({
  regiao: z.string().optional(),
  nota: z.number().min(0).max(10).optional(),
  dificuldade: z.string().optional(),
})

export const anamneseSchema = z.object({
  nome: z.string().min(2, 'Informe seu nome completo'),
  idade: z.string().min(1, 'Informe sua idade'),
  sexo: z.enum(['masculino', 'feminino', 'outro'], { required_error: 'Selecione o sexo' }),
  objetivos: z.array(z.string()).min(1, 'Selecione pelo menos um objetivo'),
  objetivos_outros: z.string().optional(),
  disponibilidade_dias: z.string().min(1, 'Informe os dias disponíveis'),
  disponibilidade_minutos: z.string().min(1, 'Informe os minutos por dia'),
  tipos_exercicio: z.array(z.string()).min(1, 'Selecione pelo menos um tipo'),
  tipos_exercicio_outros: z.string().optional(),
  nao_gosta: z.enum(['sim', 'nao']),
  nao_gosta_descricao: z.string().optional(),
  praticou_exercicio: z.enum(['sim', 'nao']),
  exercicio_tipo: z.string().optional(),
  exercicio_vezes_semana: z.string().optional(),
  exercicio_minutos_dia: z.string().optional(),
  exercicio_intensidade: z.enum(['leve', 'moderada', 'vigorosa']).optional(),
  tem_doenca: z.enum(['sim', 'nao']),
  doencas: z.string().optional(),
  medicamentos: z.string().optional(),
  fez_cirurgia: z.enum(['sim', 'nao']),
  cirurgia_regioes: z.string().optional(),
  tem_dor: z.enum(['sim', 'nao']),
  dor_regioes: z.array(regiaoDolorSchema).optional(),
  dor_peito_exercicio: z.enum(['sim', 'nao']),
  tontura_desmaio: z.enum(['sim', 'nao']),
  desconforto_atividades: z.enum(['sim', 'nao']),
  desconforto_descricao: z.string().optional(),
  historico_cardiaco_familiar: z.enum(['sim', 'nao']),
  teve_lesao: z.enum(['sim', 'nao']),
  lesao_descricao: z.string().optional(),
  tem_limitacao: z.enum(['sim', 'nao']),
  limitacao_descricao: z.string().optional(),
  informacoes_adicionais: z.string().optional(),
})

export const avaliacaoSchema = z.object({
  peso: z.number({ required_error: 'Peso é obrigatório' }).min(20).max(300),
  altura: z.number({ required_error: 'Altura é obrigatória' }).min(100).max(250),
  medidas: z.object({
    braco_d: z.number().optional(),
    braco_e: z.number().optional(),
    cintura: z.number().optional(),
    quadril: z.number().optional(),
    coxa_d: z.number().optional(),
    coxa_e: z.number().optional(),
    peitoral: z.number().optional(),
    panturrilha: z.number().optional(),
  }),
  dobras_cutaneas: z.object({
    tricipital: z.number().optional(),
    subescapular: z.number().optional(),
    suprailíaca: z.number().optional(),
    abdominal: z.number().optional(),
    coxa: z.number().optional(),
    peitoral: z.number().optional(),
  }),
  percentual_gordura: z.number().min(1).max(60).optional(),
  massa_magra: z.number().optional(),
})

export const exercicioSchema = z.object({
  nome: z.string().min(2, 'Nome do exercício é obrigatório'),
  series: z.number().min(1).max(20),
  reps: z.string().min(1, 'Informe as repetições'),
  carga: z.string().optional(),
  observacoes: z.string().optional(),
})

export const treinoSchema = z.object({
  user_id: z.string().uuid('Selecione um usuário'),
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  lista_exercicios: z.array(exercicioSchema).min(1, 'Adicione pelo menos 1 exercício'),
  data_atribuicao: z.string().min(1, 'Selecione a data'),
})

export const feedbackSchema = z.object({
  feedback_admin: z.string().min(10, 'Mínimo 10 caracteres').max(2000),
})

export type LoginFormData      = z.infer<typeof loginSchema>
export type RegisterFormData   = z.infer<typeof registerSchema>
export type OnboardingFormData = z.infer<typeof onboardingSchema>
export type AnamneseFormData   = z.infer<typeof anamneseSchema>
export type AvaliacaoFormData  = z.infer<typeof avaliacaoSchema>
export type TreinoFormData     = z.infer<typeof treinoSchema>
export type FeedbackFormData   = z.infer<typeof feedbackSchema>
