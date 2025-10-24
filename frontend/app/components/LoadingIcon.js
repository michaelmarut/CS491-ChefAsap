import LottieView from 'lottie-react-native';
import { View, Text, StyleSheet } from 'react-native';

const lottieSrc = {
    'pan': require('../assets/lotties/panLoading.json'),
    'spinner': require('../assets/lotties/spinnerLoading.json'),
    'flame': require('../assets/lotties/flameLoading.json'),
    'food': require('../assets/lotties/foodLoading.json'),
}

export default function LoadingIcon({
    message = "Just a moment...",
    icon = "pan",
    size = 192
}) {
    const styles = StyleSheet.create({
        lottieSize: {
            width: size,
            height: size,
        }
    });

    return (
        <View className="flex-1 justify-center items-center">
            <LottieView
                source={lottieSrc[icon]}
                style={styles.lottieSize}
                autoPlay
                loop
            />
            {message &&
                <Text className="text-lg font-semibold text-primary-400 mt-4 dark:text-dark-400">
                    {message}
                </Text>
            }
        </View>
    );
}