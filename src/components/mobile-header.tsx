interface MobileHeaderProps {
  title?: string
  showAvatar?: boolean
  showNotification?: boolean
}

export default function MobileHeader({ title, showAvatar, showNotification }: MobileHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white">
      {showAvatar ? (
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
          HU
        </div>
      ) : (
        <div className="w-10" />
      )}

      {title && <h1 className="text-lg font-bold text-foreground">{title}</h1>}

      {showNotification ? (
        <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-lg">🔔</span>
        </button>
      ) : (
        <div className="w-10" />
      )}
    </div>
  )
}
