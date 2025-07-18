import { Text, View, Button } from "react-native";
import { Link } from "expo-router";

export default function Page() {
  return (
    <View style={{ padding: 20 }}>
      <Text>ChefAsap</Text>
      
      <Link href="/signup" asChild>
        <Button title="Sign Up" />
      </Link>

      <View style={{ height: 10 }} />

      <Link href="/signin" asChild>
        <Button title="Sign In" />
      </Link>
    </View>
  );
}

