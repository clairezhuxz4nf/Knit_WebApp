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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Will's test credentials - matching the app's test phone pattern
    const testEmail = 'will@knit.app';
    const testPassword = 'TestPassword123!';
    const testPhone = '+15555555556'; // Different from main test user

    console.log('Creating user for Will with email:', testEmail);

    // Create the user for Will
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      phone: testPhone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        display_name: 'Will'
      }
    });

    if (userError) {
      // If user already exists, try to get them
      if (userError.message.includes('already been registered')) {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.find(u => u.email === testEmail);
        if (existingUser) {
          // Update Will's person record with this user_id
          const { error: updateError } = await supabaseAdmin
            .from('people')
            .update({ 
              user_id: existingUser.id,
              status: 'active'
            })
            .eq('id', 'acb64313-154b-4c8a-9357-ab5517b965cf');

          if (updateError) {
            console.error('Error updating person:', updateError);
          }

          // Add as family member if not exists
          const { error: memberError } = await supabaseAdmin
            .from('family_members')
            .upsert({
              family_space_id: '4e4990c6-92cd-4a0b-a653-544fd8c87524',
              user_id: existingUser.id,
              display_name: 'Will',
              is_admin: false
            }, { onConflict: 'family_space_id,user_id' });

          if (memberError) {
            console.error('Error adding family member:', memberError);
          }

          return new Response(JSON.stringify({
            success: true,
            message: 'User already exists, linked to Will',
            credentials: {
              phone: testPhone,
              verificationCode: '123456',
              email: testEmail,
              password: testPassword
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        }
      }
      throw userError;
    }

    const userId = userData.user.id;
    console.log('Created user with ID:', userId);

    // Update Will's person record with the new user_id
    const { error: updateError } = await supabaseAdmin
      .from('people')
      .update({ 
        user_id: userId,
        status: 'active'
      })
      .eq('id', 'acb64313-154b-4c8a-9357-ab5517b965cf');

    if (updateError) {
      console.error('Error updating person:', updateError);
    }

    // Add Will as a family member
    const { error: memberError } = await supabaseAdmin
      .from('family_members')
      .insert({
        family_space_id: '4e4990c6-92cd-4a0b-a653-544fd8c87524',
        user_id: userId,
        display_name: 'Will',
        is_admin: false
      });

    if (memberError) {
      console.error('Error adding family member:', memberError);
    }

    return new Response(JSON.stringify({
      success: true,
      credentials: {
        phone: testPhone,
        verificationCode: '123456',
        email: testEmail,
        password: testPassword
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
