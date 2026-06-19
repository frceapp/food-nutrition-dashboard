import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  type User,
} from "firebase/auth";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import type {
  DashboardData,
  FoodItem,
  NutritionValues,
  Period,
  UserOption,
  WhitelistEntry,
} from "./types";


declare global {
  interface Window {
    __NUTRIA_CONFIG__?: {
      FIREBASE_API_KEY?: string;
      FIREBASE_AUTH_DOMAIN?: string;
      FIREBASE_PROJECT_ID?: string;
      FIREBASE_STORAGE_BUCKET?: string;
      FIREBASE_MESSAGING_SENDER_ID?: string;
      FIREBASE_APP_ID?: string;
      APP_TIMEZONE?: string;
    };
  }
}


const runtime = window.__NUTRIA_CONFIG__ || {};
const firebaseConfig = {
  apiKey: runtime.FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY,
  authDomain: runtime.FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: runtime.FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: runtime.FIREBASE_STORAGE_BUCKET || import.meta.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: runtime.FIREBASE_MESSAGING_SENDER_ID || import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: runtime.FIREBASE_APP_ID || import.meta.env.FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  throw new Error("Konfigurasi Firebase frontend belum lengkap");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_TIMEZONE = runtime.APP_TIMEZONE || import.meta.env.APP_TIMEZONE || "Asia/Bangkok";
const NUTRIENT_KEYS = [
  "energy_kcal",
  "carbohydrate_g",
  "protein_g",
  "fat_g",
  "fiber_g",
] as const;


function dateFromValue(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}


function isoFromValue(value: unknown): string {
  const date = dateFromValue(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}


function localDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}


function periodDateKeys(period: Period): Set<string> {
  const days = period === "daily" ? 1 : 7;
  const keys = new Set<string>();
  const cursor = new Date();
  for (let index = 0; index < days; index += 1) {
    keys.add(localDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return keys;
}


function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}


function whitelistFromSnapshot(id: string, data: Record<string, unknown>): WhitelistEntry {
  return {
    id,
    phone_number: String(data.phone_number || id),
    label: typeof data.label === "string" ? data.label : null,
    is_admin: Boolean(data.is_admin),
    is_enabled: Boolean(data.is_enabled),
    created_by_phone: typeof data.created_by_phone === "string" ? data.created_by_phone : null,
    created_at: isoFromValue(data.created_at),
    updated_at: isoFromValue(data.updated_at),
  };
}


function progressStatus(percent: number): string {
  if (percent < 80) return "belum mencapai target";
  if (percent <= 120) return "sesuai rentang target";
  return "di atas target";
}


function requireUser(): User {
  if (!auth.currentUser) throw new Error("Login admin diperlukan");
  return auth.currentUser;
}


export async function signInAdmin(customToken: string): Promise<void> {
  try {
    await signInWithCustomToken(auth, customToken);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "auth/configuration-not-found") {
      throw new Error(
        "Firebase Authentication belum diaktifkan. Buka Firebase Console > Authentication lalu klik Get started."
      );
    }
    if (code === "auth/unauthorized-domain") {
      throw new Error(
        "Domain dashboard belum diizinkan di Firebase Authentication > Settings > Authorized domains."
      );
    }
    if (code === "auth/invalid-custom-token" || code === "auth/custom-token-mismatch") {
      throw new Error("Token login tidak cocok dengan Firebase project dashboard.");
    }
    throw error;
  }
}


export function observeAdminAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}


export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}


export const dataService = {
  async me(): Promise<{ id: string; phone_number: string; label: string | null }> {
    const user = requireUser();
    const token = await user.getIdTokenResult();
    const phoneNumber = String(token.claims.phone_number || "");
    const entry = await getDoc(doc(db, "whitelist_entries", phoneNumber));
    if (!entry.exists() || !entry.data().is_admin || !entry.data().is_enabled) {
      throw new Error("Akses admin tidak tersedia");
    }
    return {
      id: user.uid,
      phone_number: phoneNumber,
      label: typeof entry.data().label === "string" ? entry.data().label : null,
    };
  },

  async users(): Promise<UserOption[]> {
    requireUser();
    const [whitelistSnapshot, usersSnapshot, profilesSnapshot] = await Promise.all([
      getDocs(query(collection(db, "whitelist_entries"), where("is_enabled", "==", true))),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "user_profiles")),
    ]);
    const users = new Map(usersSnapshot.docs.map((item) => [item.id, item.data()]));
    const profiles = new Map(profilesSnapshot.docs.map((item) => [item.id, item.data()]));
    return whitelistSnapshot.docs
      .map((item) => {
        const access = item.data();
        const user = users.get(item.id);
        const profile = profiles.get(item.id);
        return {
          phone_number: item.id,
          label: String(access.label || user?.name || item.id),
          is_admin: Boolean(access.is_admin),
          profile_complete: profile?.onboarding_step === "complete",
          calorie_target: typeof profile?.daily_calorie_target === "number" ? profile.daily_calorie_target : null,
          last_analysis_at: null,
        };
      })
      .sort((left, right) => (left.label || left.phone_number).localeCompare(right.label || right.phone_number));
  },

  async dashboard(phone: string, period: Period): Promise<DashboardData> {
    requireUser();
    const queryStart = new Date();
    queryStart.setUTCDate(queryStart.getUTCDate() - 8);
    const [userSnapshot, profileSnapshot, logsSnapshot] = await Promise.all([
      getDoc(doc(db, "users", phone)),
      getDoc(doc(db, "user_profiles", phone)),
      getDocs(query(
        collection(db, "food_analysis_logs"),
        where("user_id", "==", phone),
        where("created_at", ">=", Timestamp.fromDate(queryStart)),
        orderBy("created_at", "desc"),
      )),
    ]);
    const userData = userSnapshot.data();
    const profileData = profileSnapshot.data();
    const acceptedDates = periodDateKeys(period);
    const totals: Record<string, number> = Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, 0]));
    const series = new Map<string, { date: string } & NutritionValues>();
    const meals: DashboardData["meals"] = [];

    for (const snapshot of logsSnapshot.docs) {
      const log = snapshot.data();
      if (log.status !== "success" || !log.nutrition_json) continue;
      const createdAt = dateFromValue(log.created_at);
      const date = localDateKey(createdAt);
      if (!acceptedDates.has(date)) continue;
      const nutrition = log.nutrition_json as Record<string, unknown>;
      const daily: { date: string } & NutritionValues = series.get(date) || {
        date,
        energy_kcal: 0,
        carbohydrate_g: 0,
        protein_g: 0,
        fat_g: 0,
        fiber_g: 0,
      };
      for (const key of NUTRIENT_KEYS) {
        const value = numberValue(nutrition[key]);
        totals[key] += value;
        daily[key] = numberValue(daily[key]) + value;
      }
      series.set(date, daily);
      meals.push({
        id: snapshot.id,
        created_at: createdAt.toISOString(),
        date,
        foods: Array.isArray(log.detected_foods_json) ? log.detected_foods_json as FoodItem[] : [],
        nutrition: Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, numberValue(nutrition[key])])) as unknown as NutritionValues,
        confidence: typeof log.confidence === "string" ? log.confidence : null,
      });
    }

    const days = period === "daily" ? 1 : 7;
    const dailyCalories = numberValue(profileData?.daily_calorie_target);
    const targets: Record<string, number> = {
      energy_kcal: dailyCalories * days,
      carbohydrate_g: dailyCalories * 0.50 / 4 * days,
      protein_g: dailyCalories * 0.20 / 4 * days,
      fat_g: dailyCalories * 0.30 / 9 * days,
      fiber_g: 25 * days,
    };
    const progress = Object.fromEntries(NUTRIENT_KEYS.map((key) => {
      const percent = targets[key] ? totals[key] / targets[key] * 100 : 0;
      return [key, { percent: Math.round(percent * 10) / 10, status: progressStatus(percent) }];
    }));

    return {
      phone_number: phone,
      period,
      profile: profileSnapshot.exists() ? {
        name: typeof userData?.name === "string" ? userData.name : null,
        weight_kg: typeof profileData?.weight_kg === "number" ? profileData.weight_kg : null,
        height_cm: typeof profileData?.height_cm === "number" ? profileData.height_cm : null,
        activity_level: typeof profileData?.activity_level === "string" ? profileData.activity_level : null,
        bmi: typeof profileData?.bmi === "number" ? profileData.bmi : null,
        bmi_category: typeof profileData?.bmi_category === "string" ? profileData.bmi_category : null,
        daily_calorie_target: dailyCalories || null,
      } : null,
      totals,
      targets,
      progress,
      daily_series: [...series.values()].sort((left, right) => left.date.localeCompare(right.date)),
      meals,
    };
  },

  async whitelist(): Promise<WhitelistEntry[]> {
    requireUser();
    const snapshot = await getDocs(query(collection(db, "whitelist_entries"), orderBy("created_at", "desc")));
    return snapshot.docs.map((item) => whitelistFromSnapshot(item.id, item.data()));
  },

  async addWhitelist(payload: { phone_number: string; label: string; is_admin: boolean }): Promise<void> {
    const admin = await this.me();
    const phoneNumber = payload.phone_number.replace(/\D/g, "");
    if (!/^\d{8,20}$/.test(phoneNumber)) throw new Error("Nomor WhatsApp tidak valid");
    const reference = doc(db, "whitelist_entries", phoneNumber);
    await runTransaction(db, async (transaction) => {
      if ((await transaction.get(reference)).exists()) throw new Error("Nomor sudah terdaftar");
      transaction.set(reference, {
        phone_number: phoneNumber,
        label: payload.label.trim() || null,
        is_admin: payload.is_admin,
        is_enabled: true,
        created_by_phone: admin.phone_number,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    });
  },

  async updateWhitelist(id: string, payload: Partial<WhitelistEntry>): Promise<void> {
    requireUser();
    const allowed: Record<string, unknown> = { updated_at: serverTimestamp() };
    if (typeof payload.label === "string" || payload.label === null) allowed.label = payload.label;
    if (typeof payload.is_admin === "boolean") allowed.is_admin = payload.is_admin;
    if (typeof payload.is_enabled === "boolean") allowed.is_enabled = payload.is_enabled;
    await updateDoc(doc(db, "whitelist_entries", id), allowed);
  },

  async removeWhitelist(id: string): Promise<void> {
    requireUser();
    await updateDoc(doc(db, "whitelist_entries", id), {
      is_enabled: false,
      is_admin: false,
      updated_at: serverTimestamp(),
    });
  },
};
