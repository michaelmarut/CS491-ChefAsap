import LottieView from 'lottie-react-native';
import { View, Text, StyleSheet } from 'react-native'; // 💡 Import StyleSheet
import { useTailwind } from 'nativewind'; // Still needed if you use it elsewhere

const FryingPanAsset = require('../assets/loadingLottie.json');

const styles = StyleSheet.create({
    lottieSize: {
        width: 192,
        height: 192,
    }
});

export default function LoadingIcon({ message = "Just a moment..." }) {
    return (
        <View className="flex-1 justify-center items-center bg-base-100 pb-16">
            <LottieView
                source={FryingPanAsset}
                style={styles.lottieSize} 
                autoPlay
                loop
            />
            <Text className="text-lg font-semibold text-olive-500 mt-4">
                {message}
            </Text>
        </View>
    );
}