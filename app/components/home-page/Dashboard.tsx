import React from "react";
import { WizardState } from "../../(main)/dashboard/hooks/useWizard";
import { roadmapData } from "../../../data/roadmap";

interface DashboardProps {
    state: WizardState;
    isSignedIn: boolean;
    onContinue: () => void;
    onNavigate: (section: string) => void;
    onToggleAuth: () => void;
}   

export function Dashboard({ state, isSignedIn, onContinue, onNavigate, onToggleAuth }: DashboardProps) {
    const getTotalSteps = () => {
        return roadmapData.stages.reduce((acc, stage) => acc + stage.steps.length, 0);
    };

    const totalSteps = getTotalSteps();
    const completed = state.completedSteps.size;
    const progress = totalSteps === 0 ? 0 : Math.round((completed / totalSteps) * 100);

    return (
        <section id="dashboard" className="block">
            <div className="max-w-[1400px] mx-auto px-6 py-[60px]">
                <h1 className="text-[40px] font-bold mb-4">Your Dashboard</h1>
                <p className="text-slate-500 text-lg mb-12">Track your active journeys and access recommended tools.</p>

                {!isSignedIn && (
                    <div id="guest-dashboard-msg">
                        <div className="bg-[#f59e0b]/5 border-2 border-[#f59e0b]/20 p-8 rounded-xl text-center">
                            <h4 className="text-xl font-bold mb-2">👋 Sign in to access your dashboard</h4>
                            <p className="text-slate-500 mb-6">Track journeys, save progress across devices, and get personalized recommendations.</p>
                            <button 
                                className="px-6 py-3 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-sm"
                                onClick={onToggleAuth}
                            >
                                Sign In Free
                            </button>
                        </div>
                    </div>
                )}

                {isSignedIn && (
                    <div id="signed-in-dashboard">


                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                            <div className="lg:col-span-2">
                                <h3 className="text-xl font-bold mb-5">Your Active Journeys</h3>
                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <h4 className="text-lg font-bold mb-2">🇺🇸 IR-1/CR-1 Spouse Visa</h4>
                                    <p className="text-slate-500 text-sm mb-3">Started Dec 21, 2025</p>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                                        <div 
                                            className="h-full bg-linear-to-r from-[#0d9488] to-[#10b981] transition-all duration-500" 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[13px] mb-6">
                                        <span className="font-semibold text-slate-800">{completed} of {totalSteps} steps</span>
                                        <span className="text-slate-500">{progress}% Complete</span>
                                    </div>
                                    <button 
                                        className="w-full px-6 py-4 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-lg"
                                        onClick={onContinue}
                                    >
                                        Continue Journey →
                                    </button>
                                </div>

                                <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm opacity-60">
                                    <h4 className="font-bold mb-2">➕ Start Another Journey</h4>
                                    <p className="text-slate-500 text-sm mb-3">IR-5 Parents, K-1 Fiancé, and more coming soon.</p>
                                    <button className="px-4 py-2 rounded-lg bg-slate-100 text-slate-400 font-bold border border-slate-200 cursor-not-allowed" disabled>
                                        Coming Soon
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold mb-5">Document Overview</h3>
                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center">
                                    <div className="text-4xl mb-2">📁</div>
                                    <p className="text-sm text-slate-500 mb-4">You have <strong>{Object.keys(state.docUploads || {}).length}</strong> documents in your vault.</p>
                                    <button 
                                        className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold hover:border-[#0d9488] transition-colors"
                                        onClick={onContinue}
                                    >
                                        Open Vault
                                    </button>
                                </div>

                                <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <h4 className="text-[14px] font-bold uppercase tracking-wider text-slate-400 mb-4">Upcoming Milestone</h4>
                                    <div className="flex gap-3 items-start">
                                        <div className="px-3 py-2 bg-[#5eead4] text-[#0f766e] rounded-lg font-bold text-lg">II</div>
                                        <div>
                                            <p className="font-bold text-sm">NVC/CEAC Processing</p>
                                            <p className="text-xs text-slate-500">Typical wait: 4-9 months</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <h3 className="text-xl font-bold mb-5">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <button 
                                    className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center hover:shadow-md transition-all group"
                                    onClick={() => onNavigate('ir1-journey')}
                                >
                                    <h4 className="text-lg font-bold mb-1 group-hover:text-[#0d9488] transition-colors">📋 Open IR-1 Wizard</h4>
                                    <p className="text-sm text-slate-500">Continue your journey</p>
                                </button>
                                <button 
                                    className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center hover:shadow-md transition-all group"
                                    onClick={() => onNavigate('tools')}
                                >
                                    <h4 className="text-lg font-bold mb-1 group-hover:text-[#0d9488] transition-colors">🛠️ Browse Tools</h4>
                                    <p className="text-sm text-slate-500">Document prep & planning</p>
                                </button>
                                <button 
                                    className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center hover:shadow-md transition-all group"
                                    onClick={() => onNavigate('pricing')}
                                >
                                    <h4 className="text-lg font-bold mb-1 group-hover:text-[#0d9488] transition-colors">⭐ View Premium</h4>
                                    <p className="text-sm text-slate-500">Unlock all features</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
