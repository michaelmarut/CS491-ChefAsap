import React, { useState, useEffect, useRef, useLayoutEffect, use } from 'react';
import {
    FlatList, View, Text, TouchableOpacity, TextInput, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { KeyboardAwareFlatList, KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import getEnvVars from "../config";
import { useAuth } from './context/AuthContext';
import { useTheme } from './providers/ThemeProvider';
import Octicons from '@expo/vector-icons/Octicons';

export default function ChatScreen() {

    const [loading, setLoading] = useState(true); //use Omar's
    const [error, setError] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [sending, setSending] = useState(false);
    const { chatId, otherUserName, otherUserId } = useLocalSearchParams();
    const { apiUrl } = getEnvVars();
    const { userId, userType, token } = useAuth();
    const { manualTheme } = useTheme();
    const router = useRouter();
    const flatListRef = useRef();

    let chefId, customerId;

    if (userType === 'chef') {
        chefId = userId;
        customerId = otherUserId;
        console.log('I am chef ', chefId, 'Talking to customer', customerId);
    }
    else {
        customerId = userId;
        chefId = otherUserId;
        console.log('Talking to customer', customerId, 'I am chef ', chefId);
    }

    useEffect(() => {

        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);

    }, [chatId]);

    useEffect(() => {

        if (chatId) {
            markAsRead();
        }

    }, [chatId]);


    const fetchMessages = async () => {
        try {
            console.log('=== FETCH MESSAGES DEBUG ===');
            console.log('customerId:', customerId);
            console.log('chefId:', chefId);
            console.log('userId:', userId);
            console.log('userType:', userType);
            console.log('otherUserId:', otherUserId);
            const url = `${apiUrl}/api/chat/history?customer_id=${customerId}&chef_id=${chefId}`;
            console.log('Fetching chat from URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            if (!response.ok) {
                throw new Error('Failed to fetch chat history.');
            }

            const data = await response.json();

            setMessages(data);
            setError(null);
        }
        catch (err) {
            console.error('Error fetching chat history:', err);
            setError('Failed to load chat. Please try again.');
        }
        finally {
            setLoading(false);
        };
    };

    const markAsRead = async () => {
        if (!chatId) {
            return;
        }

        try {

            const url = `${apiUrl}/api/chat/mark-read`;

            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },

                body: JSON.stringify({
                    chat_id: chatId,
                    user_type: userType,
                }),
            });
        }
        catch (err) {
            console.error('Error marking messages as read:', err);
        }
    };

    const handleSendMessage = async () => {

        const trimmedMessage = newMessage.trim();

        if (!trimmedMessage) { //mty messages
            return;
        }

        setSending(true);

        try {

            const url = `${apiUrl}/api/chat/send`;
            console.log('Sending message to URL:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },

                body: JSON.stringify({
                    customer_id: customerId,
                    chef_id: chefId,
                    sender_type: userType,
                    message: trimmedMessage,
                }),
            });

            console.log('Request body :', {
                customer_id: customerId,
                //chef_id: chefId,
                sender_type: userType,
                message: trimmedMessage,
            });

            console.log('Status: ', response.status);

            if (!response.ok) {
                throw new Error('Failed to send message.');
                console.error('Failed to send message. Status:', response.status);
            }


            const data = await response.json();
            console.log('Message sent successfully:', data);

            setNewMessage('');
            fetchMessages();

            setTimeout(() => { // or onContentSizeChange in flatlist
                flatListRef.current?.scrollToEnd({ animated: true }); // Always see the latest message
            }, 100);

        }
        catch (err) {
            console.error(err);
            //Alert.alert('Error', 'Failed to send message. Please try again!');
        }
        finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp) => {

        if (!timestamp) {
            return '';
        }

        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    useLayoutEffect(() => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
        }
    }, [messages]);

    const renderMessage = ({ item }) => {

        const sentByUser = item.sender_type === userType;
        return (
            <View
                className={`my-2 flex-row ${sentByUser ? 'justify-end' : 'justify-start'}`}
            >
                <View
                    className={`max-w-3/4 p-3 rounded-lg ${sentByUser ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                    <Text className={`${sentByUser ? 'text-white' : 'text-black dark:text-white'}`}>
                        {item.message}
                    </Text>
                    <Text className={`text-xs mt-1 ${sentByUser ? 'text-white/70' : 'text-black/70 dark:text-white/70'}`}>
                        {formatTime(item.sent_at)}
                    </Text>
                </View>
            </View>
        );
    }

    if (loading) { //update to use Omar's loading svg or splash screen
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 dark:bg-base-dark-100 justify-center items-center">
                    <ActivityIndicator size="large" color={manualTheme === 'dark' ? '#D9F99D ' : '#4D7C0F'} />
                    <Text className="text-gray-600 dark:text-gray-400 mt-4">
                        Loading chat...
                    </Text>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-base-100 dark:bg-base-dark-100">

                {/* Display name of other user */}
                <View className="bg-white dark:bg-base-dark-200 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 mt-5">
                        <Octicons
                            name="chevron-left"
                            size={24}
                            color={manualTheme === 'dark' ? '#D9F99D ' : '#4D7C0F'}
                        />
                    </TouchableOpacity>
                    <View className="flex-1 mt-5">
                        <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {otherUserName}
                        </Text>
                    </View>
                </View>

                {/* Messages List */}
                {messages.length === 0 ? (
                    <View className="flex-1 justify-center items-center px-6">
                        <Octicons
                            name="comment"
                            size={64}
                            color={manualTheme === 'dark' ? '#D9F99D ' : '#4D7C0F'}
                        />
                        <Text className="text-gray-900 dark:text-gray-100 text-lg font-semibold mt-4 text-center">
                            No messages yet
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-center mt-2">
                            Start the conversation by sending a message below
                        </Text>
                    </View>
                ) : (
                    <KeyboardAwareFlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.message_id.toString()}
                        contentContainerStyle={{ padding: 16 }}
                        enableOnAndroid={true}
                        extraScrollHeight={200}
                    //scrollToEnd={true}
                    //bottomOffset={100}                    

                    />
                )}

                {/* Text Input */}
                <View className="bg-white dark:bg-base-dark-200 border-t border-gray-200 dark:border-gray-700 px-2 py-6 mb-2">
                    <View className="flex-row items-center mb-6">
                        <TextInput
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Type a message..."
                            placeholderTextColor={manualTheme === 'dark' ? '#D9F99D ' : '#4D7C0F'}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-full mr-2"
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            disabled={!newMessage.trim() || sending}
                            className={`w-12 h-12 rounded-full items-center justify-center ${!newMessage.trim() || sending
                                    ? 'bg-gray-300 dark:bg-gray-600'
                                    : 'bg-primary-500'
                                }`}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Octicons name="paper-airplane" size={20} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </>
    );

}