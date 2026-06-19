export type Period = "daily" | "weekly";

export interface UserOption {
  phone_number: string;
  label: string | null;
  is_admin: boolean;
  profile_complete: boolean;
  calorie_target: number | null;
  last_analysis_at: string | null;
}

export interface FoodItem {
  name: string;
  estimated_portion: string;
  category: string;
  emoji: string;
}

export interface NutritionValues {
  energy_kcal: number;
  carbohydrate_g: number;
  protein_g: number;
  fat_g: number;
  fiber_g: number;
  calcium_note?: string;
}

export interface Meal {
  id: string;
  created_at: string;
  date: string;
  foods: FoodItem[];
  nutrition: NutritionValues;
  confidence: string | null;
}

export interface DashboardData {
  phone_number: string;
  period: Period;
  profile: {
    name: string | null;
    weight_kg: number | null;
    height_cm: number | null;
    activity_level: string | null;
    bmi: number | null;
    bmi_category: string | null;
    daily_calorie_target: number | null;
  } | null;
  totals: Partial<NutritionValues>;
  targets: Partial<NutritionValues>;
  progress: Record<string, { percent: number; status: string }>;
  daily_series: Array<{ date: string } & NutritionValues>;
  meals: Meal[];
}

export interface WhitelistEntry {
  id: string;
  phone_number: string;
  label: string | null;
  is_admin: boolean;
  is_enabled: boolean;
  created_by_phone: string | null;
  created_at: string;
  updated_at: string;
}
