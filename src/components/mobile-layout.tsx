import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useSocialAuth } from "../providers/SocialAuthProvider"
import { Home, MapPin, User } from "lucide-react"

interface MobileLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
  activeTab?: "home" | "map" | "profile"
}

export default function MobileLayout({ children, showBottomNav, activeTab }: MobileLayoutProps) {
  return (
    <div className="mobile-container">
      {children}
      {showBottomNav && <BottomNav activeTab={activeTab} />}
    </div>
  )
}

function BottomNav({ activeTab }: { activeTab?: "home" | "map" | "profile" }) {
  const navigate = useNavigate()
  const { registeredUser } = useSocialAuth()

  const handleTabClick = (tabId: string) => {
    if (tabId === "home") {
      // Navigate to respective dashboard based on role
      if (registeredUser?.role === "artisan") {
        navigate("/artisan-dashboard")
      } else if (registeredUser?.role === "client") {
        navigate("/client-dashboard")
      }
    } else if (tabId === "map") {
      navigate("/map")
    } else if (tabId === "profile") {
      navigate("/profile")
    }
  }

  const tabs = [
    { id: "home", label: "Inicio", icon: Home },
    { id: "map", label: "Mapa", icon: MapPin },
    { id: "profile", label: "Perfil", icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border">
      <div className="flex items-center justify-around px-6 py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
