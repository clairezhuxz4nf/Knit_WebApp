import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Block in production
  if (Deno.env.get('ENVIRONMENT') === 'production') {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Require an authorization header (anon key or user JWT from supabase.functions.invoke)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, password } = await req.json();
    
    // Only allow known test emails
    const allowedTestEmails = ['testuser@knit.app', 'testuser2@knit.app', 'will@knit.app'];
    if (!email || !password || !allowedTestEmails.includes(email)) {
      return new Response(JSON.stringify({ error: 'Invalid test credentials' }), {
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
      const displayName = email === 'testuser2@knit.app' ? 'Priya Agrawal' : 'Test User';
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
            name: 'The Agrawal Family',
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
            first_name: 'Priya',
            last_name: 'Agrawal',
            is_admin: true,
            birth_date: '1990-08-20',
            status: 'active',
            created_by: userId,
          });

          // Add a couple placeholder family members
          const members = [
            { first_name: 'Rohan', last_name: 'Agrawal', birth_date: '1988-02-14' },
            { first_name: 'Dadaji', last_name: 'Agrawal', birth_date: '1955-06-30' },
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

          // Seed story bites
          const storyBites = [
            {
              title: "Grandma's Seventieth",
              description: "In July 2016, the whole family gathered at a mountain resort in Nanjing to celebrate Grandma's seventieth birthday. Though she was technically sixty-eight, someone had said a seventieth birthday should be counted two years early, and so three generations came together for a joyful reunion. What began decades earlier as a small family that had moved to Nanjing with few relatives nearby had, over time, grown into a large clan of eighteen members across six households.\n\nThat day was especially precious because all the grandchildren were present — perhaps the only time they would all stand together in one photograph. Ten years later, they are scattered across China, Japan, Ireland, and the United States, shaped by studies, work, and new lives abroad. Yet wherever they go, this moment remains — a reminder that because of their grandparents, they share a bond that distance cannot thin: family, rooted in love.",
              person_name: 'Priya Agrawal',
              content_type: 'stories',
              comic_path: '/comics/grandmas-seventieth.png',
              comic_name: 'grandmas-seventieth.png',
            },
            {
              title: 'Our Beginning',
              description: "In September 1994, as China's first long holiday approached, Mom and her coworkers planned a trip to the mountains. A mutual friend mentioned that another group was going too and offered to introduce them. On September 29, Mom met Dad at the gate of Nanjing University to coordinate the journey. A few days later, they stood together at Yellow Mountain and took their very first photo.\n\nWhat began as a simple introduction and a shared holiday became the beginning of a lifelong story. That trip led to a partnership that has now lasted more than thirty years — a reminder that sometimes, the most ordinary plans quietly change everything.",
              person_name: 'Priya Agrawal',
              content_type: 'stories',
              comic_path: '/comics/our-beginning.png',
              comic_name: 'our-beginning.png',
            },
            {
              title: 'First Family Photo',
              description: "On New Year's Day in 1997, Mom and Dad met up with old friends and wandered from Nanjing University to Gulou Park, chatting as they walked beneath a gray, damp winter sky. The air was chilly, but the mood was warm — laughter, familiar faces, and the easy comfort of friendship marking the start of a new year.\n\nThey took a photo that day, standing side by side against an old stone wall. At first glance, it looks like a picture of two people. But it was already a family of three. Their baby was quietly growing, soon to arrive and change everything. A few months later, she would be born — and that winter afternoon would become the first chapter of their life together.",
              person_name: 'Priya Agrawal',
              content_type: 'stories',
              comic_path: '/comics/first-family-photo.png',
              comic_name: 'first-family-photo.png',
            },
          ];

          for (const bite of storyBites) {
            const { data: sb } = await supabaseAdmin.from('story_bites').insert({
              family_space_id: familySpace.id,
              created_by: userId,
              title: bite.title,
              description: bite.description,
              person_name: bite.person_name,
              content_type: bite.content_type,
            }).select().single();

            if (sb) {
              await supabaseAdmin.from('storybooks').insert({
                story_bite_id: sb.id,
                family_space_id: familySpace.id,
                created_by: userId,
                file_path: bite.comic_path,
                file_name: bite.comic_name,
              });
            }
          }

          console.log('Created Agrawal family space with story bites:', familySpace.id);
          console.log('Created Agrawal family space:', familySpace.id);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      userId,
      email,
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
