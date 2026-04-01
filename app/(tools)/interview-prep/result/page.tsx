'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResultPage } from './ResultPage';
import { InterviewPrepOutput } from '@/lib/interview-prep';
import { Loader } from "@/components/ui/spinner";
import { ToastProvider } from '@/app/components/shared/ToastProvider';

export default function InterviewPrepResultPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InterviewPrepOutput | null>(null);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Get the sessionId from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionIdParam = urlParams.get('sessionId');
        
        if (!sessionIdParam) {
          setError('Session ID is required');
          setLoading(false);
          return;
        }

        setSessionIdState(sessionIdParam);
        
        // Fetch the session data with results
        const response = await fetch(
          `/api/interview-prep/sessions/${sessionIdParam}`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch session data');
        }
        
        const data = await response.json();
        
        // Check if session has interview results
        if (data.session && data.session.interview_prep_results) {
          const prepOutput: InterviewPrepOutput = {
            sessionId: sessionIdParam,
            questions: data.session.interview_prep_results.generated_questions || [],
            summary: {
              totalQuestions: data.session.interview_prep_results.generated_questions?.length || 0,
              applicableQuestions: data.session.interview_prep_results.generated_questions?.length || 0,
              categories: Array.from(
                new Set(
                  (data.session.interview_prep_results.generated_questions || []).map(
                    (q: any) => q.category
                  )
                )
              ),
            },
          };
          setResults(prepOutput);
        } else {
          setError('No interview results found for this session. Please complete the interview preparation first.');
        }
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred loading session');
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
      <ToastProvider>
        <div className="flex items-center justify-center min-h-screen">
          <Loader size="lg" text="Loading session..." />
        </div>
      </ToastProvider>
    );
  }

  if (error) {
    return (
      <ToastProvider>
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
      </ToastProvider>
    );
  }

  if (!results || results.questions.length === 0) {
    return (
      <ToastProvider>
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
      </ToastProvider>
    );
  }

  return (
    <div className="container mx-auto site-main-px site-main-py max-w-4xl">
    <ToastProvider>
      <ResultPage 
        sessionId={sessionId || ''} 
        results={results} 
        onRestart={handleRestart} 
      />
    </ToastProvider>
    </div>
  );
}