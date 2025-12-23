'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContextSupabase'

export const withGuestAuth = Component => {
  // eslint-disable-next-line react/display-name
  return props => {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && user) {
        router.push('/profile')
      }
    }, [user, loading, router])

    if (loading) {
      return <p>Loading...</p>
    }

    return !user ? <Component {...props} /> : null
  }
}
