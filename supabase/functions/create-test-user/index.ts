import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate random test credentials
    const testEmail = `testuser_${Date.now()}@knit-family.test`;
    const testPassword = 'TestPassword123!';
    const familyCode = String(Math.floor(100000 + Math.random() * 900000));

    console.log('Creating test user with email:', testEmail);

    // Create the test user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        display_name: 'Sarah Thompson'
      }
    });

    if (userError) {
      console.error('Error creating user:', userError);
      throw userError;
    }

    const userId = userData.user.id;
    console.log('Created user with ID:', userId);

    // Create family space
    const { data: familySpace, error: familySpaceError } = await supabaseAdmin
      .from('family_spaces')
      .insert({
        name: 'The Thompson Family',
        family_code: familyCode,
        created_by: userId
      })
      .select()
      .single();

    if (familySpaceError) {
      console.error('Error creating family space:', familySpaceError);
      throw familySpaceError;
    }

    console.log('Created family space:', familySpace.id);

    // Create additional family member users
    const familyMembersData = [
      { email: `mike_${Date.now()}@knit-family.test`, name: 'Mike Thompson', first_name: 'Mike', last_name: 'Thompson', birthday: '1978-03-15' },
      { email: `emma_${Date.now()}@knit-family.test`, name: 'Emma Thompson', first_name: 'Emma', last_name: 'Thompson', birthday: '2005-07-22' },
      { email: `grandma_${Date.now()}@knit-family.test`, name: 'Grandma Rose', first_name: 'Grandma', last_name: 'Rose', birthday: '1952-12-01' }
    ];

    const memberIds: string[] = [userId];

    for (const member of familyMembersData) {
      const { data: memberUser, error: memberError } = await supabaseAdmin.auth.admin.createUser({
        email: member.email,
        password: testPassword,
        email_confirm: true,
        user_metadata: { display_name: member.name }
      });

      if (memberError) {
        console.error('Error creating member:', memberError);
        continue;
      }
      memberIds.push(memberUser.user.id);
    }

    // Add all family members to the people table (unified table)
    const peopleInsert = [
      { 
        family_space_id: familySpace.id, 
        user_id: userId, 
        first_name: 'Sarah', 
        last_name: 'Thompson', 
        is_admin: true, 
        birth_date: '1980-05-10',
        status: 'active',
        created_by: userId
      },
      { 
        family_space_id: familySpace.id, 
        user_id: memberIds[1] || userId, 
        first_name: 'Mike', 
        last_name: 'Thompson', 
        is_admin: false, 
        birth_date: '1978-03-15',
        status: 'active',
        created_by: userId
      },
      { 
        family_space_id: familySpace.id, 
        user_id: memberIds[2] || userId, 
        first_name: 'Emma', 
        last_name: 'Thompson', 
        is_admin: false, 
        birth_date: '2005-07-22',
        status: 'active',
        created_by: userId
      },
      { 
        family_space_id: familySpace.id, 
        user_id: memberIds[3] || userId, 
        first_name: 'Grandma', 
        last_name: 'Rose', 
        is_admin: false, 
        birth_date: '1952-12-01',
        status: 'active',
        created_by: userId
      }
    ];

    const { error: peopleError } = await supabaseAdmin
      .from('people')
      .insert(peopleInsert);

    if (peopleError) {
      console.error('Error inserting people:', peopleError);
    }

    // Create projects
    const projectsData = [
      { title: 'Family Cookbook', description: 'Collecting all of Grandma Rose\'s secret recipes', status: 'in_progress', progress: 45 },
      { title: 'Summer Vacation Album', description: 'Photos and memories from our trip to the beach', status: 'completed', progress: 100 },
      { title: 'Family Tree Research', description: 'Tracing our ancestry back through generations', status: 'in_progress', progress: 30 },
      { title: 'Holiday Card Design', description: 'Creating our annual family holiday card', status: 'paused', progress: 15 }
    ];

    const { error: projectsError } = await supabaseAdmin
      .from('projects')
      .insert(projectsData.map(p => ({
        ...p,
        family_space_id: familySpace.id,
        created_by: userId
      })));

    if (projectsError) {
      console.error('Error creating projects:', projectsError);
    }

    // Create events
    const eventsData = [
      { title: 'Emma\'s Birthday Party', description: 'Celebrating Emma turning 20!', event_date: '2025-07-22', event_type: 'birthday' },
      { title: 'Mom & Dad Anniversary', description: '25 years of love and laughter', event_date: '2025-06-15', event_type: 'anniversary' },
      { title: 'Christmas Gathering', description: 'Annual family Christmas dinner', event_date: '2025-12-25', event_type: 'holiday' },
      { title: 'Grandma\'s 73rd Birthday', description: 'Special celebration for Grandma Rose', event_date: '2025-12-01', event_type: 'birthday' },
      { title: 'Family Reunion', description: 'Yearly Thompson family reunion at the lake house', event_date: '2025-08-10', event_type: 'general' },
      { title: 'Emma\'s Graduation', description: 'High school graduation milestone', event_date: '2025-05-30', event_type: 'milestone' }
    ];

    const { error: eventsError } = await supabaseAdmin
      .from('events')
      .insert(eventsData.map(e => ({
        ...e,
        family_space_id: familySpace.id,
        created_by: userId
      })));

    if (eventsError) {
      console.error('Error creating events:', eventsError);
    }

    console.log('Test data created successfully');

    return new Response(JSON.stringify({
      success: true,
      credentials: {
        email: testEmail,
        password: testPassword
      },
      familyCode: familyCode,
      familyName: 'The Thompson Family',
      familyMembers: ['Sarah Thompson (Admin)', 'Mike Thompson', 'Emma Thompson', 'Grandma Rose'],
      projectsCreated: projectsData.length,
      eventsCreated: eventsData.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create test data';
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});