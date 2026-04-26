// App.js - Pantry Cauldron Main Application
// Install dependencies: npm install @supabase/supabase-js react-native-vector-icons

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from './supabaseClient';

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [pantryItems, setPantryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cauldronBubbling, setCauldronBubbling] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  // Categories from screenshot
  const categories = [
    'All', 'Fruits', 'Dairy & Fish', 'Meat', 
    'Spices', 'Vegetables', 'Essentials', 'Other'
  ];

  // Sample items as shown in screenshot
  const samplePantry = [
    { name: 'Red Apples', category: 'Fruits', quantity: 4, unit: 'pieces' },
    { name: 'Green Apples', category: 'Fruits', quantity: 3, unit: 'pieces' },
    { name: 'Lemons', category: 'Fruits', quantity: 2, unit: 'pieces' },
    { name: 'Bananas', category: 'Fruits', quantity: 5, unit: 'pieces' },
    { name: 'Oranges', category: 'Fruits', quantity: 6, unit: 'pieces' },
    { name: 'Grapes', category: 'Fruits', quantity: 1, unit: 'bunch' },
    { name: 'Cherry Tomatoes', category: 'Vegetables', quantity: 20, unit: 'pieces' },
    { name: 'Pears', category: 'Fruits', quantity: 3, unit: 'pieces' },
  ];

  useEffect(() => {
    checkUser();
    loadPantry();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
    } else {
      // For demo, auto-create anonymous session
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error) setUser(data.user);
    }
  };

  const loadPantry = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', user.id);
    
    if (data && data.length > 0) {
      setPantryItems(data);
    } else {
      // Load sample data for first-time users
      setPantryItems(samplePantry.map(item => ({ ...item, user_id: user.id })));
    }
  };

  const addToPantry = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Add Item', 'Please enter an item name');
      return;
    }

    const newItem = {
      user_id: user.id,
      name: newItemName,
      category: selectedCategory === 'All' ? 'Other' : selectedCategory,
      quantity: parseInt(newItemQuantity) || 1,
      unit: 'piece',
      shelf_life_days: 7, // Default 7 days
    };

    const { data, error } = await supabase
      .from('pantry_items')
      .insert([newItem])
      .select();

    if (!error) {
      setPantryItems([...pantryItems, data[0]]);
      setNewItemName('');
      Alert.alert('Success', `${newItemName} added to your pantry!`);
    } else {
      Alert.alert('Error', error.message);
    }
  };

  const cookCauldron = async () => {
    setCauldronBubbling(true);
    setLoading(true);
    
    // Simulate API call to Spoonacular
    // In production: fetch from https://api.spoonacular.com/recipes/findByIngredients
    setTimeout(() => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Fresh Fruit Salad',
          image: 'https://spoonacular.com/recipeImages/715594-312x231.jpg',
          usedIngredients: pantryItems.slice(0, 3).map(i => i.name),
          missedIngredients: ['Honey', 'Mint'],
        },
        {
          id: 2,
          title: 'Green Apple Smoothie',
          image: 'https://spoonacular.com/recipeImages/715595-312x231.jpg',
          usedIngredients: ['Green Apples', 'Bananas'],
          missedIngredients: ['Yogurt', 'Spinach'],
        },
        {
          id: 3,
          title: 'Tomato & Egg Scramble',
          image: 'https://spoonacular.com/recipeImages/715596-312x231.jpg',
          usedIngredients: ['Eggs', 'Cherry Tomatoes'],
          missedIngredients: ['Salt', 'Pepper'],
        },
      ];
      
      setRecipes(mockRecipes);
      setCauldronBubbling(false);
      setLoading(false);
      
      Alert.alert('✨ Cauldron Ready!', 'I found some magical recipes using your ingredients!');
    }, 2000);
  };

  const cookRecipe = async (recipe) => {
    Alert.alert(
      'Cook This Recipe?',
      `Ready to make ${recipe.title}? I'll subtract the ingredients from your pantry!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Cook It!',
          onPress: async () => {
            // Convert ingredients to JSON format for the DB function
            const ingredientsUsed = recipe.usedIngredients.map(name => ({
              name: name,
              quantity: 1,
              unit: 'piece'
            }));
            
            const { data, error } = await supabase.rpc('cook_recipe', {
              p_recipe_id: recipe.id.toString(),
              p_recipe_title: recipe.title,
              p_ingredients: ingredientsUsed
            });
            
            if (!error) {
              Alert.alert('🎉 Delicious!', 'Recipe logged. Your pantry has been updated!');
              loadPantry(); // Refresh pantry
            }
          }
        }
      ]
    );
  };

  const getFilteredItems = () => {
    if (selectedCategory === 'All') return pantryItems;
    return pantryItems.filter(item => item.category === selectedCategory);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pantry Cauldron</Text>
          <Text style={styles.subtitle}>Your magical kitchen companion ✨</Text>
        </View>

        {/* Cauldron Button */}
        <TouchableOpacity 
          style={[styles.cauldronButton, cauldronBubbling && styles.cauldronBubbling]}
          onPress={cookCauldron}
          disabled={loading}
        >
          {cauldronBubbling ? (
            <>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.cauldronText}>Bubbling...</Text>
            </>
          ) : (
            <>
              <Text style={styles.cauldronEmoji}>⚗️</Text>
              <Text style={styles.cauldronText}>Suggest Recipes</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pantry Items Grid */}
        <View style={styles.pantryGrid}>
          {getFilteredItems().map((item, index) => (
            <View key={index} style={styles.pantryItem}>
              <Text style={styles.pantryEmoji}>🍎</Text>
              <Text style={styles.pantryName}>{item.name}</Text>
              <Text style={styles.pantryQuantity}>
                {item.quantity} {item.unit}
              </Text>
            </View>
          ))}
        </View>

        {/* Add Item Form */}
        <View style={styles.addItemForm}>
          <TextInput
            style={styles.input}
            placeholder="Add new item (e.g., Milk)"
            value={newItemName}
            onChangeText={setNewItemName}
            placeholderTextColor="#999"
          />
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.quantityInput]}
              placeholder="Qty"
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.addButton} onPress={addToPantry}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recipe Suggestions */}
        {recipes.length > 0 && (
          <View style={styles.recipesSection}>
            <Text style={styles.sectionTitle}>✨ Cauldron Suggestions ✨</Text>
            {recipes.map(recipe => (
              <TouchableOpacity 
                key={recipe.id} 
                style={styles.recipeCard}
                onPress={() => cookRecipe(recipe)}
              >
                <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <Text style={styles.recipeIngredients}>
                    Using: {recipe.usedIngredients.join(', ')}
                  </Text>
                  {recipe.missedIngredients.length > 0 && (
                    <Text style={styles.missingIngredients}>
                      Need: {recipe.missedIngredients.join(', ')}
                    </Text>
                  )}
                  <Text style={styles.cookButton}>🔥 Cook This →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom Navigation (from screenshot) */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🥘</Text>
            <Text style={styles.navText}>Pantry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📖</Text>
            <Text style={styles.navText}>Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>⏰</Text>
            <Text style={styles.navText}>Reminders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📝</Text>
            <Text style={styles.navText}>List</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 14,
    color: '#FF6B35',
    marginTop: 4,
  },
  cauldronButton: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cauldronBubbling: {
    backgroundColor: '#E85D2C',
    transform: [{ scale: 0.98 }],
  },
  cauldronEmoji: {
    fontSize: 32,
  },
  cauldronText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#F0E6D2',
    borderRadius: 25,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#FF6B35',
  },
  categoryText: {
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  pantryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginTop: 15,
  },
  pantryItem: {
    width: '30%',
    backgroundColor: 'white',
    margin: '1.5%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pantryEmoji: {
    fontSize: 32,
  },
  pantryName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
  pantryQuantity: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  addItemForm: {
    backgroundColor: 'white',
    margin: 20,
    padding: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  addRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quantityInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recipesSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 15,
    color: '#2D3436',
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImage: {
    width: 100,
    height: 100,
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recipeIngredients: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  missingIngredients: {
    fontSize: 11,
    color: '#FF6B35',
    marginBottom: 6,
  },
  cookButton: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0E6D2',
    marginTop: 20,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
  },
  navText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});