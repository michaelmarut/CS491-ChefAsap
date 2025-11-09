import { Text, View, Image } from "react-native";
import Button from '../components/Button';

export default function LandingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100 p-8">
      <View className="p-6 rounded-2xl bg-primary-200 items-center w-full h-full shadow-lg shadow-primary-400 dark:bg-dark-200 dark:shadow-dark-400">
        <View className="mb-8 items-center">
          <Image
            source={require('../assets/icon.png')}
            className="w-48 h-48 mb-4"
            resizeMode="contain"
          />
          <Text className="text-5xl font-bold text-primary-500 title-shadow-md">ChefAsap</Text>
          <Text className="text-xl font-bold text-primary-400 title-shadow-md dark:text-dark-400">Find a Chef</Text>
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