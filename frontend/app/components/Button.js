import { Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Octicons } from "@expo/vector-icons";

const BUTTON_STYLES = {
    primary: {
        button: "bg-olive-400 border-olive-100",
        text: "text-olive-100",
    },
    secondary: {
        button: "bg-olive-100 border-olive-400",
        text: "text-olive-400",
    },
    accent: {
        button: "bg-olive-200 border-olive-300",
        text: "text-olive-500",
    }
};

const BUTTON_CLASSES = {
    basic: {
        button: "py-3 px-8 rounded-full mb-2 border-2 shadow-sm shadow-olive-500",
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

    const Component = href ? Link : TouchableOpacity;

    const componentProps = {};

    if (href) {
        componentProps.href = href;
        componentProps.asChild = true;
    } else {
        componentProps.onPress = onPress;
    }

    return (
        <Component {...componentProps} className={customClasses}>
            <TouchableOpacity
                className={`${styles.button} ${buttonClass.button} items-center content-center flex-row justify-center`}
                onPress={onPress}
                disabled={disabled}
            >
                {icon &&
                    <Octicons
                        name={icon}
                        size={16}
                        color="#BEF264" // olive-100
                        style={{ marginRight: 8 }}
                    />
                }
                <Text className={`${styles.text} ${buttonClass.text} ${customTextClasses} `}>
                    {title}
                </Text>
            </TouchableOpacity>
        </Component>
    );
}