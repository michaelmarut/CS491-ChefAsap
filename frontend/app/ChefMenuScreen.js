import React, { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, Text, Alert, View, FlatList } from "react-native";

import getEnvVars from "../config";
import { useAuth } from "./context/AuthContext";

import LoadingIcon from "./components/LoadingIcon";
import Button from "./components/Button";
import Card from "./components/Card";
import ChefMenuItem from './components/ChefMenuItem';
import ChefCategory from './components/ChefCategory';

export default function ChefMenu() {
    const { token, userId, profileId } = useAuth();
    const { apiUrl } = getEnvVars();

    const [chefData, setChefData] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [newItemDraft, setNewItemDraft] = useState(null);
    const [newSectionDraft, setNewSectionDraft] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Group items by category
    const itemsByCategory = useMemo(() => {
        const grouped = {};

        // Add all categories
        categories.forEach(cat => {
            grouped[cat.id] = {
                category: cat,
                items: []
            };
        });

        // Add uncategorized group
        grouped['uncategorized'] = {
            category: { id: null, category_name: 'Uncategorized' },
            items: []
        };

        // Distribute items
        menuItems.forEach(item => {
            const catId = item.category_id || 'uncategorized';
            if (grouped[catId]) {
                grouped[catId].items.push(item);
            } else {
                grouped['uncategorized'].items.push(item);
            }
        });

        return grouped;
    }, [categories, menuItems]);

    const handleItemUpdate = (itemId, actionType) => {
        if (actionType === 'DELETE') {
            setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
            setFeaturedItems(prevFeatured => prevFeatured.filter(item => item.id !== itemId));
        } else if (actionType === 'POST_SUCCESS') {
            setNewItemDraft(null);
            refetchMenuData();
        } else if (actionType === 'PUT' || actionType === 'FEATURED_UPDATE') {
            return;
            refetchMenuData();
        } else if (actionType === 'CATEGORY_UPDATE') {
            fetchMenuData();
        }
    };

    const handleCategoryUpdate = (categoryId, actionType) => {
        if (actionType === 'DELETE') {
            setCategories(categories.filter(c => c.id !== categoryId));
        } else if (actionType === 'POST_SUCCESS') {
            setNewSectionDraft(null);
            refetchMenuData();
        } else if (actionType === 'PUT' || actionType === 'FEATURED_UPDATE') {
            return;
            refetchMenuData();
        }
    };

    const startNewItemDraft = (sectionId) => {
        const tempId = -Date.now();

        const blankItem = {
            id: tempId,
            chef_id: profileId,
            dish_name: '',
            description: '',
            photo_url: null,
            servings: 1,
            cuisine_type: null,
            dietary_info: null,
            spice_level: null,
            display_order: menuItems.length,
            price: 0.00,
            prep_time: 15,
            is_new_draft: true,
            category_id: sectionId || null,
        };
        setNewItemDraft(blankItem);
        //console.log('Starting new item draft in section:', newItemDraft);
    };

    const fetchMenuData = async () => {
        if (!profileId) return;

        setLoading(true);
        setError(null);

        try {
            // Fetch chef profile
            const profileUrl = `${apiUrl}/profile/chef/${profileId}/public`;
            const profileResponse = await fetch(profileUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const profileData = await profileResponse.json();

            if (profileResponse.ok) {
                setChefData(profileData.profile);
            } else {
                setError(profileData.error || 'Failed to load profile.');
                Alert.alert('Error', profileData.error || 'Failed to load profile.');
            }

            // Fetch menu items
            const menuUrl = `${apiUrl}/api/menu/chef/${profileId}?show_all=true`;
            const menuResponse = await fetch(menuUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const menuData = await menuResponse.json();

            if (menuResponse.ok) {
                setMenuItems(menuData.menu_items || []);
            } else {
                setMenuItems([]);
            }

            // Fetch categories
            const categoriesUrl = `${apiUrl}/api/menu/chef/${profileId}/categories`;
            const categoriesResponse = await fetch(categoriesUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const categoriesData = await categoriesResponse.json();

            if (categoriesResponse.ok) {
                setCategories(categoriesData.categories || []);
                //console.log('Categories loaded:', categoriesData.categories?.length || 0);
            } else {
                console.log('Categories fetch error:', categoriesData.error);
                setCategories([]);
            }

        } catch (err) {
            setError('Network error. Could not connect to API.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenuData();
    }, [profileId, apiUrl, token]);

    const refetchMenuData = async () => {
        if (!profileId) return;

        setError(null);

        try {
            // Fetch menu items
            const menuUrl = `${apiUrl}/api/menu/chef/${profileId}?show_all=true`;
            const menuResponse = await fetch(menuUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const menuData = await menuResponse.json();

            if (menuResponse.ok) {
                setMenuItems(menuData.menu_items || []);
            } else {
                setMenuItems([]);
            }

            // Fetch categories
            const categoriesUrl = `${apiUrl}/api/menu/chef/${profileId}/categories`;
            const categoriesResponse = await fetch(categoriesUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const categoriesData = await categoriesResponse.json();

            if (categoriesResponse.ok) {
                setCategories(categoriesData.categories || []);
                //console.log('Categories loaded:', categoriesData.categories?.length || 0);
            } else {
                console.log('Categories fetch error:', categoriesData.error);
                setCategories([]);
            }

        } catch (err) {
            setError('Network error. Could not connect to API.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignCategory = async (categoryId) => {
        try {
            const response = await fetch(`${apiUrl}/api/menu/item/${selectedMenuItem.id}/category`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ category_id: categoryId }),
            });

            if (response.ok) {
                // Update menu items locally
                setMenuItems(menuItems.map(item =>
                    item.id === selectedMenuItem.id
                        ? { ...item, category_id: categoryId }
                        : item
                ));
                setShowAssignCategoryModal(false);
                setSelectedMenuItem(null);
                Alert.alert('Success', 'Item assigned to category!');
            } else {
                const data = await response.json();
                Alert.alert('Error', data.error || 'Failed to assign category');
            }
        } catch (err) {
            Alert.alert('Error', 'Network error');
            console.error('Assign category error:', err);
        }
    };

    const uncategorizedSection = () => (
        <>
            {itemsByCategory['uncategorized']?.items?.map(item => (
                <ChefMenuItem
                    key={item.id}
                    item={item}
                    onItemUpdate={handleItemUpdate}
                    cuisineTypes={chefData?.cuisines || []}
                    categories={categories}
                />
            ))}
            {newItemDraft?.category_id === null ? (
                <ChefMenuItem
                    key={newItemDraft.id}
                    item={newItemDraft}
                    onItemUpdate={handleItemUpdate}
                    cuisineTypes={chefData?.cuisines || []}
                    categories={categories}
                    isNewDraft={true}
                    onCancelNew={() => setNewItemDraft(null)}
                />
            ) : (
                <Button
                    title={newItemDraft ? "Cancel Add Item" : "Add New Menu Item"}
                    onPress={newItemDraft ? () => setNewItemDraft(null) : () => startNewItemDraft(null)}
                    style={newItemDraft ? "danger" : "secondary"}
                    customClasses="min-w-[60%]"
                />
            )}
        </>
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12">
                {/*<Text>{JSON.stringify(chefData)}</Text>*/}
                <Card
                    title="Menu"
                    customHeader='justify-center'
                    customHeaderText='text-xl'
                >
                    {loading ?
                        <LoadingIcon message="Loading Your Menu..." icon='spinner' />
                        : <>
                            {categories.map(category => {
                                const categoryItems = itemsByCategory[category.id]?.items || [];
                                return (
                                    <ChefCategory
                                        key={category.id}
                                        categoryId={category.id}
                                        initialName={category.category_name}
                                        categoryItems={categoryItems}
                                        chefCuisineTypes={chefData?.cuisines || []}
                                        onItemUpdate={handleItemUpdate}
                                        onCategoryUpdate={handleCategoryUpdate}
                                        categories={categories}
                                    >
                                        {
                                            newItemDraft?.category_id === category.id ? (
                                                <ChefMenuItem
                                                    key={newItemDraft.id}
                                                    item={newItemDraft}
                                                    onItemUpdate={handleItemUpdate}
                                                    cuisineTypes={chefData?.cuisines || []}
                                                    sectionId={category.id}
                                                    categories={categories}
                                                    isNewDraft={true}
                                                    onCancelNew={() => setNewItemDraft(null)}
                                                />
                                            ) : (
                                                <Button
                                                    title={newItemDraft ? "Cancel Add Item" : "Add New Menu Item"}
                                                    onPress={newItemDraft ? () => setNewItemDraft(null) : () => startNewItemDraft(category.id)}
                                                    style={newItemDraft ? "danger" : "secondary"}
                                                    customClasses="min-w-[60%]"
                                                />
                                            )
                                        }
                                    </ChefCategory>
                                );
                            })}

                            {categories.length > 0 ? (
                                <Card
                                    title={'Other'}
                                    isCollapsible={true}
                                    startExpanded={false}
                                    customHeaderText='text-lg'
                                >
                                    {uncategorizedSection()}
                                </Card>
                            ) : (
                                uncategorizedSection()
                            )}

                            {newSectionDraft ? (
                                <ChefCategory
                                    key={-1}
                                    categoryId={null}
                                    initialName={"New Category"}
                                    categoryItems={[]}
                                    chefCuisineTypes={chefData?.cuisines || []}
                                    onItemUpdate={handleItemUpdate}
                                    onCategoryUpdate={handleCategoryUpdate}
                                    isNewDraft={true}
                                    categories={categories}
                                />
                            ) : (
                                <Button
                                    title={newSectionDraft ? "Cancel Add Section" : "Add New Section"}
                                    onPress={() => setNewSectionDraft(true)}
                                    style={newSectionDraft ? "danger" : "primary"}
                                    customClasses="min-w-[60%]"
                                />
                            )}
                        </>
                    }
                </Card>

                <Button
                    title="Customer View"
                    style="primary"
                    customClasses="min-w-[60%]"
                    href={`/ChefMenu/${profileId}`}
                />

                <Button
                    title="← Return"
                    style="secondary"
                    href={`/(tabs)/Profile`}
                    customClasses="min-w-[60%]"
                />
                <View className="h-24" />

            </ScrollView>
        </>
    );
}