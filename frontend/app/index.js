import { ImageBackground, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function Page() {
  return (
    <ImageBackground
      source={require('../assets/images/landingPage.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.subtitle}>Find a Chef</Text>
          <Text style={styles.brand}>ChefAsap</Text>
        </View>

        <Link href="/signup" asChild>
          <TouchableOpacity style={styles.signupButton}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </Link>

        <View style={{ height: 10 }} />

        <Link href="/signin" asChild>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#2c3e50', // Fallback background color
  },

  container: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center", 
    flex: 1,
  },

  titleContainer: {
  marginBottom: 40,
  alignItems: 'center',
  },

  subtitle: {
    fontSize: 36,
    color: '#3f3f1f', // earthy dark olive
    fontWeight: '600',
    textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)',
  },

  brand: {
    fontSize: 32,
    color: '#4d7c0f', // rich olive text
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)',
  },

  signupButton: { 
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: "center",
    backgroundColor: "#4d7c0f", // rich olive text
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },

  loginButton: { 
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: "center",
    backgroundColor: "#d9f99d", // light olive highlight
    borderWidth: 2,
    borderColor: "#4d7c0f", // rich olive text
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  buttonText: {
    color: "#fefce8", // soft cream base for signup button
    fontSize: 18,
    fontWeight: "700",
  },
  
  loginButtonText: {
    color: "#4d7c0f", // rich olive text for login button
    fontSize: 18,
    fontWeight: "700",
  },
});

