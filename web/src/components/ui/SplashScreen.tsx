'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
    // DEBUG: Start visible by default
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // DEBUG MODE: We removed the sessionStorage check entirely.
        // It will ALWAYS run on mount.

        // Validate we are indeed on the client and ready
        setShouldRender(true);

        // Standard "Netflix" behavior would typically start a timer here.
        // Total duration matches animation (approx 2.5s)
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    // If not mounted (SSR), don't render to avoid hydration mismatch
    if (!shouldRender) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [0.8, 1, 40], // Zoom Effect: Start bit small, Normal, then MASSIVE (fly through)
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                            times: [0, 0.2, 0.8, 1], // Keyframes timing
                            duration: 2.5,
                            ease: "easeInOut"
                        }}
                        className="relative flex items-center justify-center"
                    >
                        {/* Logo Construction */}
                        <div className="text-6xl md:text-8xl font-black tracking-tighter text-white select-none">
                            <span className="text-white">Kyno</span>
                            <span className="text-[#3b82f6]">
                                +
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
