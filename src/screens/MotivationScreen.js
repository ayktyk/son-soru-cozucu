import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { quotes } from '../data/quotes';
import { colors } from '../theme/colors';

const CATEGORIES = [
  { key: 'all', label: 'Tümü' },
  { key: 'azim', label: 'Azim' },
  { key: 'cesaret', label: 'Cesaret' },
  { key: 'disiplin', label: 'Disiplin' },
  { key: 'bilim', label: 'Bilim' },
  { key: 'özgüven', label: 'Özgüven' },
];

export default function MotivationScreen() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredQuotes = activeCategory === 'all'
    ? quotes
    : quotes.filter((q) => q.category === activeCategory);

  return (
    <LinearGradient colors={['#041E42', '#061730']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>Motivasyon</Text>
        <Text style={styles.subtitle}>Sarı lacivert ritimle devam et</Text>

        {/* Kategori Filtreleri */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeCategory === item.key && styles.filterChipActive]}
              onPress={() => setActiveCategory(item.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, activeCategory === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Sözler Listesi */}
        <FlatList
          style={styles.list}
          data={filteredQuotes}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.emojiCircle}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                </View>
                {item.category && (
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.quoteText}>"{item.text}"</Text>
              <View style={styles.authorRow}>
                <View style={styles.authorDot} />
                <Text style={styles.author}>{item.author}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  // Filter
  filterList: { maxHeight: 44, marginBottom: 16 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: colors.buttonText },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    ...colors.shadowCard,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emojiCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  categoryText: {
    fontSize: 9,
    color: colors.primarySoft,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  quoteText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  author: {
    color: colors.primarySoft,
    fontSize: 13,
    fontWeight: '600',
  },
});
