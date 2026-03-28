// ========================================
// Analysis Skeleton
// ========================================
import React from 'react';

function SkeletonBlock({ height = 120, style }: { height?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height,
        borderRadius: '12px',
        backgroundColor: '#F3F4F6',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function AnalysisSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
      <SkeletonBlock height={80} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <SkeletonBlock height={200} />
        <SkeletonBlock height={200} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <SkeletonBlock height={160} />
        <SkeletonBlock height={160} />
        <SkeletonBlock height={160} />
      </div>
      <SkeletonBlock height={100} />
    </div>
  );
}
