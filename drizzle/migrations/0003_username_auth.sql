CREATE TABLE public.usernames (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[A-Za-z0-9_]{3,32}$')
);

ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.usernames TO service_role;

DO $$
DECLARE
  u record;
  v_base text;
  v_candidate text;
  v_suffix integer;
BEGIN
  FOR u IN SELECT id, email FROM auth.users WHERE email IS NOT NULL LOOP
    IF NOT EXISTS (SELECT 1 FROM public.usernames WHERE user_id = u.id) THEN
      v_base := lower(regexp_replace(split_part(u.email, '@', 1), '[^a-z0-9_]', '_', 'g'));
      IF char_length(v_base) < 3 THEN
        v_base := 'user_' || left(replace(u.id::text, '-', ''), 8);
      END IF;
      v_base := left(v_base, 24);
      v_candidate := v_base;
      v_suffix := 0;
      WHILE EXISTS (SELECT 1 FROM public.usernames WHERE username = v_candidate) LOOP
        v_suffix := v_suffix + 1;
        v_candidate := left(v_base, 31 - char_length(v_suffix::text)) || '_' || v_suffix::text;
      END LOOP;
      INSERT INTO public.usernames(user_id, username) VALUES (u.id, v_candidate);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.store_signup_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text := lower(trim(coalesce(NEW.raw_user_meta_data ->> 'username', '')));
BEGIN
  IF v_username = '' THEN
    RAISE EXCEPTION 'اسم المستخدم مطلوب';
  END IF;
  IF v_username !~ '^[a-z0-9_]{3,32}$' THEN
    RAISE EXCEPTION 'اسم المستخدم يجب أن يكون من 3 إلى 32 حرفًا: أحرف إنجليزية صغيرة وأرقام وشرطة سفلية فقط';
  END IF;
  INSERT INTO public.usernames(user_id, username)
  VALUES (NEW.id, v_username);
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'اسم المستخدم مستخدم بالفعل';
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_store_username ON auth.users;
CREATE TRIGGER on_auth_user_store_username
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.store_signup_username();

CREATE OR REPLACE FUNCTION public.get_my_username()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username FROM public.usernames WHERE user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_username() TO authenticated;

CREATE OR REPLACE FUNCTION public.change_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text := lower(trim(coalesce(p_username, '')));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول';
  END IF;
  IF v_username !~ '^[a-z0-9_]{3,32}$' THEN
    RAISE EXCEPTION 'اسم المستخدم يجب أن يكون من 3 إلى 32 حرفًا: أحرف إنجليزية صغيرة وأرقام وشرطة سفلية فقط';
  END IF;
  UPDATE public.usernames
  SET username = v_username, updated_at = now()
  WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    INSERT INTO public.usernames(user_id, username) VALUES (auth.uid(), v_username);
  END IF;
  RETURN v_username;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'اسم المستخدم مستخدم بالفعل';
END;
$$;
GRANT EXECUTE ON FUNCTION public.change_username(text) TO authenticated;
