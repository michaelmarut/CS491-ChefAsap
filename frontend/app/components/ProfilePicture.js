import { View, Text, Image } from "react-native";
import getEnvVars from "../../config";

export default function ProfilePicture({
    photoUrl = '', // something like profile.photo_url
    firstName = '', // profile.first_name
    lastName = '', // profile.last_name
    size = 32 // changes circle size, border thickness, font size; should be multiple of 4
}) {
    const { apiUrl } = getEnvVars();
    return (
        <View style={{ alignItems: "center" }}>
            {photoUrl ? (
                <Image
                    source={{ uri: `${apiUrl}${photoUrl}` }}
                    className={"rounded-full mb-2 shadow-sm shadow-olive-500"}
                    style={{
                        width: size * 4,
                        height: size * 4,
                        borderWidth: size / 8,
                        borderColor: "#4D7C0F",
                    }}
                />
            ) : (
                <View className="rounded-full mb-2 shadow-sm shadow-olive-500 justify-center items-center bg-olive-100"
                    style={{
                        width: size * 4,
                        height: size * 4,
                        borderWidth: size / 8,
                        borderColor: "#4D7C0F",
                    }}
                >
                    <Text className="text-olive-400 font-bold text-center" style={{fontSize: size*1.5}}>{firstName[0]} {lastName[0]}</Text>
                </View>
            )}
        </View>
    );
}