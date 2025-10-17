import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST add a new raiyat to a project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { name } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'रैयत नाम आवश्यक है' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { raiyatNames: true }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'प्रोजेक्ट नहीं मिला' },
        { status: 404 }
      );
    }

    // Check if raiyat name already exists
    const existingRaiyat = project.raiyatNames.find(
      r => r.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existingRaiyat) {
      return NextResponse.json(
        { error: 'यह रैयत नाम पहले से मौजूद है' },
        { status: 400 }
      );
    }

    // Create new raiyat
    const newRaiyat = await db.raiyat.create({
      data: {
        name: name.trim(),
        projectId: projectId
      }
    });

    // Get updated project
    const updatedProject = await db.project.findUnique({
      where: { id: projectId },
      include: {
        raiyatNames: true,
        landRecords: {
          include: {
            raiyat: true
          }
        }
      }
    });

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'प्रोजेक्ट अपडेट करने में विफल' },
        { status: 500 }
      );
    }

    const transformedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      created: updatedProject.createdAt.toISOString(),
      raiyatNames: updatedProject.raiyatNames,
      landRecords: updatedProject.landRecords.map(record => ({
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
      raiyatColors: {}
    };

    return NextResponse.json({ project: transformedProject });
  } catch (error) {
    console.error('Failed to add raiyat:', error);
    return NextResponse.json(
      { error: 'रैयत नाम जोड़ने में विफल' },
      { status: 500 }
    );
  }
}