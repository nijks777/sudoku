import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Puzzle } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    console.log('Warming up database connection...');
    await connectDB();
    // Perform a lightweight query to keep the connection alive and the cluster warm
    await Puzzle.findOne().lean();
    console.log('Database warmed up successfully.');

    return NextResponse.json({
      success: true,
      message: 'Database warmed up successfully.',
    });
  } catch (error) {
    console.error('Error warming up database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to warm up database' },
      { status: 500 }
    );
  }
}
