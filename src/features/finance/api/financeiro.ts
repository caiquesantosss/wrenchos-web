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

export interface OrdemServicoFinanceiroDTO {
    id_ordem_servico: number
    status: string
    descricao_problema: string
    diagnostico: string | null
    solucao_aplicada: string | null
    valor_mao_obra: number
    valor_pecas: number
    valor_total: number
    data_abertura: string
    data_previsao: string | null
    data_conclusao: string | null
}

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

export interface CreateFinanceiroDTO {
    id_ordem_servico: number
    descricao: string
    tipo_lancamento: 'RECEITA' | 'DESPESA'
    status_pagamento: StatusPagamento
    valor: number
    forma_pagamento?: MetodoPagamento
    referencia_externa?: string | null
    data_vencimento?: string | null
}

export interface FinanceiroWithOSDTO extends FinanceiroDTO {
    ordem_servico: OrdemServicoFinanceiroDTO
}

export const getAllFinanceiro = async (): Promise<FinanceiroDTO[]> => {
    return apiFetch<FinanceiroDTO[]>('/financeiro', {
        method: 'GET',
    })
}

export const getAllFinanceiroWithOS = async (): Promise<FinanceiroWithOSDTO[]> => {
    return apiFetch<FinanceiroWithOSDTO[]>('/financeiro/com-ordens-servico', {
        method: 'GET',
    })
}

export const createFinanceToOS = async (orderId: number, data: CreateFinanceiroDTO): Promise<FinanceiroDTO> => {
    return apiFetch<FinanceiroDTO>(`/financeiro/ordem-servico/${orderId}/faturar`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
}