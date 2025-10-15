import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Card from "../components/Card";
import Button from '../components/Button';
import LoadingIcon from "../components/LoadingIcon";
import LocationInput from '../components/LocationInput';
import SearchBarComponent from '../components/SearchBar';

export default function SearchScreen() {
    const [formData, setFormData] = useState({
        searchQuery: '',     // chef name, cuisine, or dish
        searchType: 'chef',  // 'chef', 'cuisine', or 'dish'
        searchRadius: 10,    // search radius in miles (default 10)
        gender: 'all',       // 'any', 'male', 'female'
        timing: 'all',       // 'any', 'breakfast', 'lunch', 'dinner'
        locationAddress: '',
        latitude: null,
        longitude: null,
    });

    const handleSearch = () => {
        console.log("Initiating search with data:", formData);
        alert(JSON.stringify(formData));
    };
    
    return (
        <ScrollView className="flex-1 bg-base-100 p-5 gap-y-12 pt-24">

            <SearchBarComponent
                formData={formData}
                setFormData={setFormData}
                handleSearch={handleSearch}
            />

            <Card
                title="Favorite Chefs"
                headerIcon="heart"
                isCollapsible={true}
                isScrollable={true}
                scrollDirection="horizontal"
            >
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">Jane Doe</Text>
                    <Text className="text-base text-olive-500 text-center">Italian</Text>
                </View>
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">John Smith</Text>
                    <Text className="text-base text-olive-500 text-center">French</Text>
                </View>
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">George Johnson</Text>
                    <Text className="text-base text-olive-500 text-center">Vietnamese</Text>
                </View>
            </Card>
            <Card
                title="Recent Chefs"
                headerIcon="history"
                isCollapsible={true}
                isScrollable={true}
                scrollDirection="horizontal"
            >
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">Jane Doe</Text>
                    <Text className="text-base text-olive-500 text-center">Italian</Text>
                </View>
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">John Smith</Text>
                    <Text className="text-base text-olive-500 text-center">French</Text>
                </View>
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">George Johnson</Text>
                    <Text className="text-base text-olive-500 text-center">Vietnamese</Text>
                </View>
            </Card>
            <Card
                title="Nearby Chefs"
                headerIcon="location"
                isScrollable={true}
                scrollDirection="vertical"
            >
                <Card
                    title="Jane Doe"
                    footerButtonProps={{ title: "Book", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-olive-500 text-center">Italian</Text>
                        <Text className="text-base text-olive-500 text-center">Breakfast, Lunch, Dinner</Text>
                        <Text className="text-base text-olive-500 text-center">3 miles away</Text>
                    </View>
                </Card>
                <Card
                    title="John Smith"
                    footerButtonProps={{ title: "Book", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-olive-500 text-center">French</Text>
                        <Text className="text-base text-olive-500 text-center">Breakfast</Text>
                        <Text className="text-base text-olive-500 text-center">5 miles away</Text>
                    </View>
                </Card>
                <Card
                    title="George Johnson"
                    footerButtonProps={{ title: "Book", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-olive-500 text-center">Vietnamese</Text>
                        <Text className="text-base text-olive-500 text-center">Lunch, Dinner</Text>
                        <Text className="text-base text-olive-500 text-center">7 miles away</Text>
                    </View>
                </Card>
            </Card>
            <View className="h-24" />
        </ScrollView>
    );

}