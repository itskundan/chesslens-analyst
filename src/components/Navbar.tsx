import { UploadSimple } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  onUploadClick: () => void
}

export function Navbar({ onUploadClick }: NavbarProps) {
  return (
    <nav className="border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ChessLens Analyst
          </h1>
        </div>
        <Button
          onClick={onUploadClick}
          className="flex items-center gap-2 transition-all duration-200"
        >
          <UploadSimple size={18} weight="regular" />
          Upload
        </Button>
      </div>
    </nav>
  )
}
