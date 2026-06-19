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

export interface RuntimeSettings {
  maintenance_manual: boolean;
  maintenance_schedule_enabled: boolean;
  maintenance_start: string;
  maintenance_end: string;
  maintenance_message: string;
  image_cooldown_seconds: number;
  image_window_minutes: number;
  max_images_per_window: number;
  max_revisions_per_analysis: number;
}

export interface UsageAnalytics {
  totals: {
    requests: number;
    images: number;
    revisions: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    active_users: number;
    success_rate: number;
  };
  daily_series: Array<{
    date: string;
    requests: number;
    images: number;
    revisions: number;
    total_tokens: number;
  }>;
  request_types: Array<{ name: string; value: number }>;
  top_users: Array<{ phone_number: string; requests: number; images: number; tokens: number }>;
}
