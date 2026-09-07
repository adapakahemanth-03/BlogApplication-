export interface Role {
  id?: number
  name: string
}

export interface User {
  id: number
  username: string
  email: string
  roles?: Role[]
}

export interface Post {
  id: number
  title: string
  content: string
  author: User
  createdAt: string
  updated: string
  likeCount?: number
  commentCount?: number
}

export interface Comment {
  id: number
  content: string
  author: User
  createdAt: string
  updated: string
}

export interface AuthResponse {
  token: string
}
