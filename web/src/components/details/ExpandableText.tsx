'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './ExpandableText.module.css';

interface ExpandableTextProps {
    text: string;
    className?: string; // Allow overriding styles if needed
}

export default function ExpandableText({ text, className }: ExpandableTextProps) {
    const [showPopup, setShowPopup] = useState(false);

    // If text is short, just show it normally
    if (!text || text.length < 250) {
        return <p className={`${styles.text} ${className || ''}`}>{text}</p>;
    }

    const truncated = text.slice(0, 250).trim();

    return (
        <div className={styles.container}>
            {/* Truncated View (Inline Button) */}
            <p className={`${styles.text} ${className || ''}`}>
                {truncated}...
                <button className={styles.readMoreBtn} onClick={() => setShowPopup(true)}>
                    Ler mais
                </button>
            </p>

            {/* Popup View */}

            {/* Popup View */}
            {showPopup && (
                <div className={styles.overlay} onClick={() => setShowPopup(false)}>
                    <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeButton} onClick={() => setShowPopup(false)}>
                            <X size={18} />
                        </button>

                        <h3 className={styles.popupTitle}>Sinopse</h3>
                        <p className={styles.fullText}>
                            {text}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
