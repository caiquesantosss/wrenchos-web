import { apiFetch } from "../../../lib/api"

export type MetodoPagamento =
    | 'PIX'
    | 'CARTAO_CREDITO'
    | 'CARTAO_DEBITO'
    | 'DINHEIRO'
    | 'BOLETO'
    | 'TRANSFERENCIA'
    | null

export type StatusPagamento =
    | 'PENDENTE'
    | 'PAGO'
    | 'CANCELADO'
    | 'ATRASADO'


export interface FinanceiroDTO {
    id_financeiro: number
    id_ordem_servico: number
    descricao: string
    tipo_lancamento: 'RECEITA' | 'DESPESA'
    status_pagamento: StatusPagamento
    valor: number
    forma_pagamento: MetodoPagamento
    referencia_externa: string | null 
    data_vencimento: string | null
    data_pagamento: string | null
    data_cadastro: string
}

export const getAllFinanceiro = async (): Promise<FinanceiroDTO[]> => {
    return apiFetch<FinanceiroDTO[]>('/financeiro', {
        method: 'GET',
    })
}