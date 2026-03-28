import { BetaAnalyticsDataClient } from '@google-analytics/data';

/**
 * Analytics service to fetch data from Google Analytics 4 using the Data API.
 * Uses service account credentials from GOOGLE_SERVICE_ACCOUNT_JSON env var.
 */

const getClient = () => {
  const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  
  if (!serviceAccount) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured in environment variables');
  }

  try {
    const credentials = JSON.parse(serviceAccount);
    
    return new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key?.replace(/\\n/g, '\n'),
      },
      projectId: credentials.project_id,
    });
  } catch (error) {
    console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', error);
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format');
  }
};

export async function getAnalyticsData(startDate: string = '7daysAgo', endDate: string = 'today') {
  const propertyId = process.env.NEXT_PUBLIC_PROPERTY_ID;
  
  if (!propertyId) {
    throw new Error('NEXT_PUBLIC_PROPERTY_ID is not configured');
  }

  const client = getClient();

  // Fetch multiple metrics for the specified date range
  const response = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'eventCount' }
    ],
    metricAggregations: [1], 
  });

  return response[0];
}

export async function getRealtimeActiveUsers() {
    const propertyId = process.env.NEXT_PUBLIC_PROPERTY_ID;
    
    if (!propertyId) {
      throw new Error('NEXT_PUBLIC_PROPERTY_ID is not configured');
    }
  
    const client = getClient();
  
    // Fetch real-time active users (last 30 minutes)
    const [response] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });
  
    return response;
  }
