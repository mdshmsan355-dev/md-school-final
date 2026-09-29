-- Keep score rows limited to the two academic terms while allowing final-period
-- result templates/issuances to use a distinct result-period enum.
CREATE TYPE public.score_term AS ENUM ('first', 'second');
CREATE TYPE public.result_period AS ENUM ('first', 'second', 'final');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.scores WHERE term = 'final') THEN
    RAISE EXCEPTION 'لا يمكن ترحيل درجات نهائية موجودة في جدول scores؛ يجب أن تحتوي الدرجات الخام على النصف الأول أو الثاني فقط';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.save_result_template(uuid, public.academic_term, public.result_template);
DROP FUNCTION IF EXISTS public.issue_result_snapshot(uuid, uuid, uuid, public.academic_term, public.result_template, integer, text, jsonb);

ALTER TABLE public.scores
  ALTER COLUMN term TYPE public.score_term USING term::text::public.score_term;
ALTER TABLE public.result_template_settings
  ALTER COLUMN term TYPE public.result_period USING term::text::public.result_period;
ALTER TABLE public.result_issuances
  ALTER COLUMN term TYPE public.result_period USING term::text::public.result_period;

CREATE OR REPLACE FUNCTION public.save_result_template(p_grade_id uuid,p_term public.result_period,p_template public.result_template)
RETURNS public.result_template_settings LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_school uuid := public.current_school_id(); v_row public.result_template_settings;
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.grade_levels WHERE id=p_grade_id AND school_id=v_school) THEN RAISE EXCEPTION 'الصف غير صالح'; END IF;
  INSERT INTO public.result_template_settings(school_id,grade_level_id,term,template)
  VALUES(v_school,p_grade_id,p_term,p_template)
  ON CONFLICT(grade_level_id,term) DO UPDATE SET template=excluded.template,updated_at=now()
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.save_result_template(uuid,public.result_period,public.result_template) TO authenticated;

CREATE OR REPLACE FUNCTION public.issue_result_snapshot(
  p_academic_year_id uuid,
  p_grade_level_id uuid,
  p_section_id uuid,
  p_term public.result_period,
  p_template public.result_template,
  p_results_count integer,
  p_scope text,
  p_snapshot jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_school uuid := public.current_school_id();
  v_id uuid;
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  IF p_scope NOT IN ('section','grade') THEN RAISE EXCEPTION 'نطاق الإصدار غير صالح'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academic_years WHERE id=p_academic_year_id AND school_id=v_school) THEN RAISE EXCEPTION 'العام الدراسي غير صالح'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.grade_levels WHERE id=p_grade_level_id AND school_id=v_school AND academic_year_id=p_academic_year_id) THEN RAISE EXCEPTION 'الصف غير صالح'; END IF;
  IF p_scope='section' AND NOT EXISTS (SELECT 1 FROM public.sections WHERE id=p_section_id AND school_id=v_school AND grade_level_id=p_grade_level_id) THEN RAISE EXCEPTION 'الشعبة غير صالحة'; END IF;
  INSERT INTO public.result_issuances(school_id,academic_year_id,grade_level_id,section_id,term,template,results_count,issued_by,scope,snapshot)
  VALUES(v_school,p_academic_year_id,p_grade_level_id,p_section_id,p_term,p_template,p_results_count,auth.uid(),p_scope,p_snapshot)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.issue_result_snapshot(uuid,uuid,uuid,public.result_period,public.result_template,integer,text,jsonb) TO authenticated;

ALTER TABLE public.result_template_settings ALTER COLUMN template SET DEFAULT 'formal_blue';

CREATE INDEX IF NOT EXISTS result_template_settings_grade_term_idx
  ON public.result_template_settings(school_id, grade_level_id, term);
CREATE INDEX IF NOT EXISTS result_issuances_school_period_idx
  ON public.result_issuances(school_id, academic_year_id, grade_level_id, term, issued_at DESC);
