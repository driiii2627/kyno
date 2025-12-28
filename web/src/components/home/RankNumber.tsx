import React from 'react';

// Simple, bold, premium number paths or text-based SVG
// Using SVG text is cleaner than storing paths for all digits manually
export default function RankNumber({ rank }: { rank: number }) {
    return (
        <svg
            width="160"
            height="110"
            viewBox="0 0 160 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                position: 'absolute',
                left: '-15px',
                bottom: '-15px',
                zIndex: 10,
                pointerEvents: 'none',
                filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.8))'
            }}
            className="rank-number"
        >
            <defs>
                <linearGradient id="rankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#AAAAAA" />
                </linearGradient>
            </defs>
            <text
                x="10"
                y="95"
                fontFamily="'Inter', 'Roboto', sans-serif"
                fontWeight="900"
                fontSize="100"
                fill="#000"
                fillOpacity="0.4"
                stroke="url(#rankGradient)"
                strokeWidth="3"
            >
                {rank}
            </text>
        </svg>
    );
}
