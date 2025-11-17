import { Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { Octicons } from "@expo/vector-icons";
import { useTheme } from '../providers/ThemeProvider';
import { getTailwindColor } from '../utils/getTailwindColor';

export default function Button({
    title, // button text
    style = 'primary', // button colors: primary, secondary, accent, transparent
    base = 'basic', // base button structure: basic, link, icon
    href, // pass a href for navigation (not needed if using onPress)
    onPress, // pass an onPress for custom action (not needed if using href)
    customClasses = "", // custom button style overrides
    customTextClasses = "", // custom text style overrides
    disabled = false, // disable button interaction
    icon = "", // optional Octicons icon name
    iconGap = 5, // if title and icon, this is space between
    iconSize,
}) {
    const { manualTheme } = useTheme();

    const BUTTON_STYLES = {
        primary: {
            button: "bg-primary-400 border-primary-100 dark:bg-dark-400 dark:border-dark-100",
            text: "text-primary-100 dark:text-dark-100",
            icon: manualTheme === 'light' ? getTailwindColor('primary.100') : getTailwindColor('dark.100')
        },
        secondary: {
            button: "bg-primary-100 border-primary-400 dark:bg-dark-100 dark:border-dark-400",
            text: "text-primary-400 dark:text-dark-400",
            icon: manualTheme === 'light' ? getTailwindColor('primary.400') : getTailwindColor('dark.400')
        },
        accent: {
            button: "bg-primary-400 border-base-100 dark:border-base-dark-100 dark:bg-dark-400",
            text: "text-base-100 dark:text-base-dark-100",
            icon: manualTheme === 'light' ? getTailwindColor('base.100') : getTailwindColor('base.dark.100')
        },
        transparent: {
            button: "bg-transparent border-transparent",
            text: "text-primary-400 dark:text-dark-400",
            icon: getTailwindColor('warm-gray')
        }
    };

    const BUTTON_CLASSES = {
        basic: {
            button: "py-3 rounded-full mb-2 border-2 shadow-sm shadow-primary-500 dark:shadow-dark-500",
            text: "text-center font-bold text-lg",
        },
        icon: {
            button: "rounded-full border-2 shadow-sm shadow-primary-500 dark:shadow-dark-500",
            text: "text-center font-bold text-lg",
        },
        link: {
            button: "py-2 px-4 bg-transparent",
            text: "text-center text-md underline",
        },
    };

    const styles = BUTTON_STYLES[style] || BUTTON_STYLES.primary;
    const buttonClass = BUTTON_CLASSES[base] || BUTTON_CLASSES.basic;

    const content = (
        <TouchableOpacity
            onPress={onPress || href ? onPress : () => alert("Button pressed")}
            disabled={disabled}
            className={`${styles.button} ${buttonClass.button} items-center flex-row justify-center ${customClasses} ${disabled ? 'opacity-50' : ''}`}
        >
            {title ? (
                <Text className={`${styles.text} ${buttonClass.text} ${customTextClasses}`}>
                    {title}
                </Text>
            ) : null}
            {title && icon ? <View className={`w-[${iconGap}px]`} /> : null}
            {icon ? (
                <Octicons
                    name={icon}
                    size={ iconSize ? iconSize : title ? 24 : 16}
                    color={styles.icon}
                />
            ) : null}
        </TouchableOpacity>
    );

    return href ? <Link href={href} asChild>{content}</Link> : content;
}