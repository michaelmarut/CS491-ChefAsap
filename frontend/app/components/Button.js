import { Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Octicons } from "@expo/vector-icons";

const BUTTON_STYLES = {
    primary: {
        button: "bg-olive-400 border-olive-100",
        text: "text-olive-100",
        icon: "#bef264"
    },
    secondary: {
        button: "bg-olive-100 border-olive-400",
        text: "text-olive-400",
        icon: "#4d7c0f"
    },
    accent: {
        button: "bg-olive-400 border-base-100",
        text: "base-100",
        icon: "#fefce8"
    },
    transparent: {
        button: "bg-transparent border-transparent",
        text: "text-transparent",
        icon: "#4D7C0F"
    }
};

const BUTTON_CLASSES = {
    basic: {
        button: "py-3 rounded-full mb-2 border-2 shadow-sm shadow-olive-500",
        text: "text-center font-bold text-lg",
    }, 
    link: {
        button: "py-2 px-4 bg-transparent",
        text: "text-center text-md underline",
    },
};

export default function Button({
    title, // button text
    style = 'primary', // button colors: primary, secondary, accent, transparent
    base = 'basic', // base button structure: basic, link
    href, // pass a href for navigation (not needed if using onPress)
    onPress, // pass an onPress for custom action (not needed if using href)
    customClasses = "", // custom button style overrides
    customTextClasses = "", // custom text style overrides
    disabled = false, // disable button interaction
    icon = "", // optional Octicons icon name
}) {
    const styles = BUTTON_STYLES[style] || BUTTON_STYLES.primary;
    const buttonClass = BUTTON_CLASSES[base] || BUTTON_CLASSES.basic;

    const content = (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            className={`${styles.button} ${buttonClass.button} items-center content-center flex-row justify-center ${customClasses}`}
        >
            {icon ? (
                <Octicons
                    name={icon}
                    size={16}
                    color={styles.icon}
                />
            ) : null}
            {title ? (
                <Text className={`${styles.text} ${buttonClass.text} ${customTextClasses}`}>
                    {title}
                </Text>
            ) : null}
        </TouchableOpacity>
    );

    return href ? <Link href={href} asChild>{content}</Link> : content;
}