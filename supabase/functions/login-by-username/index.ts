const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const { username, password } = await req.json();
    const normalized = String(username ?? '').trim().toLowerCase();
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY');
    const publishableKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!secretKey || !publishableKey || !supabaseUrl) {
      throw new Error('Server authentication configuration is incomplete');
    }

    if (!/^[a-z0-9_]{3,32}$/.test(normalized) || typeof password !== 'string' || password.length === 0) {
      return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401, headers: corsHeaders });
    }

    const lookup = await fetch(`${supabaseUrl}/rest/v1/usernames?select=user_id&username=eq.${encodeURIComponent(normalized)}&limit=1`, {
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!lookup.ok) throw new Error('Username lookup failed');
    const rows = await lookup.json();
    if (!rows.length) {
      return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401, headers: corsHeaders });
    }

    const userId = rows[0].user_id;
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!userResponse.ok) throw new Error('User lookup failed');
    const user = await userResponse.json();
    if (!user.email) {
      return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401, headers: corsHeaders });
    }

    const signIn = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: user.email, password }),
    });

    const payload = await signIn.json();
    if (!signIn.ok) {
      return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401, headers: corsHeaders });
    }

    return Response.json(payload, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'تعذر إتمام تسجيل الدخول الآن' }, { status: 500, headers: corsHeaders });
  }
});
