-- Migrate legacy visual template selections to the new official formal-blue template.
UPDATE public.result_template_settings SET template = 'formal_blue' WHERE template IN ('classic', 'modern', 'formal', 'compact');
UPDATE public.result_issuances SET template = 'formal_blue' WHERE template IN ('classic', 'modern', 'formal', 'compact');
ALTER TABLE public.result_template_settings ALTER COLUMN template SET DEFAULT 'formal_blue';
