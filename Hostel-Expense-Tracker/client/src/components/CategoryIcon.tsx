import { Utensils, Zap, Wifi, Plane, Shirt, Box } from "lucide-react";

const icons = {
  Food: Utensils,
  Electricity: Zap,
  WiFi: Wifi,
  Travel: Plane,
  Laundry: Shirt,
  Misc: Box,
} as const;

export type CategoryType = keyof typeof icons;

interface CategoryIconProps {
  category: string;
  className?: string;
}

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = icons[category as CategoryType] || Box;
  
  return <Icon className={className} />;
}

export function getCategoryColor(category: string) {
  switch (category) {
    case 'Food': return 'bg-orange-100 text-orange-600';
    case 'Electricity': return 'bg-yellow-100 text-yellow-600';
    case 'WiFi': return 'bg-blue-100 text-blue-600';
    case 'Travel': return 'bg-teal-100 text-teal-600';
    case 'Laundry': return 'bg-purple-100 text-purple-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}
