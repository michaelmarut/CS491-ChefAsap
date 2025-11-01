import React, { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, Text, Alert, View, FlatList, Modal, TouchableOpacity, TextInput, Image } from "react-native";
import { Octicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import getEnvVars from "../config";
import { useAuth } from "./context/AuthContext";

import LoadingIcon from "./components/LoadingIcon";
import Button from "./components/Button";
import ProfilePicture from "./components/ProfilePicture";
import Card from "./components/Card";
import TagsBox from './components/TagsBox';
import RatingsDisplay from './components/RatingsDisplay';
import ChefMenuItem from './components/ChefMenuItem';

const featuredDishComponent = (item, onRemove, apiUrl) => (
    <View key={item.id} className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mr-4 relative" >
        {/* Remove button */}
        <TouchableOpacity
            onPress={() => onRemove(item.id)}
            className="absolute top-2 right-2 z-10 bg-red-500 rounded-full p-1"
        >
            <Octicons name="x" size={16} color="white" />
        </TouchableOpacity>
        
        {item.photo_url ? (
            <Image 
                source={{ uri: `${apiUrl}${item.photo_url}` }}
                className="h-[200px] w-[200px] rounded-lg"
                resizeMode="cover"
            />
        ) : (
            <View className="bg-white h-[200px] w-[200px] justify-center rounded-lg">
                <Text className="text-lg text-center text-primary-400 dark:text-dark-400">NO IMAGE</Text>
            </View>
        )}
        <Text className="text-primary-400 text-md font-semibold pt-2 w-[200px] text-center dark:text-dark-400">
            {item.dish_name}
        </Text>
        <Text className="text-primary-400 text-sm pt-1 w-[200px] text-center text-justified dark:text-dark-400">
            {item.description || 'No description'}
        </Text>
        {item.cuisine_type && (
            <Text className="text-primary-400 text-xs pt-1 w-[200px] text-center dark:text-dark-400">
                {item.cuisine_type}
            </Text>
        )}
        {item.price && (
            <Text className="text-primary-400 text-lg font-bold pt-2 w-[200px] text-center dark:text-dark-400">
                ${item.price.toFixed(2)}
            </Text>
        )}
        {item.prep_time && (
            <Text className="text-primary-400 text-xs pt-1 w-[200px] text-center dark:text-dark-400">
                Prep time: {item.prep_time} min
            </Text>
        )}
    </View>
);

const addFeaturedButton = (onPress) => (
    <TouchableOpacity
        onPress={onPress}
        className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mr-4 h-[200px] w-[200px] justify-center items-center"
    >
        <Octicons name="plus-circle" size={64} color="#65a30d" />
        <Text className="text-primary-400 text-md font-semibold pt-4 text-center dark:text-dark-400">
            Add Featured Dish
        </Text>
    </TouchableOpacity>
);

const addMenuButton = (onPress) => (
    <TouchableOpacity
        onPress={onPress}
        className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 h-[120px] w-[120px] justify-center items-center"
    >
        <Octicons name="plus-circle" size={48} color="#65a30d" />
        <Text className="text-primary-400 text-sm font-semibold pt-2 text-center dark:text-dark-400">
            Add Menu
        </Text>
    </TouchableOpacity>
);

const menuItemCard = ({ item, onAssignCategory, apiUrl }) => (
    <View className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mb-4 w-full" key={item?.id}>
        <View className="flex-row">
            <View className="flex w-1/2 justify-between pr-2">
                <Text className="text-lg font-medium pt-2 mb-2 text-center text-justified text-primary-400 dark:text-dark-400 w-full border-b border-primary-400 dark:border-dark-400">
                    {item?.dish_name || 'Dish Name'}
                </Text>
                <Text className="text-primary-400 text-md pt-2 mb-2 text-center text-justified dark:text-dark-400">
                    {item?.description || 'No description available'}
                </Text>
                {item?.price !== null && item?.price !== undefined && (
                    <Text className="text-primary-400 text-lg font-bold pt-2 mb-2 text-center dark:text-dark-400">
                        ${Number(item.price).toFixed(2)}
                    </Text>
                )}
                {item?.prep_time && (
                    <Text className="text-primary-400 text-xs pt-1 mb-2 text-center dark:text-dark-400">
                        Prep time: {item.prep_time} min
                    </Text>
                )}
                {item?.servings && (
                    <Text className="text-primary-400 text-xs pt-1 mb-2 text-center text-justified dark:text-dark-400">
                        Servings: {item.servings}
                    </Text>
                )}
                {item?.spice_level && (
                    <Text className="text-primary-400 text-xs pt-1 mb-2 text-center text-justified dark:text-dark-400">
                        Spice: {item.spice_level}
                    </Text>
                )}
            </View>
            <View className="flex w-1/2">
                {item?.photo_url ? (
                    <Image 
                        source={{ uri: `${apiUrl}${item.photo_url}` }}
                        className="h-[150px] w-full rounded-lg"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="bg-white h-[150px] justify-center rounded-lg">
                        <Text className="text-lg text-center text-primary-400 dark:text-dark-400">NO IMAGE</Text>
                    </View>
                )}
            </View>
        </View>

        {item?.cuisine_type && (
            <Text className="text-primary-400 text-sm pt-2 mb-2 text-center text-justified dark:text-dark-400">
                Cuisine: {item.cuisine_type}
            </Text>
        )}
        {item?.dietary_info && (
            <Text className="text-primary-400 text-xs pt-2 mb-2 text-center text-justified dark:text-dark-400">
                Dietary: {item.dietary_info}
            </Text>
        )}
        <Button
            title="Assign to Category"
            onPress={() => onAssignCategory(item)}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
            style='secondary'
        />
        <Button
            title={item?.is_available ? "Make Unavailable" : "Make Available"}
            onPress={() => alert(item?.is_available ? "Made Unavailable" : "Made Available")}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
            style='secondary'
        />
        <Button
            title={"Edit item"}
            onPress={() => alert("Edit mode")}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
        />
    </View>
);

const timing = ["Lunch", "Dinner"];
const cuisine = ["Gluten-Free", "Italian", "Vegetarian", "Vietnamese"];
const distance = 3.1

export default function ChefMenu() {
    const { id } = useLocalSearchParams();

    const { token, userId, profileId } = useAuth();
    const { apiUrl } = getEnvVars();

    const [chefData, setChefData] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [featuredItems, setFeaturedItems] = useState([]);
    const [chefCuisines, setChefCuisines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddFeaturedModal, setShowAddFeaturedModal] = useState(false);
    
    // Category management states
    const [categories, setCategories] = useState([]);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showAssignCategoryModal, setShowAssignCategoryModal] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState(null);
    const [showRenameCategoryModal, setShowRenameCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [renameCategoryName, setRenameCategoryName] = useState('');
    
    // Add new menu item states
    const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false);
    const [selectedCategoryForNewItem, setSelectedCategoryForNewItem] = useState(null);
    const [newMenuItem, setNewMenuItem] = useState({
        dish_name: '',
        description: '',
        price: '',
        prep_time: '',
        servings: '',
        cuisine_type: '',
        dietary_info: '',
        spice_level: '',
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
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
                    setChefCuisines(profileData.profile.cuisines || []);
                } else {
                    setError(profileData.error || 'Failed to load profile.');
                    Alert.alert('Error', profileData.error || 'Failed to load profile.');
                }

                // Fetch menu items
                const menuUrl = `${apiUrl}/api/menu/chef/${profileId}`;
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
                    console.log('Menu items loaded:', menuData.menu_items?.length || 0);
                } else {
                    console.log('Menu fetch error:', menuData.error);
                    setMenuItems([]);
                }

                // Fetch featured items
                const featuredUrl = `${apiUrl}/api/menu/chef/${profileId}/featured`;
                const featuredResponse = await fetch(featuredUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const featuredData = await featuredResponse.json();

                if (featuredResponse.ok) {
                    setFeaturedItems(featuredData.featured_items || []);
                    console.log('Featured items loaded:', featuredData.featured_items?.length || 0);
                } else {
                    console.log('Featured items fetch error:', featuredData.error);
                    setFeaturedItems([]);
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
                    console.log('Categories loaded:', categoriesData.categories?.length || 0);
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

        fetchData();

    }, [profileId, apiUrl, token]);

    // Handler for when ChefMenuItem updates an item
    const handleItemUpdate = (updatedItem) => {
        // Update in menuItems list
        setMenuItems(prevItems => 
            prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
        );
        
        // Update in featuredItems if it's featured
        if (updatedItem.is_featured) {
            setFeaturedItems(prevItems => 
                prevItems.some(item => item.id === updatedItem.id)
                    ? prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
                    : [...prevItems, updatedItem]
            );
        } else {
            // Remove from featured if is_featured is false
            setFeaturedItems(prevItems => 
                prevItems.filter(item => item.id !== updatedItem.id)
            );
        }
    };

    const handleAddFeatured = async (menuItemId) => {
        try {
            // Get current featured item IDs and add the new one
            const currentFeaturedIds = featuredItems.map(item => item.id);
            const newFeaturedIds = [...currentFeaturedIds, menuItemId];
            
            if (newFeaturedIds.length > 3) {
                Alert.alert('Error', 'Maximum 3 featured dishes allowed. Please remove one first.');
                return;
            }
            
            const response = await fetch(`${apiUrl}/api/menu/chef/${profileId}/featured`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    item_ids: newFeaturedIds
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Find the added menu item and add it to featured
                const addedItem = menuItems.find(item => item.id === menuItemId);
                if (addedItem) {
                    setFeaturedItems([...featuredItems, addedItem]);
                }
                
                // Close modal and show success
                setShowAddFeaturedModal(false);
                Alert.alert('Success', 'Item added to featured dishes!');
            } else {
                Alert.alert('Error', data.error || 'Failed to add featured item.');
            }
        } catch (err) {
            Alert.alert('Error', 'Network error. Could not add featured item.');
            console.error('Add featured error:', err);
        }
    };

    const handleRemoveFeatured = async (menuItemId) => {
        try {
            // Get current featured item IDs and remove the specified one
            const currentFeaturedIds = featuredItems.map(item => item.id);
            const newFeaturedIds = currentFeaturedIds.filter(id => id !== menuItemId);
            
            console.log('Removing featured dish:', menuItemId);
            console.log('Current featured IDs:', currentFeaturedIds);
            console.log('New featured IDs:', newFeaturedIds);
            
            const response = await fetch(`${apiUrl}/api/menu/chef/${profileId}/featured`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    item_ids: newFeaturedIds
                }),
            });

            const data = await response.json();
            console.log('Remove featured response:', data);

            if (response.ok) {
                // Directly update the state instead of fetching
                // Because backend auto-selects items when is_featured is all FALSE
                const updatedFeaturedItems = featuredItems.filter(item => item.id !== menuItemId);
                setFeaturedItems(updatedFeaturedItems);
                
                // Show success message
                Alert.alert('Success', 'Item removed from featured dishes!');
            } else {
                Alert.alert('Error', data.error || 'Failed to remove featured item.');
            }
        } catch (err) {
            Alert.alert('Error', 'Network error. Could not remove featured item.');
            console.error('Remove featured error:', err);
        }
    };

    const availableMenuItems = menuItems.filter(item => 
        !featuredItems.some(featured => featured.id === item.id)
    );

    // Category management functions
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/menu/chef/${profileId}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ category_name: newCategoryName.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setCategories([...categories, data.category]);
                setNewCategoryName('');
                setShowAddCategoryModal(false);
                Alert.alert('Success', 'Category created successfully!');
            } else {
                Alert.alert('Error', data.error || 'Failed to create category');
            }
        } catch (err) {
            Alert.alert('Error', 'Network error. Could not create category.');
            console.error('Create category error:', err);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
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
                                setCategories(categories.filter(c => c.id !== categoryId));
                                // Refresh menu items to update category_id
                                const menuUrl = `${apiUrl}/api/menu/chef/${profileId}`;
                                const menuResponse = await fetch(menuUrl, {
                                    headers: { 'Authorization': `Bearer ${token}` },
                                });
                                const menuData = await menuResponse.json();
                                if (menuResponse.ok) {
                                    setMenuItems(menuData.menu_items || []);
                                }
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

    const handleRenameCategory = async () => {
        if (!renameCategoryName.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/menu/categories/${selectedCategory.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ category_name: renameCategoryName.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setCategories(categories.map(c => 
                    c.id === selectedCategory.id 
                        ? { ...c, category_name: renameCategoryName.trim() }
                        : c
                ));
                setRenameCategoryName('');
                setSelectedCategory(null);
                setShowRenameCategoryModal(false);
                Alert.alert('Success', 'Category renamed successfully!');
            } else {
                Alert.alert('Error', data.error || 'Failed to rename category');
            }
        } catch (err) {
            Alert.alert('Error', 'Network error. Could not rename category.');
            console.error('Rename category error:', err);
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

    const handleCreateMenuItem = async () => {
        // Validate required field
        if (!newMenuItem.dish_name.trim()) {
            Alert.alert('Error', 'Dish name is required');
            return;
        }

        try {
            let photoUrl = null;

            // Upload photo first if selected
            if (selectedImage) {
                setUploadingImage(true);
                const formData = new FormData();
                const filename = selectedImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('photo', {
                    uri: selectedImage,
                    name: filename,
                    type,
                });

                try {
                    const uploadUrl = `${apiUrl}/api/menu/upload-photo`;
                    const uploadResponse = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: formData,
                    });

                    const uploadData = await uploadResponse.json();
                    if (uploadResponse.ok && uploadData.photo_url) {
                        photoUrl = uploadData.photo_url;
                    } else {
                        Alert.alert('Warning', 'Failed to upload photo, creating dish without image');
                    }
                } catch (err) {
                    console.error('Photo upload error:', err);
                    Alert.alert('Warning', 'Failed to upload photo, creating dish without image');
                }
                setUploadingImage(false);
            }

            const itemData = {
                dish_name: newMenuItem.dish_name.trim(),
                description: newMenuItem.description.trim() || null,
                price: newMenuItem.price ? parseFloat(newMenuItem.price) : null,
                prep_time: newMenuItem.prep_time ? parseInt(newMenuItem.prep_time) : null,
                servings: newMenuItem.servings ? parseInt(newMenuItem.servings) : null,
                cuisine_type: newMenuItem.cuisine_type.trim() || null,
                dietary_info: newMenuItem.dietary_info.trim() || null,
                spice_level: newMenuItem.spice_level.trim() || null,
                category_id: selectedCategoryForNewItem,
                photo_url: photoUrl,
            };

            const response = await fetch(`${apiUrl}/api/menu/chef/${profileId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(itemData),
            });

            const data = await response.json();

            if (response.ok) {
                // Refresh menu items
                const menuUrl = `${apiUrl}/api/menu/chef/${profileId}`;
                const menuResponse = await fetch(menuUrl, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const menuData = await menuResponse.json();
                if (menuResponse.ok) {
                    setMenuItems(menuData.menu_items || []);
                }

                // Reset form and close modal
                setNewMenuItem({
                    dish_name: '',
                    description: '',
                    price: '',
                    prep_time: '',
                    servings: '',
                    cuisine_type: '',
                    dietary_info: '',
                    spice_level: '',
                });
                setSelectedImage(null);
                setSelectedCategoryForNewItem(null);
                setShowAddMenuItemModal(false);
                Alert.alert('Success', 'Menu item created successfully!');
            } else {
                Alert.alert('Error', data.error || 'Failed to create menu item');
            }
        } catch (err) {
            Alert.alert('Error', 'Network error. Could not create menu item.');
            console.error('Create menu item error:', err);
        }
    };

    const pickImageForMenuItem = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Permission to access gallery was denied');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setSelectedImage(result.assets[0].uri);
        }
    };

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

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">
                    <LoadingIcon message="Loading Chef Menu..." />
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12">
                {/* Featured Dishes Section */}
                <Card
                    title="Featured Dishes"
                    isCollapsible={true}
                    startExpanded={true}
                    customHeader='justify-center'
                    customHeaderText='text-xl'
                >
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {/* Featured items */}
                        {featuredItems.map(item => featuredDishComponent(item, handleRemoveFeatured, apiUrl))}
                        
                        {/* Add button - only show if less than 3 featured dishes */}
                        {featuredItems.length < 3 && addFeaturedButton(() => setShowAddFeaturedModal(true))}
                    </ScrollView>
                    
                    {featuredItems.length === 0 && (
                        <Text className="text-primary-400 text-center py-2 text-sm dark:text-dark-400">
                            Click + to add featured dishes
                        </Text>
                    )}
                </Card>

                {/* Menu Categories Section */}
                <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Menu Categories</Text>

                    {/* Display categories */}
                    {categories.map(category => {
                        const categoryItems = itemsByCategory[category.id]?.items || [];
                        return (
                            <Card
                                key={category.id}
                                title={category.category_name}
                                isCollapsible={true}
                                startExpanded={false}
                                customHeader='justify-between'
                                customHeaderText='text-lg'
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedCategoryForNewItem(category.id);
                                            setShowAddMenuItemModal(true);
                                        }}
                                        style={{ backgroundColor: '#65a30d', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, flex: 1 }}
                                    >
                                        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>+ Add Dish</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedCategory(category);
                                            setRenameCategoryName(category.category_name);
                                            setShowRenameCategoryModal(true);
                                        }}
                                        style={{ backgroundColor: '#3b82f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, flex: 1 }}
                                    >
                                        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Rename</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteCategory(category.id)}
                                        style={{ backgroundColor: '#ef4444', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, flex: 1 }}
                                    >
                                        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                {categoryItems.length > 0 ? (
                                    categoryItems.map(item => (
                                        <ChefMenuItem
                                            key={item.id}
                                            item={item}
                                            onItemUpdate={handleItemUpdate}
                                            cuisineTypes={chefCuisines}
                                        />
                                    ))
                                ) : (
                                    <Text className="text-primary-400 text-center py-4 dark:text-dark-400">
                                        No items in this category yet
                                    </Text>
                                )}
                            </Card>
                        );
                    })}

                    {/* Show uncategorized items */}
                    {itemsByCategory['uncategorized']?.items?.map(item => (
                        <ChefMenuItem
                            key={item.id}
                            item={item}
                            onItemUpdate={handleItemUpdate}
                            cuisineTypes={chefCuisines}
                        />
                    ))}

                    {/* Add Menu Button at the bottom */}
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        {addMenuButton(() => setShowAddCategoryModal(true))}
                    </View>

                    {menuItems.length === 0 && categories.length === 0 && (
                        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                            <Text className="text-primary-400 text-center mb-4 dark:text-dark-400">
                                No menu items yet. Click "Add Menu" to get started!
                            </Text>
                        </View>
                    )}
                </View>

                <Button
                    title="Customer View"
                    style="primary"
                    customClasses="min-w-[60%]"
                    href={`/ChefMenu/${profileId}`}
                />

                <Button
                    title="�?Return"
                    style="secondary"
                    href={`/(tabs)/Profile`}
                    customClasses="min-w-[60%]"
                />
                <View className="h-24" />
            </ScrollView>

            {/* Add Featured Dish Modal */}
            <Modal
                visible={showAddFeaturedModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddFeaturedModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, textAlign: 'center' }}>
                            Select Dish to Feature
                        </Text>
                        
                        <ScrollView>
                            {availableMenuItems.length > 0 ? (
                                availableMenuItems.map(item => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => handleAddFeatured(item.id)}
                                        style={{ 
                                            padding: 12, 
                                            marginBottom: 8, 
                                            backgroundColor: '#f3f4f6', 
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: '#e5e7eb'
                                        }}
                                    >
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                            {item.dish_name}
                                        </Text>
                                        {item.description && (
                                            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                                                {item.description}
                                            </Text>
                                        )}
                                        {item.price && (
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#65a30d', marginTop: 4 }}>
                                                ${item.price.toFixed(2)}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
                                    All menu items are already featured or no menu items available.
                                </Text>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => setShowAddFeaturedModal(false)}
                            style={{ 
                                marginTop: 12, 
                                padding: 12, 
                                backgroundColor: '#e5e7eb', 
                                borderRadius: 8, 
                                alignItems: 'center' 
                            }}
                        >
                            <Text style={{ fontWeight: 'bold', color: '#374151' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Category Modal */}
            <Modal
                visible={showAddCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddCategoryModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#00000055', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
                            Create New Category
                        </Text>
                        
                        <TextInput
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                            placeholder="Category name (e.g., Breakfast, Lunch)"
                            style={{ 
                                borderWidth: 1, 
                                borderColor: '#e5e7eb', 
                                borderRadius: 8, 
                                padding: 12, 
                                marginBottom: 16,
                                fontSize: 16
                            }}
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setNewCategoryName('');
                                    setShowAddCategoryModal(false);
                                }}
                                style={{ 
                                    flex: 1,
                                    marginRight: 8,
                                    padding: 12, 
                                    backgroundColor: '#e5e7eb', 
                                    borderRadius: 8, 
                                    alignItems: 'center' 
                                }}
                            >
                                <Text style={{ fontWeight: 'bold', color: '#374151' }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleCreateCategory}
                                style={{ 
                                    flex: 1,
                                    marginLeft: 8,
                                    padding: 12, 
                                    backgroundColor: '#65a30d', 
                                    borderRadius: 8, 
                                    alignItems: 'center' 
                                }}
                            >
                                <Text style={{ fontWeight: 'bold', color: 'white' }}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Rename Category Modal */}
            <Modal
                visible={showRenameCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowRenameCategoryModal(false);
                    setSelectedCategory(null);
                    setRenameCategoryName('');
                }}
            >
                <View style={{ flex: 1, backgroundColor: '#00000055', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
                            Rename Category
                        </Text>
                        
                        {selectedCategory && (
                            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, textAlign: 'center' }}>
                                Current: {selectedCategory.category_name}
                            </Text>
                        )}

                        <TextInput
                            value={renameCategoryName}
                            onChangeText={setRenameCategoryName}
                            placeholder="Enter new category name"
                            style={{ 
                                borderWidth: 1, 
                                borderColor: '#e5e7eb', 
                                borderRadius: 8, 
                                padding: 12, 
                                marginBottom: 16,
                                fontSize: 16
                            }}
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setRenameCategoryName('');
                                    setSelectedCategory(null);
                                    setShowRenameCategoryModal(false);
                                }}
                                style={{ 
                                    flex: 1,
                                    marginRight: 8,
                                    padding: 12, 
                                    backgroundColor: '#e5e7eb', 
                                    borderRadius: 8, 
                                    alignItems: 'center' 
                                }}
                            >
                                <Text style={{ fontWeight: 'bold', color: '#374151' }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleRenameCategory}
                                style={{ 
                                    flex: 1,
                                    marginLeft: 8,
                                    padding: 12, 
                                    backgroundColor: '#3b82f6', 
                                    borderRadius: 8, 
                                    alignItems: 'center' 
                                }}
                            >
                                <Text style={{ fontWeight: 'bold', color: 'white' }}>Rename</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Assign to Category Modal */}
            <Modal
                visible={showAssignCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowAssignCategoryModal(false);
                    setSelectedMenuItem(null);
                }}
            >
                <View style={{ flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, textAlign: 'center' }}>
                            Assign to Category
                        </Text>
                        
                        {selectedMenuItem && (
                            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' }}>
                                {selectedMenuItem.dish_name}
                            </Text>
                        )}

                        <ScrollView>
                            {/* Option to remove from category */}
                            <TouchableOpacity
                                onPress={() => handleAssignCategory(null)}
                                style={{ 
                                    padding: 12, 
                                    marginBottom: 8, 
                                    backgroundColor: '#fef3c7', 
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: '#fbbf24'
                                }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#92400e' }}>
                                    Remove from Category (Uncategorized)
                                </Text>
                            </TouchableOpacity>

                            {/* List all categories */}
                            {categories.map(category => (
                                <TouchableOpacity
                                    key={category.id}
                                    onPress={() => handleAssignCategory(category.id)}
                                    style={{ 
                                        padding: 12, 
                                        marginBottom: 8, 
                                        backgroundColor: selectedMenuItem?.category_id === category.id ? '#dcfce7' : '#f3f4f6', 
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: selectedMenuItem?.category_id === category.id ? '#86efac' : '#e5e7eb'
                                    }}
                                >
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                        {category.category_name}
                                    </Text>
                                    {selectedMenuItem?.category_id === category.id && (
                                        <Text style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                                            �?Currently in this category
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}

                            {categories.length === 0 && (
                                <Text style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
                                    No categories available. Create one first!
                                </Text>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => {
                                setShowAssignCategoryModal(false);
                                setSelectedMenuItem(null);
                            }}
                            style={{ 
                                marginTop: 12, 
                                padding: 12, 
                                backgroundColor: '#e5e7eb', 
                                borderRadius: 8, 
                                alignItems: 'center' 
                            }}
                        >
                            <Text style={{ fontWeight: 'bold', color: '#374151' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Menu Item Modal */}
            <Modal
                visible={showAddMenuItemModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowAddMenuItemModal(false);
                    setSelectedCategoryForNewItem(null);
                    setSelectedImage(null);
                    setNewMenuItem({
                        dish_name: '',
                        description: '',
                        price: '',
                        prep_time: '',
                        servings: '',
                        cuisine_type: '',
                        dietary_info: '',
                        spice_level: '',
                    });
                }}
            >
                <View style={{ flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '90%' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4, textAlign: 'center' }}>
                            Add New Menu Item
                        </Text>
                        {selectedCategoryForNewItem && (
                            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, textAlign: 'center' }}>
                                Category: {categories.find(c => c.id === selectedCategoryForNewItem)?.category_name || 'Unknown'}
                            </Text>
                        )}
                        {!selectedCategoryForNewItem && (
                            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, textAlign: 'center' }}>
                                Uncategorized
                            </Text>
                        )}
                        
                        <ScrollView style={{ marginBottom: 12 }}>
                            {/* Photo Upload */}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                                Dish Photo
                            </Text>
                            <TouchableOpacity
                                onPress={pickImageForMenuItem}
                                disabled={uploadingImage}
                                style={{ 
                                    marginBottom: 12,
                                    borderWidth: 2,
                                    borderColor: '#d1d5db',
                                    borderStyle: 'dashed',
                                    borderRadius: 8,
                                    padding: 16,
                                    alignItems: 'center',
                                    backgroundColor: '#f9fafb'
                                }}
                            >
                                {selectedImage ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <Image 
                                            source={{ uri: selectedImage }} 
                                            style={{ width: 200, height: 150, borderRadius: 8, marginBottom: 8 }}
                                            resizeMode="cover"
                                        />
                                        <Text style={{ color: '#65a30d', fontSize: 14, fontWeight: '600' }}>
                                            Tap to change photo
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Octicons name="image" size={48} color="#9ca3af" />
                                        <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
                                            Tap to select a photo
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Dish Name - Required */}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                                Dish Name *
                            </Text>
                            <TextInput
                                value={newMenuItem.dish_name}
                                onChangeText={(text) => setNewMenuItem({...newMenuItem, dish_name: text})}
                                placeholder="Enter dish name"
                                style={{ 
                                    padding: 10, 
                                    backgroundColor: '#f9fafb', 
                                    borderRadius: 6, 
                                    borderWidth: 1,
                                    borderColor: '#d1d5db',
                                    marginBottom: 12,
                                    fontSize: 14
                                }}
                            />

                            {/* Description */}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                                Description
                            </Text>
                            <TextInput
                                value={newMenuItem.description}
                                onChangeText={(text) => setNewMenuItem({...newMenuItem, description: text})}
                                placeholder="Describe your dish"
                                multiline
                                numberOfLines={3}
                                style={{ 
                                    padding: 10, 
                                    backgroundColor: '#f9fafb', 
                                    borderRadius: 6, 
                                    borderWidth: 1,
                                    borderColor: '#d1d5db',
                                    marginBottom: 12,
                                    fontSize: 14,
                                    textAlignVertical: 'top'
                                }}
                            />

                            {/* Price */}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                                Price ($)
                            </Text>
                            <TextInput
                                value={newMenuItem.price}
                                onChangeText={(text) => setNewMenuItem({...newMenuItem, price: text})}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                style={{ 
                                    padding: 10, 
                                    backgroundColor: '#f9fafb', 
                                    borderRadius: 6, 
                                    borderWidth: 1,
                                    borderColor: '#d1d5db',
                                    marginBottom: 12,
                                    fontSize: 14
                                }}
                            />

                            {/* Prep Time */}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                                Prep Time (minutes)
                            </Text>
                            <TextInput
                                value={newMenuItem.prep_time}
                                onChangeText={(text) => setNewMenuItem({...newMenuItem, prep_time: text})}
                                placeholder="30"
                                keyboardType="number-pad"
                                style={{ 
                                    padding: 10, 
                                    backgroundColor: '#f9fafb', 
                                    borderRadius: 6, 
                                    borderWidth: 1,
                                    borderColor: '#d1d5db',
                                    marginBottom: 12,
                                    fontSize: 14
                                }}
                            />

                            {/* Servings */}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                                Servings
                            </Text>
                            <TextInput
                                value={newMenuItem.servings}
                                onChangeText={(text) => setNewMenuItem({...newMenuItem, servings: text})}
                                placeholder="4"
                                keyboardType="number-pad"
                                style={{ 
                                    padding: 10, 
                                    backgroundColor: '#f9fafb', 
                                    borderRadius: 6, 
                                    borderWidth: 1,
                                    borderColor: '#d1d5db',
                                    marginBottom: 12,
                                    fontSize: 14
                                }}
                            />

                            {/* Cuisine Type */}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                                Cuisine Type
                            </Text>
                            <TextInput
                                value={newMenuItem.cuisine_type}
                                onChangeText={(text) => setNewMenuItem({...newMenuItem, cuisine_type: text})}
                                placeholder="e.g., Italian, Chinese, Mexican"
                                style={{ 
                                    padding: 10, 
                                    backgroundColor: '#f9fafb', 
                                    borderRadius: 6, 
                                    borderWidth: 1,
                                    borderColor: '#d1d5db',
                                    marginBottom: 12,
                                    fontSize: 14
                                }}
                            />

                            {/* Dietary Info */}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                                Dietary Info
                            </Text>
                            <TextInput
                                value={newMenuItem.dietary_info}
                                onChangeText={(text) => setNewMenuItem({...newMenuItem, dietary_info: text})}
                                placeholder="e.g., Vegetarian, Gluten-Free"
                                style={{ 
                                    padding: 10, 
                                    backgroundColor: '#f9fafb', 
                                    borderRadius: 6, 
                                    borderWidth: 1,
                                    borderColor: '#d1d5db',
                                    marginBottom: 12,
                                    fontSize: 14
                                }}
                            />

                            {/* Spice Level */}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                                Spice Level
                            </Text>
                            <TextInput
                                value={newMenuItem.spice_level}
                                onChangeText={(text) => setNewMenuItem({...newMenuItem, spice_level: text})}
                                placeholder="e.g., Mild, Medium, Hot"
                                style={{ 
                                    padding: 10, 
                                    backgroundColor: '#f9fafb', 
                                    borderRadius: 6, 
                                    borderWidth: 1,
                                    borderColor: '#d1d5db',
                                    marginBottom: 12,
                                    fontSize: 14
                                }}
                            />
                        </ScrollView>

                        {/* Buttons */}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowAddMenuItemModal(false);
                                    setSelectedCategoryForNewItem(null);
                                    setSelectedImage(null);
                                    setNewMenuItem({
                                        dish_name: '',
                                        description: '',
                                        price: '',
                                        prep_time: '',
                                        servings: '',
                                        cuisine_type: '',
                                        dietary_info: '',
                                        spice_level: '',
                                    });
                                }}
                                style={{ 
                                    flex: 1,
                                    marginRight: 8,
                                    padding: 12, 
                                    backgroundColor: '#e5e7eb', 
                                    borderRadius: 8, 
                                    alignItems: 'center' 
                                }}
                            >
                                <Text style={{ fontWeight: 'bold', color: '#374151' }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleCreateMenuItem}
                                style={{ 
                                    flex: 1,
                                    marginLeft: 8,
                                    padding: 12, 
                                    backgroundColor: '#65a30d', 
                                    borderRadius: 8, 
                                    alignItems: 'center' 
                                }}
                            >
                                <Text style={{ fontWeight: 'bold', color: 'white' }}>Create Dish</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}
