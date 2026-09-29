import {
  LayoutDashboard,
  Layers,
  Rows3,
  Users,
  BookMarked,
  PenLine,
  BarChart3,
  FileOutput,
  FileText,
  Settings,
  UserRound,
} from "lucide-react";

export const navItems = [
  { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/classes", label: "الصفوف", icon: Layers },
  { to: "/sections", label: "الشعب", icon: Rows3 },
  { to: "/students", label: "الطلاب", icon: Users },
  { to: "/subjects", label: "المواد", icon: BookMarked },
  { to: "/grades", label: "تسجيل الدرجات", icon: PenLine },
  { to: "/results", label: "النتائج", icon: BarChart3 },
  { to: "/issue-results", label: "إصدار النتائج", icon: FileOutput },
  { to: "/reports", label: "التقارير", icon: FileText },
  { to: "/settings", label: "الإعدادات", icon: Settings },
  { to: "/developer", label: "معلومات المطور", icon: UserRound },
] as const;

export type NavItem = (typeof navItems)[number];

/** Placeholder values only — no real school data in this phase. */
export const schoolPlaceholder = {
  name: "مدرسة النهضة الأساسية",
  academicYear: "1447 / 1448 هـ",
  managerName: "محمد شمسان",
  managerRole: "مدير المدرسة",
};
