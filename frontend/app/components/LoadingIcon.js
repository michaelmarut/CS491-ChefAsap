import LottieView from 'lottie-react-native';
import { View, Text, StyleSheet } from 'react-native';

const FryingPanAsset = require('../assets/lotties/loadingLottie.json');

const styles = StyleSheet.create({
    lottieSize: {
        width: 192,
        height: 192,
    }
});

export default function LoadingIcon({ message = "Just a moment..." }) {
    return (
        <View className="flex-1 justify-center items-center bg-base-100 pb-32">
            <LottieView
                source={FryingPanAsset}
                style={styles.lottieSize} 
                autoPlay
                loop
            />
            <Text className="text-lg font-semibold text-olive-400 mt-4">
                {message}
            </Text>
        </View>
    );
}