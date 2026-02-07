import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '@shared/logger';

interface ThemeState {
    fontScale: number;
    isHighContrast: boolean;
    toggleHighContrast: () => void;
    setFontScale: (scale: number) => void;
}

const ThemeContext = createContext<ThemeState | undefined>(undefined);

const STORAGE_KEY_FONT_SCALE = 'app_font_scale';
const STORAGE_KEY_HIGH_CONTRAST = 'app_high_contrast';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [fontScale, setFontScaleState] = useState(1.0);
    const [isHighContrast, setIsHighContrast] = useState(false);

    // Load persisted theme settings
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedScale = await AsyncStorage.getItem(STORAGE_KEY_FONT_SCALE);
                if (storedScale) {
                    setFontScaleState(parseFloat(storedScale));
                }

                const storedContrast = await AsyncStorage.getItem(STORAGE_KEY_HIGH_CONTRAST);
                if (storedContrast) {
                    setIsHighContrast(storedContrast === 'true');
                }
            } catch (error) {
                logError('Failed to load theme settings', error);
            }
        };
        loadTheme();
    }, []);

    const setFontScale = async (scale: number) => {
        setFontScaleState(scale);
        await AsyncStorage.setItem(STORAGE_KEY_FONT_SCALE, String(scale));
    };

    const toggleHighContrast = async () => {
        const newValue = !isHighContrast;
        setIsHighContrast(newValue);
        await AsyncStorage.setItem(STORAGE_KEY_HIGH_CONTRAST, String(newValue));
    };

    return (
        <ThemeContext.Provider
            value={{
                fontScale,
                isHighContrast,
                toggleHighContrast,
                setFontScale,
            }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
