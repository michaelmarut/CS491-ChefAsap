import { Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

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
    },
};

export default function Button({
    title, // button text
    style = 'primary', // primary, secondary, accent
    href, // pass a href for navigation (not needed if using onPress)
    onPress, // pass an onPress for custom action (not needed if using href)
    customClasses = "", // custom button style overrides
    customTextClasses = "" // custom text style overrides
}) {

    const styles = BUTTON_STYLES[style] || BUTTON_STYLES.primary;

    const Component = href ? Link : TouchableOpacity;

    const componentProps = {};

    if (href) {
        componentProps.href = href;
        componentProps.asChild = true;
    } else {
        componentProps.onPress = onPress;
    }

    return (
        <Component {...componentProps}>
            <TouchableOpacity
                className={`py-3 px-8 rounded-full mb-2 border-2 shadow-sm shadow-olive-500 ${styles.button} ${customClasses}`}
                onPress={onPress}
            >
                <Text className={`text-center font-bold text-lg ${styles.text} ${customTextClasses}`}>
                    {title}
                </Text>
            </TouchableOpacity>
        </Component>
    );
}