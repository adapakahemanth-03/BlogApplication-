import * as React from "react"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { postsApi, likesApi, commentsApi } from "@/lib/api"
import { Navbar } from "@/components/Navbar"
import { ArticleFeedCard } from "@/components/ArticleFeedCard"
import { PostDetailModal } from "@/components/PostDetailModal"
import { PostEditorModal } from "@/components/PostEditorModal"
import { AuthModal } from "@/components/AuthModal"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Plus,
  BookOpen,
  RefreshCw,
  Sparkles,
  Flame,
  ArrowRight,
} from "lucide-react"

function BlogMain() {
  const { currentUser, isAuthenticated } = useAuth()

  // Navigation / Page View state: "home" | "articles" | "my"
  const [activeView, setActiveView] = React.useState("home")
  const currentView = isAuthenticated ? activeView : activeView === "my" ? "articles" : activeView

  // Posts state
  const [posts, setPosts] = React.useState([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [error, setError] = React.useState(null)

  // Modals state
  const [authModalOpen, setAuthModalOpen] = React.useState(false)
  const [authInitialTab, setAuthInitialTab] = React.useState("login")

  const [editorModalOpen, setEditorModalOpen] = React.useState(false)
  const [editingPost, setEditingPost] = React.useState(null)

  const [detailModalOpen, setDetailModalOpen] = React.useState(false)
  const [selectedPost, setSelectedPost] = React.useState(null)

  // Load all real posts from Spring Boot database
  const loadPosts = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const serverPosts = await postsApi.getAll()
      const postList = Array.isArray(serverPosts) ? serverPosts : []

      // If authenticated, get all post IDs the user has liked
      let likedSet = new Set()
      if (isAuthenticated) {
        try {
          const likedIds = await likesApi.getUserLikedPostIds()
          if (Array.isArray(likedIds)) {
            likedSet = new Set(likedIds)
          }
        } catch {
          // fallback if unauthenticated
        }
      }

      // Enrich with live like counts, liked status, and comment counts concurrently
      const enriched = await Promise.all(
        postList.map(async (p) => {
          try {
            const [likeCount, comments] = await Promise.all([
              likesApi.getCount(p.id).catch(() => 0),
              commentsApi.getByPostId(p.id).catch(() => []),
            ])
            return {
              ...p,
              likeCount: typeof likeCount === "number" ? likeCount : 0,
              isLiked: likedSet.has(p.id),
              commentCount: comments.length,
            }
          } catch {
            return {
              ...p,
              likeCount: 0,
              isLiked: likedSet.has(p.id),
              commentCount: 0,
            }
          }
        })
      )

      // Sort by newest first (newest createdAt, or highest ID as fallback)
      enriched.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        if (dateB !== dateA) return dateB - dateA
        return b.id - a.id
      })

      setPosts(enriched)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the backend server. Make sure the Spring Boot server is running on http://localhost:8080."
      )
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Update a single post's like status in memory immediately
  const handlePostLikeUpdated = React.useCallback((postId, freshCount, liked) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likeCount: typeof freshCount === "number" ? freshCount : p.likeCount,
              isLiked: typeof liked === "boolean" ? liked : p.isLiked,
            }
          : p
      )
    )
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              likeCount: typeof freshCount === "number" ? freshCount : prev.likeCount,
              isLiked: typeof liked === "boolean" ? liked : prev.isLiked,
            }
          : null
      )
    }
  }, [selectedPost])

  // Initial and view-change reload
  React.useEffect(() => {
    let isMounted = true
    const init = async () => {
      if (isMounted) {
        await loadPosts()
      }
    }
    void init()
    return () => {
      isMounted = false
    }
  }, [activeView, isAuthenticated, loadPosts])

  // Open Auth modal
  const handleOpenAuth = (tab = "login") => {
    setAuthInitialTab(tab)
    setAuthModalOpen(true)
  }

  // Open Create Post modal (requires auth)
  const handleOpenCreatePost = () => {
    if (!isAuthenticated) {
      handleOpenAuth("login")
      return
    }
    setEditingPost(null)
    setEditorModalOpen(true)
  }

  // Open Edit Post modal
  const handleEditPost = (post) => {
    setEditingPost(post)
    setEditorModalOpen(true)
  }

  // Handle Post Deletion
  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to permanently delete this post?")) return
    try {
      await postsApi.delete(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      if (selectedPost?.id === postId) {
        setDetailModalOpen(false)
        setSelectedPost(null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete post.")
    }
  }

  // Callback when a post is created or updated
  const handlePostSaved = (savedPost) => {
    // 1. If author object is not populated, attach currentUser
    const postWithAuthor = {
      ...savedPost,
      author: savedPost.author || {
        id: currentUser?.id || 0,
        username: currentUser?.username || "You",
        email: currentUser?.email || "",
      },
    }

    // 2. Immediately update client state so the post appears on the feed without delay
    setPosts((prev) => {
      const filtered = prev.filter((p) => p.id !== postWithAuthor.id)
      return [postWithAuthor, ...filtered]
    })

    if (selectedPost && selectedPost.id === postWithAuthor.id) {
      setSelectedPost(postWithAuthor)
    }

    // 3. Background re-fetch to ensure sync with server
    void loadPosts()
  }

  // Filter posts by activeView (articles vs my) and search query
  const displayedPosts = React.useMemo(() => {
    let list = posts
    if (currentView === "my" && currentUser) {
      const myUsername = currentUser.username.trim().toLowerCase()
      list = list.filter((p) => {
        const authorUsername = p.author?.username?.trim().toLowerCase()
        return authorUsername === myUsername
      })
    }
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author?.username?.toLowerCase().includes(q)
    )
  }, [posts, currentView, currentUser, searchQuery])

  // Latest featured article for Home Page spotlight
  const latestArticle = posts.length > 0 ? posts[0] : null

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenCreatePost={handleOpenCreatePost}
        activeView={currentView}
        onViewChange={setActiveView}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {/* ============================================================ */}
        {/* VIEW 1: HOME PAGE (Clean Landing Page without small grid)     */}
        {/* ============================================================ */}
        {currentView === "home" && (
          <div>
            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/5 via-background to-background py-20 sm:py-32">
              <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2 animate-in fade-in slide-in-from-top-3 duration-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Welcome to BlogPlus — Read, Write & Inspire</span>
                </div>

                <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-foreground sm:leading-tight">
                  Life isn't about finding yourself. Life is about creating yourself.
                </h1>

                <p className="mx-auto max-w-2xl text-base sm:text-xl text-muted-foreground leading-relaxed">
                  Publishing made simple. Read what matters to you, and write what inspires others.
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <Button
                    size="lg"
                    onClick={() => setActiveView("articles")}
                    className="gap-2 h-12 px-6 text-sm sm:text-base font-bold shadow-md cursor-pointer rounded-xl transition-transform hover:scale-102"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Explore Articles</span>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleOpenCreatePost}
                    className="gap-2 h-12 px-6 text-sm sm:text-base font-bold cursor-pointer rounded-xl border-border/80 hover:border-primary/60 hover:bg-muted/60 transition-transform hover:scale-102"
                  >
                    <Plus className="h-5 w-5 text-primary" />
                    <span>Start Writing</span>
                  </Button>
                </div>
              </div>
            </section>

            {/* Spotlight on Latest Post */}
            {latestArticle && (
              <section className="container mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
                <div className="p-6 sm:p-8 rounded-2xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>LATEST ARTICLE SPOTLIGHT</span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-foreground line-clamp-1">
                      {latestArticle.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      By {latestArticle.author?.username || "Anonymous"} • Ready to read in full length
                    </p>
                  </div>

                  <Button
                    variant="default"
                    onClick={() => setActiveView("articles")}
                    className="gap-2 cursor-pointer shrink-0 font-semibold shadow-xs"
                  >
                    <span>Read on Articles Feed</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2 & 3: ARTICLES FEED & MY BLOGS (Full-Width Stacked)    */}
        {/* ============================================================ */}
        {(currentView === "articles" || currentView === "my") && (
          <section className="container mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14 space-y-8">
            {/* Page Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {currentView === "my" ? "My Articles" : "Articles Feed"}
                  </h1>
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 text-xs font-bold">
                    {displayedPosts.length} {displayedPosts.length === 1 ? "article" : "articles"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {currentView === "my"
                    ? "Your personal articles and stories published on BlogPlus."
                    : "Complete, full-length articles from authors across the platform."}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {currentView === "my" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveView("articles")}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ← All Articles
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLoading(true)
                    void loadPosts()
                  }}
                  disabled={isLoading}
                  className="gap-1.5 cursor-pointer text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleOpenCreatePost}
                  className="gap-1.5 cursor-pointer text-xs shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Write</span>
                </Button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles by title, content, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-card/60 shadow-xs text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Error Notice */}
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex flex-col gap-1.5">
                <span className="font-semibold">Connection Notice</span>
                <p className="text-xs">{error}</p>
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && posts.length === 0 && (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border/60 bg-card/40 p-8 space-y-4 animate-pulse"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-20 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-7 w-3/4 bg-muted rounded mt-2" />
                    <div className="space-y-2 pt-2">
                      <div className="h-3.5 w-full bg-muted rounded" />
                      <div className="h-3.5 w-5/6 bg-muted rounded" />
                      <div className="h-3.5 w-4/6 bg-muted rounded" />
                    </div>
                    <div className="h-10 w-full bg-muted/40 rounded-xl mt-6" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State UI */}
            {!isLoading && displayedPosts.length === 0 && (
              currentView === "my" ? (
                <Card className="p-8 sm:p-14 text-center max-w-md mx-auto my-8 border-dashed border-border/80 bg-card/60 shadow-sm">
                  <CardContent className="space-y-4 p-0">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-foreground">
                        You haven't written any blogs yet!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Click "Write" to get started.
                      </p>
                    </div>
                    <Button
                      variant="default"
                      onClick={handleOpenCreatePost}
                      className="gap-1.5 cursor-pointer shadow-sm mt-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Write</span>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border/80 bg-muted/10 max-w-lg mx-auto space-y-3">
                  <BookOpen className="h-12 w-12 text-muted-foreground/60 mx-auto" />
                  <h3 className="text-lg font-bold text-foreground">
                    {searchQuery ? "No matching articles found" : "No articles published yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {searchQuery
                      ? "Try adjusting your search terms or clearing the filter."
                      : "Be the first creator to share your story on BlogPlus!"}
                  </p>
                  {searchQuery ? (
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="cursor-pointer">
                      Clear Search Filter
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={handleOpenCreatePost} className="cursor-pointer">
                      Publish First Article
                    </Button>
                  )}
                </div>
              )
            )}

            {/* Full-Width Stacked Cards Feed */}
            {displayedPosts.length > 0 && (
              <div className="w-full space-y-8">
                {displayedPosts.map((post) => (
                  <ArticleFeedCard
                    key={post.id}
                    post={post}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                    onOpenAuth={() => handleOpenAuth("login")}
                    onPostUpdated={() => void loadPosts()}
                    onLikeUpdated={handlePostLikeUpdated}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modern Minimalist Footer */}
      <footer className="border-t border-border/60 bg-background py-8 text-xs text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl">
          <p>© 2026 BlogPlus. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a
              href="#privacy"
              onClick={(e) => e.preventDefault()}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              onClick={(e) => e.preventDefault()}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Terms of Service
            </a>
            <a
              href="#help"
              onClick={(e) => e.preventDefault()}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Help
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        initialTab={authInitialTab}
      />

      <PostEditorModal
        open={editorModalOpen}
        onOpenChange={setEditorModalOpen}
        editingPost={editingPost}
        onSaved={handlePostSaved}
      />

      <PostDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        post={selectedPost}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onOpenAuth={() => handleOpenAuth("login")}
        onPostUpdated={() => {
          void loadPosts()
        }}
        onLikeUpdated={handlePostLikeUpdated}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BlogMain />
    </AuthProvider>
  )
}
