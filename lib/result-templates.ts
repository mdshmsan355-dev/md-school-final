export const RESULT_TEMPLATES = [
  { value: "children_blue", label: "الأطفال — أزرق", group: "children", accent: "#0787d8" },
  { value: "children_green", label: "الأطفال — أخضر", group: "children", accent: "#12a64a" },
  { value: "children_orange", label: "الأطفال — برتقالي", group: "children", accent: "#e38b14" },
  { value: "formal_blue", label: "رسمي — أزرق", group: "formal", accent: "#075ca8" },
  { value: "formal_green", label: "رسمي — أخضر", group: "formal", accent: "#168447" },
  { value: "formal_gold", label: "رسمي — ذهبي", group: "formal", accent: "#b06d12" },
] as const;

export type ResultTemplate = typeof RESULT_TEMPLATES[number]["value"];

export function isChildrenTemplate(template: ResultTemplate) {
  return template.startsWith("children_");
}

export function templateAccent(template: ResultTemplate) {
  return RESULT_TEMPLATES.find((item) => item.value === template)?.accent ?? "#075ca8";
}
