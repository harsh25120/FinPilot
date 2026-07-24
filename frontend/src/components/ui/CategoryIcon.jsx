import {
  Briefcase,
  Laptop,
  TrendingUp,
  PlusCircle,
  ShoppingCart,
  Home,
  Zap,
  Car,
  Coffee,
  Film,
  Heart,
  Shield,
  ShoppingBag,
  BookOpen,
  PiggyBank,
  MoreHorizontal,
  Gift,
  Plane,
  Music,
  Dumbbell,
  Wallet,
  Phone,
  Wifi,
  Utensils,
  GraduationCap,
  Star,
  Tag,
} from 'lucide-react'

const ICON_MAP = {
  briefcase: Briefcase,
  laptop: Laptop,
  'trending-up': TrendingUp,
  'plus-circle': PlusCircle,
  'shopping-cart': ShoppingCart,
  home: Home,
  zap: Zap,
  car: Car,
  coffee: Coffee,
  film: Film,
  heart: Heart,
  shield: Shield,
  'shopping-bag': ShoppingBag,
  'book-open': BookOpen,
  'piggy-bank': PiggyBank,
  'more-horizontal': MoreHorizontal,
  gift: Gift,
  plane: Plane,
  music: Music,
  dumbbell: Dumbbell,
  wallet: Wallet,
  phone: Phone,
  wifi: Wifi,
  utensils: Utensils,
  'graduation-cap': GraduationCap,
  star: Star,
}

const SIZE_CLASSES = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
}

export default function CategoryIcon({ icon, color, size = 'md', className = '' }) {
  const IconComponent = ICON_MAP[icon] || Tag
  const iconColor = color || '#6366F1'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg ${SIZE_CLASSES[size]} ${className}`}
      style={{ backgroundColor: `${iconColor}1A`, color: iconColor }}
    >
      <IconComponent size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} strokeWidth={2} />
    </span>
  )
}
