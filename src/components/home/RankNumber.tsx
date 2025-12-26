import React from 'react';

// Simple, bold, premium number paths or text-based SVG
// Using SVG text is cleaner than storing paths for all digits manually
export default function RankNumber({ rank }: { rank: number }) {
    return (
        <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                position: 'absolute',
                left: '-10px',
                bottom: '-25px',
                zIndex: 10, /* Strictly on top */
                pointerEvents: 'none', /* Let clicks pass through to card */
                filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.9))' /* Heavy shadow for contrast */
            }}
            className="rank-number"
        >
            <text
                x="10"
                y="90"
                fontFamily="'Inter', 'Roboto', sans-serif"
                fontWeight="900"
                fontSize="90"
                fill="#ffffff" /* Pure white fill */
                stroke="#000000" /* Black outline */
                strokeWidth="2"
            >
                {rank}
            </text>
        </svg>
    );
}
