import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { records } = await request.json();

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'अमान्य रिकॉर्ड डेटा' },
        { status: 400 }
      );
    }

    // Get project and existing raiyats
    const project = await db.project.findUnique({
      where: { id },
      include: { raiyatNames: true }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'प्रोजेक्ट नहीं मिला' },
        { status: 404 }
      );
    }

    const createdRecords = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Find or create raiyat
        let raiyat = project.raiyatNames.find(r => r.name === record.raiyatName);
        
        if (!raiyat) {
          raiyat = await db.raiyat.create({
            data: {
              name: record.raiyatName,
              projectId: id
            }
          });
        }

        // Check for duplicate khesra number for this raiyat
        const existingRecord = await db.landRecord.findFirst({
          where: {
            raiyatId: raiyat.id,
            projectId: id,
            khesraNumber: record.khesraNumber
          }
        });

        if (existingRecord) {
          errors.push(`पंक्ति ${i + 1}: रैयत ${record.raiyatName} के लिए खेसरा नंबर ${record.khesraNumber} पहले से मौजूद है`);
          continue;
        }

        // Create land record
        const newRecord = await db.landRecord.create({
          data: {
            timestamp: new Date().toISOString(),
            raiyatId: raiyat.id,
            projectId: id,
            jamabandiNumber: record.jamabandiNumber || null,
            khataNumber: record.khataNumber || null,
            khesraNumber: record.khesraNumber,
            rakwa: record.rakwa?.toString() || null,
            uttar: record.uttar || null,
            dakshin: record.dakshin || null,
            purab: record.purab || null,
            paschim: record.paschim || null,
            remarks: record.remarks || null
          }
        });

        createdRecords.push(newRecord);
      } catch (error) {
        errors.push(`पंक्ति ${i + 1}: ${error instanceof Error ? error.message : 'अज्ञात त्रुटि'}`);
      }
    }

    // Get updated project with all records
    const updatedProject = await db.project.findUnique({
      where: { id },
      include: {
        raiyatNames: true,
        landRecords: {
          include: { raiyat: true }
        }
      }
    });

    const transformedProject = {
      id: updatedProject?.id,
      name: updatedProject?.name,
      created: updatedProject?.createdAt.toISOString(),
      raiyatNames: updatedProject?.raiyatNames || [],
      landRecords: updatedProject?.landRecords.map(record => ({
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
      })) || [],
      raiyatColors: {}
    };

    return NextResponse.json({
      project: transformedProject,
      createdCount: createdRecords.length,
      errorCount: errors.length,
      errors
    });
  } catch (error) {
    console.error('Failed to import records:', error);
    return NextResponse.json(
      { error: 'रिकॉर्ड इंपोर्ट करने में विफल' },
      { status: 500 }
    );
  }
}