import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ShieldAlert, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

export interface ScoreResponse {
  post_id: string;
  scored_at: string;
  scores: {
    content_quality: {
      score: number;
      reasoning: string;
      breakdown: { clarity: number; originality: number; sentiment_strength: number; depth: number };
      error?: string;
    };
    relevance: {
      score: number;
      reasoning: string;
      matched_trends: string[];
      error?: string;
    };
    fairness: {
      score: number;
      reasoning: string;
      exposure_delta: number;
    };
  };
  final_score: number;
  weights_used: { alpha: number; beta: number; gamma: number };
  rank_tier: "HIGH" | "MEDIUM" | "LOW";
  boost_recommended: boolean;
  feedback_report: {
    generated: boolean;
    report?: {
      summary: string;
      weak_pillars: string[];
      suggestions: string[];
      next_post_tips: string;
    };
    error?: string;
  };
}

interface Props {
  data: ScoreResponse;
}

export function AIAnalysisReport({ data }: Props) {
  const { scores, feedback_report, final_score, rank_tier, boost_recommended } = data;

  const toPercent = (val: number) => Math.round(val * 100);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'HIGH': return '#22c55e'; // Green
      case 'MEDIUM': return '#eab308'; // Yellow
      case 'LOW': return '#ef4444'; // Red
      default: return '#888';
    }
  };

  return (
    <div style={{
      marginTop: 24,
      padding: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      color: '#fff',
      fontFamily: 'var(--app-font-sans)',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#a855f7" />
          AI Analysis Report
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {boost_recommended && (
            <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={10} /> BOOST READY
            </span>
          )}
          <span style={{
            backgroundColor: getTierColor(rank_tier),
            color: '#000',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 800,
          }}>
            {rank_tier} TIER
          </span>
          <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 14, fontWeight: 700 }}>
            {toPercent(final_score)}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {/* Quality Card */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>Content Quality</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--app-font-mono)', color: '#22c55e' }}>
            {toPercent(scores.content_quality.score)}
          </div>
        </div>
        {/* Relevance Card */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>Trend Relevance</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--app-font-mono)', color: '#3b82f6' }}>
            {toPercent(scores.relevance.score)}
          </div>
        </div>
        {/* Fairness Card */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>Exposure Fairness</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--app-font-mono)', color: '#f59e0b' }}>
            {toPercent(scores.fairness.score)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Reasoning Breakdown</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, lineHeight: 1.4, color: '#ccc' }}>
            <strong style={{ color: '#fff' }}>Quality:</strong> {scores.content_quality.reasoning}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.4, color: '#ccc' }}>
            <strong style={{ color: '#fff' }}>Relevance:</strong> {scores.relevance.reasoning}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.4, color: '#ccc' }}>
            <strong style={{ color: '#fff' }}>Fairness:</strong> {scores.fairness.reasoning}
          </div>
        </div>
      </div>

      {feedback_report.generated && feedback_report.report && (
        <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: 16, borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 12, color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase' }}>
            <TrendingUp size={14} /> Creator Feedback
          </h4>
          <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.5 }}>
            {feedback_report.report.summary}
          </p>

          <div style={{ marginBottom: 12 }}>
            <h5 style={{ margin: '0 0 6px', fontSize: 11, color: '#888' }}>SUGGESTIONS</h5>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#bbb' }}>
              {feedback_report.report.suggestions.map((s, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5 style={{ margin: '0 0 6px', fontSize: 11, color: '#888' }}>NEXT POST TIPS</h5>
            <div style={{ fontSize: 12, color: '#bbb', backgroundColor: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4 }}>
              💡 {feedback_report.report.next_post_tips}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
