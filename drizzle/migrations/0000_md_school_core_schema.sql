CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.school_type AS ENUM ('basic', 'secondary', 'mixed');
CREATE TYPE public.school_stage AS ENUM ('basic', 'secondary');
CREATE TYPE public.academic_term AS ENUM ('first', 'second');
CREATE TYPE public.result_template AS ENUM ('classic', 'modern', 'formal', 'compact');

CREATE SEQUENCE public.student_number_seq START WITH 100001;
GRANT USAGE, SELECT ON SEQUENCE public.student_number_seq TO authenticated;
GRANT ALL ON SEQUENCE public.student_number_seq TO service_role;

CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 160),
  school_type public.school_type NOT NULL DEFAULT 'mixed',
  region text NOT NULL DEFAULT '',
  owner_user_id uuid NOT NULL UNIQUE,
  exam_max numeric(6,2) NOT NULL DEFAULT 30 CHECK (exam_max > 0),
  coursework_max numeric(6,2) NOT NULL DEFAULT 20 CHECK (coursework_max >= 0),
  term_pass_mark numeric(6,2) NOT NULL DEFAULT 25 CHECK (term_pass_mark >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_pass_mark_valid CHECK (term_pass_mark <= exam_max + coursework_max)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 120),
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.current_school_id() TO authenticated;

CREATE POLICY "Owners read school" ON public.schools FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Owners update school" ON public.schools FOR UPDATE TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND school_id = public.current_school_id());
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 3 AND 40),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO service_role;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX academic_years_one_active ON public.academic_years(school_id) WHERE is_active;

CREATE TABLE public.grade_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  stage public.school_stage NOT NULL,
  sort_order smallint NOT NULL CHECK (sort_order BETWEEN 1 AND 12),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, code),
  UNIQUE (id, school_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grade_levels TO authenticated;
GRANT ALL ON public.grade_levels TO service_role;
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade_level_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 30),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade_level_id, name),
  UNIQUE (id, school_id),
  FOREIGN KEY (grade_level_id, school_id) REFERENCES public.grade_levels(id, school_id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_number bigint NOT NULL DEFAULT nextval('public.student_number_seq') UNIQUE,
  full_name text NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 160),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, school_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  grade_level_id uuid NOT NULL,
  section_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, academic_year_id),
  FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id) ON DELETE CASCADE,
  FOREIGN KEY (grade_level_id, school_id) REFERENCES public.grade_levels(id, school_id) ON DELETE RESTRICT,
  FOREIGN KEY (section_id, school_id) REFERENCES public.sections(id, school_id) ON DELETE RESTRICT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_enrollments TO authenticated;
GRANT ALL ON public.student_enrollments TO service_role;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade_level_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 100),
  sort_order smallint NOT NULL DEFAULT 1 CHECK (sort_order > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade_level_id, name),
  UNIQUE (id, school_id),
  FOREIGN KEY (grade_level_id, school_id) REFERENCES public.grade_levels(id, school_id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  term public.academic_term NOT NULL,
  exam_score numeric(6,2) NOT NULL DEFAULT 0 CHECK (exam_score >= 0),
  coursework_score numeric(6,2) NOT NULL DEFAULT 0 CHECK (coursework_score >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, student_id, subject_id, term),
  FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id, school_id) REFERENCES public.subjects(id, school_id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scores TO authenticated;
GRANT ALL ON public.scores TO service_role;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.result_template_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade_level_id uuid NOT NULL,
  term public.academic_term NOT NULL,
  template public.result_template NOT NULL DEFAULT 'classic',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade_level_id, term),
  FOREIGN KEY (grade_level_id, school_id) REFERENCES public.grade_levels(id, school_id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_template_settings TO authenticated;
GRANT ALL ON public.result_template_settings TO service_role;
ALTER TABLE public.result_template_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.result_issuances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  grade_level_id uuid NOT NULL,
  section_id uuid NOT NULL,
  term public.academic_term NOT NULL,
  template public.result_template NOT NULL,
  results_count integer NOT NULL CHECK (results_count >= 0),
  issued_by uuid NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (grade_level_id, school_id) REFERENCES public.grade_levels(id, school_id) ON DELETE RESTRICT,
  FOREIGN KEY (section_id, school_id) REFERENCES public.sections(id, school_id) ON DELETE RESTRICT
);
GRANT SELECT, INSERT ON public.result_issuances TO authenticated;
GRANT ALL ON public.result_issuances TO service_role;
ALTER TABLE public.result_issuances ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.tenant_row_allowed(row_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT row_school_id = public.current_school_id() AND public.has_role(auth.uid(), 'admin')
$$;
GRANT EXECUTE ON FUNCTION public.tenant_row_allowed(uuid) TO authenticated;

CREATE POLICY "Tenant academic years" ON public.academic_years FOR ALL TO authenticated USING (public.tenant_row_allowed(school_id)) WITH CHECK (public.tenant_row_allowed(school_id));
CREATE POLICY "Tenant grade levels" ON public.grade_levels FOR ALL TO authenticated USING (public.tenant_row_allowed(school_id)) WITH CHECK (public.tenant_row_allowed(school_id));
CREATE POLICY "Tenant sections" ON public.sections FOR ALL TO authenticated USING (public.tenant_row_allowed(school_id)) WITH CHECK (public.tenant_row_allowed(school_id));
CREATE POLICY "Tenant students" ON public.students FOR ALL TO authenticated USING (public.tenant_row_allowed(school_id)) WITH CHECK (public.tenant_row_allowed(school_id));
CREATE POLICY "Tenant enrollments" ON public.student_enrollments FOR ALL TO authenticated USING (public.tenant_row_allowed(school_id)) WITH CHECK (public.tenant_row_allowed(school_id));
CREATE POLICY "Tenant subjects" ON public.subjects FOR ALL TO authenticated USING (public.tenant_row_allowed(school_id)) WITH CHECK (public.tenant_row_allowed(school_id));
CREATE POLICY "Tenant scores" ON public.scores FOR ALL TO authenticated USING (public.tenant_row_allowed(school_id)) WITH CHECK (public.tenant_row_allowed(school_id));
CREATE POLICY "Tenant template settings" ON public.result_template_settings FOR ALL TO authenticated USING (public.tenant_row_allowed(school_id)) WITH CHECK (public.tenant_row_allowed(school_id));
CREATE POLICY "Tenant issuances" ON public.result_issuances FOR SELECT TO authenticated USING (public.tenant_row_allowed(school_id));
CREATE POLICY "Tenant create issuances" ON public.result_issuances FOR INSERT TO authenticated WITH CHECK (public.tenant_row_allowed(school_id) AND issued_by = auth.uid());

CREATE INDEX grade_levels_school_year_idx ON public.grade_levels(school_id, academic_year_id);
CREATE INDEX sections_school_grade_idx ON public.sections(school_id, grade_level_id);
CREATE INDEX enrollments_school_year_grade_section_idx ON public.student_enrollments(school_id, academic_year_id, grade_level_id, section_id);
CREATE INDEX subjects_school_grade_idx ON public.subjects(school_id, grade_level_id, sort_order);
CREATE INDEX scores_school_year_student_idx ON public.scores(school_id, academic_year_id, student_id, term);
CREATE INDEX issuances_school_date_idx ON public.result_issuances(school_id, issued_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER scores_updated_at BEFORE UPDATE ON public.scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_score_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.schools%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.schools WHERE id = NEW.school_id;
  IF NEW.exam_score > s.exam_max OR NEW.coursework_score > s.coursework_max THEN
    RAISE EXCEPTION 'تتجاوز الدرجة الحد المعتمد في إعدادات المدرسة';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER scores_validate_limits BEFORE INSERT OR UPDATE ON public.scores FOR EACH ROW EXECUTE FUNCTION public.validate_score_limits();

CREATE OR REPLACE FUNCTION public.ensure_one_active_year()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.academic_years SET is_active = false WHERE school_id = NEW.school_id AND id <> NEW.id AND is_active;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER academic_year_single_active BEFORE INSERT OR UPDATE OF is_active ON public.academic_years FOR EACH ROW EXECUTE FUNCTION public.ensure_one_active_year();

CREATE OR REPLACE FUNCTION public.bootstrap_school(
  p_school_name text,
  p_school_type public.school_type,
  p_region text,
  p_manager_name text,
  p_phone text,
  p_academic_year text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_school uuid;
  v_year uuid;
  v_grade uuid;
  g record;
  subject_name text;
  subject_list text[];
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'يجب تسجيل الدخول أولاً'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user) THEN RAISE EXCEPTION 'الحساب مرتبط بمدرسة مسبقاً'; END IF;

  INSERT INTO public.schools(name, school_type, region, owner_user_id)
  VALUES (trim(p_school_name), p_school_type, trim(p_region), v_user) RETURNING id INTO v_school;
  INSERT INTO public.profiles(user_id, school_id, full_name, phone)
  VALUES (v_user, v_school, trim(p_manager_name), trim(p_phone));
  INSERT INTO public.user_roles(user_id, role) VALUES (v_user, 'admin');
  INSERT INTO public.academic_years(school_id, name, is_active)
  VALUES (v_school, trim(p_academic_year), true) RETURNING id INTO v_year;

  FOR g IN SELECT * FROM (VALUES
    ('basic-1','الصف الأول الأساسي','basic'::public.school_stage,1),
    ('basic-2','الصف الثاني الأساسي','basic'::public.school_stage,2),
    ('basic-3','الصف الثالث الأساسي','basic'::public.school_stage,3),
    ('basic-4','الصف الرابع الأساسي','basic'::public.school_stage,4),
    ('basic-5','الصف الخامس الأساسي','basic'::public.school_stage,5),
    ('basic-6','الصف السادس الأساسي','basic'::public.school_stage,6),
    ('basic-7','الصف السابع الأساسي','basic'::public.school_stage,7),
    ('basic-8','الصف الثامن الأساسي','basic'::public.school_stage,8),
    ('basic-9','الصف التاسع الأساسي','basic'::public.school_stage,9),
    ('secondary-1','الأول الثانوي','secondary'::public.school_stage,10),
    ('secondary-2','الثاني الثانوي العلمي','secondary'::public.school_stage,11),
    ('secondary-3','الثالث الثانوي العلمي','secondary'::public.school_stage,12)
  ) AS grades(code,name,stage,sort_order) LOOP
    IF p_school_type = 'mixed' OR (p_school_type = 'basic' AND g.stage = 'basic') OR (p_school_type = 'secondary' AND g.stage = 'secondary') THEN
      INSERT INTO public.grade_levels(school_id, academic_year_id, code, name, stage, sort_order)
      VALUES (v_school, v_year, g.code, g.name, g.stage, g.sort_order) RETURNING id INTO v_grade;
      subject_list := CASE
        WHEN g.sort_order <= 3 THEN ARRAY['القرآن الكريم','التربية الإسلامية','اللغة العربية','الرياضيات','العلوم']
        WHEN g.sort_order <= 6 THEN ARRAY['القرآن الكريم','التربية الإسلامية','اللغة العربية','الرياضيات','العلوم','الاجتماعيات']
        WHEN g.sort_order <= 9 THEN ARRAY['القرآن الكريم','التربية الإسلامية','اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التاريخ','الجغرافيا','التربية الوطنية']
        WHEN g.sort_order = 10 THEN ARRAY['القرآن الكريم','التربية الإسلامية','اللغة العربية','اللغة الإنجليزية','الرياضيات','الفيزياء','الكيمياء','الأحياء','التاريخ','الجغرافيا','المجتمع اليمني']
        ELSE ARRAY['القرآن الكريم','التربية الإسلامية','اللغة العربية','اللغة الإنجليزية','الرياضيات','الفيزياء','الكيمياء','الأحياء']
      END;
      FOR subject_name IN SELECT unnest(subject_list) LOOP
        INSERT INTO public.subjects(school_id, grade_level_id, name, sort_order)
        VALUES (v_school, v_grade, subject_name, array_position(subject_list, subject_name));
      END LOOP;
    END IF;
  END LOOP;
  RETURN v_school;
END;
$$;
GRANT EXECUTE ON FUNCTION public.bootstrap_school(text, public.school_type, text, text, text, text) TO authenticated;
