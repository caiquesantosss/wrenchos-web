import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { login } from "../../features/auth/api/login"
import workshopImg from "../../assets/workshop.jpg" // Imagem importada dos assets
import { 
  Mail, Lock, Eye, EyeOff, Wrench, 
  CheckCircle2, ArrowRight, Info 
} from "lucide-react"

import styles from "./login.module.css"

export const Route = createFileRoute("/usuario/login")({
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.string().email("Introduza um e-mail válido."),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
})

type LoginFormInputs = z.infer<typeof loginSchema>

function LoginPage() {
  const navigate = useNavigate()
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/" })
    },
  })

  const onSubmit = (data: LoginFormInputs) => {
    loginMutation.mutate(data)
  }

  return (
    <div className={styles.container}>
      
      <div className={styles.leftColumn}>
        
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <Wrench size={18} strokeWidth={2.5} />
          </div>
          <div className={styles.logoTextWrapper}>
            <span className={styles.logoTitle}>WrenchOS</span>
            <span className={styles.logoSubtitle}>Gestão de Manutenção</span>
          </div>
        </div>

        <div className={styles.formContainer}>
          <h1 className={styles.title}>Bem-vindo de volta</h1>
          <p className={styles.subtitle}>
            Acesse sua operação, acompanhe os serviços e mantenha tudo em ordem.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>E-mail</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={18} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  {...register("email")}
                />
              </div>
              {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Senha</label>
                <Link to="/" className={styles.forgotPassword}>Esqueci minha senha</Link>
              </div>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={18} />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Digite sua senha"
                  className={`${styles.input} ${errors.senha ? styles.inputError : ""}`}
                  {...register("senha")}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className={styles.eyeButton}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.senha && <span className={styles.errorText}>{errors.senha.message}</span>}
            </div>

            <div className={styles.checkboxGroup}>
              <input type="checkbox" id="lembrar" className={styles.checkbox} />
              <label htmlFor="lembrar" className={styles.checkboxLabel}>Lembrar de mim</label>
            </div>

            {loginMutation.isError && (
              <div className={styles.apiError}>
                {loginMutation.error.message}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={styles.submitButton}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar na conta"} 
              {!loginMutation.isPending && <ArrowRight size={18} />}
            </button>
          </form>

          <div className={styles.signupPrompt}>
            Ainda não tem conta? <Link to="/" className={styles.signupLink}>Criar cadastro</Link>
          </div>
        </div>

        <div className={styles.footer}>
          <Info size={14} /> Ambiente demonstrativo - Sem autenticação real
        </div>
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.imageCard}>
          <img src={workshopImg} alt="Oficina" className={styles.image} />
          
          <div className={styles.imageOverlay} />
          
          <div className={styles.imageContent}>
            <div className={styles.badge}>
              <span className={styles.pulseDot} />
              Operação em tempo real
            </div>
            
            <h2 className={styles.imageTitle}>
              Cada ordem de serviço sob controle.
            </h2>
            <p className={styles.imageSubtitle}>
              Acompanhe a operação, aprove orçamentos e mantenha os prazos em dia.
            </p>

            <ul className={styles.features}>
              <li>
                <CheckCircle2 className={styles.checkIcon} size={18} />
                Ordens de serviço do orçamento ao encerramento
              </li>
              <li>
                <CheckCircle2 className={styles.checkIcon} size={18} />
                Clientes, equipamentos e estoque integrados
              </li>
              <li>
                <CheckCircle2 className={styles.checkIcon} size={18} />
                Financeiro e histórico em um só painel
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  )
}