import * as React from "react"
import type { Post, Comment } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { likesApi, commentsApi } from "@/lib/api"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Heart,
  MessageSquare,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Send,
  Sparkles,
} from "lucide-react"

interface ArticleFeedCardProps {
  post: Post
  onEdit: (post: Post) => void
  onDelete: (postId: number) => void
  onOpenAuth: (tab?: "login" | "register") => void
  onPostUpdated?: () => void
}

export const ArticleFeedCard: React.FC<ArticleFeedCardProps> = ({
  post,
  onEdit,
  onDelete,
  onOpenAuth,
  onPostUpdated,
}) => {
  const { currentUser, isAuthenticated } = useAuth()

  // Live like state
  const [likeCount, setLikeCount] = React.useState(post.likeCount || 0)
  const [prevPropLikeCount, setPrevPropLikeCount] = React.useState(post.likeCount)
  if (post.likeCount !== undefined && post.likeCount !== prevPropLikeCount) {
    setPrevPropLikeCount(post.likeCount)
    setLikeCount(post.likeCount)
  }

  const [isLiked, setIsLiked] = React.useState(false)
  const [isTogglingLike, setIsTogglingLike] = React.useState(false)

  // Comments state
  const [comments, setComments] = React.useState<Comment[]>([])
  const [showComments, setShowComments] = React.useState(false)
  const [isLoadingComments, setIsLoadingComments] = React.useState(false)
  const [newComment, setNewComment] = React.useState("")
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  const [commentError, setCommentError] = React.useState<string | null>(null)

  const isAuthor =
    currentUser?.username?.trim().toLowerCase() ===
    post.author?.username?.trim().toLowerCase()
  const canModify = isAuthor || currentUser?.isAdmin

  // Format creation date
  const formattedDate = React.useMemo(() => {
    if (!post.createdAt) return "Recent"
    try {
      const d = new Date(post.createdAt)
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return post.createdAt
    }
  }, [post.createdAt])

  // Approximate reading time
  const readTime = Math.max(1, Math.ceil((post.content?.split(/\s+/).length || 0) / 180))

  // Load comments when comments section is toggled
  const handleToggleComments = async () => {
    const nextState = !showComments
    setShowComments(nextState)
    if (nextState && comments.length === 0) {
      setIsLoadingComments(true)
      try {
        const fetched = await commentsApi.getByPostId(post.id)
        setComments(fetched)
      } catch {
        // silent fallback
      } finally {
        setIsLoadingComments(false)
      }
    }
  }

  // Handle Like Toggle
  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      onOpenAuth("login")
      return
    }

    if (isTogglingLike) return
    setIsTogglingLike(true)

    // Optimistic UI update
    const previousLiked = isLiked
    const previousCount = likeCount
    setIsLiked(!previousLiked)
    setLikeCount((prev) => (previousLiked ? Math.max(0, prev - 1) : prev + 1))

    try {
      await likesApi.toggle(post.id)
      const freshCount = await likesApi.getCount(post.id)
      setLikeCount(freshCount)
      if (onPostUpdated) onPostUpdated()
    } catch {
      // Revert on error
      setIsLiked(previousLiked)
      setLikeCount(previousCount)
    } finally {
      setIsTogglingLike(false)
    }
  }

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    if (!isAuthenticated) {
      onOpenAuth("login")
      return
    }

    setIsSubmittingComment(true)
    setCommentError(null)

    try {
      const created = await commentsApi.create(post.id, newComment.trim())
      setComments((prev) => [...prev, created])
      setNewComment("")
      if (onPostUpdated) onPostUpdated()
    } catch (err: unknown) {
      setCommentError(
        err instanceof Error ? err.message : "Failed to post comment. Please try again."
      )
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Handle Delete Comment
  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentsApi.delete(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      if (onPostUpdated) onPostUpdated()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete comment.")
    }
  }

  return (
    <Card className="w-full rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden">
      {/* Header: Author Info & Controls */}
      <CardHeader className="p-6 pb-4 sm:p-8 sm:pb-4 border-b border-border/40 bg-muted/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <Avatar name={post.author?.username || "Anonymous"} size="md" />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold text-foreground leading-snug">
                {post.author?.username || "Anonymous Author"}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readTime} min read
                </span>
              </div>
            </div>
          </div>

          {/* Author/Admin Edit & Delete Actions */}
          {canModify && (
            <div className="flex items-center space-x-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary cursor-pointer"
                onClick={() => onEdit(post)}
                title="Edit Article"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive cursor-pointer"
                onClick={() => onDelete(post.id)}
                title="Delete Article"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Main Content Area */}
      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* Article Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight sm:leading-snug break-words emoji-font">
          {post.title}
        </h2>

        {/* Complete Blog Content with Rich Native Emoji & Typography Formatting */}
        <div className="text-foreground/90 font-sans text-base sm:text-lg leading-relaxed sm:leading-8 whitespace-pre-wrap break-words emoji-font font-normal">
          {post.content}
        </div>
      </CardContent>

      {/* Footer: Interactive Action Bar & Integrated Comments */}
      <CardFooter className="flex flex-col p-0 border-t border-border/50 bg-muted/10">
        {/* Like & Comment Bar */}
        <div className="flex items-center justify-between w-full px-6 py-3.5 sm:px-8">
          <div className="flex items-center space-x-3">
            {/* Live Like Button */}
            <Button
              variant={isLiked ? "secondary" : "ghost"}
              size="sm"
              onClick={handleToggleLike}
              disabled={isTogglingLike}
              className={`gap-2 h-9 px-3.5 text-xs font-semibold cursor-pointer rounded-full transition-all ${
                isLiked
                  ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart
                className={`h-4 w-4 transition-transform active:scale-125 ${
                  isLiked ? "fill-red-500 text-red-500" : ""
                }`}
              />
              <span>{likeCount}</span>
              <span className="hidden sm:inline">{likeCount === 1 ? "Like" : "Likes"}</span>
            </Button>

            {/* Toggle Comment Section */}
            <Button
              variant={showComments ? "secondary" : "ghost"}
              size="sm"
              onClick={handleToggleComments}
              className="gap-2 h-9 px-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{comments.length || post.commentCount || 0}</span>
              <span className="hidden sm:inline">Comments</span>
            </Button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary/60" />
            <span className="hidden sm:inline">Share your thoughts below</span>
          </div>
        </div>

        {/* Clean Integrated Comment Section */}
        {showComments && (
          <div className="w-full px-6 pb-6 sm:px-8 sm:pb-8 pt-4 border-t border-border/50 bg-background/60 space-y-5 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>Discussion ({comments.length})</span>
              </h3>
            </div>

            {/* Add Comment Input Form */}
            {isAuthenticated ? (
              <form onSubmit={handleAddComment} className="space-y-2.5">
                {commentError && (
                  <div className="p-2.5 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                    {commentError}
                  </div>
                )}
                <div className="relative">
                  <Textarea
                    placeholder="Write a thoughtful comment... Emojis supported! ✨"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[85px] text-sm pr-20 resize-none font-sans"
                    disabled={isSubmittingComment}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="absolute bottom-2.5 right-2.5 gap-1.5 h-7 px-3 text-xs cursor-pointer shadow-xs"
                  >
                    <Send className="h-3 w-3" />
                    <span>{isSubmittingComment ? "Posting..." : "Comment"}</span>
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-3.5 rounded-xl border border-dashed border-border text-center bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Sign in to like this post and join the conversation.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenAuth("login")}
                  className="text-xs cursor-pointer h-8"
                >
                  Sign In to Comment
                </Button>
              </div>
            )}

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No comments yet. Be the first to start the discussion! 💬
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-border/40">
                {comments.map((comment) => {
                  const isCommentAuthor =
                    currentUser?.username?.trim().toLowerCase() ===
                    comment.author?.username?.trim().toLowerCase()
                  const canDeleteComment = isCommentAuthor || currentUser?.isAdmin

                  const commentDate = comment.createdAt
                    ? new Date(comment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ""

                  return (
                    <div key={comment.id} className="pt-3 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar name={comment.author?.username || "User"} size="sm" />
                          <span className="text-xs font-semibold text-foreground">
                            {comment.author?.username || "Anonymous"}
                          </span>
                          {commentDate && (
                            <span className="text-[11px] text-muted-foreground">
                              • {commentDate}
                            </span>
                          )}
                        </div>

                        {canDeleteComment && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer transition-colors p-1"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap break-words pl-8 emoji-font leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
