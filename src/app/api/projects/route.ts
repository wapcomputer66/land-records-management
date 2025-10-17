import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all projects for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'यूजर ID आवश्यक है' },
        { status: 400 }
      );
    }

    // Get projects for the specific user
    const projects = await db.project.findMany({
      where: { userId },
      include: {
        raiyatNames: true,
        landRecords: {
          include: {
            raiyat: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the expected format
    const transformedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      created: project.createdAt.toISOString(),
      raiyatNames: project.raiyatNames,
      landRecords: project.landRecords.map(record => ({
        id: record.id,
        timestamp: record.timestamp,
        raiyatId: record.raiyatId,
        raiyatName: record.raiyat.name,
        jamabandiNumber: record.jamabandiNumber,
        khataNumber: record.khataNumber,
        khesraNumber: record.khesraNumber,
        rakwa: record.rakwa,
        uttar: record.uttar,
        dakshin: record.dakshin,
        purab: record.purab,
        paschim: record.paschim,
        remarks: record.remarks
      })),
      raiyatColors: {} // We can implement this later if needed
    }));

    return NextResponse.json({ projects: transformedProjects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'प्रोजेक्ट्स लोड करने में विफल' },
      { status: 500 }
    );
  }
}

// POST create a new project
export async function POST(request: NextRequest) {
  try {
    const { name, userId } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'प्रोजेक्ट नाम आवश्यक है' },
        { status: 400 }
      );
    }

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'यूजर ID आवश्यक है' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'यूजर मौजूद नहीं है' },
        { status: 404 }
      );
    }

    // Create project with default raiyat names
    const project = await db.project.create({
      data: {
        name: name.trim(),
        userId: userId,
        raiyatNames: {
          create: [
            { name: 'राम कुमार' },
            { name: 'सुरेश यादव' },
            { name: 'अनीता देवी' },
            { name: 'मोहन लाल' },
            { name: 'गीता सिंह' }
          ]
        }
      },
      include: {
        raiyatNames: true,
        landRecords: true
      }
    });

    const transformedProject = {
      id: project.id,
      name: project.name,
      created: project.createdAt.toISOString(),
      raiyatNames: project.raiyatNames,
      landRecords: [],
      raiyatColors: {}
    };

    return NextResponse.json({ project: transformedProject });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'प्रोजेक्ट बनाने में विफल' },
      { status: 500 }
    );
  }
}