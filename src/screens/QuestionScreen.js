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

const SYSTEM_PROMPT = `Sen YKS'ye haz\u0131rlanan bir lise \u00F6\u011Frencisinin en iyi arkada\u015F\u0131s\u0131n.
G\u00F6revin bu soruyu \u00E7\u00F6zmek de\u011Fil, \u00D6\u011ERENC\u0130N\u0130N anlay\u0131p kendisi \u00E7\u00F6zmesini sa\u011Flamak.

KURALLARIN:
1. \u0130lkokul 4. s\u0131n\u0131f \u00F6\u011Frencisine anlat\u0131r gibi konu\u015F. Karma\u015F\u0131k kelime kullanma.
2. \u00D6nce "Bu soru asl\u0131nda \u015Funu soruyor:" diye ba\u015Fla. Soruyu \u00E7ok basit anlat.
3. \u00D6\u011Frenci bu konudan korkuyorsa, "Bu soru senden \u00E7ok daha kolay, seni kand\u0131rmaya \u00E7al\u0131\u015F\u0131yor" de.
4. Ad\u0131m ad\u0131m \u00E7\u00F6z. Her ad\u0131m\u0131 numaraland\u0131r.
5. Sonunda "Bunun gibi sorularda \u015Fu noktaya dikkat et:" diye bir ipucu ver.
6. Her zaman T\u00FCrk\u00E7e yaz.
7. Sonunda emojilerle te\u015Fvik et: "Bunu anlad\u0131ysan Matemati\u011Fin b\u00FCy\u00FCk k\u0131sm\u0131n\u0131 \u00E7\u00F6zd\u00FCn demektir!"
8. CEVABININ EN SON SATIRINA \u015Fu formatta ders ve konu bilgisini yaz (bu sat\u0131r \u00F6\u011Frenciye g\u00F6sterilmeyecek):
   [KONU: Ders Ad\u0131 > Konu Ad\u0131]
   \u00D6rnek: [KONU: Matematik > T\u00FCrev]
   \u00D6rnek: [KONU: Fizik > Newton Kanunlar\u0131]
   \u00D6rnek: [KONU: T\u00FCrk\u00E7e > Paragraf]

ASLA yapma:
- Karma\u015F\u0131k matematiksel g\u00F6sterim kullanma
- "Bu trivial bir soru" veya "A\u00E7\u0131k\u00E7a g\u00F6r\u00FCl\u00FCyor ki" gibi \u015Feyler s\u00F6yleme
- \u00D6\u011Frenciyi a\u015Fa\u011F\u0131lama`;

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

    return { subject: 'Di\u011Fer', topic: 'Belirsiz', cleanText: text };
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
      console.error('Soru analiz hatasi:', err);
      const updated = [...qs];
      updated[index].explanation = err.message || 'Bilinmeyen bir hata olu\u015Ftu.';
      setQuestions(updated);
    }
    setLoading(false);
  };

  const analyzeBatch = async (qs) => {
    setProcessingBatch(true);
    setLoading(true);
    let updated = [...qs];

    for (let i = 0; i < qs.length; i++) {
      setBatchProgress(`Soru ${i + 1}/${qs.length} \u00E7\u00F6z\u00FCl\u00FCyor...`);
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
        console.error(`Soru ${i + 1} hatasi:`, err);
        updated[i].explanation = err.message || 'Bu soru \u00E7\u00F6z\u00FClemedi.';
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
        subject: currentQ.subject || 'Di\u011Fer',
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
      console.error('Chat hatasi:', err);
      updated[currentIndex].chat.push({
        role: 'ai',
        text: err.message || 'Ba\u011Flanti hatasi. Tekrar dene.',
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
        <Text style={styles.title}>{'Soru \u00C7\u00F6z'}</Text>
        <Text style={styles.subtitle}>{'Tek foto\u011Fraf \u00E7ek veya galeriden birden fazla se\u00E7'}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.pickButton} onPress={takePhoto}>
            <Text style={styles.pickButtonText}>{'Foto\u011Fraf \u00C7ek'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
            <Text style={styles.pickButtonText}>
              {'Galeriden Se\u00E7'} {questions.length > 1 ? `(${questions.length})` : ''}
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
              <Text style={styles.navButtonText}>{'\u00D6nceki'}</Text>
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
            <Text style={styles.loadingText}>{'AI d\u00FC\u015F\u00FCn\u00FCyor...'}</Text>
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
              <Text style={styles.explanationLabel}>{'AI A\u00E7\u0131klamas\u0131'}</Text>
              <Text style={styles.explanationText}>{currentQ.explanation}</Text>
            </View>

            {!currentQ.saved && !processingBatch && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{'Bu soruyu do\u011Fru mu yapm\u0131\u015Ft\u0131n?'}</Text>
                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    style={[styles.resultButton, styles.correctButton]}
                    onPress={() => saveResult(true)}
                  >
                    <Text style={[styles.resultButtonText, styles.correctButtonText]}>{'Do\u011Fru yapt\u0131m'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resultButton, styles.wrongButton]}
                    onPress={() => saveResult(false)}
                  >
                    <Text style={[styles.resultButtonText, styles.wrongButtonText]}>{'Yanl\u0131\u015F yapt\u0131m'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {currentQ.saved && (
              <View style={styles.savedBox}>
                <Text style={styles.savedText}>{'Kaydedildi. \u0130statistiklerinde g\u00F6r\u00FCnecek.'}</Text>
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
            <Text style={styles.loadingText}>{'Cevap yaz\u0131l\u0131yor...'}</Text>
          </View>
        )}
      </ScrollView>

      {currentQ && currentQ.explanation !== '' && !processingBatch && (
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder={'Anlamad\u0131\u011F\u0131n yeri sor...'}
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
