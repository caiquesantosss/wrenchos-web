
import { apiFetch } from "../../../lib/api"

export interface AtivoDTO {
  id_ativo: number
  id_cliente: number
  descricao: string
  tipo: string
  marca: string | null
  modelo: string | null
  identificacao: string | null
  observacoes: string | null
  ativo: boolean
  data_cadastro: string
}

export interface AtivoWithClientDTO {
  id_ativo: number
  id_cliente: number
  descricao: string
  tipo: string
  marca: string | null
  modelo: string | null
  identificacao: string | null
  observacoes: string | null
  ativo: boolean
  data_cadastro: Date
  cliente: {
    id_cliente: number
    nome: string
    documento: string
  }
}

export interface CreateAtivoDTO {
  id_cliente: number
  descricao: string
  tipo: string
  marca?: string | null
  modelo?: string | null
  identificacao?: string | null
  observacoes?: string | null
}

export interface UpdateAtivoDTO {
  descricao: string
  tipo: string
  marca?: string | null
  modelo?: string | null
  identificacao?: string | null
  observacoes?: string | null
}

export const getAllAtivos = async (): Promise<AtivoDTO[]> => {
  return apiFetch<AtivoDTO[]>("/ativos", {
    method: "GET",
  })
}

export const getAllAtivosWithClient = async (): Promise<AtivoWithClientDTO[]> => {
  return apiFetch<AtivoWithClientDTO[]>("/ativos/com-clientes", {
    method: "GET"
  })
}

export const getAtivoById = async (
  id: number,
): Promise<AtivoDTO> => {
  return apiFetch<AtivoDTO>(`/ativos/${id}`, {
    method: "GET",
  })
}

export const getAtivosByCliente = async (
  idCliente: number,
): Promise<AtivoDTO[]> => {
  return apiFetch<AtivoDTO[]>(`/clientes/${idCliente}/ativos`, {
    method: "GET",
  })
}

export const createAtivo = async (
  data: CreateAtivoDTO,
): Promise<AtivoDTO> => {
  return apiFetch<AtivoDTO>("/ativos", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const updateAtivo = async (
  id: number,
  data: UpdateAtivoDTO,
): Promise<AtivoDTO> => {
  return apiFetch<AtivoDTO>(`/ativos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const toggleAtivoStatus = async (
  id: number,
): Promise<AtivoDTO> => {
  return apiFetch<AtivoDTO>(`/ativos/${id}/status`, {
    method: "PATCH",
  })
}
