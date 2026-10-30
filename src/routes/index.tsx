import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard WrenchOS</h1>
      <p className="mt-2 text-gray-600">Bem-vindo ao sistema de gestão.</p>
    </div>
  )
}