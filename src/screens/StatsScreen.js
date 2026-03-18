import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { colors } from '../theme/colors';

export default function StatsScreen({ navigation }) {
  const [stats, setStats] = useState([]);
  const [totalSolved, setTotalSolved] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'week'

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [filter])
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      let query = supabase.from('sessions').select('subject, topic, is_correct, created_at');

      if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      }

      const { data, error } = await query;

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
        const subjectNorm = (row.subject || 'Diğer').trim();
        const topicNorm = (row.topic || 'Belirsiz').trim();
        const key = `${subjectNorm} > ${topicNorm}`;
        if (!grouped[key]) {
          grouped[key] = { subject: subjectNorm, topic: topicNorm, total: 0, wrong: 0 };
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
        <Text style={styles.subtitle}>
          Soru çözdükçe burada odaklanman gereken yerler görünecek
        </Text>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tümü</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'week' && styles.filterActive]}
            onPress={() => setFilter('week')}
          >
            <Text style={[styles.filterText, filter === 'week' && styles.filterTextActive]}>Bu Hafta</Text>
          </TouchableOpacity>
        </View>

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

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tümü</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'week' && styles.filterActive]}
          onPress={() => setFilter('week')}
        >
          <Text style={[styles.filterText, filter === 'week' && styles.filterTextActive]}>Bu Hafta</Text>
        </TouchableOpacity>
      </View>

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
              <TouchableOpacity
                style={styles.learnButton}
                onPress={() => navigation.navigate('Learn', { subject: item.subject, topic: item.topic })}
              >
                <Text style={styles.learnButtonText}>Konuyu Öğren</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Tüm Konular</Text>
      {stats.map((item, i) => {
        const correctCount = item.total - item.wrong;
        return (
          <TouchableOpacity
            key={i}
            style={styles.topicRow}
            onPress={() => navigation.navigate('Learn', { subject: item.subject, topic: item.topic })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.topicSubject}>{item.subject}</Text>
              <Text style={styles.topicName}>{item.topic}</Text>
            </View>
            <View style={styles.topicStats}>
              <Text style={styles.topicCorrect}>{correctCount}{'\u2713'}</Text>
              <Text style={styles.topicWrong}>{item.wrong}{'\u2717'}</Text>
            </View>
            <Text style={styles.learnArrow}>→</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 20, paddingTop: 10, paddingBottom: 60 },
  centeredContainer: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary, marginBottom: 12 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  filterButton: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...colors.shadowPrimary,
  },
  filterText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: colors.buttonText, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    ...colors.shadowCard,
  },
  summaryNumber: { fontSize: 24, fontWeight: '800', color: colors.primary },
  summaryLabel: { fontSize: 11, color: colors.textSubtle, marginTop: 4, fontWeight: '500' },
  weakSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.primarySoft, marginBottom: 14, letterSpacing: 0.3 },
  weakCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    ...colors.shadowCard,
  },
  weakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  weakRank: { fontSize: 22, fontWeight: '800', color: colors.primary },
  weakSubject: { fontSize: 15, fontWeight: '700', color: colors.text },
  weakTopic: { fontSize: 13, color: colors.textMuted },
  weakCount: { fontSize: 13, color: colors.danger, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: colors.overlay, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  barFill: { height: 6, borderRadius: 3 },
  learnButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    ...colors.shadowPrimary,
  },
  learnButtonText: { color: colors.buttonText, fontSize: 14, fontWeight: '800' },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    ...colors.shadowCard,
  },
  topicSubject: { fontSize: 14, fontWeight: '700', color: colors.text },
  topicName: { fontSize: 12, color: colors.textSubtle },
  topicStats: { flexDirection: 'row', gap: 10 },
  topicCorrect: { color: colors.success, fontSize: 14, fontWeight: '700' },
  topicWrong: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  learnArrow: { color: colors.primarySoft, fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  emptyBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 44,
    alignItems: 'center',
    marginTop: 20,
    ...colors.shadowCard,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
