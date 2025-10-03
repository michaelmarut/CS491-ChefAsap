import { ScrollView, Text } from "react-native";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
    const { logout } = useAuth(); 

    return (
        <ScrollView className="flex-1 bg-base-100 p-5">
            <Text className="text-base text-warm-gray text-center mt-12"> Profile Picture </Text>
            <Text className="text-base text-warm-gray text-center mt-12"> FirstName LastName </Text>
            <Text className="text-base text-warm-gray text-center mt-12"> Description </Text>
            <Button
                title="Log out"
                style="primary"
                onPress={logout}
            />
        </ScrollView>
    );

}