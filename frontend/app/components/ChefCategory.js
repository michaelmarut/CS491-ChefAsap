import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, Image, TouchableOpacity } from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import Card from './Card';
import LoadingIcon from './LoadingIcon';
import Button from './Button';
import Input from './Input';
import ChefMenuItem from './ChefMenuItem';

export default function ChefCategory({
    categoryId,
    initialName,
    categoryItems,
    chefCuisineTypes,
    onItemUpdate,
    onCategoryUpdate,
    isNewDraft = false,
    categories,
    children
}) {
    const { token, profileId } = useAuth();
    const { apiUrl } = getEnvVars();

    const [categoryName, setCategoryName] = useState(initialName);
    const [renameCategoryName, setRenameCategoryName] = useState(initialName);
    const [editing, setEditing] = useState(isNewDraft);

    const [loading, setLoading] = useState(false);
    const [savingCategory, setSavingCategory] = useState(false);

    const [error, setError] = useState(null);

    const handleRenameCategory = async () => {
        setRenameCategoryName(renameCategoryName.trim())

        if (isNewDraft && !renameCategoryName) {
            Alert.alert("Missing Name", "A section name is required.");
            return;
        }

        if (!isNewDraft && (!renameCategoryName || renameCategoryName === categoryName)) {
            setEditing(false);
            return;
        }

        if (isNewDraft) {
            try {
                const response = await fetch(`${apiUrl}/api/menu/chef/${profileId}/categories`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ category_name: renameCategoryName }),
                });

                const data = await response.json();

                if (response.ok) {
                    setCategoryName(renameCategoryName);
                    onCategoryUpdate(data.category_id, 'POST_SUCCESS');
                    Alert.alert('Success', 'Category created successfully!');
                } else {
                    Alert.alert('Error', data.error || 'Failed to create category');
                }
            } catch (err) {
                Alert.alert('Error', 'Network error. Could not create category.');
                console.error('Create category error:', err);
            }
        } else {
            try {
                setSavingCategory(true);
                const response = await fetch(`${apiUrl}/api/menu/categories/${categoryId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ category_name: renameCategoryName }),
                });

                const data = await response.json();

                if (response.ok) {
                    setCategoryName(renameCategoryName);
                    onCategoryUpdate(categoryId, 'PUT');
                    Alert.alert('Success', 'Category renamed successfully!');
                } else {
                    Alert.alert('Error', data.error || 'Failed to rename category');
                }
            } catch (err) {
                Alert.alert('Error', 'Network error. Could not rename category.');
                console.error('Rename category error:', err);
            } finally {
                setSavingCategory(false);
                setEditing(false);
            }
        }
    };

    const handleCancelEdit = () => {
        if (isNewDraft) {
            onCategoryUpdate(categoryId), 'DELETE';
            return;
        }
        setRenameCategoryName(categoryName || initialName);
        setEditing(false);
    };

    const handleDeleteCategory = async () => {
        Alert.alert(
            'Delete Category',
            'Are you sure? Items in this category will become uncategorized.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${apiUrl}/api/menu/categories/${categoryId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            });

                            if (response.ok) {
                                onCategoryUpdate(categoryId, 'DELETE');
                                Alert.alert('Success', 'Category deleted successfully!');
                            } else {
                                const data = await response.json();
                                Alert.alert('Error', data.error || 'Failed to delete category');
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Network error');
                            console.error('Delete category error:', err);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mb-4 w-full" key={item?.id}>
                <LoadingIcon icon='spinner' size={128} message='' />
            </View>
        );
    }

    return (
        <Card
            title={categoryName}
            isCollapsible={!editing}
            startExpanded={isNewDraft}
            customHeaderText='text-lg'
        >
            {!editing &&
                <>
                    <Button
                        onPress={() => setEditing(true)}
                        icon="pencil"
                        style="accent"
                        customClasses="absolute -top-[62px] right-[84px] z-10 p-3 rounded-full pl-3"
                    />
                    <Button
                        onPress={() => handleDeleteCategory()}
                        icon="trash"
                        style="accent"
                        customClasses="absolute -top-[62px] right-10 z-10 p-3 rounded-full pl-3"
                    />
                </>
            }
            {editing &&
                <View>
                    <Input
                        value={renameCategoryName}
                        onChangeText={setRenameCategoryName}
                        placeholder={categoryName || 'Category Name'}
                        maxLength={100}
                        containerClasses='absolute -top-[72px] w-[70%]'
                    />
                    <Button
                        onPress={handleCancelEdit}
                        icon="x"
                        style="accent"
                        customClasses="absolute -top-[70px] right-10 z-10 p-3 rounded-full pl-3"
                    />
                    <Button
                        onPress={handleRenameCategory}
                        icon={savingCategory ? 'sync' : 'check'}
                        style="accent"
                        customClasses="absolute -top-[70px] -right-2 z-10 p-3 rounded-full pl-3"
                        disabled={savingCategory}
                    />
                </View>
            }
            {!isNewDraft && 
                <>
                {categoryItems.length > 0 ? (
                    categoryItems.map(item => (
                        <ChefMenuItem
                            key={item.id}
                            item={item}
                            onItemUpdate={onItemUpdate}
                            cuisineTypes={chefCuisineTypes || []}
                            sectionId={categoryId}
                            categories={categories}
                        />
                    ))
                ) : (
                    <Text className="text-primary-400 text-center py-4 dark:text-dark-400">
                        No items in this category yet
                    </Text>
                )}
                {children}
            </>
            }
            
        </Card>
    );
}