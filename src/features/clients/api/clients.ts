import { apiFetch } from "../../../lib/api"

export interface ClienteDTO {
  id_cliente: number
  nome: string
  documento: string
  telefone?: string
  email: string | null
  endereco: string | null
  ativo: boolean
  data_cadastro: string
}

export interface CreateClienteDTO {
  nome: string
  documento: string
  telefone?: string
  email?: string | null
  endereco?: string | null
}

export interface UpdateClienteDTO {
  nome: string
  documento: string
  telefone?: string
  email?: string | null
  endereco?: string | null
}

export const getAllClientes = async (): Promise<ClienteDTO[]> => {
  return apiFetch<ClienteDTO[]>("/clientes", {
    method: "GET",
  })
}

export const getClienteById = async (
  id: number,
): Promise<ClienteDTO> => {
  return apiFetch<ClienteDTO>(`/clientes/${id}`, {
    method: "GET",
  })
}