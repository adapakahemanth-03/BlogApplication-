// Driven by VITE_API_URL environment variable with fallback for deployments
// In local dev, an empty string routes through Vite's dev proxy to prevent browser CORS issues
const API_BASE = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ""
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? "" : "http://localhost:8080")

function getAuthHeader() {
  const token = localStorage.getItem("blog_token")
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // 204 No Content handling
  if (response.status === 204) {
    return {}
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
    return {}
  }

  // Handle server-side recursion truncation if present in Spring Boot response
  const sanitized = rawText.replace(/"roles":\]/g, '"roles":[]')
  try {
    return JSON.parse(sanitized)
  } catch (parseError) {
    console.warn("JSON parsing failed, returning raw text or fallback:", parseError)
    throw new Error("Failed to parse server response.", { cause: parseError })
  }
}

// Authentication endpoints
export const authApi = {
  login: async (credentials) => {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  register: async (userData) => {
    return request("/api/users/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },
}

// Post endpoints
export const postsApi = {
  getAll: async () => {
    return request("/api/posts", {
      method: "GET",
    })
  },

  getById: async (id) => {
    return request(`/api/posts/${id}`, {
      method: "GET",
    })
  },

  create: async (postData) => {
    return request("/api/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    })
  },

  update: async (id, postData) => {
    return request(`/api/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    })
  },

  delete: async (id) => {
    return request(`/api/posts/${id}`, {
      method: "DELETE",
    })
  },
}

// Comment endpoints
export const commentsApi = {
  getByPostId: async (postId) => {
    return request(`/api/comments/post/${postId}`, {
      method: "GET",
    })
  },

  create: async (postId, content) => {
    return request(`/api/comments/post/${postId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
  },

  delete: async (commentId) => {
    return request(`/api/comments/${commentId}`, {
      method: "DELETE",
    })
  },
}

// Likes endpoints
export const likesApi = {
  toggle: async (postId) => {
    return request(`/api/likes/post/${postId}/toggle`, {
      method: "POST",
    })
  },

  getCount: async (postId) => {
    return request(`/api/likes/post/${postId}/count`, {
      method: "GET",
    })
  },

  getStatus: async (postId) => {
    return request(`/api/likes/post/${postId}/status`, {
      method: "GET",
    })
  },

  getUserLikedPostIds: async () => {
    return request("/api/likes/user/liked", {
      method: "GET",
    })
  },
}

