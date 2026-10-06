import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BrainCircuit,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';

const AISummaryModal = ({ project, onClose }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAISummary = async () => {
    if (!project?._id) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.post(`/projects/${project._id}/ai-summary`);
      if (res.data.success) {
        setSummaryData(res.data.data);
      }
    } catch (err) {
      console.error('AI summary generation failed:', err);
      setError(
        err.response?.data?.message || 'Failed to synthesize AI project summary.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAISummary();
  }, [project?._id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content p-6 space-y-6 max-w-2xl bg-slate-900 border border-purple-500/30 shadow-2xl shadow-purple-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                AI Sprint & Project Summary
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Intelligent Insight
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated velocity scoring and risk detection for{' '}
                <span className="font-semibold text-slate-300">
                  {project?.name}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAISummary}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh AI Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin"></div>
            <p className="text-sm font-medium text-slate-300">
              Synthesizing project telemetry & task velocity...
            </p>
            <p className="text-xs text-slate-400">
              Calculating health score, analyzing WIP, and formulating recommendations
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Success Content */}
        {!loading && summaryData && (
          <div className="space-y-6">
            {/* Health Score & Velocity Scorecard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Overall Health Card */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Project Health
                </span>
                <div className="flex items-baseline gap-2 my-2">
                  <span
                    className="text-3xl font-black"
                    style={{ color: summaryData.healthBadgeColor }}
                  >
                    {summaryData.healthScore}%
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {summaryData.healthStatus}
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${summaryData.healthScore}%`,
                      backgroundColor: summaryData.healthBadgeColor,
                    }}
                  ></div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Sprint Completion
                </span>
                <div className="text-3xl font-black text-indigo-400 my-2">
                  {summaryData.completionRate}%
                </div>
                <span className="text-xs text-slate-400">
                  {summaryData.stats.done} of {summaryData.stats.total} tasks completed
                </span>
              </div>

              {/* Risk Level */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Sprint Risk Level
                </span>
                <div className="text-xl font-bold my-2 flex items-center gap-2">
                  {summaryData.velocityAssessment.riskLevel === 'Elevated' ? (
                    <>
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                      <span className="text-rose-400">Elevated</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400">Low / Optimal</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {summaryData.stats.overdue} overdue, {summaryData.stats.urgent} urgent
                </span>
              </div>
            </div>

            {/* AI Executive Narrative */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                <span>Executive Synthesis</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {summaryData.executiveSummary}
              </p>
            </div>

            {/* Actionable Recommendations */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Recommended Team Actions</span>
              </div>

              <div className="space-y-2">
                {summaryData.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Timestamp */}
            <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-800">
              Generated via TeamFlow AI Engine at{' '}
              {new Date(summaryData.generatedAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISummaryModal;
