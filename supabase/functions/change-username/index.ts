const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const publishableKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY');
    if (!authHeader || !supabaseUrl || !publishableKey || !secretKey) throw new Error('Server authentication configuration is incomplete');
    const { username, currentPassword } = await req.json();
    const normalized = String(username ?? '').trim().toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/.test(normalized) || typeof currentPassword !== 'string' || !currentPassword) return Response.json({ error: 'بيانات التحقق غير صحيحة' }, { status: 400, headers: corsHeaders });
    const me = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: publishableKey, Authorization: authHeader } });
    if (!me.ok) return Response.json({ error: 'انتهت جلسة الدخول' }, { status: 401, headers: corsHeaders });
    const user = await me.json();
    if (!user.email) return Response.json({ error: 'تعذر التحقق من الحساب' }, { status: 401, headers: corsHeaders });
    const verify = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: currentPassword }) });
    if (!verify.ok) return Response.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401, headers: corsHeaders });
    const update = await fetch(`${supabaseUrl}/rest/v1/usernames?user_id=eq.${encodeURIComponent(user.id)}`, { method: 'PATCH', headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ username: normalized, updated_at: new Date().toISOString() }) });
    if (!update.ok) { const body = await update.text(); if (body.includes('duplicate') || body.includes('unique')) return Response.json({ error: 'اسم المستخدم مستخدم بالفعل' }, { status: 409, headers: corsHeaders }); throw new Error('Username update failed'); }
    return Response.json({ username: normalized }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) { console.error(error); return Response.json({ error: 'تعذر تغيير اسم المستخدم الآن' }, { status: 500, headers: corsHeaders }); }
});
