import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE a raiyat from a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; raiyatId: string } }
) {
  try {
    const projectId = params.id;
    const raiyatId = params.raiyatId;

    // Check if raiyat exists and belongs to the project
    const raiyat = await db.raiyat.findFirst({
      where: {
        id: raiyatId,
        projectId: projectId
      }
    });

    if (!raiyat) {
      return NextResponse.json(
        { error: 'रैयत नहीं मिला' },
        { status: 404 }
      );
    }

    // Delete raiyat (cascade will handle related land records if needed)
    await db.raiyat.delete({
      where: { id: raiyatId }
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
    console.error('Failed to delete raiyat:', error);
    return NextResponse.json(
      { error: 'रैयत नाम डिलीट करने में विफल' },
      { status: 500 }
    );
  }
}