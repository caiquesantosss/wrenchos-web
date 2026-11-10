import { apiFetch } from "../../../lib/api";

export interface ClienteOS {
  id_cliente: number;
  nome: string;
  documento: string;
  telefone: string;
  email: string;
}

export interface AtivoOS {
  id_ativo: number;
  descricao: string;
  tipo: string;
  marca: string;
  modelo: string;
  identificacao: string;
}

export interface UsuarioOS {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: string;
}

export interface CatalogoItemOS {
  id_catalogo_item: number;
  descricao: string;
  tipo_item: string;
  unidade: string;
  valor_unitario: string;
}

export interface ItemOS {
  id_item_os: number;
  id_catalogo_item: number;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  status_aprovacao: string | null;
  baixa_estoque: boolean;
  data_cadastro: string;
  catalogo_item: CatalogoItemOS;
}

export interface OrdemServicoDTO {
  id_ordem_servico: number;
  id_cliente: number;
  id_ativo: number;
  id_usuario: number;

  status: string;
  descricao_problema: string;
  diagnostico: string | null;
  solucao_aplicada: string | null;

  valor_mao_obra: string;
  valor_pecas: string;
  valor_total: string;

  data_abertura: string;
  data_previsao: string | null;
  data_conclusao: string | null;
  data_atualizacao: string;

  cliente: ClienteOS;
  ativo: AtivoOS;
  usuario: UsuarioOS;
  itens_os: ItemOS[];
}

export interface DiagnosticDTO {
  diagnostico: string
}

export interface CreateOrdemServicoDTO {
  id_cliente: number
  id_ativo: number
  descricao_problema: string
}

export interface AddItemOsDTO {
    id_catalogo_item: number
    quantidade: number
}

export interface FinishExecutionDTO {
  appliedSolution: string
}

export type AddItemsOsDTO = AddItemOsDTO[]

export interface AddOrcamentoDTO {
    valor_mao_obra: number
}

export async function createOrder(data: CreateOrdemServicoDTO): Promise<OrdemServicoDTO> {
  return apiFetch<OrdemServicoDTO>('/ordens-servico', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function addDiagnostic(data: DiagnosticDTO, id_ordem: number): Promise<OrdemServicoDTO> {
  return apiFetch<OrdemServicoDTO>(`/ordens-servico/${id_ordem}/diagnostico`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function getOrderById(
  id_ordem_servico: number,
): Promise<OrdemServicoDTO> {
  return apiFetch<OrdemServicoDTO>(
    `/ordens-servico/${id_ordem_servico}`,
    {
      method: "GET",
    },
  )
}

export async function getAllOrders(): Promise<OrdemServicoDTO[]> {
  return apiFetch<OrdemServicoDTO[]>('/ordens-servico/listar-os', {
    method: 'GET',
  })
}

export async function addItemsToOrder(
  orderId: number,
  items: AddItemsOsDTO,
): Promise<OrdemServicoDTO> {
  return apiFetch<OrdemServicoDTO>(
    `/ordens-servico/${orderId}/itens`,
    {
      method: 'POST',
      body: JSON.stringify(items),
    },
  )
}

export async function defineOrcamento(
  orderId: number,
  data: AddOrcamentoDTO
): Promise<OrdemServicoDTO> {
  return apiFetch<OrdemServicoDTO>(
    `/ordens-servico/${orderId}/orcamento`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  )
}

export async function StartExecution(
  orderId: number, 
): Promise<OrdemServicoDTO> {
  return apiFetch<OrdemServicoDTO>(
    `/ordens-servico/${orderId}/iniciar-execucao`, 
    {
      method: 'PATCH'
    }
  )
}

export async function finishExecution(
  orderId: number,
  data: FinishExecutionDTO
): Promise<OrdemServicoDTO> {
  return apiFetch<OrdemServicoDTO>(
    `/ordens-servico/${orderId}/concluir`,
    {
      method: 'POST', 
      body: JSON.stringify(data)
    }
  )
}