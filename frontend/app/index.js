import { ImageBackground, Text, View, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function LandingScreen() {
  return (
    <ImageBackground
      source={require('./assets/images/landingPage.png')}
      className="flex-1 justify-center items-center bg-base-300"
      resizeMode="cover"
    >
      <View className="p-5 flex-1 justify-center items-center w-full">

        <View className="mb-10 items-center">

          <Text
            className="text-4xl text-olive-500 font-semibold"
            style={{
              textShadowColor: 'rgba(255, 255, 255, 0.8)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            Find a Chef
          </Text>

          <Text
            className="text-3xl text-olive-400 font-bold"
            style={{
              textShadowColor: 'rgba(255, 255, 255, 0.8)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            ChefAsap
          </Text>
        </View>

        <Link href="/SignUpScreen" asChild>
          <TouchableOpacity
            className="py-4 px-8 rounded-full items-center bg-olive-400 border-2 border-olive-100 shadow-lg"
          >
            <Text className="text-lg font-bold text-olive-100">Sign Up</Text>
          </TouchableOpacity>
        </Link>

        <View className="h-2.5" />

        <Link href="/SignInScreen" asChild>
          <TouchableOpacity
            className="py-4 px-8 rounded-full items-center bg-olive-100 border-2 border-olive-400 shadow-lg"
          >
            <Text className="text-lg font-bold text-olive-400">Log In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ImageBackground>
  );
}