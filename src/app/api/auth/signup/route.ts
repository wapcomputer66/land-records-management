import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'ईमेल और पासवर्ड दोनों आवश्यक हैं' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'यह ईमेल एड्रेस पहले से रजिस्टर है' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    // Create default project for new user
    const defaultProject = await db.project.create({
      data: {
        name: 'मेरा प्रोजेक्ट',
        userId: user.id,
        raiyatNames: {
          create: [
            { name: 'राम कुमार' },
            { name: 'सुरेश यादव' },
            { name: 'अनीता देवी' },
            { name: 'मोहन लाल' },
            { name: 'गीता सिंह' }
          ]
        }
      }
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create response
    const response = NextResponse.json({
      message: 'अकाउंट सफलतापूर्वक बनाया गया',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'अकाउंट बनाते समय त्रुटि हुई' },
      { status: 500 }
    );
  }
}