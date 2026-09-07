import * as React from "react"
import { useAuth } from "@/context/AuthContext"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Lock, Mail, User as UserIcon } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: "login" | "register"
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onOpenChange,
  initialTab = "login",
}) => {
  const { login, register } = useAuth()
  const [activeTab, setActiveTab] = React.useState<"login" | "register">(initialTab)

  // Form states
  const [username, setUsername] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset error when tab changes
  const handleTabChange = (tab: "login" | "register") => {
    setActiveTab(tab)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (activeTab === "login") {
        if (!username.trim() || !password.trim()) {
          setError("Please enter valid credentials,")
          setIsLoading(false)
          return
        }
        await login(username.trim(), password)
      } else {
        if (!username.trim() || !email.trim() || !password.trim()) {
          setError("Please enter valid credentials,")
          setIsLoading(false)
          return
        }
        await register(username.trim(), email.trim(), password)
      }
      onOpenChange(false)
    } catch {
      // Intercept any 400, 401, 403, or network errors
      // Display clean, user-friendly credentials notice
      setError("Please enter valid credentials,")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <UserIcon className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            {activeTab === "login" ? "Welcome" : "Join BlogPlus"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            {activeTab === "login"
              ? "Sign in with your username and password to continue"
              : "Create an account to publish articles and leave comments"}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switch buttons */}
        <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-xs font-semibold my-2">
          <button
            type="button"
            className={`py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleTabChange("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "register"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleTabChange("register")}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 space-y-1 animate-in fade-in-50 duration-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold leading-normal">
                  {error}
                </p>
                {activeTab === "login" && (
                  <p className="text-muted-foreground text-[11px] leading-normal">
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => handleTabChange("register")}
                      className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer"
                    >
                      Create an account
                    </button>{" "}
                    to get started.
                  </p>
                )}
                {activeTab === "register" && (
                  <p className="text-muted-foreground text-[11px] leading-normal">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => handleTabChange("login")}
                      className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer"
                    >
                      Sign in here
                    </button>
                    .
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9 text-sm"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {activeTab === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-sm"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 text-sm"
                autoComplete={
                  activeTab === "login" ? "current-password" : "new-password"
                }
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-3 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading
              ? "Please wait..."
              : activeTab === "login"
              ? "Sign In"
              : "Create Account"}
          </Button>

          {/* Helpful bottom option */}
          <div className="text-center pt-2 text-xs text-muted-foreground">
            {activeTab === "login" ? (
              <p>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => handleTabChange("register")}
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleTabChange("login")}
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
