'use server'

import { requireAuthenticatedUser } from '@/lib/authHelpers'
import { createClient } from '@/utils/supabase/server'

export type UserProfileDTO = {
  email: string | null
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  dateOfBirth: string | null
  gender: string | null
  bio: string | null
  website: string | null
  timezone: string | null
  language: string | null
  isEmailVerified: boolean
  isPhoneVerified: boolean
  lastLoginAt: string | null
  metadata: Record<string, unknown>
}

export type UpdateUserProfileInput = {
  firstName?: string
  lastName?: string
  phone?: string | null
  imageUrl?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  bio?: string | null
  website?: string | null
  timezone?: string | null
  language?: string | null
}

function mapRowToDto (
  user: { email?: string | null },
  row: Record<string, unknown>
): UserProfileDTO {
  const fn = String(row.first_name ?? '')
  const ln = String(row.last_name ?? '')
  return {
    email: user.email ?? null,
    firstName: fn,
    lastName: ln,
    fullName: `${fn} ${ln}`.trim(),
    imageUrl: (row.image_url as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    postalCode: (row.postal_code as string | null) ?? null,
    dateOfBirth: (row.date_of_birth as string | null) ?? null,
    gender: (row.gender as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    timezone: (row.timezone as string | null) ?? null,
    language: (row.language as string | null) ?? null,
    isEmailVerified: Boolean(row.is_email_verified),
    isPhoneVerified: Boolean(row.is_phone_verified),
    lastLoginAt: (row.last_login_at as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {}
  }
}

export async function getUserProfile (): Promise<UserProfileDTO> {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const { data: userProfile, error } = await supabase
      .from('users')
      .select(
        'first_name, last_name, image_url, phone, address, city, state, country, postal_code, date_of_birth, gender, bio, website, timezone, language, is_email_verified, is_phone_verified, last_login_at, metadata'
      )
      .eq('id', user.uid)
      .single()

    if (error || !userProfile) {
      const emailName = user.email?.split('@')[0] || 'Usuario'
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
        .select(
          'first_name, last_name, image_url, phone, address, city, state, country, postal_code, date_of_birth, gender, bio, website, timezone, language, is_email_verified, is_phone_verified, last_login_at, metadata'
        )
        .single()

      if (createError || !newProfile) {
        return {
          email: user.email ?? null,
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
        }
      }

      return mapRowToDto(user, newProfile as Record<string, unknown>)
    }

    return mapRowToDto(user, userProfile as Record<string, unknown>)
  } catch {
    let email: string | null = null
    let emailName = 'Usuario'
    try {
      const u = await requireAuthenticatedUser()
      email = u.email ?? null
      emailName = u.email?.split('@')[0] || 'Usuario'
    } catch {
    }
    return {
      email,
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
    }
  }
}

export async function updateUserProfile (
  payload: UpdateUserProfileInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const row: Record<string, unknown> = {}
    if (payload.firstName !== undefined) row.first_name = payload.firstName
    if (payload.lastName !== undefined) row.last_name = payload.lastName
    if (payload.phone !== undefined) row.phone = payload.phone
    if (payload.imageUrl !== undefined) row.image_url = payload.imageUrl
    if (payload.address !== undefined) row.address = payload.address
    if (payload.city !== undefined) row.city = payload.city
    if (payload.state !== undefined) row.state = payload.state
    if (payload.country !== undefined) row.country = payload.country
    if (payload.postalCode !== undefined) row.postal_code = payload.postalCode
    if (payload.dateOfBirth !== undefined) row.date_of_birth = payload.dateOfBirth || null
    if (payload.gender !== undefined) row.gender = payload.gender || null
    if (payload.bio !== undefined) row.bio = payload.bio
    if (payload.website !== undefined) row.website = payload.website || null
    if (payload.timezone !== undefined) row.timezone = payload.timezone
    if (payload.language !== undefined) row.language = payload.language

    if (Object.keys(row).length === 0) {
      return { success: true }
    }

    const { error } = await supabase.from('users').update(row).eq('id', user.uid)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function getUserPops () {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { data: accessiblePops, error: popsError } = await supabase.rpc(
      'get_user_accessible_pops',
      {
        user_id: user.uid
      }
    )

    if (popsError) {
      return []
    }

    if (!accessiblePops || accessiblePops.length === 0) {
      return []
    }

    type PopRow = {
      pop_id: string
      pop_name: string
      role_id: string
      role_name: string
      is_owner: boolean
    }

    const popsWithSubscription = await Promise.all(
      (accessiblePops as PopRow[]).map(async (pop) => {
        try {
          const { data: subscriptionInfo, error: subscriptionError } =
            await supabase.rpc('get_pop_subscription_info', {
              pop_id: pop.pop_id
            })

          if (
            subscriptionError ||
            !subscriptionInfo ||
            subscriptionInfo.length === 0
          ) {
            return {
              id: pop.pop_id,
              name: pop.pop_name,
              imageUrl: null,
              roleId: pop.role_id,
              roleName: pop.role_name,
              isOwner: pop.is_owner,
              subscription: null
            }
          }

          const subscription = subscriptionInfo[0]

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
          }
        } catch {
          return {
            id: pop.pop_id,
            name: pop.pop_name,
            imageUrl: null,
            roleId: pop.role_id,
            roleName: pop.role_name,
            isOwner: pop.is_owner,
            subscription: null
          }
        }
      })
    )

    return popsWithSubscription
  } catch {
    return []
  }
}
