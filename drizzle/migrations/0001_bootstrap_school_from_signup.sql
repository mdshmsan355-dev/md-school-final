CREATE OR REPLACE FUNCTION public.bootstrap_school_from_signup()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m jsonb := coalesce(auth.jwt() -> 'user_metadata', '{}'::jsonb);
  v_school uuid;
BEGIN
  SELECT school_id INTO v_school FROM public.profiles WHERE user_id = auth.uid();
  IF v_school IS NOT NULL THEN RETURN v_school; END IF;
  IF coalesce(m ->> 'school_name', '') = '' THEN
    RAISE EXCEPTION 'بيانات المدرسة غير مكتملة';
  END IF;
  RETURN public.bootstrap_school(
    m ->> 'school_name',
    coalesce(nullif(m ->> 'school_type', ''), 'mixed')::public.school_type,
    coalesce(m ->> 'region', ''),
    coalesce(nullif(m ->> 'manager_name', ''), split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1)),
    coalesce(m ->> 'phone', ''),
    coalesce(nullif(m ->> 'academic_year', ''), '1447 / 1448 هـ')
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.bootstrap_school_from_signup() TO authenticated;