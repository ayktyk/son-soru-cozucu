import React, { useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { colors } from '../theme/colors';

export default function StatsScreen() {
  const [stats, setStats] = useState([]);
  const [totalSolved, setTotalSolved] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('subject, topic, is_correct');

      if (error) throw error;

      if (!data || data.length === 0) {
        setStats([]);
        setTotalSolved(0);
        setTotalCorrect(0);
        setLoading(false);
        return;
      }

      setTotalSolved(data.length);
      setTotalCorrect(data.filter((d) => d.is_correct).length);

      const grouped = {};
      for (const row of data) {
        const key = `${row.subject} > ${row.topic}`;
        if (!grouped[key]) {
          grouped[key] = { subject: row.subject, topic: row.topic, total: 0, wrong: 0 };
        }
        grouped[key].total++;
        if (!row.is_correct) grouped[key].wrong++;
      }

      const sorted = Object.values(grouped).sort((a, b) => b.wrong - a.wrong);
      setStats(sorted);
    } catch {
      // Sessizce devam et
    }
    setLoading(false);
  };

  const getBarColor = (wrong, total) => {
    const ratio = wrong / total;
    if (ratio >= 0.7) return colors.primary;
    if (ratio >= 0.4) return colors.primaryMuted;
    return colors.danger;
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (stats.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.title}>İstatistikler</Text>
        <Text style={styles.subtitle}>Soru çözdükçe burada odaklanman gereken yerler görünecek</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>Henüz veri yok. İlk soruyu çözerek başla.</Text>
        </View>
      </View>
    );
  }

  const successRate = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
  const weakTopics = stats.filter((s) => s.wrong > 0).slice(0, 3);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator>
      <Text style={styles.title}>İstatistikler</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalSolved}</Text>
          <Text style={styles.summaryLabel}>Toplam Soru</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>{totalCorrect}</Text>
          <Text style={styles.summaryLabel}>Doğru</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: colors.danger }]}>{totalSolved - totalCorrect}</Text>
          <Text style={styles.summaryLabel}>Yanlış</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: colors.primarySoft }]}>%{successRate}</Text>
          <Text style={styles.summaryLabel}>Başarı</Text>
        </View>
      </View>

      {weakTopics.length > 0 && (
        <View style={styles.weakSection}>
          <Text style={styles.sectionTitle}>Bunlara Odaklan</Text>
          {weakTopics.map((item, i) => (
            <View key={i} style={styles.weakCard}>
              <View style={styles.weakHeader}>
                <Text style={styles.weakRank}>#{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weakSubject}>{item.subject}</Text>
                  <Text style={styles.weakTopic}>{item.topic}</Text>
                </View>
                <Text style={styles.weakCount}>{item.wrong}/{item.total} yanlış</Text>
              </View>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(item.wrong / item.total) * 100}%`,
                      backgroundColor: getBarColor(item.wrong, item.total),
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Tüm Konular</Text>
      {stats.map((item, i) => {
        const correctCount = item.total - item.wrong;
        return (
          <View key={i} style={styles.topicRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.topicSubject}>{item.subject}</Text>
              <Text style={styles.topicName}>{item.topic}</Text>
            </View>
            <View style={styles.topicStats}>
              <Text style={styles.topicCorrect}>{correctCount}✓</Text>
              <Text style={styles.topicWrong}>{item.wrong}✗</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 20, paddingTop: 10, paddingBottom: 60 },
  centeredContainer: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: 16 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 30 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryNumber: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  summaryLabel: { fontSize: 11, color: colors.textSubtle, marginTop: 4 },
  weakSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primarySoft, marginBottom: 12 },
  weakCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  weakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  weakRank: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  weakSubject: { fontSize: 15, fontWeight: '600', color: colors.text },
  weakTopic: { fontSize: 13, color: colors.textMuted },
  weakCount: { fontSize: 13, color: colors.primarySoft, fontWeight: '600' },
  barBg: { height: 8, backgroundColor: colors.overlay, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  topicSubject: { fontSize: 14, fontWeight: '600', color: colors.text },
  topicName: { fontSize: 12, color: colors.textSubtle },
  topicStats: { flexDirection: 'row', gap: 10 },
  topicCorrect: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  topicWrong: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  emptyBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
