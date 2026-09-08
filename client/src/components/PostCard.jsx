import * as React from "react"
import { useAuth } from "@/context/AuthContext"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Heart, MessageSquare, Pencil, Trash2, Calendar } from "lucide-react"

export const PostCard = ({
  post,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { currentUser } = useAuth()

  const isAuthor = currentUser?.username === post.author?.username
  const canModify = isAuthor || currentUser?.isAdmin

  // Format date nicely
  const formattedDate = React.useMemo(() => {
    if (!post.createdAt) return ""
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
  const readTime = Math.max(1, Math.ceil((post.content?.split(" ").length || 0) / 180))

  return (
    <Card className="group flex flex-col justify-between overflow-hidden border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-md transition-all duration-300">
      <CardHeader className="p-5 pb-3">
        {/* Author info & actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <Avatar name={post.author?.username || "Anonymous"} size="sm" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground/90 leading-tight">
                {post.author?.username || "Unknown"}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
                <span>•</span>
                <span>{readTime} min read</span>
              </div>
            </div>
          </div>

          {canModify && (
            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(post)
                }}
                title="Edit Post"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(post.id)
                }}
                title="Delete Post"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Title */}
        <CardTitle
          onClick={() => onSelect(post)}
          className="mt-3 text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-2"
        >
          {post.title}
        </CardTitle>
      </CardHeader>

      {/* Snippet */}
      <CardContent className="p-5 pt-0 pb-4">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {post.content}
        </p>
      </CardContent>

      {/* Footer / Stats & Read Button */}
      <CardFooter className="flex items-center justify-between border-t border-border/50 p-4 pt-3 bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 font-medium">
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />
            {post.likeCount ?? 0}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
            {post.commentCount ?? 0}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs font-semibold text-primary hover:text-primary/90 hover:bg-primary/10 cursor-pointer"
          onClick={() => onSelect(post)}
        >
          Read full post →
        </Button>
      </CardFooter>
    </Card>
  )
}
