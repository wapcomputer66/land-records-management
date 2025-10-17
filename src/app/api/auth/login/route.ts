import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'ईमेल और पासवर्ड आवश्यक हैं' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'यह ईमेल एड्रेस रजिस्टर नहीं है' },
        { status: 400 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'गलत पासवर्ड' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'लॉगिन सफल',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'लॉगिन में त्रुटि हुई' },
      { status: 500 }
    );
  }
}