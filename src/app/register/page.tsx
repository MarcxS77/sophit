'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { SophitLogo } from '@/components/SophitLogo'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterFormData) {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Este e-mail já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <div className="inline-flex p-4 rounded-full bg-green-50 dark:bg-green-900/20 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Conta criada!</h2>
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg,#1a0a00,#3b1200,#7c2d12)' }}
      >
        <div className="flex items-center gap-3">
          <SophitLogo size={48} />
          <span className="font-bold text-2xl tracking-widest text-white">SOPHIT</span>
        </div>

        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Comece sua jornada<br />de evolução hoje.
          </h1>
          <p className="text-orange-200 text-lg leading-relaxed">
            Crie sua conta gratuitamente e tenha acesso ao acompanhamento personalizado de saúde e performance.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Avaliações', value: '2.4k+' },
            { label: 'Profissionais', value: '380+' },
            { label: 'Alunos ativos', value: '12k+' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <p className="text-white text-2xl font-bold">{s.value}</p>
              <p className="text-orange-200 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <SophitLogo size={40} />
            <span className="font-bold text-xl tracking-widest" style={{
              background: 'linear-gradient(135deg,#f97316,#c2410c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              SOPHIT
            </span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Criar conta</h2>
          <p className="text-muted-foreground mb-8">Preencha os dados para começar</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-6 text-sm"
              style={{ background: 'hsl(var(--destructive)/0.1)', color: 'hsl(var(--destructive))' }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogleLogin} disabled={googleLoading} className="btn-secondary w-full mb-4">
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continuar com Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'hsl(var(--border))' }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))' }}>ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input {...register('full_name')} placeholder="Seu nome completo" className="input-base pl-10" />
              </div>
              {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="form-label">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input {...register('email')} type="email" placeholder="seu@email.com" className="input-base pl-10" />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="input-base pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Mínimo 8 caracteres, uma letra maiúscula e um número
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar conta
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium" style={{ color: '#ea580c' }}>
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
