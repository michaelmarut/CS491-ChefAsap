import { Text, View, TouchableOpacity, Image } from "react-native";
import { Link } from "expo-router";
import { NativeWindStyleSheet } from "nativewind";

NativeWindStyleSheet.setOutput({ default: "native" });

export default function Page() {
  return (
    <View className="flex-1 justify-center items-center bg-base-100">
      <View className="p-6 rounded-2xl bg-olive-200 items-center">
        <View className="mb-8 items-center">
          {/* <Image
            source={require('../assets/images/chefAsapLogo.png')}
            className="w-16 h-16 mb-4"
            resizeMode="contain"
          /> */}
          <Text className="text-xl font-bold text-olive-400">Find a Chef</Text>
          <Text className="text-3xl font-bold text-olive-500">ChefAsap</Text>
        </View>

        <Link href="/signup" asChild>
          <TouchableOpacity className="bg-olive-300 py-3 px-8 rounded-lg mb-2">
            <Text className="text-base-300 font-bold text-lg">Sign Up</Text>
          </TouchableOpacity>
        </Link>

        <View className="h-2" />

        <Link href="/signin" asChild>
          <TouchableOpacity className="bg-olive-300 py-3 px-8 rounded-lg">
            <Text className="text-base-300 font-bold text-lg">Log In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}