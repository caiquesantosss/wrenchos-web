import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_ordem_servico/nova/")({
  component: NovaOrdemServico,
})

function NovaOrdemServico() {
  return (
    <div>
      <h1>Nova Ordem de Serviço</h1>
      <p>Cadastro de uma nova ordem de serviço.</p>
    </div>
  )
}