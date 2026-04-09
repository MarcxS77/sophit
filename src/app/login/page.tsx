'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from 'lucide-react'
import { SophitLogo } from '@/components/SophitLogo'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    if (error) { setError('E-mail ou senha incorretos.'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{background:'linear-gradient(160deg,#1a0a00,#3b1200,#7c2d12)'}}>
        <div className="flex items-center gap-3">
          <SophitLogo size={48} />
          <span className="font-bold text-2xl tracking-widest text-white">SOPHIT</span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Treine com<br />inteligência.<br />Evolua com<br />dados.
          </h1>
          <p className="text-orange-200 text-lg leading-relaxed">
            A plataforma completa para acompanhar anamneses, avaliações físicas e treinos dos seus alunos.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: '🔥', frase: 'Cada treino registrado é um passo a mais na evolução do seu aluno.' },
            { icon: '📊', frase: 'Dados reais, resultados reais. Acompanhe cada detalhe da jornada.' },
            { icon: '🏆', frase: 'O bom profissional não adivinha — ele mede, analisa e prescreve.' },
          ].map(s => (
            <div key={s.frase} className="flex items-start gap-3 rounded-xl p-4" style={{background:'rgba(255,255,255,0.07)'}}>
              <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
              <p className="text-orange-100 text-sm leading-relaxed">{s.frase}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <SophitLogo size={40} />
            <span className="font-bold text-xl tracking-widest" style={{background:'linear-gradient(135deg,#f97316,#c2410c)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>SOPHIT</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Bem-vindo de volta</h2>
          <p className="text-muted-foreground mb-8">Entre na sua conta para continuar</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-6 text-sm" style={{background:'hsl(var(--destructive)/0.1)',color:'hsl(var(--destructive))'}}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}

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
              <div className="w-full border-t" style={{borderColor:'hsl(var(--border))'}} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2" style={{background:'hsl(var(--background))',color:'hsl(var(--muted-foreground))'}}>ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{color:'hsl(var(--muted-foreground))'}} />
                <input {...register('email')} type="email" placeholder="seu@email.com" className="input-base pl-10" />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label !mb-0">Senha</label>
                <Link href="/forgot-password" className="text-xs" style={{color:'#ea580c'}}>Esqueceu a senha?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{color:'hsl(var(--muted-foreground))'}} />
                <input {...register('password')} type={showPassword?'text':'password'} placeholder="••••••••" className="input-base pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'hsl(var(--muted-foreground))'}}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem uma conta?{' '}
            <Link href="/register" className="font-medium" style={{color:'#ea580c'}}>Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
