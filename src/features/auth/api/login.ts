import { apiFetch } from "../../../lib/api"

export interface LoginCredentialsDTO {
    email: string 
    senha_hash: string
}

export interface LoginResponseDTO {
    token: string;
    perfil: string;
    nome: string;
}

export async function login(credentials: {
    email: string, 
    senha: string 
}): Promise<LoginResponseDTO> {
    
    const response = await apiFetch<LoginResponseDTO>('/users/login', {
        method: 'POST', 
        body: JSON.stringify(credentials) 
    })

    if (response.token) {
        localStorage.setItem('@WrenchOS:token', response.token);
        
        localStorage.setItem('@WrenchOS:usuario', JSON.stringify({
            nome: response.nome,
            perfil: response.perfil
        }));
    }

    return response;
}

export function logout() {
    localStorage.removeItem('@WrenchOS:token')
    localStorage.removeItem('@WrenchOS:usuario')
    window.location.href = '/login'
}