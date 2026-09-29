import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SchoolOnboarding } from "@/components/auth/SchoolOnboarding";
import { setOfflineUserId } from "@/lib/offline-store";

type School = {
  id: string;
  name: string;
  school_type: "basic" | "secondary" | "mixed";
  region: string;
  exam_max: number;
  coursework_max: number;
  term_pass_mark: number;
};
type Profile = { full_name: string; phone: string; school_id: string };
type AcademicYear = { id: string; name: string; is_active: boolean; is_closed: boolean };
type GradeLevel = { id: string; name: string; code: string; stage: "basic" | "secondary"; sort_order: number; academic_year_id: string };

type SchoolContextValue = {
  loading: boolean;
  school: School | null;
  profile: Profile | null;
  years: AcademicYear[];
  activeYear: AcademicYear | null;
  grades: GradeLevel[];
  refresh: () => Promise<void>;
};

const SchoolContext = createContext<SchoolContextValue | null>(null);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<School | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => { if (mounted) setOfflineUserId(data.user?.id ?? null); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setOfflineUserId(session?.user?.id ?? null));
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: profileData } = await supabase.from("profiles").select("school_id, full_name, phone").maybeSingle();
    if (!profileData) {
      const { error: bootstrapError } = await supabase.rpc("bootstrap_school_from_signup");
      if (!bootstrapError) {
        const { data: createdProfile } = await supabase.from("profiles").select("school_id, full_name, phone").maybeSingle();
        if (createdProfile) {
          const [schoolResult, yearsResult, gradesResult] = await Promise.all([
            supabase.from("schools").select("id, name, school_type, region, exam_max, coursework_max, term_pass_mark").eq("id", createdProfile.school_id).single(),
            supabase.from("academic_years").select("id, name, is_active, is_closed").eq("school_id", createdProfile.school_id).order("created_at", { ascending: false }),
            supabase.from("grade_levels").select("id, name, code, stage, sort_order, academic_year_id").eq("school_id", createdProfile.school_id).order("sort_order"),
          ]);
          setProfile(createdProfile as Profile);
          setSchool(schoolResult.data ? { ...schoolResult.data, exam_max: Number(schoolResult.data.exam_max), coursework_max: Number(schoolResult.data.coursework_max), term_pass_mark: Number(schoolResult.data.term_pass_mark) } as School : null);
          setYears((yearsResult.data ?? []) as AcademicYear[]);
          setGrades((gradesResult.data ?? []) as GradeLevel[]);
          setLoading(false); return;
        }
      }
      setProfile(null); setSchool(null); setYears([]); setGrades([]); setLoading(false); return;
    }
    const [schoolResult, yearsResult, gradesResult] = await Promise.all([
      supabase.from("schools").select("id, name, school_type, region, exam_max, coursework_max, term_pass_mark").eq("id", profileData.school_id).single(),
      supabase.from("academic_years").select("id, name, is_active, is_closed").eq("school_id", profileData.school_id).order("created_at", { ascending: false }),
      supabase.from("grade_levels").select("id, name, code, stage, sort_order, academic_year_id").eq("school_id", profileData.school_id).order("sort_order"),
    ]);
    setProfile(profileData as Profile);
    setSchool(schoolResult.data ? { ...schoolResult.data, exam_max: Number(schoolResult.data.exam_max), coursework_max: Number(schoolResult.data.coursework_max), term_pass_mark: Number(schoolResult.data.term_pass_mark) } as School : null);
    setYears((yearsResult.data ?? []) as AcademicYear[]);
    setGrades((gradesResult.data ?? []) as GradeLevel[]);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  const activeYear = years.find((year) => year.is_active) ?? null;
  const value = useMemo(() => ({ loading, school, profile, years, activeYear, grades, refresh }), [loading, school, profile, years, activeYear, grades, refresh]);
  if (loading) return <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">جارٍ تحميل بيانات المدرسة...</div>;
  if (!profile) return <SchoolOnboarding onComplete={refresh} />;
  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool() {
  const value = useContext(SchoolContext);
  if (!value) throw new Error("useSchool must be used inside SchoolProvider");
  return value;
}
