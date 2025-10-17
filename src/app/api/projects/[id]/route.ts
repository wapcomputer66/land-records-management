import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'प्रोजेक्ट नाम आवश्यक है' },
        { status: 400 }
      );
    }

    const project = await db.project.update({
      where: { id },
      data: { name: name.trim() },
      include: {
        raiyatNames: true,
        landRecords: {
          include: {
            raiyat: true
          }
        }
      }
    });

    const transformedProject = {
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
      raiyatColors: {}
    };

    return NextResponse.json({ project: transformedProject });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { error: 'प्रोजेक्ट अपडेट करने में विफल' },
      { status: 500 }
    );
  }
}