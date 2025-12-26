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
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#999999" />
                </linearGradient>
            </defs>
            <text
                x="130" // Push more to the right to be visible
                y="145" // Keep vertical alignment
                textAnchor="end"
                fontFamily="'Inter', 'Roboto', sans-serif"
                fontWeight="900"
                fontSize="220"
                fill="none" // Outline style mostly
                stroke="url(#rankGradient)" // Silver stroke
                strokeWidth="4"
                className="rank-text"
            >
                {rank}
            </text>
            {/* Inner fill for better contrast */}
            <text
                x="130"
                y="145"
                textAnchor="end"
                fontFamily="'Inter', 'Roboto', sans-serif"
                fontWeight="900"
                fontSize="220"
                fill="#000" // Dark fill inside
                fillOpacity="0.5"
                stroke="none"
            >
                {rank}
            </text>
        </svg>
    );
}
