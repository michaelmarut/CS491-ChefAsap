import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';
import Button from './Button';

export default function Card({
    title,
    headerIcon,
    isCollapsible = false,
    isScrollable = false,
    scrollDirection = 'vertical',
    children,
    footerButtonProps = null,
    startExpanded = false,
    customClasses = '',
    customCard = '',
    customHeader = '',
    customHeaderText = ''
}) {
    const [isExpanded, setIsExpanded] = useState(isCollapsible ? startExpanded : true);

    const ContentWrapper = isScrollable ? ScrollView : View;

    const scrollProps = isScrollable
        ? {
            horizontal: scrollDirection === 'horizontal',
            showsHorizontalScrollIndicator: scrollDirection === 'horizontal',
            showsVerticalScrollIndicator: scrollDirection === 'vertical',
            contentContainerStyle: scrollDirection === 'horizontal' ? { paddingHorizontal: 4 } : {},
        }
        : {};

    const cardClasses = "bg-white rounded-xl shadow-sm shadow-olive-500 mb-4 p-0 overflow-hidden " + customClasses;
    const headerClasses = "flex-row items-center justify-between p-4 border-b border-gray-100 bg-olive-100 " + customHeader;
    const contentWrapperClasses = "m-4 " + customCard;
    const footerClasses = "p-4 pt-0";

    const HeaderContent = (
        <View className="flex-row items-center">
            {headerIcon && (
                <Octicons
                    name={headerIcon}
                    size={20}
                    color="#4d7c0f" // olive-400
                    style={{ marginRight: 8 }}
                />
            )}
            <Text className={`text-lg font-bold text-olive-400 ${customHeaderText}`}>{title}</Text>
        </View>
    );

    return (
        <View className={cardClasses}>

            {title && (
                <TouchableOpacity
                    className={headerClasses}
                    onPress={() => isCollapsible && setIsExpanded(!isExpanded)}
                    activeOpacity={isCollapsible ? 0.7 : 1}
                >
                    {HeaderContent}

                    {isCollapsible && (
                        <Octicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#4d7c0f" // olive-400
                        />
                    )}
                </TouchableOpacity>
            )}

            {isExpanded && (
                <ContentWrapper className={contentWrapperClasses} {...scrollProps}>
                    {children}
                </ContentWrapper>
            )}

            {footerButtonProps && (
                <View className={footerClasses}>
                    <Button
                        title={footerButtonProps.title}
                        style={footerButtonProps.style || 'accent'}
                        onPress={footerButtonProps.onPress}
                        href={footerButtonProps.href}
                        icon={footerButtonProps.icon}
                        customClasses="w-full"
                    />
                </View>
            )}
        </View>
    );
}