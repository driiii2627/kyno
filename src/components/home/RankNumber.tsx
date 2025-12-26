import React from 'react';

// Simple, bold, premium number paths or text-based SVG
// Using SVG text is cleaner than storing paths for all digits manually
export default function RankNumber({ rank }: { rank: number }) {
    return (
        <svg
            width="160"
            height="280"
            viewBox="0 0 160 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                position: 'absolute',
                left: '-70px', /* Adjust overlap slightly more for the wider box */
                bottom: '-20px', /* Adjust vertical alignment */
                zIndex: -1
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
                x="150"
                y="240"
                textAnchor="end"
                fontFamily="'Inter', 'Roboto', sans-serif"
                fontWeight="900"
                fontSize="240"
                fill="none"
                stroke="url(#rankGradient)"
                strokeWidth="4"
                className="rank-text"
            >
                {rank}
            </text>
            <text
                x="150"
                y="240"
                textAnchor="end"
                fontFamily="'Inter', 'Roboto', sans-serif"
                fontWeight="900"
                fontSize="240"
                fill="#000"
                fillOpacity="0.5"
                stroke="none"
            >
                {rank}
            </text>
        </svg>
    );
}
