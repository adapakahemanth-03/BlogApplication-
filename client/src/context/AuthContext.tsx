import * as React from "react"
import { authApi } from "@/lib/api"

export interface CurrentUser {
  username: string
  roles: string[]
  isAdmin: boolean
}

interface AuthContextType {
  currentUser: CurrentUser | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

function parseJwt(token: string): { sub?: string; roles?: string[]; exp?: number } | null {
  try {
    const base64Url = token.split(".")[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function getUserFromToken(token: string): CurrentUser | null {
  const payload = parseJwt(token)
  if (!payload || !payload.sub) return null

  // Check expiration
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    return null
  }

  const roles = Array.isArray(payload.roles) ? payload.roles : []
  const isAdmin = roles.some((r) => r === "ROLE_ADMIN" || r === "ADMIN")

  return {
    username: payload.sub,
    roles,
    isAdmin,
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = React.useState<string | null>(() => {
    const saved = localStorage.getItem("blog_token")
    if (saved) {
      const user = getUserFromToken(saved)
      if (user) return saved
      localStorage.removeItem("blog_token")
    }
    return null
  })

  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem("blog_token")
    return saved ? getUserFromToken(saved) : null
  })

  const login = async (username: string, password: string) => {
    const res = await authApi.login({ username, password })
    if (res && res.token) {
      const user = getUserFromToken(res.token)
      if (user) {
        localStorage.setItem("blog_token", res.token)
        setToken(res.token)
        setCurrentUser(user)
      }
    }
  }

  const register = async (username: string, email: string, password: string) => {
    await authApi.register({ username, email, password })
    await login(username, password)
  }

  const logout = () => {
    localStorage.removeItem("blog_token")
    setToken(null)
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
