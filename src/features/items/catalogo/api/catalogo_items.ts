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

export async function allCatalogItems(): Promise<CatalogoItemDTO[]> {
  return apiFetch<CatalogoItemDTO[]>('/catalogo-itens', {
    method: 'GET',
  })
}