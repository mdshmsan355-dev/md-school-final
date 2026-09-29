CREATE OR REPLACE FUNCTION public.add_student_with_enrollment(p_full_name text, p_grade_level_id uuid, p_section_id uuid)
RETURNS TABLE(student_id uuid, student_number bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_school uuid; v_year uuid; v_student public.students;
BEGIN
  v_school := public.current_school_id();
  IF v_school IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  SELECT academic_year_id INTO v_year FROM public.grade_levels WHERE id = p_grade_level_id AND school_id = v_school;
  IF v_year IS NULL OR NOT EXISTS (SELECT 1 FROM public.sections WHERE id = p_section_id AND grade_level_id = p_grade_level_id AND school_id = v_school) THEN RAISE EXCEPTION 'الصف أو الشعبة غير صالح'; END IF;
  INSERT INTO public.students(school_id, full_name) VALUES (v_school, trim(p_full_name)) RETURNING * INTO v_student;
  INSERT INTO public.student_enrollments(school_id, student_id, academic_year_id, grade_level_id, section_id) VALUES (v_school, v_student.id, v_year, p_grade_level_id, p_section_id);
  RETURN QUERY SELECT v_student.id, v_student.student_number;
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_student_with_enrollment(text, uuid, uuid) TO authenticated;