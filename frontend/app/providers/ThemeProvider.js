import React, { useState, useEffect, createContext, useContext } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SystemBars } from 'react-native-edge-to-edge';
import { View } from 'react-native';
import { getTailwindColor } from '../utils/getTailwindColor';

const THEME_STORAGE_KEY = 'user-color-theme';

export const ThemeContext = createContext({
    manualTheme: 'system',
    setManualTheme: () => { },
    isOnAuthPage: false,
    setIsOnAuthPage: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
    const { colorScheme, setColorScheme } = useColorScheme();
    const [manualTheme, setManualTheme] = useState('system');
    const [isOnAuthPage, setIsOnAuthPage] = useState(false);

    /*const activeBackground = colorScheme === 'light'
        ? isOnAuthPage
            ? getTailwindColor('base.100')
            : getTailwindColor('primary.300')
        : isOnAuthPage
            ? getTailwindColor('base.dark.100')
            : getTailwindColor('dark.200');*/

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
        isOnAuthPage,
        setIsOnAuthPage,
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            <View style={{
                flex: 1, backgroundColor: colorScheme === 'light'
                    ? isOnAuthPage
                        ? getTailwindColor('base.100')
                        : getTailwindColor('primary.300')
                    : isOnAuthPage
                        ? getTailwindColor('base.dark.100')
                        : getTailwindColor('dark.200') }}>
                <SystemBars
                    style={colorScheme}
                    animated
                    hidden={true}
                />
                {children}
            </View>
        </ThemeContext.Provider>
    );
}