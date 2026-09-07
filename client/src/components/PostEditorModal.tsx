import * as React from "react"
import type { Post } from "@/types"
import { postsApi } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Check, Smile, Sparkles } from "lucide-react"

interface PostEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPost: Post | null
  onSaved: (post: Post) => void
}

interface FormProps {
  editingPost: Post | null
  onClose: () => void
  onSaved: (post: Post) => void
}

const CURATED_EMOJIS = [
  "✨", "🚀", "💡", "🔥", "💻", "📝", "🎉", "❤️", "👍", "👏",
  "🌟", "📚", "🎯", "⚡", "🎨", "🔍", "📖", "💬", "🏆", "🛠️",
  "🤝", "☕", "☀️", "🙌", "😊", "😎", "🤔", "💪", "🌈", "✅"
]

function PostEditorForm({ editingPost, onClose, onSaved }: FormProps) {
  const [title, setTitle] = React.useState(editingPost?.title || "")
  const [content, setContent] = React.useState(editingPost?.content || "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [emojiTarget, setEmojiTarget] = React.useState<"title" | "content">("content")

  const titleInputRef = React.useRef<HTMLInputElement>(null)
  const contentTextareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleInsertEmoji = (emoji: string) => {
    if (emojiTarget === "title") {
      const input = titleInputRef.current
      if (input && input.selectionStart !== null && input.selectionEnd !== null) {
        const start = input.selectionStart
        const end = input.selectionEnd
        const newTitle = title.substring(0, start) + emoji + title.substring(end)
        setTitle(newTitle)
        setTimeout(() => {
          input.focus()
          input.setSelectionRange(start + emoji.length, start + emoji.length)
        }, 0)
      } else {
        setTitle((prev) => prev + emoji)
      }
    } else {
      const textarea = contentTextareaRef.current
      if (textarea && textarea.selectionStart !== null && textarea.selectionEnd !== null) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = content.substring(0, start) + emoji + content.substring(end)
        setContent(newContent)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + emoji.length, start + emoji.length)
        }, 0)
      } else {
        setContent((prev) => prev + emoji)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage("Title is required.")
      return
    }
    if (!content.trim()) {
      setErrorMessage("Content cannot be empty.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      let saved: Post
      if (editingPost) {
        saved = await postsApi.update(editingPost.id, {
          title: title.trim(),
          content: content.trim(),
        })
      } else {
        saved = await postsApi.create({
          title: title.trim(),
          content: content.trim(),
        })
      }
      onSaved(saved)
      onClose()
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save post. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const wordCount = content.trim().length ? content.trim().split(/\s+/).length : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      {errorMessage && (
        <div className="p-3 text-xs rounded-md bg-destructive/15 text-destructive font-medium border border-destructive/20">
          {errorMessage}
        </div>
      )}

      {/* Formatting & Emoji Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 border border-border/60">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showEmojiPicker ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="gap-1.5 h-8 text-xs cursor-pointer"
          >
            <Smile className="h-4 w-4 text-amber-500" />
            <span>Add Emojis</span>
          </Button>

          {showEmojiPicker && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-background/80 px-2 py-1 rounded border border-border/50">
              <span>Insert into:</span>
              <button
                type="button"
                onClick={() => setEmojiTarget("title")}
                className={`px-1.5 py-0.5 rounded cursor-pointer font-medium ${
                  emojiTarget === "title" ? "bg-primary text-primary-foreground" : "hover:text-foreground"
                }`}
              >
                Title
              </button>
              <button
                type="button"
                onClick={() => setEmojiTarget("content")}
                className={`px-1.5 py-0.5 rounded cursor-pointer font-medium ${
                  emojiTarget === "content" ? "bg-primary text-primary-foreground" : "hover:text-foreground"
                }`}
              >
                Content
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground hidden sm:flex">
          <Sparkles className="h-3 w-3 text-primary/70" />
          <span>Rich emoji keyboard supported (Win + .)</span>
        </div>
      </div>

      {/* Emoji Picker Popover / Palette */}
      {showEmojiPicker && (
        <div className="p-3 rounded-lg border border-border/80 bg-card shadow-sm animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">
              Click to insert emoji into {emojiTarget}:
            </span>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Done
            </button>
          </div>
          <div className="grid grid-cols-10 gap-1.5 text-xl text-center">
            {CURATED_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer text-lg hover:scale-115 transform transition-transform"
                title={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Title
        </label>
        <Input
          ref={titleInputRef}
          placeholder="Title (e.g. 🚀 Building the Future with React)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setEmojiTarget("title")}
          maxLength={200}
          autoFocus
        />
        <div className="flex justify-end text-[11px] text-muted-foreground">
          {title.length}/200
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Content</label>
        <Textarea
          ref={contentTextareaRef}
          placeholder="Write your article content here... Markdown and native emojis ✨ are fully supported!"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setEmojiTarget("content")}
          className="min-h-[220px] font-sans text-sm leading-relaxed"
        />
        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
          <span>Approx. {Math.max(1, Math.ceil(wordCount / 180))} min read</span>
          <span>{wordCount} words</span>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          className="gap-1.5 cursor-pointer"
        >
          <Check className="h-4 w-4" />
          {isSubmitting
            ? "Saving..."
            : editingPost
            ? "Update Post"
            : "Publish Post"}
        </Button>
      </div>
    </form>
  )
}

export const PostEditorModal: React.FC<PostEditorModalProps> = ({
  open,
  onOpenChange,
  editingPost,
  onSaved,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editingPost ? "Update article" : "Create new article"}
          </DialogTitle>
          <DialogDescription>
            Publish your insights to the community. Markdown formatting is supported.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <PostEditorForm
            key={editingPost ? `edit-${editingPost.id}` : "create-new"}
            editingPost={editingPost}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
