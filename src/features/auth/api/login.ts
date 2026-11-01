import { apiFetch } from "../../../lib/api"

export interface LoginCredentialsDTO {
    email: string 
    senha_hash: string
}

export interface LoginResponseDTO {
    access_token: string
    usuario: {
        id: number, 
        nome: string, 
        email: string
    }
}

export async function login(credentials: {
    email: string, 
    senha: string
}): Promise<LoginResponseDTO> {
    const response = await apiFetch<LoginResponseDTO>('/users/login', {
        method: 'POST', 
        body: JSON.stringify(credentials)
    })

    if (response.access_token) {
        localStorage.setItem('@WrenchOS:token', response.access_token) 
        localStorage.setItem('@WrenchOS:usuario', JSON.stringify(
            response.usuario
        ))
    }

    return response
}

export function logout() {
    localStorage.removeItem('@WrenchOS:token')
    localStorage.removeItem('@WrenchOS:usuario')
    window.location.href = '/login'
}