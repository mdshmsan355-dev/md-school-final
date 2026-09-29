-- Results integrity, complete academic-year lifecycle, snapshots, and final-period templates.
ALTER TYPE public.academic_term ADD VALUE IF NOT EXISTS 'final';

ALTER TABLE public.academic_years
  ADD COLUMN IF NOT EXISTS is_closed boolean NOT NULL DEFAULT false;

ALTER TABLE public.scores
  ALTER COLUMN exam_score DROP NOT NULL,
  ALTER COLUMN coursework_score DROP NOT NULL;

ALTER TABLE public.result_issuances
  ALTER COLUMN section_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'section' CHECK (scope IN ('section','grade')),
  ADD COLUMN IF NOT EXISTS snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.validate_score_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.schools%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.schools WHERE id = NEW.school_id;
  IF NEW.exam_score IS NOT NULL AND (NEW.exam_score < 0 OR NEW.exam_score > s.exam_max) THEN
    RAISE EXCEPTION 'درجة الاختبار خارج الحدود المعتمدة';
  END IF;
  IF NEW.coursework_score IS NOT NULL AND (NEW.coursework_score < 0 OR NEW.coursework_score > s.coursework_max) THEN
    RAISE EXCEPTION 'درجة المحصلة خارج الحدود المعتمدة';
  END IF;
  IF EXISTS (SELECT 1 FROM public.academic_years y WHERE y.id = NEW.academic_year_id AND y.school_id = NEW.school_id AND y.is_closed) THEN
    RAISE EXCEPTION 'العام الدراسي مغلق ولا يمكن تعديل درجاته';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.issue_result_snapshot(
  p_academic_year_id uuid,
  p_grade_level_id uuid,
  p_section_id uuid,
  p_term public.academic_term,
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
GRANT EXECUTE ON FUNCTION public.issue_result_snapshot(uuid,uuid,uuid,public.academic_term,public.result_template,integer,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.close_academic_year(p_year_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_school uuid := public.current_school_id();
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  UPDATE public.academic_years SET is_closed=true, is_active=false WHERE id=p_year_id AND school_id=v_school;
  IF NOT FOUND THEN RAISE EXCEPTION 'العام الدراسي غير صالح'; END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.close_academic_year(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reopen_academic_year(p_year_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_school uuid := public.current_school_id();
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  UPDATE public.academic_years SET is_closed=false WHERE id=p_year_id AND school_id=v_school;
  IF NOT FOUND THEN RAISE EXCEPTION 'العام الدراسي غير صالح'; END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.reopen_academic_year(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_active_academic_year(p_year_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_school uuid := public.current_school_id();
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academic_years WHERE id=p_year_id AND school_id=v_school AND NOT is_closed) THEN RAISE EXCEPTION 'لا يمكن تفعيل عام مغلق أو غير تابع للمدرسة'; END IF;
  UPDATE public.academic_years SET is_active=false WHERE school_id=v_school;
  UPDATE public.academic_years SET is_active=true WHERE id=p_year_id AND school_id=v_school;
  RETURN p_year_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_result_template(p_grade_id uuid,p_term public.academic_term,p_template public.result_template)
RETURNS public.result_template_settings LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_school uuid := public.current_school_id(); v_row public.result_template_settings;
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.grade_levels WHERE id=p_grade_id AND school_id=v_school) THEN RAISE EXCEPTION 'الصف غير صالح'; END IF;
  INSERT INTO public.result_template_settings(school_id,grade_level_id,term,template) VALUES(v_school,p_grade_id,p_term,p_template)
  ON CONFLICT(grade_level_id,term) DO UPDATE SET template=excluded.template,updated_at=now()
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

CREATE INDEX IF NOT EXISTS result_issuances_school_grade_year_idx ON public.result_issuances(school_id,academic_year_id,grade_level_id,term,issued_at DESC);

CREATE OR REPLACE FUNCTION public.swap_subject_order(p_subject_id uuid, p_direction integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_school uuid := public.current_school_id(); v_grade uuid; v_current smallint; v_target uuid; v_target_order smallint;
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  SELECT grade_level_id, sort_order INTO v_grade, v_current FROM public.subjects WHERE id=p_subject_id AND school_id=v_school;
  IF v_grade IS NULL OR p_direction NOT IN (-1,1) THEN RAISE EXCEPTION 'المادة أو الاتجاه غير صالح'; END IF;
  SELECT id, sort_order INTO v_target, v_target_order FROM public.subjects WHERE school_id=v_school AND grade_level_id=v_grade AND sort_order = v_current + p_direction LIMIT 1;
  IF v_target IS NULL THEN RETURN; END IF;
  UPDATE public.subjects SET sort_order=-sort_order WHERE id IN (p_subject_id,v_target);
  UPDATE public.subjects SET sort_order=v_target_order WHERE id=p_subject_id;
  UPDATE public.subjects SET sort_order=v_current WHERE id=v_target;
END;
$$;
GRANT EXECUTE ON FUNCTION public.swap_subject_order(uuid,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_grade_safely(p_grade_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_school uuid := public.current_school_id(); v_year uuid;
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  SELECT academic_year_id INTO v_year FROM public.grade_levels WHERE id=p_grade_id AND school_id=v_school;
  IF v_year IS NULL THEN RAISE EXCEPTION 'الصف غير موجود'; END IF;
  IF EXISTS (SELECT 1 FROM public.student_enrollments WHERE grade_level_id=p_grade_id) OR EXISTS (SELECT 1 FROM public.scores sc JOIN public.subjects su ON su.id=sc.subject_id WHERE su.grade_level_id=p_grade_id) THEN RAISE EXCEPTION 'لا يمكن حذف الصف لأنه مرتبط بطلاب أو درجات'; END IF;
  DELETE FROM public.subjects WHERE grade_level_id=p_grade_id AND school_id=v_school;
  DELETE FROM public.sections WHERE grade_level_id=p_grade_id AND school_id=v_school;
  DELETE FROM public.grade_levels WHERE id=p_grade_id AND school_id=v_school;
  WITH ordered AS (SELECT id,row_number() OVER (ORDER BY sort_order,created_at) AS n FROM public.grade_levels WHERE school_id=v_school AND academic_year_id=v_year)
  UPDATE public.grade_levels g SET sort_order=ordered.n FROM ordered WHERE g.id=ordered.id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_grade_safely(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_open_academic_year()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_year uuid;
BEGIN
  v_year := CASE WHEN TG_OP='DELETE' THEN CASE WHEN TG_TABLE_NAME='grade_levels' THEN OLD.academic_year_id WHEN TG_TABLE_NAME='student_enrollments' THEN OLD.academic_year_id WHEN TG_TABLE_NAME='sections' THEN (SELECT academic_year_id FROM public.grade_levels WHERE id=OLD.grade_level_id) WHEN TG_TABLE_NAME='subjects' THEN (SELECT academic_year_id FROM public.grade_levels WHERE id=OLD.grade_level_id) END ELSE CASE WHEN TG_TABLE_NAME='grade_levels' THEN NEW.academic_year_id WHEN TG_TABLE_NAME='student_enrollments' THEN NEW.academic_year_id WHEN TG_TABLE_NAME='sections' THEN (SELECT academic_year_id FROM public.grade_levels WHERE id=NEW.grade_level_id) WHEN TG_TABLE_NAME='subjects' THEN (SELECT academic_year_id FROM public.grade_levels WHERE id=NEW.grade_level_id) END END;
  IF v_year IS NOT NULL AND EXISTS (SELECT 1 FROM public.academic_years WHERE id=v_year AND is_closed) THEN
    RAISE EXCEPTION 'العام الدراسي مغلق ولا يمكن تعديل بياناته';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS grade_levels_open_year_guard ON public.grade_levels;
CREATE TRIGGER grade_levels_open_year_guard BEFORE INSERT OR UPDATE OR DELETE ON public.grade_levels FOR EACH ROW EXECUTE FUNCTION public.guard_open_academic_year();
DROP TRIGGER IF EXISTS sections_open_year_guard ON public.sections;
CREATE TRIGGER sections_open_year_guard BEFORE INSERT OR UPDATE OR DELETE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.guard_open_academic_year();
DROP TRIGGER IF EXISTS subjects_open_year_guard ON public.subjects;
CREATE TRIGGER subjects_open_year_guard BEFORE INSERT OR UPDATE OR DELETE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.guard_open_academic_year();
DROP TRIGGER IF EXISTS enrollments_open_year_guard ON public.student_enrollments;
CREATE TRIGGER enrollments_open_year_guard BEFORE INSERT OR UPDATE OR DELETE ON public.student_enrollments FOR EACH ROW EXECUTE FUNCTION public.guard_open_academic_year();

-- The client must not be able to bypass current-password verification by calling the old RPC directly.
REVOKE EXECUTE ON FUNCTION public.change_username(text) FROM PUBLIC, authenticated;

CREATE OR REPLACE FUNCTION public.delete_student_safely(p_student_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_school uuid := public.current_school_id();
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id=p_student_id AND school_id=v_school) THEN RAISE EXCEPTION 'الطالب غير موجود'; END IF;
  IF EXISTS (SELECT 1 FROM public.student_enrollments e JOIN public.academic_years y ON y.id=e.academic_year_id WHERE e.student_id=p_student_id AND e.school_id=v_school AND y.is_closed) THEN RAISE EXCEPTION 'لا يمكن حذف طالب له سجل في عام دراسي مغلق'; END IF;
  DELETE FROM public.students WHERE id=p_student_id AND school_id=v_school;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_student_safely(uuid) TO authenticated;
