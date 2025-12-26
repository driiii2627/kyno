import React from 'react';

// Simple, bold, premium number paths or text-based SVG
// Using SVG text is cleaner than storing paths for all digits manually
export default function RankNumber({ rank }: { rank: number }) {
    return (
        <svg
            width="140"
            height="180"
            viewBox="0 0 140 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                position: 'absolute',
                left: '-60px', /* Adjust overlap */
                bottom: '0',
                zIndex: -1 /* Behind the card */
            }}
            className="rank-number"
        >
            <defs>
                <linearGradient id="rankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#444" />
                    <stop offset="100%" stopColor="#111" />
                </linearGradient>
            </defs>
            <text
                x="110" // Align right to push against the card
                y="145" // Bottom align roughly
                textAnchor="end"
                fontFamily="'Inter', 'Roboto', sans-serif"
                fontWeight="900"
                fontSize="220"
                fill="url(#rankGradient)" // Dark gradient fill
                stroke="#666" // Subtle highlight stroke
                strokeWidth="2"
                style={{
                    textShadow: '4px 4px 10px rgba(0,0,0,0.8)'
                }}
            >
                {rank}
            </text>
        </svg>
    );
}
