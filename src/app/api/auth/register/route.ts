import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'ईमेल और पासवर्ड आवश्यक हैं' },
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
        { status: 400 }
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

    // Create default project
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

    return NextResponse.json({
      message: 'अकाउंट सफलतापूर्वक बनाया गया',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'रजिस्ट्रेशन में त्रुटि हुई' },
      { status: 500 }
    );
  }
}