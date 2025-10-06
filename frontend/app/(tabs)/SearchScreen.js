import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Card from "../components/Card";
import Button from '../components/Button';
import LoadingIcon from "../components/LoadingIcon";

export default function SearchScreen() {
    return (
        <ScrollView className="flex-1 bg-base-100 p-5 gap-y-12 pt-24">

            <Button
                title="Start a New Booking"
                variant="primary"
                href="/BookingScreen"
                customClasses="w-full mt-4 mb-4"
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
                isCollapsible={true}
                isScrollable={true}
                scrollDirection="vertical"
                startExpanded={true}
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