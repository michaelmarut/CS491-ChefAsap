import React from 'react';
import { useTheme } from '../providers/ThemeProvider';
import Button from './Button';

export default function ThemeButton() {
    const { manualTheme, setManualTheme } = useTheme();

    const getNextTheme = () => {
        switch (manualTheme) {
            case 'light': return 'dark';
            case 'dark': return 'system';
            case 'system': return 'light';
            default: return 'system';
        }
    };

    const getIcon = (theme) => {
        if (theme === 'dark') return 'moon';
        if (theme === 'light') return 'sun';
        return 'device-desktop';
    };

    const iconName = getIcon(manualTheme);

    return (
        <Button
            icon={iconName}
            onPress={() => setManualTheme(getNextTheme())}
            customClasses="absolute -top-[70px] right-[40px] z-10 p-3 rounded-full pl-3"
            style='accent'
        />
    );
}