import type { Post, Comment, User, AuthResponse } from "@/types"

// Driven by VITE_API_URL environment variable with fallback for deployments
// In local dev, an empty string routes through Vite's dev proxy to prevent browser CORS issues
const API_BASE = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ""
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? "" : "http://localhost:8080")

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("blog_token")
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // 204 No Content handling
  if (response.status === 204) {
    return {} as T
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    try {
      const errorData = await response.json()
      if (errorData.message) errorMessage = errorData.message
      else if (typeof errorData === "string") errorMessage = errorData
    } catch {
      try {
        const text = await response.text()
        if (text) errorMessage = text
      } catch {
        // use fallback message
      }
    }
    throw new Error(errorMessage)
  }

  const rawText = await response.text()
  if (!rawText || rawText.trim() === "") {
    return {} as T
  }

  // Handle server-side recursion truncation if present in Spring Boot response
  const sanitized = rawText.replace(/"roles":\]/g, '"roles":[]')
  try {
    return JSON.parse(sanitized) as T
  } catch (parseError) {
    console.warn("JSON parsing failed, returning raw text or fallback:", parseError)
    throw new Error("Failed to parse server response.", { cause: parseError })
  }
}

// Authentication endpoints
export const authApi = {
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  register: async (userData: { username: string; email: string; password: string }): Promise<User> => {
    return request<User>("/api/users/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },
}

// Post endpoints
export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    return request<Post[]>("/api/posts", {
      method: "GET",
    })
  },

  getById: async (id: number): Promise<Post> => {
    return request<Post>(`/api/posts/${id}`, {
      method: "GET",
    })
  },

  create: async (postData: { title: string; content: string }): Promise<Post> => {
    return request<Post>("/api/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    })
  },

  update: async (id: number, postData: { title: string; content: string }): Promise<Post> => {
    return request<Post>(`/api/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    })
  },

  delete: async (id: number): Promise<void> => {
    return request<void>(`/api/posts/${id}`, {
      method: "DELETE",
    })
  },
}

// Comment endpoints
export const commentsApi = {
  getByPostId: async (postId: number): Promise<Comment[]> => {
    return request<Comment[]>(`/api/comments/post/${postId}`, {
      method: "GET",
    })
  },

  create: async (postId: number, content: string): Promise<Comment> => {
    return request<Comment>(`/api/comments/post/${postId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
  },

  delete: async (commentId: number): Promise<void> => {
    return request<void>(`/api/comments/${commentId}`, {
      method: "DELETE",
    })
  },
}

// Likes endpoints
export const likesApi = {
  toggle: async (postId: number): Promise<void> => {
    return request<void>(`/api/likes/post/${postId}/toggle`, {
      method: "POST",
    })
  },

  getCount: async (postId: number): Promise<number> => {
    return request<number>(`/api/likes/post/${postId}/count`, {
      method: "GET",
    })
  },
}
