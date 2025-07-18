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
          <Text style={styles.brand}>Chefasap</Text>
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
    color: '#000',
    fontWeight: '500',
  },

  brand: {
    fontSize: 32,
    color: '#5A4FCF',
    fontWeight: 'bold',
  },

  signupButton: { 
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: "center",
    backgroundColor: "#FFD700",
  },

  loginButton: { 
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: "center",
    backgroundColor: "#8A2BE2",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

