import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { callGeminiApi } from '../config/api';
import { supabase } from '../config/supabase';
import { colors } from '../theme/colors';

const SYSTEM_PROMPT = `Sen YKS'ye hazırlanan bir lise öğrencisinin en iyi arkadaşısın.
Görevin bu soruyu çözmek değil, ÖĞRENCİNİN anlayıp kendisi çözmesini sağlamak.

KURALLARIN:
1. İlkokul 4. sınıf öğrencisine anlatır gibi konuş. Karmaşık kelime kullanma.
2. Önce "Bu soru aslında şunu soruyor:" diye başla. Soruyu çok basit anlat.
3. Öğrenci bu konudan korkuyorsa, "Bu soru senden çok daha kolay, seni kandırmaya çalışıyor" de.
4. Adım adım çöz. Her adımı numaralandır.
5. Sonunda "Bunun gibi sorularda şu noktaya dikkat et:" diye bir ipucu ver.
6. Her zaman Türkçe yaz.
7. Sonunda emojilerle teşvik et: "Bunu anladıysan Matematiğin büyük kısmını çözdün demektir!"
8. CEVABININ EN SON SATIRINA şu formatta ders ve konu bilgisini yaz (bu satır öğrenciye gösterilmeyecek):
   [KONU: Ders Adı > Konu Adı]
   Örnek: [KONU: Matematik > Türev]
   Örnek: [KONU: Fizik > Newton Kanunları]
   Örnek: [KONU: Türkçe > Paragraf]

ASLA yapma:
- Karmaşık matematiksel gösterim kullanma
- "Bu trivial bir soru" veya "Açıkça görülüyor ki" gibi şeyler söyleme
- Öğrenciyi aşağılama`;

export default function QuestionScreen() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef(null);

  const currentQ = questions[currentIndex] || null;

  const optimizeImage = async (asset) => {
    const maxDimension = 1400;
    const width = asset.width || maxDimension;
    const height = asset.height || maxDimension;
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const resizedWidth = Math.max(1, Math.round(width * scale));
    const resizedHeight = Math.max(1, Math.round(height * scale));

    const optimized = await manipulateAsync(
      asset.uri,
      [{ resize: { width: resizedWidth, height: resizedHeight } }],
      {
        compress: 0.55,
        format: SaveFormat.JPEG,
        base64: true,
      }
    );

    return {
      uri: optimized.uri,
      base64: optimized.base64,
      explanation: '',
      subject: '',
      topic: '',
      chat: [],
      saved: false,
    };
  };

  const parseSubjectTopic = (text) => {
    const match = text.match(/\[KONU:\s*(.+?)\s*>\s*(.+?)\s*\]/);
    if (match) {
      return {
        subject: match[1],
        topic: match[2],
        cleanText: text.replace(/\[KONU:.*?\]/, '').trim(),
      };
    }

    return { subject: 'Diğer', topic: 'Belirsiz', cleanText: text };
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.5,
      selectionLimit: 30,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newQuestions = await Promise.all(result.assets.map(optimizeImage));
      setQuestions(newQuestions);
      setCurrentIndex(0);

      if (newQuestions.length === 1) {
        analyzeSingle(newQuestions, 0);
      } else {
        analyzeBatch(newQuestions);
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
    });

    if (!result.canceled) {
      const optimizedQuestion = await optimizeImage(result.assets[0]);
      const newQuestions = [optimizedQuestion];
      setQuestions(newQuestions);
      setCurrentIndex(0);
      analyzeSingle(newQuestions, 0);
    }
  };

  const processAiResponse = (qs, index, rawText) => {
    const { subject, topic, cleanText } = parseSubjectTopic(rawText);
    const updated = [...qs];
    updated[index].explanation = cleanText;
    updated[index].subject = subject;
    updated[index].topic = topic;
    return updated;
  };

  const analyzeSingle = async (qs, index) => {
    setLoading(true);
    try {
      const text = await callGeminiApi([{
        parts: [
          { text: SYSTEM_PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: qs[index].base64 } },
        ],
      }]);
      const updated = processAiResponse(qs, index, text);
      setQuestions(updated);
    } catch (err) {
      console.error('Soru analiz hatası:', err);
      const updated = [...qs];
      updated[index].explanation = err.message || 'Bilinmeyen bir hata oluştu.';
      setQuestions(updated);
    }
    setLoading(false);
  };

  const analyzeBatch = async (qs) => {
    setProcessingBatch(true);
    setLoading(true);
    let updated = [...qs];

    for (let i = 0; i < qs.length; i++) {
      setBatchProgress(`Soru ${i + 1}/${qs.length} çözülüyor...`);
      setCurrentIndex(i);

      try {
        const text = await callGeminiApi([{
          parts: [
            { text: SYSTEM_PROMPT },
            { inline_data: { mime_type: 'image/jpeg', data: qs[i].base64 } },
          ],
        }]);
        updated = processAiResponse(updated, i, text);
      } catch (err) {
        console.error(`Soru ${i + 1} hatası:`, err);
        updated[i].explanation = err.message || 'Bu soru çözülemedi.';
      }

      setQuestions([...updated]);
    }

    setCurrentIndex(0);
    setProcessingBatch(false);
    setLoading(false);
    setBatchProgress('');
  };

  const saveResult = async (isCorrect) => {
    if (!currentQ || currentQ.saved) return;

    const updated = [...questions];
    updated[currentIndex].saved = true;
    setQuestions(updated);

    try {
      await supabase.from('sessions').insert({
        subject: currentQ.subject || 'Diğer',
        topic: currentQ.topic || 'Belirsiz',
        is_correct: isCorrect,
        ai_explanation: currentQ.explanation.substring(0, 2000),
      });
    } catch {
      // Sessizce devam et
    }
  };

  const sendFollowUp = async () => {
    if (!chatMessage.trim() || !currentQ) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatLoading(true);

    const updated = [...questions];
    updated[currentIndex].chat.push({ role: 'user', text: userMsg });
    setQuestions([...updated]);

    try {
      const contents = [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT },
            { inline_data: { mime_type: 'image/jpeg', data: currentQ.base64 } },
          ],
        },
        {
          role: 'model',
          parts: [{ text: currentQ.explanation }],
        },
      ];

      for (const msg of updated[currentIndex].chat) {
        if (msg.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.text }] });
        } else {
          contents.push({ role: 'model', parts: [{ text: msg.text }] });
        }
      }

      const text = await callGeminiApi(contents);
      if (text) {
        const { cleanText } = parseSubjectTopic(text);
        updated[currentIndex].chat.push({ role: 'ai', text: cleanText });
        setQuestions([...updated]);
      }
    } catch (err) {
      console.error('Chat hatası:', err);
      updated[currentIndex].chat.push({
        role: 'ai',
        text: err.message || 'Bağlantı hatası. Tekrar dene.',
      });
      setQuestions([...updated]);
    }

    setChatLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const goToQuestion = (direction) => {
    const next = currentIndex + direction;
    if (next >= 0 && next < questions.length) {
      setCurrentIndex(next);
    }
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
        <Text style={styles.title}>Soru Çöz</Text>
        <Text style={styles.subtitle}>
          Tek fotoğraf çek veya galeriden birden fazla seç
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.pickButton} onPress={takePhoto}>
            <Text style={styles.pickButtonText}>Fotoğraf Çek</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
            <Text style={styles.pickButtonText}>
              Galeriden Seç {questions.length > 1 ? `(${questions.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {questions.length > 1 && (
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navButton, currentIndex === 0 && styles.navDisabled]}
              onPress={() => goToQuestion(-1)}
              disabled={currentIndex === 0}
            >
              <Text style={styles.navButtonText}>Önceki</Text>
            </TouchableOpacity>
            <Text style={styles.navCounter}>
              {currentIndex + 1} / {questions.length}
            </Text>
            <TouchableOpacity
              style={[styles.navButton, currentIndex === questions.length - 1 && styles.navDisabled]}
              onPress={() => goToQuestion(1)}
              disabled={currentIndex === questions.length - 1}
            >
              <Text style={styles.navButtonText}>Sonraki</Text>
            </TouchableOpacity>
          </View>
        )}

        {processingBatch && (
          <View style={styles.progressBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progressText}>{batchProgress}</Text>
          </View>
        )}

        {currentQ && (
          <Image source={{ uri: currentQ.uri }} style={styles.preview} resizeMode="contain" />
        )}

        {loading && !processingBatch && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>AI düşünüyor...</Text>
          </View>
        )}

        {currentQ && currentQ.explanation !== '' && (
          <>
            {currentQ.subject !== '' && (
              <View style={styles.topicTag}>
                <Text style={styles.topicTagText}>
                  {currentQ.subject} {'>'} {currentQ.topic}
                </Text>
              </View>
            )}

            <View style={styles.explanationBox}>
              <Text style={styles.explanationLabel}>AI Açıklaması</Text>
              <Text style={styles.explanationText}>{currentQ.explanation}</Text>
            </View>

            {!currentQ.saved && !processingBatch && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Bu soruyu doğru mu yapmıştın?</Text>
                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    style={[styles.resultButton, styles.correctButton]}
                    onPress={() => saveResult(true)}
                  >
                    <Text style={[styles.resultButtonText, styles.correctButtonText]}>Doğru yaptım</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resultButton, styles.wrongButton]}
                    onPress={() => saveResult(false)}
                  >
                    <Text style={[styles.resultButtonText, styles.wrongButtonText]}>Yanlış yaptım</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {currentQ.saved && (
              <View style={styles.savedBox}>
                <Text style={styles.savedText}>Kaydedildi. İstatistiklerinde görünecek.</Text>
              </View>
            )}
          </>
        )}

        {currentQ && currentQ.chat.length > 0 && (
          <View style={styles.chatSection}>
            {currentQ.chat.map((msg, i) => (
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

      {currentQ && currentQ.explanation !== '' && !processingBatch && (
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
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  pickButtonText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 16 },
  navButton: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navDisabled: { opacity: 0.3 },
  navButtonText: { color: colors.text, fontSize: 14 },
  navCounter: { color: colors.primarySoft, fontSize: 16, fontWeight: 'bold' },
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10,
  },
  progressText: { color: colors.primarySoft, fontSize: 14 },
  preview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  loadingBox: { alignItems: 'center', paddingVertical: 20 },
  loadingText: { color: colors.textMuted, marginTop: 8, fontSize: 14 },
  topicTag: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  topicTagText: { color: colors.buttonText, fontSize: 13, fontWeight: '600' },
  explanationBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  explanationLabel: { color: colors.primary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  explanationText: { color: colors.text, fontSize: 15, lineHeight: 24 },
  resultRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  resultLabel: { color: colors.textMuted, fontSize: 14, marginBottom: 12 },
  resultButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  resultButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  correctButton: { backgroundColor: colors.primary },
  wrongButton: { backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.primarySoft },
  resultButtonText: { fontSize: 15, fontWeight: '600' },
  correctButtonText: { color: colors.buttonText },
  wrongButtonText: { color: colors.text },
  savedBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  savedText: { color: colors.primarySoft, fontSize: 13 },
  chatSection: { marginBottom: 12 },
  chatBubble: { borderRadius: 12, padding: 12, marginBottom: 8, maxWidth: '85%' },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: colors.surface, alignSelf: 'flex-start' },
  chatText: { color: colors.text, fontSize: 14, lineHeight: 22 },
  userChatText: { color: colors.buttonText },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: colors.overlay,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  sendDisabled: { opacity: 0.4 },
  sendButtonText: { color: colors.buttonText, fontWeight: 'bold', fontSize: 15 },
});
