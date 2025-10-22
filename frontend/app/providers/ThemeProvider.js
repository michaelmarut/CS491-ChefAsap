import React, { useState, useEffect, createContext, useContext } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'user-color-theme';

export const ThemeContext = createContext({
    manualTheme: 'system',
    setManualTheme: () => { },
});
export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
    const { colorScheme, setColorScheme } = useColorScheme();
    const [manualTheme, setManualTheme] = useState('system');

    useEffect(() => {
        const loadTheme = async () => {
            const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (storedTheme) {
                setManualTheme(storedTheme);
                setColorScheme(storedTheme);
            }
        };
        loadTheme();
    }, []);

    const updateTheme = async (newTheme) => {
        setManualTheme(newTheme);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);

        setColorScheme(newTheme);
    };

    const contextValue = {
        manualTheme,
        setManualTheme: updateTheme,
        activeColorScheme: colorScheme,
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}