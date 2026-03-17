import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { quotes } from '../data/quotes';

export default function MotivationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Motivasyon</Text>
      <Text style={styles.subtitle}>Gucune guc katacak sozler</Text>

      <FlatList
        data={quotes}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.quoteText}>"{item.text}"</Text>
            <Text style={styles.author}>— {item.author}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00D4FF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  quoteText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
  },
  author: {
    color: '#FFD700',
    fontSize: 12,
  },
});
