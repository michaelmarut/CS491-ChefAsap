import { View, Text, Image } from "react-native";
import getEnvVars from "../../config";
import { getTailwindColor } from '../utils/getTailwindColor';
import { useTheme } from "../providers/ThemeProvider";

export default function ProfilePicture({
    photoUrl = '', // something like profile.photo_url
    firstName = '', // profile.first_name
    lastName = '', // profile.last_name
    size = 32, // changes circle size, border thickness, font size; should be multiple of 4
    customClasses = '',
}) {
    const { apiUrl } = getEnvVars();
    const { manualTheme } = useTheme();
    return (
        <View style={{ alignItems: "center" }} className = {customClasses}>
            {photoUrl ? (
                <Image
                    source={{ uri: `${apiUrl}${photoUrl}` }}
                    className={"rounded-full shadow-sm shadow-primary-500"}
                    style={{
                        width: size * 4,
                        height: size * 4,
                        borderWidth: size / 8,
                        borderColor: manualTheme === 'light' ? getTailwindColor('primary.400') : getTailwindColor('dark.400'),
                    }}
                />
            ) : (
                <View className="rounded-full shadow-sm shadow-primary-500 justify-center items-center bg-primary-100 dark:bg-dark-100"
                    style={{
                        width: size * 4,
                        height: size * 4,
                        borderWidth: size / 8,
                        borderColor: manualTheme === 'light' ? getTailwindColor('primary.400') : getTailwindColor('dark.400'),
                    }}
                >
                    <Text className="text-primary-400 font-bold text-center dark:text-dark-400" style={{ fontSize: size * 1.5 }}>{firstName[0]} {lastName[0]}</Text>
                </View>
            )}
        </View>
    );
}