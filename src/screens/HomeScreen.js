import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTodayQuote } from '../data/quotes';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const quote = getTodayQuote();

  return (
    <LinearGradient colors={['#041E42', '#061730', '#041E42']} style={styles.gradient}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🎯</Text>
            </View>
            <View>
              <Text style={styles.title}>YKS KOÇ</Text>
              <Text style={styles.subtitle}>Bugün de asılıyoruz!</Text>
            </View>
          </View>
        </View>

        {/* Motivasyon Kartı */}
        <View style={styles.quoteCard}>
          <LinearGradient
            colors={['rgba(13, 52, 114, 0.9)', 'rgba(8, 42, 94, 0.7)']}
            style={styles.quoteGradient}
          >
            <View style={styles.quoteEmojiContainer}>
              <Text style={styles.quoteEmoji}>{quote.emoji}</Text>
            </View>
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            <View style={styles.quoteDivider} />
            <Text style={styles.quoteAuthor}>{quote.author}</Text>
            {quote.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{quote.category.toUpperCase()}</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Ana Buton */}
        <TouchableOpacity
          style={styles.mainButtonWrapper}
          onPress={() => navigation.navigate('Question')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.mainButton}
          >
            <Text style={styles.mainButtonIcon}>📸</Text>
            <View>
              <Text style={styles.mainButtonText}>Soru Çöz</Text>
              <Text style={styles.mainButtonSub}>Fotoğraf çek, AI açıklasın</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Alt Butonlar */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={() => navigation.navigate('Stats')}
            activeOpacity={0.8}
          >
            <View style={styles.secondaryIconBg}>
              <Text style={styles.secondaryIcon}>📊</Text>
            </View>
            <Text style={styles.secondaryTitle}>İstatistikler</Text>
            <Text style={styles.secondaryDesc}>Zayıf konularını gör</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={() => navigation.navigate('Motivation')}
            activeOpacity={0.8}
          >
            <View style={styles.secondaryIconBg}>
              <Text style={styles.secondaryIcon}>💪</Text>
            </View>
            <Text style={styles.secondaryTitle}>Motivasyon</Text>
            <Text style={styles.secondaryDesc}>İlham al, devam et</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Header
  header: { marginBottom: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 26 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Quote Card
  quoteCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...colors.shadowCard,
  },
  quoteGradient: {
    padding: 24,
    alignItems: 'center',
  },
  quoteEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quoteEmoji: { fontSize: 28 },
  quoteText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },
  quoteDivider: {
    width: 40,
    height: 2,
    backgroundColor: colors.primaryBorder,
    borderRadius: 1,
    marginVertical: 14,
  },
  quoteAuthor: {
    fontSize: 13,
    color: colors.primarySoft,
    fontWeight: '600',
  },
  categoryBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  categoryText: {
    fontSize: 10,
    color: colors.primarySoft,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Main Button
  mainButtonWrapper: {
    borderRadius: 16,
    marginBottom: 20,
    ...colors.shadowPrimary,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 16,
  },
  mainButtonIcon: { fontSize: 28 },
  mainButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.buttonText,
  },
  mainButtonSub: {
    fontSize: 12,
    color: 'rgba(4, 30, 66, 0.7)',
    marginTop: 2,
  },

  // Secondary Cards
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    ...colors.shadowCard,
  },
  secondaryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  secondaryIcon: { fontSize: 22 },
  secondaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  secondaryDesc: {
    fontSize: 11,
    color: colors.textSubtle,
    textAlign: 'center',
  },
});
