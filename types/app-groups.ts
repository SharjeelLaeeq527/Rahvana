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
  /**
   * Base visa categories (e.g. "IR-2", "CR-2") this item is shown for. Omitted = every
   * category. Applied by getJourneyAppGroups().
   */
  visaCategories?: string[];
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
