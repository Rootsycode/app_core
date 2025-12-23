'use server';

import { requireAuthenticatedUser } from '@/lib/authHelpers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getUserProfile() {
  try {
    const user = await requireAuthenticatedUser();
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    // Intentar obtener el perfil del usuario
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('first_name, last_name, image_url')
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
          last_name: ''
        })
        .select('first_name, last_name, image_url')
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
        fullName: `${newProfile.first_name} ${newProfile.last_name}`.trim()
      };
    }

    return {
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      fullName: `${userProfile.first_name} ${userProfile.last_name}`.trim(),
      imageUrl: userProfile.image_url
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    const emailName = user.email?.split('@')[0] || 'Usuario';
    return {
      firstName: emailName,
      lastName: '',
      fullName: emailName
    };
  }
}

export async function getUserPops() {
  // Obtener el usuario autenticado
  const user = await requireAuthenticatedUser();
  const cookieStore = await cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  try {
    // Consultar el usuario en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('pops')
      .eq('id', user.uid)
      .single();

    if (userError || !userData) {
      // Si el usuario no existe en la tabla users, devolver array vacío
      // (puede ser un usuario nuevo que aún no tiene perfil creado)
      return [];
    }

    const popIds = userData.pops || []; // IDs de los "pop"

    if (!Array.isArray(popIds) || popIds.length === 0) {
      return []; // Si no hay IDs, devuelve un array vacío
    }

    // Consultar los pops usando los IDs
    const { data: pops, error: popsError } = await supabase
      .from('pops')
      .select('id, name, image_url')
      .in('id', popIds)
      .eq('is_active', true);

    if (popsError) {
      console.error('Error fetching pops:', popsError);
      return [];
    }

    // Mapear los datos a el formato esperado
    return (pops || []).map((pop) => ({
      id: pop.id,
      name: pop.name,
      imageUrl: pop.image_url
    }));
  } catch (error) {
    console.error('Error fetching pops:', error);
    return []; // Devolver array vacío en caso de error
  }
}
