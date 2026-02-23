import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Find or create the test user, and ensure password matches
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = users.find(u => u.email === email);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // Update password to ensure it matches
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: password,
      });
      if (updateError) throw updateError;
      userId = existingUser.id;
    } else {
      // Create user
      const displayName = email === 'testuser2@knit.app' ? 'Jordan Lee' : 'Test User';
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
      isNewUser = true;
    }

    // For the second test user, ensure they have a family space
    if (email === 'testuser2@knit.app') {
      const { data: existingPeople } = await supabaseAdmin
        .from('people')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!existingPeople || existingPeople.length === 0) {
        // Create a separate family space for this user
        const familyCode = String(Math.floor(100000 + Math.random() * 900000));
        const { data: familySpace, error: fsError } = await supabaseAdmin
          .from('family_spaces')
          .insert({
            name: 'The Lee Family',
            family_code: familyCode,
            created_by: userId,
          })
          .select()
          .single();

        if (fsError) {
          console.error('Error creating family space:', fsError);
        } else {
          // Add the user as admin member
          await supabaseAdmin.from('people').insert({
            family_space_id: familySpace.id,
            user_id: userId,
            first_name: 'Jordan',
            last_name: 'Lee',
            is_admin: true,
            birth_date: '1990-08-20',
            status: 'active',
            created_by: userId,
          });

          // Add a couple placeholder family members
          const members = [
            { first_name: 'Alex', last_name: 'Lee', birth_date: '1988-02-14' },
            { first_name: 'Grandpa', last_name: 'Lee', birth_date: '1955-06-30' },
          ];
          for (const m of members) {
            await supabaseAdmin.from('people').insert({
              family_space_id: familySpace.id,
              first_name: m.first_name,
              last_name: m.last_name,
              birth_date: m.birth_date,
              status: 'placeholder',
              created_by: userId,
            });
          }

          // Create a project
          await supabaseAdmin.from('projects').insert({
            family_space_id: familySpace.id,
            created_by: userId,
            title: 'Family Photo Album',
            description: 'Collecting memories from our family trips',
            status: 'in_progress',
            progress: 20,
          });

          // Create an event
          await supabaseAdmin.from('events').insert({
            family_space_id: familySpace.id,
            created_by: userId,
            title: 'Family BBQ',
            description: 'Annual backyard barbecue',
            event_date: '2026-07-04',
            event_type: 'general',
          });

          console.log('Created Lee family space:', familySpace.id);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      userId,
      email,
      password,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Test login failed';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
