import { Text, View, Image } from "react-native";
import { NativeWindStyleSheet } from "nativewind";
import Button from '../components/Button';

NativeWindStyleSheet.setOutput({ default: "native" });

export default function LandingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-base-100">
      <View className="p-6 rounded-2xl bg-olive-200 items-center w-[80%] h-[90%] shadow-lg shadow-olive-400">
        <View className="mb-8 items-center">
          <Image
            source={require('../assets/images/chefAsapLogo.png')}
            className="w-24 h-24 mb-4"
            resizeMode="contain"
          />
          <Text className="text-5xl font-bold text-olive-500">ChefAsap</Text>
          <Text className="text-xl font-bold text-olive-400">Find a Chef</Text>
        </View>

        <View className="absolute bottom-[100px] justify-center">

          <Button
            title="Sign Up"
            style="primary"
            href="/SignUpScreen"
          />

          <Button
            title="Log In"
            style="secondary"
            href="/SignInScreen"
          />
        </View>

      </View>
    </View>
  );
}