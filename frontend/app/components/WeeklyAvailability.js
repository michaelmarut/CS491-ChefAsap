import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';

/**
 * WeeklyAvailability Component - Editable version
 * Horizontal bar chart style with clickable time blocks
 */
const WeeklyAvailability = forwardRef(({ initialAvailability = {}, editable = true, bookedBlocks = [] }, ref) => {
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

    // Normalize bookedBlocks into a Set of "day-hour" strings for quick lookup
    const normalizeBooked = (blocks) => {
        if (!blocks) return new Set();
        if (blocks instanceof Set) return blocks;
        if (Array.isArray(blocks)) return new Set(blocks);
        // If object mapping day -> array
        const s = new Set();
        try {
            Object.entries(blocks).forEach(([day, arr]) => {
                if (Array.isArray(arr)) arr.forEach(h => s.add(`${day}-${h}`));
            });
        } catch (e) {}
        return s;
    };

    const bookedSet = normalizeBooked(bookedBlocks);

    // Convert initial availability (ranges) to selected blocks (Set of "day-hour" strings)
    const rangesToBlocks = (availability) => {
        const blocks = new Set();
        
        Object.entries(availability).forEach(([day, slots]) => {
            if (!slots || !Array.isArray(slots)) return;
            
            slots.forEach(slot => {
                const startHour = parseInt(slot.start_time.split(':')[0]);
                const endHour = parseInt(slot.end_time.split(':')[0]);
                
                for (let hour = startHour; hour < endHour; hour++) {
                    blocks.add(`${day}-${hour}`);
                }
            });
        });
        
        return blocks;
    };

    // Initialize selected blocks but remove any hours that are already booked
    const [selectedBlocks, setSelectedBlocks] = useState(() => {
        const initial = rangesToBlocks(initialAvailability);
        // remove booked hours from initial selection so they are not treated as available
        bookedSet.forEach(b => {
            if (initial.has(b)) initial.delete(b);
        });
        return initial;
    });

    const toggleBlock = (dayKey, hour) => {
        if (!editable) return;
        const blockId = `${dayKey}-${hour}`;
        if (bookedSet.has(blockId)) {
            // Prevent changing booked hours
            Alert && Alert.alert && Alert.alert('Booked', 'This hour is already booked and cannot be changed.');
            return;
        }

        setSelectedBlocks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(blockId)) {
                newSet.delete(blockId);
            } else {
                newSet.add(blockId);
            }
            return newSet;
        });
    };

    const isTimeAvailable = (dayKey, hour) => {
        return selectedBlocks.has(`${dayKey}-${hour}`);
    };

    const getHourLabel = (hour) => {
        if (hour === 12) return '12p';
        if (hour === 0) return '12a';
        if (hour < 12) return `${hour}a`;
        return `${hour - 12}p`;
    };

    // Convert selected blocks back to ranges for API
    const blocksToRanges = () => {
        const availability = {};
        
        DAYS.forEach(day => {
            // only include blocks that are selected and not booked
            const dayBlocks = HOURS.filter(hour => isTimeAvailable(day.key, hour) && !bookedSet.has(`${day.key}-${hour}`)).sort((a, b) => a - b);
            
            if (dayBlocks.length === 0) {
                availability[day.key] = [];
                return;
            }

            const ranges = [];
            let rangeStart = dayBlocks[0];
            let rangeEnd = dayBlocks[0] + 1;

            for (let i = 1; i < dayBlocks.length; i++) {
                if (dayBlocks[i] === rangeEnd) {
                    rangeEnd = dayBlocks[i] + 1;
                } else {
                    ranges.push({
                        start_time: `${rangeStart.toString().padStart(2, '0')}:00`,
                        end_time: `${rangeEnd.toString().padStart(2, '0')}:00`,
                        is_available: true
                    });
                    rangeStart = dayBlocks[i];
                    rangeEnd = dayBlocks[i] + 1;
                }
            }

            ranges.push({
                start_time: `${rangeStart.toString().padStart(2, '0')}:00`,
                end_time: `${rangeEnd.toString().padStart(2, '0')}:00`,
                is_available: true
            });

            availability[day.key] = ranges;
        });

        return availability;
    };

    // Expose getAvailability method to parent
    useImperativeHandle(ref, () => ({
        getAvailability: blocksToRanges
    }));

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="py-2">
                {/* Instruction text */}
                {editable && (
                    <View className="mb-3 p-2 bg-blue-50 dark:bg-blue-900 rounded">
                        <Text className="text-xs text-blue-800 dark:text-blue-200">
                            💡 Tap time blocks to select/deselect available hours
                        </Text>
                    </View>
                )}

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
                    const dayBlockCount = HOURS.filter(hour => isTimeAvailable(day.key, hour)).length;
                    const hasSlots = dayBlockCount > 0;

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
                                {hasSlots && (
                                    <Text className="text-[10px] text-lime-600 dark:text-lime-400">
                                        {dayBlockCount}h
                                    </Text>
                                )}
                            </View>

                            {/* Time blocks */}
                            <View className="flex-row">
                                {HOURS.map(hour => {
                                    const isAvailable = isTimeAvailable(day.key, hour);
                                    const isBooked = bookedSet.has(`${day.key}-${hour}`);

                                    let blockClass = isBooked
                                        ? 'bg-red-500 dark:bg-red-600'
                                        : isAvailable
                                            ? 'bg-lime-500 dark:bg-lime-600'
                                            : 'bg-gray-100 dark:bg-gray-800';

                                    return (
                                        <TouchableOpacity
                                            key={hour}
                                            onPress={() => toggleBlock(day.key, hour)}
                                            disabled={!editable || isBooked}
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
                </View>

                {/* Summary */}
                <View className="mt-3 p-2 bg-base-200 dark:bg-base-dark-200 rounded">
                    <Text className="text-xs text-primary-400 dark:text-dark-400">
                        Total: {selectedBlocks.size} hour{selectedBlocks.size !== 1 ? 's' : ''} selected
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
});

export default WeeklyAvailability;
