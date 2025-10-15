import { Text, View, Image } from "react-native";
import Button from '../components/Button';

export default function LandingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-base-100">
      <View className="p-6 rounded-2xl bg-olive-200 items-center w-[80%] h-[90%] shadow-lg shadow-olive-400">
        <View className="mb-8 items-center">
          <Image
            source={require('../assets/images/chefAsapLogo1Circle.png')}
            className="w-48 h-48 mb-4"
            resizeMode="contain"
          />
          <Text className="text-5xl font-bold text-olive-500 title-shadow-md">ChefAsap</Text>
          <Text className="text-xl font-bold text-olive-400 title-shadow-md">Find a Chef</Text>
        </View>

        <View className="absolute bottom-[100px] justify-center">

          <Button
            title="Sign Up"
            style="primary"
            href="/SignUpScreen"
            customClasses="min-w-[50%]"
          />

          <Button
            title="Log In"
            style="secondary"
            href="/SignInScreen"
            customClasses="min-w-[50%]"
          />
        </View>

      </View>
    </View>
  );
}