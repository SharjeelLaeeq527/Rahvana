'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResultPage } from './ResultPage';
import { InterviewPrepOutput } from '@/lib/interview-prep';
import { Loader } from "@/components/ui/spinner";

export default function InterviewPrepResultPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InterviewPrepOutput | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Get the sessionId from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('sessionId');
        
        if (!sessionId) {
          setError('Session ID is required');
          setLoading(false);
          return;
        }

        // Get email from localStorage or use a default for now
        const userEmail = localStorage.getItem('userEmail') || 'test@example.com';
        
        // Fetch the session data
        const response = await fetch(
          `/api/interview-prep/sessions/${sessionId}?userEmail=${encodeURIComponent(userEmail)}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch session data');
        }
        
        const data = await response.json();
        
        if (data.session && data.session.interview_prep_results) {
          setResults(data.session.interview_prep_results.generated_questions);
        } else {
          setError('Session results not found');
        }
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      fetchSessionData();
    }
  }, []);

  const handleRestart = () => {
    router.push('/interview-prep');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" text="Loading results..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Session</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRestart}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md"
          >
            Start New Interview Prep
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Results Found</h2>
          <p className="text-yellow-600 mb-4">The session has no results available.</p>
          <button
            onClick={handleRestart}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md"
          >
            Start New Interview Prep
          </button>
        </div>
      </div>
    );
  }

  // Extract the sessionId from URL for the ResultPage component
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');

  return (
    <ResultPage 
      sessionId={sessionId || ''} 
      results={results} 
      onRestart={handleRestart} 
    />
  );
}