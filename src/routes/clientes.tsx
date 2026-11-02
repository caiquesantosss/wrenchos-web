import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clientes')({
  component: RouteComponent,
})

export default function RouteComponent() {
  return <div>Hello "/clientes"!</div>
}
