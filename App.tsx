import React, { useEffect, useState, createContext, useContext } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, RefreshControl } from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { Card, Button, Appbar, DefaultTheme, DarkTheme, Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NEWS_API_KEY = "874f6ed4edfc47bbadb3425aaad3f194";
const TRANSLATE_API_KEY = "AIzaSyCeyOVvjL5fhFKv_tuXpUOGZKzP-6KiAIA";

const ThemeContext = createContext();

export default function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("hi");
  const [category, setCategory] = useState("general");
  const [refreshing, setRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("theme");
      if (savedTheme === "dark") setIsDarkMode(true);
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  useEffect(() => {
    fetchNews();
  }, [language, category]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      console.log("Fetching news for category:", category, "and language:", language);
      
      const NEWS_API_URL = `https://newsapi.org/v2/everything?q=india+${category}&apiKey=${NEWS_API_KEY}`;
      const response = await axios.get(NEWS_API_URL);
      
      console.log("News API Response:", response.data);
  
      if (response.data.articles) {
        const translatedNews = await translateNews(response.data.articles);
        setNews(translatedNews);
      } else {
        console.log("No articles found");
      }
  
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching news:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const translateNews = async (articles) => {
    return Promise.all(
      articles.map(async (article) => {
        try {
          const titleTranslation = await translateText(article.title);
          const descriptionTranslation = await translateText(article.description);
          return {
            ...article,
            title: titleTranslation,
            description: descriptionTranslation,
          };
        } catch (error) {
          return article;
        }
      })
    );
  };

  const translateText = async (text) => {
    if (!text) return "Translation unavailable";
    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2`,
        {},
        { params: { q: text, target: language, key: TRANSLATE_API_KEY } }
      );
      return response.data.data.translations[0].translatedText;
    } catch (error) {
      return text;
    }
  };

  const speakNews = (text) => {
    Speech.speak(text, { language });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <PaperProvider theme={isDarkMode ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: isDarkMode ? "#121212" : "#f4f4f4" }}>
            <Appbar.Header style={styles.header}>
              <Appbar.Content title="Vernacular News" subtitle="Stay updated in your language" />
              <Switch value={isDarkMode} onValueChange={toggleTheme} style={{ marginRight: 10 }} />
              <Button mode="contained" onPress={fetchNews} style={styles.refreshButton}>Refresh</Button>
            </Appbar.Header>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Select Language:</Text>
              <Picker selectedValue={language} onValueChange={(itemValue) => setLanguage(itemValue)} style={styles.picker}>
                <Picker.Item label="English" value="en" />
                <Picker.Item label="Hindi" value="hi" />
                <Picker.Item label="Marathi" value="mr" />
                <Picker.Item label="Gujarati" value="gu" />
                <Picker.Item label="Tamil" value="ta" />
                <Picker.Item label="Telugu" value="te" />
                <Picker.Item label="Bengali" value="bn" />
                <Picker.Item label="Punjabi" value="pa" />
                <Picker.Item label="Urdu" value="ur" />
                <Picker.Item label="Kannada" value="kn" />
                <Picker.Item label="Malayalam" value="ml" />
                <Picker.Item label="Odia" value="or" />
                <Picker.Item label="Assamese" value="as" />
                <Picker.Item label="Maithili" value="mai" />
                <Picker.Item label="Kashmiri" value="ks" />
                <Picker.Item label="Manipuri" value="mni" />
                <Picker.Item label="Sindhi" value="sd" />
                <Picker.Item label="Konkani" value="kok" />
                <Picker.Item label="Santali" value="sat" />
                <Picker.Item label="Bodo" value="brx" />
                <Picker.Item label="Dogri" value="doi" />
                <Picker.Item label="Arabic" value="ar" />
                <Picker.Item label="French" value="fr" />
                <Picker.Item label="German" value="de" />
                <Picker.Item label="Spanish" value="es" />
                <Picker.Item label="Italian" value="it" />
                <Picker.Item label="Chinese" value="zh-CN" />
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Select Category:</Text>
              <Picker selectedValue={category} onValueChange={(itemValue) => setCategory(itemValue)} style={styles.picker}>
                <Picker.Item label="General" value="general" />
                <Picker.Item label="Business" value="business" />
                <Picker.Item label="Entertainment" value="entertainment" />
                <Picker.Item label="Health" value="health" />
                <Picker.Item label="Science" value="science" />
                <Picker.Item label="Sports" value="sports" />
                <Picker.Item label="Technology" value="technology" />
              </Picker>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
            ) : (
              <FlatList
                data={news}
                keyExtractor={(item, index) => index.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchNews} />}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
                    <Card style={[styles.newsCard, { backgroundColor: isDarkMode ? "#333" : "white" }]}>
                      <Card.Cover source={{ uri: item.urlToImage || "https://via.placeholder.com/150" }} style={styles.newsImage} />
                      <Card.Content>
                        <Text style={[styles.newsTitle, { color: isDarkMode ? "#fff" : "#000" }]}>{item.title}</Text>
                        <Text style={styles.newsSource}>{item.source?.name || "Unknown Source"}</Text>
                        <Text style={styles.newsDescription}>{item.description}</Text>
                        <Button mode="outlined" onPress={() => speakNews(item.title)} style={styles.speakButton}>🔊 Listen</Button>
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </SafeAreaProvider>
      </PaperProvider>
    </ThemeContext.Provider>
  );
}


const styles = StyleSheet.create({
  header: {
    backgroundColor: "#6200ee",
  },
  refreshButton: {
    marginRight: 10,
  },
  pickerContainer: {
    padding: 10,
    backgroundColor: "white",
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  picker: {
    height: 60,
    width: "100%",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  newsCard: {
    margin: 10,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: "white",
    overflow: "hidden",
  },
  newsImage: {
    height: 200,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  newsSource: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
  },
  newsDescription: {
    fontSize: 16,
    marginTop: 5,
  },
  speakButton: {
    marginTop: 10,
  },
});
