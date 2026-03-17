import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getTodayQuote } from '../data/quotes';

export default function HomeScreen({ navigation }) {
  const quote = getTodayQuote();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YKS KOC</Text>
      <Text style={styles.subtitle}>Bugün de fethediyoruz!</Text>

      <View style={styles.quoteBox}>
        <Text style={styles.quoteEmoji}>{quote.emoji}</Text>
        <Text style={styles.quoteText}>"{quote.text}"</Text>
        <Text style={styles.quoteAuthor}>— {quote.author}</Text>
      </View>

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => navigation.navigate('Question')}
      >
        <Text style={styles.mainButtonText}>Soru Coz</Text>
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Stats')}
        >
          <Text style={styles.secondaryButtonText}>Istatistikler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Motivation')}
        >
          <Text style={styles.secondaryButtonText}>Motivasyon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00D4FF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 30,
  },
  quoteBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  quoteEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 13,
    color: '#FFD700',
    textAlign: 'center',
  },
  mainButton: {
    backgroundColor: '#00D4FF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D0D0D',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
