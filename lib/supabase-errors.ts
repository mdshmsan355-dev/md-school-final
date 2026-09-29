export function friendlySupabaseError(error: { code?: string | null; message?: string | null } | null | undefined, fallback="تعذر تنفيذ العملية") {
  if (!error) return fallback;
  const code=error.code??""; const message=error.message??"";
  if(code==="23505"||/unique/i.test(message)) return "القيمة موجودة بالفعل. اختر قيمة أخرى.";
  if(code==="23503"||/foreign key/i.test(message)) return "لا يمكن تنفيذ العملية لأن السجل مرتبط ببيانات أخرى.";
  if(code==="23514"||/check constraint/i.test(message)) return "البيانات المدخلة لا تطابق القواعد المعتمدة.";
  if(/غير مصرح|not authorized|permission/i.test(message)) return "ليست لديك صلاحية لتنفيذ هذه العملية.";
  if(message.includes("لا يمكن حذف")) return message;
  return message || fallback;
}
