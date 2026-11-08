import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_ordem_servico/ordemServico')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/ordem_servico"!</div>
}
