import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function CustomPicker({ 
    label, // optional text above picker
    prompt, // placeholder text
    selectedValue, // current value
    onValueChange, // function when value is selected
    items, // array of picker options
    labelStyle = '', // optional label styles
}) {
    return (
        <View className="flex-1 mr-3">
            {label && <Text className={`text-sm font-semibold mb-1 mt-2 text-olive-400 ${labelStyle}`}>{label}</Text>}
            <View className="border border-olive-200 bg-white rounded-full shadow-sm shadow-olive-500">
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={onValueChange} 
                    prompt={prompt} 
                    style={{ color: '#3f3f1f', marginLeft: 8}}
                >
                    {items.map((item, index) => (
                        <Picker.Item key={index} label={item.label} value={item.value} style={{fontSize: 14}}/>
                    ))}
                </Picker>
            </View>
        </View>
    );
}