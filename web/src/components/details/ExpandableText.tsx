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
        return <p className={`${styles.truncatedText} ${className || ''}`} style={{ display: 'block' }}>{text}</p>;
    }

    return (
        <div className={styles.container}>
            {/* Truncated View */}
            <p className={`${styles.truncatedText} ${className || ''}`}>
                {text}
            </p>

            <button className={styles.readMoreBtn} onClick={() => setShowPopup(true)}>
                Ler mais
            </button>

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
