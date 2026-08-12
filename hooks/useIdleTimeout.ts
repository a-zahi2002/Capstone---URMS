"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useIdleTimeout(
    timeoutMinutes: number = 15,
    warningMinutes: number = 14
) {
    const [isIdle, setIsIdle] = useState(false);
    const [isWarning, setIsWarning] = useState(false);
    
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    const startTimers = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);

        setIsIdle(false);
        setIsWarning(false);
        lastActivityRef.current = Date.now();

        warningRef.current = setTimeout(() => {
            setIsWarning(true);
        }, warningMinutes * 60 * 1000);

        timeoutRef.current = setTimeout(() => {
            setIsIdle(true);
        }, timeoutMinutes * 60 * 1000);
    }, [timeoutMinutes, warningMinutes]);

    const resetTimers = useCallback(() => {
        // Prevent resetting if already fully timed out
        if (!isIdle) {
            startTimers();
        }
    }, [isIdle, startTimers]);

    useEffect(() => {
        startTimers();

        const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
        
        const handleActivity = () => {
            const now = Date.now();
            
            // Throttle activity checks to once per second
            if (now - lastActivityRef.current < 1000) return;
            
            // Only automatically reset if we aren't already in the explicit warning phase
            // (When in warning, user must explicitly click to stay logged in)
            if (!isWarning) {
                resetTimers();
            }
        };

        events.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [startTimers, isWarning, resetTimers]);

    return { isIdle, isWarning, resetTimers };
}
