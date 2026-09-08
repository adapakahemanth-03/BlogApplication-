import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Plus, LogIn, LogOut } from "lucide-react"

export const Navbar = ({
  onOpenAuth,
  onOpenCreatePost,
  activeView,
  onViewChange,
}) => {
  const { currentUser, isAuthenticated, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left Side: Brand Logo & Navigation */}
        <div className="flex items-center space-x-6 sm:space-x-8">
          <button
            type="button"
            onClick={() => onViewChange("home")}
            className="cursor-pointer text-left bg-transparent border-none p-0 focus:outline-none"
          >
            <span className="text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors">
              BlogPlus
            </span>
          </button>

          {/* Navigation Links for all users */}
          <nav className="hidden sm:flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => onViewChange("home")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeView === "home"
                  ? "bg-secondary text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onViewChange("articles")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeView === "articles"
                  ? "bg-secondary text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Articles
            </button>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => onViewChange("my")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeView === "my"
                    ? "bg-secondary text-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Blogs
              </button>
            )}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              {/* Mobile Navigation Dropdown/Toggle */}
              <div className="flex sm:hidden items-center gap-1 bg-muted/60 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => onViewChange("articles")}
                  className={`px-2 py-1 rounded font-medium ${
                    activeView === "articles" ? "bg-background text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Articles
                </button>
                <button
                  type="button"
                  onClick={() => onViewChange("my")}
                  className={`px-2 py-1 rounded font-medium ${
                    activeView === "my" ? "bg-background text-foreground" : "text-muted-foreground"
                  }`}
                >
                  My
                </button>
              </div>

              <Button
                variant="default"
                size="sm"
                className="gap-1.5 cursor-pointer shadow-sm"
                onClick={onOpenCreatePost}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Write Post</span>
              </Button>

              {/* User Avatar Circle - clean profile circle without username text */}
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <button
                  type="button"
                  onClick={() => onViewChange("my")}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-transform hover:scale-105"
                  title={`Signed in as ${currentUser?.username} • Click to view My Blogs`}
                >
                  <Avatar name={currentUser?.username} size="sm" />
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={logout}
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => onOpenAuth("login")}
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                Sign In
              </Button>
              <Button
                variant="default"
                size="sm"
                className="cursor-pointer"
                onClick={() => onOpenAuth("register")}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
