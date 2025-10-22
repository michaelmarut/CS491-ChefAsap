import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Card from "../components/Card";
import Button from '../components/Button';

export default function BookingsScreen() {
    return (
        <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-16">
            <Card
                title="Previous Bookings"
                headerIcon="history"
                isCollapsible={true}
                isScrollable={true}
                scrollDirection="horizontal"
            >
                <Card
                    title="Oct. 3 - 12:00 PM"
                    footerButtonProps={{ title: "See More", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-primary-500 text-center">Jane Doe</Text>
                        <Text className="text-base text-primary-500 text-center">Lunch</Text>
                        <Text className="text-base text-primary-500 text-center">1 Hour</Text>
                    </View>
                </Card>
                <Card
                    title="Oct. 3 - 8:30 AM"
                    footerButtonProps={{ title: "See More", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-primary-500 text-center">John Smith</Text>
                        <Text className="text-base text-primary-500 text-center">Breakfast</Text>
                        <Text className="text-base text-primary-500 text-center">1 Hour</Text>
                    </View>
                </Card>
                <Card
                    title="Oct. 1 - 6:00 PM"
                    footerButtonProps={{ title: "See More", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-primary-500 text-center">George Johnson</Text>
                        <Text className="text-base text-primary-500 text-center">Dinner</Text>
                        <Text className="text-base text-primary-500 text-center">2 Hours</Text>
                    </View>
                </Card>
            </Card>
            <Card
                title="Today's Bookings"
                headerIcon="milestone"
                isCollapsible={true}
                isScrollable={true}
                scrollDirection="horizontal"
                startExpanded={true}
            >
                <Card
                    title="Oct. 3 - 12:00 PM"
                    footerButtonProps={{ title: "See More", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-primary-500 text-center">Jane Doe</Text>
                        <Text className="text-base text-primary-500 text-center">Lunch</Text>
                        <Text className="text-base text-primary-500 text-center">1 Hour</Text>
                    </View>
                </Card>
                <Card
                    title="Oct. 3 - 8:30 AM"
                    footerButtonProps={{ title: "See More", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-primary-500 text-center">John Smith</Text>
                        <Text className="text-base text-primary-500 text-center">Breakfast</Text>
                        <Text className="text-base text-primary-500 text-center">1 Hour</Text>
                    </View>
                </Card>
                <Card
                    title="Oct. 1 - 6:00 PM"
                    footerButtonProps={{ title: "See More", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-primary-500 text-center">George Johnson</Text>
                        <Text className="text-base text-primary-500 text-center">Dinner</Text>
                        <Text className="text-base text-primary-500 text-center">2 Hours</Text>
                    </View>
                </Card>
            </Card>
            <Card
                title="Upcoming Bookings"
                headerIcon="hourglass"
                isCollapsible={true}
                isScrollable={true}
                scrollDirection="horizontal"
            >
                <Card
                    title="Oct. 3 - 12:00 PM"
                    footerButtonProps={{ title: "See More", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-primary-500 text-center">Jane Doe</Text>
                        <Text className="text-base text-primary-500 text-center">Lunch</Text>
                        <Text className="text-base text-primary-500 text-center">1 Hour</Text>
                    </View>
                </Card>
                <Card
                    title="Oct. 3 - 8:30 AM"
                    footerButtonProps={{ title: "See More", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-primary-500 text-center">John Smith</Text>
                        <Text className="text-base text-primary-500 text-center">Breakfast</Text>
                        <Text className="text-base text-primary-500 text-center">1 Hour</Text>
                    </View>
                </Card>
                <Card
                    title="Oct. 1 - 6:00 PM"
                    footerButtonProps={{ title: "See More", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-primary-500 text-center">George Johnson</Text>
                        <Text className="text-base text-primary-500 text-center">Dinner</Text>
                        <Text className="text-base text-primary-500 text-center">2 Hours</Text>
                    </View>
                </Card>
            </Card>
            <View className="h-24" />
        </ScrollView>
    );

}