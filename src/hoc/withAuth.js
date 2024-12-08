'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

const withAuth = Component => {
  // eslint-disable-next-line react/display-name
  return props => {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login')
      }
    }, [user, loading, router])

    if (loading) {
      return <p>Loading...</p>
    }

    return user ? <Component {...props} /> : null
  }
}

export default withAuth
