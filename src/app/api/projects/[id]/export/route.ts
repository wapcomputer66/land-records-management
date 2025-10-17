import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Export a single project as CSV
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Get project with all data
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        landRecords: {
          include: {
            raiyat: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'प्रोजेक्ट नहीं मिला' },
        { status: 404 }
      );
    }

    // Generate CSV content
    let csvContent = "रैयत नाम,जमाबंदी नंबर,खाता नंबर,खेसरा नंबर,रकवा,उत्तर,दक्षिण,पूर्व,पश्चिम,रिमार्क्स\n";
    
    project.landRecords.forEach(record => {
      const row = [
        `"${record.raiyat.name}"`,
        `"${record.jamabandiNumber || ''}"`,
        `"${record.khataNumber || ''}"`,
        `"${record.khesraNumber}"`,
        `"${record.rakwa || ''}"`,
        `"${record.uttar || ''}"`,
        `"${record.dakshin || ''}"`,
        `"${record.purab || ''}"`,
        `"${record.paschim || ''}"`,
        `"${record.remarks || ''}"`
      ].join(',');
      csvContent += row + '\n';
    });

    // Return as CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${project.name}.csv"`
      }
    });
  } catch (error) {
    console.error('Failed to export project:', error);
    return NextResponse.json(
      { error: 'एक्सपोर्ट करने में विफल' },
      { status: 500 }
    );
  }
}