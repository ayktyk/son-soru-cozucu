import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';

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
      // Ders bazli istatistik
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

      // Konu bazli gruplama
      const grouped = {};
      for (const row of data) {
        const key = `${row.subject} > ${row.topic}`;
        if (!grouped[key]) {
          grouped[key] = { subject: row.subject, topic: row.topic, total: 0, wrong: 0 };
        }
        grouped[key].total++;
        if (!row.is_correct) grouped[key].wrong++;
      }

      // Yanlis sayisina gore sirala
      const sorted = Object.values(grouped).sort((a, b) => b.wrong - a.wrong);
      setStats(sorted);
    } catch {
      // Sessizce devam et
    }
    setLoading(false);
  };

  const getBarColor = (wrong, total) => {
    const ratio = wrong / total;
    if (ratio >= 0.7) return '#F44336'; // Kirmizi — cok zayif
    if (ratio >= 0.4) return '#FF9800'; // Turuncu — dikkat
    return '#4CAF50'; // Yesil — iyi
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00D4FF" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (stats.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Istatistikler</Text>
        <Text style={styles.subtitle}>Soru cozdukce burada zayif konularin gorunecek</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>Henuz veri yok. Ilk soruyu cozerek basla!</Text>
        </View>
      </View>
    );
  }

  const successRate = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
  const weakTopics = stats.filter((s) => s.wrong > 0).slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Istatistikler</Text>

      {/* Ozet kartlar */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalSolved}</Text>
          <Text style={styles.summaryLabel}>Toplam Soru</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: '#4CAF50' }]}>{totalCorrect}</Text>
          <Text style={styles.summaryLabel}>Dogru</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: '#F44336' }]}>{totalSolved - totalCorrect}</Text>
          <Text style={styles.summaryLabel}>Yanlis</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: '#FFD700' }]}>%{successRate}</Text>
          <Text style={styles.summaryLabel}>Basari</Text>
        </View>
      </View>

      {/* Zayif konular — odaklan */}
      {weakTopics.length > 0 && (
        <View style={styles.weakSection}>
          <Text style={styles.sectionTitle}>Bunlara Odaklan!</Text>
          {weakTopics.map((item, i) => (
            <View key={i} style={styles.weakCard}>
              <View style={styles.weakHeader}>
                <Text style={styles.weakRank}>#{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weakSubject}>{item.subject}</Text>
                  <Text style={styles.weakTopic}>{item.topic}</Text>
                </View>
                <Text style={styles.weakCount}>{item.wrong}/{item.total} yanlis</Text>
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

      {/* Tum konular */}
      <Text style={styles.sectionTitle}>Tum Konular</Text>
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 20, paddingTop: 10 },
  content: { paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#00D4FF', marginBottom: 16 },
  subtitle: { fontSize: 14, color: '#AAAAAA', marginBottom: 30 },

  // Ozet
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryNumber: { fontSize: 24, fontWeight: 'bold', color: '#00D4FF' },
  summaryLabel: { fontSize: 11, color: '#888', marginTop: 4 },

  // Zayif konular
  weakSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', marginBottom: 12 },
  weakCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, marginBottom: 10 },
  weakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  weakRank: { fontSize: 20, fontWeight: 'bold', color: '#F44336' },
  weakSubject: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  weakTopic: { fontSize: 13, color: '#AAAAAA' },
  weakCount: { fontSize: 13, color: '#F44336', fontWeight: '600' },
  barBg: { height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },

  // Tum konular
  topicRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, marginBottom: 8,
  },
  topicSubject: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  topicName: { fontSize: 12, color: '#888' },
  topicStats: { flexDirection: 'row', gap: 10 },
  topicCorrect: { color: '#4CAF50', fontSize: 14, fontWeight: '600' },
  topicWrong: { color: '#F44336', fontSize: 14, fontWeight: '600' },

  // Bos durum
  emptyBox: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 20 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#AAAAAA', fontSize: 15, textAlign: 'center' },
});
