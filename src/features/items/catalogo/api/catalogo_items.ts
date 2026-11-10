import { apiFetch } from '../../../../lib/api'

export interface CatalogoItemDTO {
  id_catalogo_item: number;
  descricao: string;
  tipo_item: 'PRODUTO' | 'SERVICO';
  unidade: string;
  valor_unitario: number;
  estoque_atual: number;
  estoque_minimo: number;
  ativo: boolean;
  data_cadastro: string;
}

export interface CreateCatalogoItemDTO {
  descricao: string
  tipo_item: "PRODUTO" | "SERVICO"
  unidade: string
  valor_unitario: number
  estoque_atual: number
  estoque_minimo: number
}

export interface MovimentacaoEstoqueDTO {
  quantidade: number
}

export async function createCatalogoItem(
  data: CreateCatalogoItemDTO
): Promise<CatalogoItemDTO> {
  return apiFetch<CatalogoItemDTO>(
    "/catalogo-itens",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  )
}

export async function entradaEstoque(
  id: number,
  data: MovimentacaoEstoqueDTO
): Promise<CatalogoItemDTO> {
  return apiFetch<CatalogoItemDTO>(
    `/catalogo-itens/${id}/estoque/entrada`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  )
}

export async function saidaEstoque(
  id: number,
  data: MovimentacaoEstoqueDTO
): Promise<CatalogoItemDTO> {
  return apiFetch<CatalogoItemDTO>(
    `/catalogo-itens/${id}/estoque/saida`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  )
}

export async function allCatalogItems(): Promise<CatalogoItemDTO[]> {
  return apiFetch<CatalogoItemDTO[]>('/catalogo-itens', {
    method: 'GET',
  })
}