import { createFileRoute } from "@tanstack/react-router"
import { SummaryCard } from "../../components/cards"
import { ClipboardList } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getAllOrders } from "../../features/orders/api/get-orders"

export const Route = createFileRoute("/_ordem_servico/ordemServico")({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ["orders", "todas"],
    queryFn: getAllOrders,
  })

  const ordersByStatus = allOrders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div>
      <SummaryCard
        title="Abertas"
        icon={<ClipboardList size={18} />}
        iconTheme="gray"
        value={ordersByStatus["ABERTAS"] ?? 0}
        isLoading={isLoading}
        footerText="Aguardando atendimento"
      />

      <SummaryCard
        title="Em execução"
        icon={<ClipboardList size={18} />}
        iconTheme="gray"
        value={ordersByStatus["EM_EXECUCAO"] ?? 0}
        isLoading={isLoading}
        footerText="Serviços em andamento"
      />

      <SummaryCard
        title="Aguardando aprovação"
        icon={<ClipboardList size={18} />}
        iconTheme="gray"
        value={ordersByStatus["AGUARDANDO_APROVACAO"] ?? 0}
        isLoading={isLoading}
        footerText="Aguardando autorização do cliente"
      />

      <SummaryCard
        title="Concluídas"
        icon={<ClipboardList size={18} />}
        iconTheme="gray"
        value={ordersByStatus["CONCLUIDAS"] ?? 0}
        isLoading={isLoading}
        footerText="Serviços finalizados"
      />
    </div>
  )
}