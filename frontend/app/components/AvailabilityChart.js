import React from 'react';
import { View, Text, ScrollView } from 'react-native';

/**
 * Simple visual availability chart for viewing only
 * Shows a week schedule with horizontal time bars
 */
export default function AvailabilityChart({ weeklySchedule = {}, bookedBlocks = {} }) {
    const DAYS = [
        { key: 1, name: 'Monday', short: 'Mon' },
        { key: 2, name: 'Tuesday', short: 'Tue' },
        { key: 3, name: 'Wednesday', short: 'Wed' },
        { key: 4, name: 'Thursday', short: 'Thu' },
        { key: 5, name: 'Friday', short: 'Fri' },
        { key: 6, name: 'Saturday', short: 'Sat' },
        { key: 0, name: 'Sunday', short: 'Sun' }
    ];

    const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

    const isTimeAvailable = (dayKey, hour) => {
        const daySlots = weeklySchedule[dayKey] || [];
        const hourStr = `${hour.toString().padStart(2, '0')}:00`;
        
        return daySlots.some(slot => {
            const slotStart = slot.start_time;
            const slotEnd = slot.end_time;
            return hourStr >= slotStart && hourStr < slotEnd;
        });
    };

    // bookedBlocks expected as an object mapping dayKey -> Set of hours OR array of strings `${day}-${hour}`
    const isTimeBooked = (dayKey, hour) => {
        if (!bookedBlocks) return false;
        // normalize both shapes
        if (bookedBlocks instanceof Set) {
            return bookedBlocks.has(`${dayKey}-${hour}`);
        }
        if (Array.isArray(bookedBlocks)) {
            return bookedBlocks.includes(`${dayKey}-${hour}`);
        }
        const daySet = bookedBlocks[dayKey];
        if (!daySet) return false;
        if (daySet instanceof Set) return daySet.has(hour);
        if (Array.isArray(daySet)) return daySet.includes(hour);
        return false;
    };

    const getHourLabel = (hour) => {
        if (hour === 12) return '12p';
        if (hour === 0) return '12a';
        if (hour < 12) return `${hour}a`;
        return `${hour - 12}p`;
    };

    const hasAnyAvailability = () => {
        return Object.values(weeklySchedule).some(slots => slots && slots.length > 0);
    };

    if (!hasAnyAvailability()) {
        return (
            <View className="p-6 items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Text className="text-gray-500 dark:text-gray-400 text-center">
                    No availability schedule set
                </Text>
            </View>
        );
    }

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="py-2">
                {/* Header - Time labels */}
                <View className="flex-row mb-2">
                    <View className="w-[60px]" />
                    {HOURS.map(hour => (
                        <View key={hour} className="w-[30px] items-center">
                            <Text className="text-[10px] text-gray-600 dark:text-gray-400">
                                {getHourLabel(hour)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Days with time bars */}
                {DAYS.map(day => {
                    const daySlots = weeklySchedule[day.key] || [];
                    const hasSlots = daySlots.length > 0;

                    return (
                        <View key={day.key} className="flex-row items-center mb-2">
                            {/* Day label */}
                            <View className="w-[60px]">
                                <Text className={`text-sm font-semibold ${
                                    hasSlots 
                                        ? 'text-primary-400 dark:text-dark-400' 
                                        : 'text-gray-400 dark:text-gray-600'
                                }`}>
                                    {day.short}
                                </Text>
                            </View>

                            {/* Time blocks */}
                            <View className="flex-row">
                                {HOURS.map(hour => {
                                    const isAvailable = isTimeAvailable(day.key, hour);
                                    const booked = isTimeBooked(day.key, hour);
                                    
                                    // booked overrides available display
                                    const blockClass = booked
                                        ? 'bg-red-500 dark:bg-red-600'
                                        : isAvailable
                                        ? 'bg-lime-500 dark:bg-lime-600'
                                        : 'bg-gray-100 dark:bg-gray-800';

                                    return (
                                        <View
                                            key={hour}
                                            className={`w-[30px] h-[24px] border-r border-gray-200 dark:border-gray-700 ${blockClass}`}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}

                {/* Legend */}
                <View className="flex-row items-center mt-3 gap-4">
                    <View className="flex-row items-center gap-2">
                        <View className="w-[20px] h-[20px] bg-lime-500 dark:bg-lime-600 rounded" />
                        <Text className="text-xs text-gray-600 dark:text-gray-400">Available</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <View className="w-[20px] h-[20px] bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700" />
                        <Text className="text-xs text-gray-600 dark:text-gray-400">Not Available</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <View className="w-[20px] h-[20px] bg-red-500 dark:bg-red-600 rounded" />
                        <Text className="text-xs text-gray-600 dark:text-gray-400">Booked</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
