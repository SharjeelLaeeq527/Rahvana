"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  ArrowRight,
  LayoutGrid,
  Search,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

interface UserGuideSession {
  id: string;
  status: string;
  progress_percent: number;
  last_updated_at: string;
  guides: {
    slug: string;
    title: string;
    description: string;
  };
}

export default function MyGuidesPage() {
  const [sessions, setSessions] = useState<UserGuideSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMyGuides = async () => {
      try {
        const res = await fetch("/api/guides/my-guides");
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (error) {
        console.error("Failed to fetch my guides:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyGuides();
  }, []);

  const filteredSessions = sessions.filter(s => 
    s.guides.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-teal-600 font-bold text-sm uppercase tracking-widest mb-2">
              <LayoutGrid size={16} />
              <span>User Dashboard</span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              My <span className="text-teal-600">Guides</span>
            </h1>
            <p className="text-slate-500 mt-2 text-lg max-w-xl">
              Resume your progress, manage your saved documents, and complete your immigration journeys.
            </p>
          </div>

          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-teal-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search your guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse h-64" />
            ))}
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                key={session.id}
                className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all flex flex-col relative overflow-hidden"
              >
                {/* Progress bar accent */}
                <div 
                  className="absolute top-0 left-0 h-1.5 bg-teal-500 transition-all duration-1000" 
                  style={{ width: `${session.progress_percent}%` }}
                />

                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full 
                      ${session.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {session.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                      <Clock size={10} />
                      {new Date(session.last_updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors mb-2">
                  {session.guides.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                  {session.guides.description}
                </p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Progress</span>
                    <span className="text-xs font-black text-teal-600">{session.progress_percent}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${session.progress_percent}%` }}
                    />
                  </div>

                  <Link 
                    href={`/guides/${session.guides.slug}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-teal-600 transition-all shadow-lg shadow-slate-200 hover:shadow-teal-100 group/btn"
                  >
                    {session.status === 'completed' ? (
                      <>
                        <CheckCircle2 size={18} />
                        View Results
                      </>
                    ) : (
                      <>
                        <PlayCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                        Resume Guide
                      </>
                    )}
                    <ChevronRight size={16} className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-slate-200 border-dashed p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={40} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No guides started yet</h2>
            <p className="text-slate-500 max-w-sm mx-auto mb-10">
              Explore our collection of step-by-step immigration guides and start your first session today.
            </p>
            <Link 
              href="/guides"
              className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-100"
            >
              Explore Guides
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
