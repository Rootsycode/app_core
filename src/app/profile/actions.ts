'use server';

import { requireAuthenticatedUser } from '@/lib/authHelpers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getUserProfile() {
  try {
    const user = await requireAuthenticatedUser();
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    // Intentar obtener el perfil completo del usuario
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('first_name, last_name, image_url, phone, address, city, state, country, postal_code, date_of_birth, gender, bio, website, timezone, language, is_email_verified, is_phone_verified, last_login_at, metadata')
      .eq('id', user.uid)
      .single();

    // Si no existe, crearlo automáticamente
    if (error || !userProfile) {
      const emailName = user.email?.split('@')[0] || 'Usuario';
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.uid,
          first_name: emailName,
          last_name: '',
          country: 'AR',
          timezone: 'America/Argentina/Buenos_Aires',
          language: 'es'
        })
        .select('first_name, last_name, image_url, phone, address, city, state, country, postal_code, date_of_birth, gender, bio, website, timezone, language, is_email_verified, is_phone_verified, last_login_at, metadata')
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return {
          firstName: emailName,
          lastName: '',
          fullName: emailName
        };
      }

      return {
        firstName: newProfile.first_name,
        lastName: newProfile.last_name,
        fullName: `${newProfile.first_name} ${newProfile.last_name}`.trim(),
        imageUrl: newProfile.image_url,
        phone: newProfile.phone,
        address: newProfile.address,
        city: newProfile.city,
        state: newProfile.state,
        country: newProfile.country,
        postalCode: newProfile.postal_code,
        dateOfBirth: newProfile.date_of_birth,
        gender: newProfile.gender,
        bio: newProfile.bio,
        website: newProfile.website,
        timezone: newProfile.timezone,
        language: newProfile.language,
        isEmailVerified: newProfile.is_email_verified,
        isPhoneVerified: newProfile.is_phone_verified,
        lastLoginAt: newProfile.last_login_at,
        metadata: newProfile.metadata
      };
    }

    return {
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      fullName: `${userProfile.first_name} ${userProfile.last_name}`.trim(),
      imageUrl: userProfile.image_url,
      phone: userProfile.phone,
      address: userProfile.address,
      city: userProfile.city,
      state: userProfile.state,
      country: userProfile.country,
      postalCode: userProfile.postal_code,
      dateOfBirth: userProfile.date_of_birth,
      gender: userProfile.gender,
      bio: userProfile.bio,
      website: userProfile.website,
      timezone: userProfile.timezone,
      language: userProfile.language,
      isEmailVerified: userProfile.is_email_verified,
      isPhoneVerified: userProfile.is_phone_verified,
      lastLoginAt: userProfile.last_login_at,
      metadata: userProfile.metadata
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    const emailName = (await requireAuthenticatedUser()).email?.split('@')[0] || 'Usuario';
    return {
      firstName: emailName,
      lastName: '',
      fullName: emailName,
      imageUrl: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      country: 'AR',
      postalCode: null,
      dateOfBirth: null,
      gender: null,
      bio: null,
      website: null,
      timezone: 'America/Argentina/Buenos_Aires',
      language: 'es',
      isEmailVerified: false,
      isPhoneVerified: false,
      lastLoginAt: null,
      metadata: {}
    };
  }
}

export async function getUserPops() {
  // Obtener el usuario autenticado
  const user = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  try {
    // Usar la función helper para obtener POPs accesibles
    const { data: accessiblePops, error: popsError } = await supabase
      .rpc('get_user_accessible_pops', {
        user_id: user.uid
      });

    if (popsError) {
      console.error('Error fetching accessible pops:', popsError);
      return [];
    }

    // Si no hay POPs, retornar array vacío
    if (!accessiblePops || accessiblePops.length === 0) {
      return [];
    }

    // Obtener información de suscripción para cada POP
    const popsWithSubscription = await Promise.all(
      accessiblePops.map(async (pop) => {
        try {
          // Obtener información de suscripción
          const { data: subscriptionInfo, error: subscriptionError } = await supabase
            .rpc('get_pop_subscription_info', {
              pop_id: pop.pop_id
            });

          // Si hay error o no hay datos, continuar sin suscripción
          if (subscriptionError || !subscriptionInfo || subscriptionInfo.length === 0) {
            return {
              id: pop.pop_id,
              name: pop.pop_name,
              imageUrl: null,
              roleId: pop.role_id,
              roleName: pop.role_name,
              isOwner: pop.is_owner,
              subscription: null
            };
          }

          const subscription = subscriptionInfo[0];

          return {
            id: pop.pop_id,
            name: pop.pop_name,
            imageUrl: null,
            roleId: pop.role_id,
            roleName: pop.role_name,
            isOwner: pop.is_owner,
            subscription: {
              status: subscription.status,
              planName: subscription.plan_display_name,
              planDisplayName: subscription.plan_display_name,
              businessTypeName: subscription.business_type_display_name,
              businessTypeDisplayName: subscription.business_type_display_name,
              daysRemaining: subscription.days_remaining,
              isActive: subscription.is_active,
              trialEndsAt: subscription.trial_ends_at,
              currentPeriodEnd: subscription.current_period_end
            }
          };
        } catch (err) {
          console.error(`Error getting subscription for POP ${pop.pop_id}:`, err);
          // Retornar POP sin suscripción en caso de error
          return {
            id: pop.pop_id,
            name: pop.pop_name,
            imageUrl: null,
            roleId: pop.role_id,
            roleName: pop.role_name,
            isOwner: pop.is_owner,
            subscription: null
          };
        }
      })
    );

    return popsWithSubscription;
  } catch (error) {
    console.error('Error fetching pops:', error);
    return []; // Devolver array vacío en caso de error
  }
}
