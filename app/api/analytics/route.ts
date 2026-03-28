import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsData, getRealtimeActiveUsers } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || 'this-week';

  // Map period to GA4 date ranges
  let startDate = '7daysAgo';
  let endDate = 'today';

  switch (period) {
    case 'today':
      startDate = 'today';
      endDate = 'today';
      break;
    case 'this-week':
      startDate = '7daysAgo';
      endDate = 'today';
      break;
    case 'last-week':
      startDate = '14daysAgo';
      endDate = '7daysAgo';
      break;
    case 'this-month':
      startDate = '30daysAgo';
      endDate = 'today';
      break;
    case 'last-month':
      startDate = '60daysAgo';
      endDate = '30daysAgo';
      break;
    case 'this-year':
      startDate = '365daysAgo';
      endDate = 'today';
      break;
    case 'last-year':
      startDate = '730daysAgo';
      endDate = '365daysAgo';
      break;
  }

  try {
    const [reportData, realtimeData] = await Promise.all([
      getAnalyticsData(startDate, endDate),
      getRealtimeActiveUsers(),
    ]);

    const summary = {
      realtime: {
        activeUsers: realtimeData.rows?.[0]?.metricValues?.[0]?.value || '0',
      },
      headers: reportData.metricHeaders?.map(h => h.name) || [],
      rows: reportData.rows?.map(row => ({
        date: row.dimensionValues?.[0]?.value,
        metrics: row.metricValues?.map(m => m.value) || [],
      })) || [],
      totals: reportData.totals?.[0]?.metricValues?.map(m => m.value) || [],
    };

    return NextResponse.json(summary);
  } catch (error: unknown) {
    const e = error as Error;
    console.error('Analytics API Error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
