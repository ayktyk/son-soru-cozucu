import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { callGeminiApi } from '../config/api';
import { colors } from '../theme/colors';

const buildLearnPrompt = (subject, topic) =>
  `${subject} dersindeki "${topic}" konusunu ilkokul 4. sınıf öğrencisine anlatır gibi anlat.

KURALLARIN:
1. Çok basit Türkçe kullan. Karmaşık kelime kullanma.
2. Konuyu günlük hayattan örneklerle anlat.
3. Formül varsa adım adım, yavaş yavaş göster. Her adımı açıkla.
4. Konuyu anlattıktan sonra 3 kolay pratik soru sor.
5. Soruları numaralandır ve her birinin cevabını ayrı ayrı ver.
6. Öğrenciyi teşvik et, "Bu konuyu anladıysan harikasın!" gibi.
7. Her zaman Türkçe yaz.
8. Konu anlatımını bölümlere ayır: "Ne öğreneceğiz?", "Konu Anlatımı", "Pratik Sorular".

ASLA yapma:
- Karmaşık matematiksel gösterim kullanma
- Öğrenciyi aşağılama
- "Bu çok kolay" gibi ifadeler kullanma`;

export default function LearnScreen({ route }) {
  const { subject, topic } = route.params;
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchExplanation();
  }, []);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const text = await callGeminiApi([
        { parts: [{ text: buildLearnPrompt(subject, topic) }] },
      ]);
      setExplanation(text || 'Açıklama alınamadı.');
    } catch (err) {
      setExplanation(err.message || 'Bir hata oluştu. Tekrar dene.');
    }
    setLoading(false);
  };

  const sendFollowUp = async () => {
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatLoading(true);

    const updatedChat = [...chat, { role: 'user', text: userMsg }];
    setChat(updatedChat);

    try {
      const contents = [
        {
          role: 'user',
          parts: [{ text: buildLearnPrompt(subject, topic) }],
        },
        {
          role: 'model',
          parts: [{ text: explanation }],
        },
      ];

      for (const msg of updatedChat) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }

      const text = await callGeminiApi(contents);
      if (text) {
        setChat([...updatedChat, { role: 'ai', text }]);
      }
    } catch (err) {
      setChat([
        ...updatedChat,
        { role: 'ai', text: err.message || 'Bağlantı hatası. Tekrar dene.' },
      ]);
    }

    setChatLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator
      >
        <View style={styles.topicHeader}>
          <Text style={styles.topicSubject}>{subject}</Text>
          <Text style={styles.topicName}>{topic}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Konu hazırlanıyor...</Text>
          </View>
        ) : (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationText}>{explanation}</Text>
          </View>
        )}

        {!loading && (
          <TouchableOpacity style={styles.retryButton} onPress={fetchExplanation}>
            <Text style={styles.retryButtonText}>Tekrar Anlat</Text>
          </TouchableOpacity>
        )}

        {chat.length > 0 && (
          <View style={styles.chatSection}>
            {chat.map((msg, i) => (
              <View
                key={i}
                style={[styles.chatBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}
              >
                <Text style={[styles.chatText, msg.role === 'user' && styles.userChatText]}>
                  {msg.text}
                </Text>
              </View>
            ))}
          </View>
        )}

        {chatLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Cevap yazılıyor...</Text>
          </View>
        )}
      </ScrollView>

      {!loading && (
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Anlamadığın yeri sor..."
            placeholderTextColor={colors.textSubtle}
            value={chatMessage}
            onChangeText={setChatMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !chatMessage.trim() && styles.sendDisabled]}
            onPress={sendFollowUp}
            disabled={!chatMessage.trim() || chatLoading}
          >
            <Text style={styles.sendButtonText}>Sor</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, minHeight: 0 },
  content: { flexGrow: 1, padding: 20, paddingTop: 10, paddingBottom: 180 },
  topicHeader: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    alignItems: 'center',
    ...colors.shadowPrimary,
  },
  topicSubject: { fontSize: 13, color: colors.buttonText, fontWeight: '600', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' },
  topicName: { fontSize: 24, color: colors.buttonText, fontWeight: '800' },
  loadingBox: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: colors.textMuted, marginTop: 10, fontSize: 14, fontWeight: '500' },
  explanationBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    ...colors.shadowCard,
  },
  explanationText: { color: colors.text, fontSize: 15, lineHeight: 28 },
  retryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 16,
  },
  retryButtonText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  chatSection: { marginBottom: 14 },
  chatBubble: { borderRadius: 18, padding: 14, marginBottom: 8, maxWidth: '85%' },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end', ...colors.shadowCard },
  aiBubble: { backgroundColor: colors.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border },
  chatText: { color: colors.text, fontSize: 14, lineHeight: 22 },
  userChatText: { color: colors.buttonText },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 14,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    backgroundColor: colors.overlay,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 22,
    ...colors.shadowPrimary,
  },
  sendDisabled: { opacity: 0.4 },
  sendButtonText: { color: colors.buttonText, fontWeight: 'bold', fontSize: 15 },
});
