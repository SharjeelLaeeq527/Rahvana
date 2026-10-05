export type AppGroupCategory = 'tools' | 'guides' | 'services';

export interface AppGroupItem {
  id: string;
  label: string;
  description: string;
  iconName: string;
  category: AppGroupCategory;
  componentKey: string;
  badge?: string;
  minTier?: 'free' | 'basic' | 'premium' | 'executive';
}

export interface AppGroup {
  id: AppGroupCategory;
  title: string;
  description: string;
  iconName: string;
  color: string;
  bgColor: string;
  items: AppGroupItem[];
}
