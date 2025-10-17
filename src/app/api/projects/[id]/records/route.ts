import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST create a new land record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const {
      raiyatName,
      jamabandiNumber,
      khataNumber,
      khesraNumber,
      rakwa,
      uttar,
      dakshin,
      purab,
      paschim,
      remarks
    } = await request.json();

    // Validation
    if (!raiyatName || !khesraNumber) {
      return NextResponse.json(
        { error: 'रैयत नाम और खेसरा नंबर आवश्यक हैं' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'प्रोजेक्ट नहीं मिला' },
        { status: 404 }
      );
    }

    // Check if raiyat exists
    const raiyat = await db.raiyat.findFirst({
      where: {
        id: raiyatName,
        projectId: projectId
      }
    });

    if (!raiyat) {
      return NextResponse.json(
        { error: 'रैयत नहीं मिला' },
        { status: 404 }
      );
    }

    // Check for duplicate record
    const existingRecord = await db.landRecord.findFirst({
      where: {
        raiyatId: raiyatName,
        khesraNumber: khesraNumber,
        projectId: projectId
      }
    });

    if (existingRecord) {
      return NextResponse.json(
        { error: 'इस रैयत के लिए यह खेसरा नंबर पहले से मौजूद है' },
        { status: 400 }
      );
    }

    // Create new land record
    const newRecord = await db.landRecord.create({
      data: {
        timestamp: new Date().toLocaleString('hi-IN'),
        jamabandiNumber: jamabandiNumber || null,
        khataNumber: khataNumber || null,
        khesraNumber: khesraNumber,
        rakwa: rakwa || null,
        uttar: uttar || null,
        dakshin: dakshin || null,
        purab: purab || null,
        paschim: paschim || null,
        remarks: remarks || null,
        raiyatId: raiyatName,
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
    console.error('Failed to create land record:', error);
    return NextResponse.json(
      { error: 'रिकॉर्ड सेव करने में विफल' },
      { status: 500 }
    );
  }
}