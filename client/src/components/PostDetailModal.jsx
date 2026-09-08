import * as React from "react"
import { useAuth } from "@/context/AuthContext"
import { commentsApi, likesApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import {
  Heart,
  MessageSquare,
  Calendar,
  Trash2,
  Pencil,
  Send,
} from "lucide-react"

export const PostDetailModal = ({
  post,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onOpenAuth,
  onPostUpdated,
  onLikeUpdated,
}) => {
  const { currentUser, isAuthenticated } = useAuth()
  const [comments, setComments] = React.useState([])
  const [newComment, setNewComment] = React.useState("")
  const [likeCount, setLikeCount] = React.useState(post?.likeCount || 0)
  const [isLiked, setIsLiked] = React.useState(Boolean(post?.isLiked))
  const [isLiking, setIsLiking] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  const [commentError, setCommentError] = React.useState(null)

  const postId = post?.id

  // Sync with prop changes
  React.useEffect(() => {
    if (post) {
      setLikeCount(post.likeCount || 0)
      setIsLiked(Boolean(post.isLiked))
    }
  }, [post?.likeCount, post?.isLiked])

  // Load comments and live like status
  React.useEffect(() => {
    let ignore = false
    async function fetchPostDetails() {
      if (!open || !postId) return
      try {
        const [commentsData, status] = await Promise.all([
          commentsApi.getByPostId(postId).catch(() => []),
          likesApi.getStatus(postId).catch(() => ({ likeCount: 0, liked: false })),
        ])
        if (!ignore) {
          setComments(commentsData)
          const count = typeof status.likeCount === "number" ? status.likeCount : 0
          const liked = Boolean(status.liked)
          setLikeCount(count)
          setIsLiked(liked)
          if (onLikeUpdated) onLikeUpdated(postId, count, liked)
        }
      } catch (err) {
        console.error("Error loading post data:", err)
      }
    }

    fetchPostDetails()
    return () => {
      ignore = true
    }
  }, [open, postId, onLikeUpdated])

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      onOpenAuth()
      return
    }
    if (!post || isLiking) return
    setIsLiking(true)

    const prevLiked = isLiked
    const prevCount = likeCount
    const nextLiked = !prevLiked
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1)

    setIsLiked(nextLiked)
    setLikeCount(nextCount)
    if (onLikeUpdated) onLikeUpdated(post.id, nextCount, nextLiked)

    try {
      const res = await likesApi.toggle(post.id)
      let finalCount = nextCount
      let finalLiked = nextLiked
      if (res && typeof res.likeCount === "number") {
        finalCount = res.likeCount
        finalLiked = Boolean(res.liked)
      } else {
        finalCount = await likesApi.getCount(post.id)
      }
      setLikeCount(finalCount)
      setIsLiked(finalLiked)
      if (onLikeUpdated) onLikeUpdated(post.id, finalCount, finalLiked)
      if (onPostUpdated) onPostUpdated()
    } catch (err) {
      setIsLiked(prevLiked)
      setLikeCount(prevCount)
      if (onLikeUpdated) onLikeUpdated(post.id, prevCount, prevLiked)
      console.error("Error liking post:", err)
    } finally {
      setIsLiking(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      onOpenAuth()
      return
    }
    if (!post || !newComment.trim()) return

    setIsSubmittingComment(true)
    setCommentError(null)
    try {
      const added = await commentsApi.create(post.id, newComment.trim())
      setComments((prev) => [added, ...prev])
      setNewComment("")
      if (onPostUpdated) onPostUpdated()
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to post comment.")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return
    try {
      await commentsApi.delete(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      if (onPostUpdated) onPostUpdated()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete comment.")
    }
  }

  if (!post) return null

  const isAuthor = currentUser?.username === post.author?.username
  const canModify = isAuthor || currentUser?.isAdmin

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
      >
        <DialogHeader className="border-b border-border/60 pb-5">
          {/* Author Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar name={post.author?.username} size="md" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {post.author?.username}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            {canModify && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs cursor-pointer"
                  onClick={() => {
                    onOpenChange(false)
                    onEdit(post)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 h-8 text-xs cursor-pointer"
                  onClick={() => {
                    onOpenChange(false)
                    onDelete(post.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Post Title */}
          <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
            {post.title}
          </DialogTitle>
        </DialogHeader>

        {/* Post Content */}
        <div className="py-6 border-b border-border/60">
          <div className="prose prose-slate max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed text-base">
            {post.content}
          </div>

          {/* Post Action Bar */}
          <div className="mt-8 flex items-center gap-3">
            <Button
              variant={isLiked ? "secondary" : "outline"}
              size="sm"
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`gap-2 cursor-pointer transition-colors ${
                isLiked
                  ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900"
                  : "border-border hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
              }`}
            >
              <Heart
                className={`h-4 w-4 text-rose-500 ${isLiked ? "fill-rose-500" : "fill-rose-500/30"}`}
              />
              <span className="font-semibold">{likeCount}</span>
              <span className="text-muted-foreground">{likeCount === 1 ? "Like" : "Likes"}</span>
            </Button>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground px-2">
              <MessageSquare className="h-4 w-4" />
              <span>{comments.length} Comments</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="pt-6 space-y-6">
          <h4 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Discussion ({comments.length})
          </h4>

          {/* Comment composer */}
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="space-y-3">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[90px] text-sm resize-none"
              />
              {commentError && (
                <p className="text-xs text-destructive">{commentError}</p>
              )}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="gap-2 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>Sign in to join the discussion and leave a comment.</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={onOpenAuth}
              >
                Sign In
              </Button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 bg-muted/10 rounded-lg">
                No comments yet. Be the first to start the conversation!
              </p>
            ) : (
              comments.map((comment) => {
                const isCommentAuthor =
                  currentUser?.username === comment.author?.username
                const canDeleteComment =
                  isCommentAuthor || currentUser?.isAdmin

                return (
                  <div
                    key={comment.id}
                    className="flex space-x-3 p-3.5 rounded-lg bg-muted/20 border border-border/50 text-sm"
                  >
                    <Avatar name={comment.author?.username} size="sm" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">
                            {comment.author?.username}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {comment.createdAt
                              ? new Date(comment.createdAt).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        {canDeleteComment && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
