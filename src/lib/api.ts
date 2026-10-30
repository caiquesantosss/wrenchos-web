export const API_URl = 'http://localhost:3030/api'

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('@WrenchOS:token')

    const headers = new Headers(options?.headers)
    headers.set('Content-type', 'application/json')

    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(`${API_URl}${endpoint}`, {
        ...options, 
        headers
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.message || `Error HTTP: ${response.status}`

        throw new Error(errorMessage)
    }

    if (response.status === 204) {
        return {} as T
    }

    return response.json() as Promise<T>
}