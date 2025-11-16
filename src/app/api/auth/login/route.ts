import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Traditional username/password login
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    return createAuthResponse(user)

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed, please try again later' },
      { status: 500 }
    )
  }
}


// Common function to create authentication response
async function createAuthResponse(user: any) {
  const token = await signToken({
    userId: user.id,
    username: user.username,
    email: user.email
  })

  const response = NextResponse.json({
    user: {
      userId: user.id,
      username: user.username,
      email: user.email
    }
  })

  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  return response
}
