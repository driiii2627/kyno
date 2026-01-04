'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Check session storage to see if we already showed it this session
        const hasShown = sessionStorage.getItem('kyno_splash_v1');

        if (hasShown) {
            setIsVisible(false);
            return;
        }

        // Validate we are indeed on the client and ready
        setShouldRender(true);

        // Mark as shown so it doesn't repeat on refresh (optional, user said "while site loads", usually means once per visit)
        // If they want it EVERY reload, we comment this out. 
        // User asked "aparece a logo... enquanto tem a animação o site carrega". 
        // Standard "Netflix" behavior is usually on App Launch. 
        // I'll keep it per session to avoid annoyance, but sticking to "v1" key allows versioning.
        sessionStorage.setItem('kyno_splash_v1', 'true');

        // Total duration matches animation (approx 2.5s)
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2800);

        return () => clearTimeout(timer);
    }, []);

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
