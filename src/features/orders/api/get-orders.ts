import { apiFetch } from '../../../lib/api'

export interface ClienteOS {
  id_cliente: number;
  nome: string;
  documento: string;
}

export interface AtivoOS {
  id_ativo: number;
  descricao: string;
  identificacao: string;
}

export interface OrdemServicoDTO {
  id_ordem_servico: number;
  status: string;
  descricao_problema: string;
  valor_total: string;
  data_abertura: string;
  cliente: ClienteOS;
  ativo: AtivoOS;
}

export async function getAllOrders(): Promise<OrdemServicoDTO[]> {
  return apiFetch<OrdemServicoDTO[]>('/ordens-servico/listar-os', {
    method: 'GET',
  })
}