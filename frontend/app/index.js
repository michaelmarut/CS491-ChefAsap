import { Text, View, TouchableOpacity, Image } from "react-native";
import { Link } from "expo-router";
import { NativeWindStyleSheet } from "nativewind";
import Button from './components/Button'; 

NativeWindStyleSheet.setOutput({ default: "native" });

export default function Page() {
  return (
    <View className="flex-1 justify-center items-center bg-base-100">
      <View className="p-6 rounded-2xl bg-olive-200 items-center">
        <View className="mb-8 items-center">
          <Image
            source={require('./assets/images/chefAsapLogo.png')}
            className="w-16 h-16 mb-4"
            resizeMode="contain"
          />
          <Text className="text-xl font-bold text-olive-400">Find a Chef</Text>
          <Text className="text-3xl font-bold text-olive-500">ChefAsap</Text>
        </View>

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
  );
}