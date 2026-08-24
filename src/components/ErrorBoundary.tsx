import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render-time crashes so one broken section doesn't blank the whole
 * app. Without this, a malformed upstream payload anywhere in the tree takes
 * the user to a white screen with no way back.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro não tratado na interface:", error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sport-red/10">
            <AlertTriangle className="h-8 w-8 text-sport-red" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-text-primary">
            Algo deu errado nesta seção
          </h2>
          <p className="mb-4 text-sm text-text-secondary">
            {error.message || "Erro inesperado ao renderizar a página."}
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => {
                window.location.href = "/"
              }}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    )
  }
}
