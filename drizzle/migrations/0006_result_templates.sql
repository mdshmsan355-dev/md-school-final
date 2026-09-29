-- Official Md School result-card templates: three child-friendly and three formal variants.
ALTER TYPE public.result_template ADD VALUE IF NOT EXISTS 'children_blue';
ALTER TYPE public.result_template ADD VALUE IF NOT EXISTS 'children_green';
ALTER TYPE public.result_template ADD VALUE IF NOT EXISTS 'children_orange';
ALTER TYPE public.result_template ADD VALUE IF NOT EXISTS 'formal_blue';
ALTER TYPE public.result_template ADD VALUE IF NOT EXISTS 'formal_green';
ALTER TYPE public.result_template ADD VALUE IF NOT EXISTS 'formal_gold';
