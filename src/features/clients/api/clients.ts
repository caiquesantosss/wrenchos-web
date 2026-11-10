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
  telefone: string
  email: string
  endereco: string
}

export async function createCliente(
  data: CreateClienteDTO
): Promise<ClienteDTO> {
  return apiFetch<ClienteDTO>(
    "/clientes",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  )
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

export async function updateCliente(
  id: number,
  data: UpdateClienteDTO
): Promise<ClienteDTO> {
  return apiFetch<ClienteDTO>(
    `/clientes/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  )
}

export async function deactivateCliente(
  id: number
): Promise<ClienteDTO> {
  return apiFetch<ClienteDTO>(
    `/clientes/${id}/status`,
    {
      method: "PATCH",
    }
  )
}