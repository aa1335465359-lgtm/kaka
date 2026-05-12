
import { PortfolioItem, DebugLog, SmartProfile } from '../types';

/**
 * STORAGE SERVICE
 * Handles all LocalStorage interactions with QuotaExceededError protection.
 * Strategy: If full, try to save a smaller subset of data (fallback).
 */

const KEYS = {
    PORTFOLIO: 'styleweave_portfolio',
    LOGS: 'styleweave_debug_logs',
    PROFILE_PREFIX: 'styleweave_profile_',
    ONBOARDING: 'styleweave_design_onboarding'
};

// Generic Safe Save Helper
const safeSave = <T>(key: string, data: T, fallbackStrategies?: ((data: T) => T)[]) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn(`Storage quota exceeded for ${key}. Attempting fallback...`);
            if (fallbackStrategies && fallbackStrategies.length > 0) {
                for (let i = 0; i < fallbackStrategies.length; i++) {
                    try {
                        const reducedData = fallbackStrategies[i](data);
                        localStorage.setItem(key, JSON.stringify(reducedData));
                        console.log(`Fallback save successful for ${key} at strategy ${i + 1}`);
                        return;
                    } catch (innerE) {
                        console.warn(`Fallback strategy ${i + 1} failed for ${key}`);
                        if (i === fallbackStrategies.length - 1) {
                            console.error(`All fallback saves failed for ${key}`, innerE);
                        }
                    }
                }
            }
        } else {
            console.error(`Storage error for ${key}`, e);
        }
    }
};

// Helper to load all profiles (used internally for LRU cleanup)
const getProfilesInternal = (): SmartProfile[] => {
    const profiles: SmartProfile[] = [];
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(KEYS.PROFILE_PREFIX)) {
            try {
                const p = JSON.parse(localStorage.getItem(key) || '{}');
                if (p.id) profiles.push(p);
            } catch (e) {}
        }
    });
    // Sort by newest first
    return profiles.sort((a, b) => b.generatedDate - a.generatedDate);
};

export const storageService = {
    // --- PORTFOLIO ---
    savePortfolio: (items: PortfolioItem[]) => {
        // Fallback: Try saving progressively fewer items
        safeSave(KEYS.PORTFOLIO, items.slice(0, 10), [
            (fullList) => fullList.slice(0, 5),
            (fullList) => fullList.slice(0, 2),
            (fullList) => fullList.slice(0, 1),
            () => [] as PortfolioItem[]
        ]);
    },

    loadPortfolio: (): PortfolioItem[] => {
        try {
            const saved = localStorage.getItem(KEYS.PORTFOLIO);
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    },

    // --- DEBUG LOGS ---
    saveDebugLogs: (logs: DebugLog[]) => {
        // Fallback: Try saving progressively fewer logs
        safeSave(KEYS.LOGS, logs.slice(0, 50), [
            (fullList) => fullList.slice(0, 10),
            (fullList) => fullList.slice(0, 5),
            () => [] as DebugLog[]
        ]);
    },

    loadDebugLogs: (): DebugLog[] => {
        try {
            const saved = localStorage.getItem(KEYS.LOGS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    },

    // --- SMART PROFILES ---
    saveProfile: (profile: SmartProfile) => {
        const key = `${KEYS.PROFILE_PREFIX}${profile.id}`;
        
        try {
            localStorage.setItem(key, JSON.stringify(profile));
        } catch (e: any) {
            // HANDLE QUOTA EXCEEDED
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                console.warn("LocalStorage quota exceeded while saving Profile. Starting cleanup protocols...");

                // PROTOCOL 1: Nuke Debug Logs (Lowest Priority)
                localStorage.removeItem(KEYS.LOGS);
                try {
                    localStorage.setItem(key, JSON.stringify(profile));
                    console.log("Space recovered by deleting Debug Logs.");
                    return;
                } catch (e1) {}

                // PROTOCOL 2: Aggressive Portfolio Trim (Medium Priority)
                // Keep only the absolute latest item if full list fails
                try {
                    const currentPortfolio = JSON.parse(localStorage.getItem(KEYS.PORTFOLIO) || '[]');
                    if (currentPortfolio.length > 0) {
                        const trimmed = currentPortfolio.slice(0, 1); // Keep only 1 latest
                        localStorage.setItem(KEYS.PORTFOLIO, JSON.stringify(trimmed));
                    }
                } catch (err) {}
                
                try {
                    localStorage.setItem(key, JSON.stringify(profile));
                    console.log("Space recovered by trimming Portfolio.");
                    return;
                } catch (e2) {}

                // PROTOCOL 3: Delete Oldest Profile (LRU - High Priority)
                // Delete one by one from the tail until it fits
                try {
                    const profiles = getProfilesInternal();
                    // We assume profiles are sorted Newest -> Oldest. 
                    // Iterate from the end (Oldest)
                    for (let i = profiles.length - 1; i >= 0; i--) {
                        const victim = profiles[i];
                        // Don't delete the one we are currently trying to save (in case of update)
                        if (victim.id === profile.id) continue;

                        localStorage.removeItem(`${KEYS.PROFILE_PREFIX}${victim.id}`);
                        console.log(`Deleted old profile ${victim.name} to free space.`);

                        // Try saving again
                        try {
                            localStorage.setItem(key, JSON.stringify(profile));
                            console.log("Space recovered by deleting old Profiles.");
                            return; // Success
                        } catch (e3) {
                            // Still full, continue loop to delete next oldest
                        }
                    }
                } catch (err) {}

                // If we reach here, we failed even after clearing everything possible.
                console.error("CRITICAL: Storage completely full. Cannot save profile.");
                alert("存储空间已满！系统尝试自动清理旧数据失败。请手动删除一些作品或重置应用。");
                throw e;
            } else {
                console.error("Failed to save profile", e);
                throw e; 
            }
        }
    },

    loadAllProfiles: (): SmartProfile[] => {
        return getProfilesInternal();
    },

    deleteProfile: (id: string) => {
        localStorage.removeItem(`${KEYS.PROFILE_PREFIX}${id}`);
    },

    // --- FLAGS ---
    checkOnboarding: (): boolean => {
        return !!localStorage.getItem(KEYS.ONBOARDING);
    },
    
    setOnboardingSeen: () => {
        try { localStorage.setItem(KEYS.ONBOARDING, 'true'); } catch(e){}
    }
};
