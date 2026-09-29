-- Management completion: years, grades, sections, students, subjects, templates and reporting helpers.
CREATE OR REPLACE FUNCTION public.set_active_academic_year(p_year_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_school uuid := public.current_school_id();
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academic_years WHERE id=p_year_id AND school_id=v_school) THEN RAISE EXCEPTION 'العام الدراسي غير صالح'; END IF;
  UPDATE public.academic_years SET is_active=false WHERE school_id=v_school;
  UPDATE public.academic_years SET is_active=true WHERE id=p_year_id AND school_id=v_school;
  RETURN p_year_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.set_active_academic_year(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_academic_year(p_name text, p_copy_grades boolean DEFAULT true)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_school uuid := public.current_school_id(); v_year uuid; r record; v_grade uuid;
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  INSERT INTO public.academic_years(school_id,name,is_active) VALUES(v_school,trim(p_name),false) RETURNING id INTO v_year;
  IF p_copy_grades THEN
    FOR r IN SELECT code,name,stage,sort_order FROM public.grade_levels WHERE school_id=v_school AND academic_year_id=(SELECT id FROM public.academic_years WHERE school_id=v_school AND is_active ORDER BY created_at DESC LIMIT 1) ORDER BY sort_order LOOP
      INSERT INTO public.grade_levels(school_id,academic_year_id,code,name,stage,sort_order) VALUES(v_school,v_year,r.code,r.name,r.stage,r.sort_order) RETURNING id INTO v_grade;
      INSERT INTO public.subjects(school_id,grade_level_id,name,sort_order)
      SELECT v_school,v_grade,name,sort_order FROM public.subjects s WHERE s.school_id=v_school AND s.grade_level_id=(SELECT id FROM public.grade_levels WHERE school_id=v_school AND academic_year_id=(SELECT id FROM public.academic_years WHERE school_id=v_school AND is_active ORDER BY created_at DESC LIMIT 1) AND code=r.code LIMIT 1) ORDER BY sort_order;
    END LOOP;
  END IF;
  RETURN v_year;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_academic_year(text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_academic_year(p_year_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_school uuid := public.current_school_id();
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  IF EXISTS (SELECT 1 FROM public.academic_years WHERE id=p_year_id AND school_id=v_school AND is_active) THEN RAISE EXCEPTION 'لا يمكن حذف العام النشط'; END IF;
  IF EXISTS (SELECT 1 FROM public.student_enrollments WHERE academic_year_id=p_year_id) OR EXISTS (SELECT 1 FROM public.scores WHERE academic_year_id=p_year_id) THEN RAISE EXCEPTION 'لا يمكن حذف عام يحتوي على سجلات طلاب أو درجات'; END IF;
  DELETE FROM public.academic_years WHERE id=p_year_id AND school_id=v_school;
END; $$;
GRANT EXECUTE ON FUNCTION public.delete_academic_year(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.move_student(p_student_id uuid,p_year_id uuid,p_grade_id uuid,p_section_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_school uuid := public.current_school_id();
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id=p_student_id AND school_id=v_school) THEN RAISE EXCEPTION 'الطالب غير موجود'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.grade_levels WHERE id=p_grade_id AND academic_year_id=p_year_id AND school_id=v_school) THEN RAISE EXCEPTION 'الصف غير صالح للعام'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.sections WHERE id=p_section_id AND grade_level_id=p_grade_id AND school_id=v_school) THEN RAISE EXCEPTION 'الشعبة غير صالحة للصف'; END IF;
  UPDATE public.student_enrollments SET grade_level_id=p_grade_id, section_id=p_section_id WHERE student_id=p_student_id AND academic_year_id=p_year_id AND school_id=v_school;
  IF NOT FOUND THEN INSERT INTO public.student_enrollments(school_id,student_id,academic_year_id,grade_level_id,section_id) VALUES(v_school,p_student_id,p_year_id,p_grade_id,p_section_id); END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.move_student(uuid,uuid,uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_result_template(p_grade_id uuid,p_term public.academic_term,p_template public.result_template)
RETURNS public.result_template_settings LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_school uuid := public.current_school_id(); v_row public.result_template_settings;
BEGIN
  IF v_school IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  INSERT INTO public.result_template_settings(school_id,grade_level_id,term,template) VALUES(v_school,p_grade_id,p_term,p_template)
  ON CONFLICT(grade_level_id,term) DO UPDATE SET template=excluded.template,updated_at=now()
  RETURNING * INTO v_row;
  RETURN v_row;
END; $$;
GRANT EXECUTE ON FUNCTION public.save_result_template(uuid,public.academic_term,public.result_template) TO authenticated;
