import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT update a land record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; recordId: string } }
) {
  try {
    const projectId = params.id;
    const recordId = params.recordId;
    const updateData = await request.json();

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

    // Check if record exists
    const existingRecord = await db.landRecord.findFirst({
      where: {
        id: recordId,
        projectId: projectId
      }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'रिकॉर्ड नहीं मिला' },
        { status: 404 }
      );
    }

    // If raiyatId is being updated, validate it
    if (updateData.raiyatId) {
      const raiyat = await db.raiyat.findFirst({
        where: {
          id: updateData.raiyatId,
          projectId: projectId
        }
      });

      if (!raiyat) {
        return NextResponse.json(
          { error: 'रैयत नहीं मिला' },
          { status: 404 }
        );
      }
    }

    // Check for duplicate record (if khesraNumber or raiyatId is being updated)
    if (updateData.khesraNumber || updateData.raiyatId) {
      const duplicateRecord = await db.landRecord.findFirst({
        where: {
          id: { not: recordId },
          projectId: projectId,
          raiyatId: updateData.raiyatId || existingRecord.raiyatId,
          khesraNumber: updateData.khesraNumber || existingRecord.khesraNumber
        }
      });

      if (duplicateRecord) {
        return NextResponse.json(
          { error: 'इस रैयत के लिए यह खेसरा नंबर पहले से मौजूद है' },
          { status: 400 }
        );
      }
    }

    // Update the record
    const updatedRecord = await db.landRecord.update({
      where: { id: recordId },
      data: {
        ...(updateData.jamabandiNumber !== undefined && { jamabandiNumber: updateData.jamabandiNumber || null }),
        ...(updateData.khataNumber !== undefined && { khataNumber: updateData.khataNumber || null }),
        ...(updateData.khesraNumber !== undefined && { khesraNumber: updateData.khesraNumber }),
        ...(updateData.rakwa !== undefined && { rakwa: updateData.rakwa || null }),
        ...(updateData.uttar !== undefined && { uttar: updateData.uttar || null }),
        ...(updateData.dakshin !== undefined && { dakshin: updateData.dakshin || null }),
        ...(updateData.purab !== undefined && { purab: updateData.purab || null }),
        ...(updateData.paschim !== undefined && { paschim: updateData.paschim || null }),
        ...(updateData.remarks !== undefined && { remarks: updateData.remarks || null }),
        ...(updateData.raiyatId && { raiyatId: updateData.raiyatId }),
        timestamp: new Date().toLocaleString('hi-IN')
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
    console.error('Failed to update land record:', error);
    return NextResponse.json(
      { error: 'रिकॉर्ड अपडेट करने में विफल' },
      { status: 500 }
    );
  }
}

// DELETE a land record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; recordId: string } }
) {
  try {
    const projectId = params.id;
    const recordId = params.recordId;

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

    // Check if record exists
    const existingRecord = await db.landRecord.findFirst({
      where: {
        id: recordId,
        projectId: projectId
      }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'रिकॉर्ड नहीं मिला' },
        { status: 404 }
      );
    }

    // Delete the record
    await db.landRecord.delete({
      where: { id: recordId }
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
    console.error('Failed to delete land record:', error);
    return NextResponse.json(
      { error: 'रिकॉर्ड डिलीट करने में विफल' },
      { status: 500 }
    );
  }
}