import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Wallet2,
  Target,
  PieChart,
  FileText,
} from 'lucide-react'

const navConfig = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/budgets', label: 'Budgets', icon: Wallet2 },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/analytics', label: 'Analytics', icon: PieChart },
  { to: '/reports', label: 'Reports', icon: FileText },
]

export default navConfig
