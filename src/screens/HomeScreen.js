import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getTodayQuote } from '../data/quotes';
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const quote = getTodayQuote();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YKS KOC</Text>
      <Text style={styles.subtitle}>Bugun de asiliyoruz!</Text>

      <View style={styles.quoteBox}>
        <Text style={styles.quoteEmoji}>{quote.emoji}</Text>
        <Text style={styles.quoteText}>"{quote.text}"</Text>
        <Text style={styles.quoteAuthor}>- {quote.author}</Text>
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
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 30,
  },
  quoteBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 13,
    color: colors.primarySoft,
    textAlign: 'center',
  },
  mainButton: {
    backgroundColor: colors.primary,
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
    color: colors.buttonText,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: colors.text,
  },
});
