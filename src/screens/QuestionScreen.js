import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView,
  ActivityIndicator, TextInput, KeyboardAvoidingView,
  Platform, StyleSheet
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const SYSTEM_PROMPT = `Sen YKS'ye hazirlanan bir lise ogrencisinin en iyi arkadasisin.
Gorevin bu soruyu cozmek degil, OGRENCININ anlayip kendisi cozmesini saglamak.

KURALLARIN:
1. Ilkokul 4. sinif ogrencisine anlatir gibi konus. Karmasik kelime kullanma.
2. Once "Bu soru aslinda sunu soruyor:" diye basla. Soruyu cok basit anlat.
3. Ogrenci bu konudan korkuyorsa, "Bu soru senden cok daha kolay, seni kandirmaya calisiyor" de.
4. Adim adim coz. Her adimi numaralandir.
5. Sonunda "Bunun gibi sorularda su numaraya dikkat et:" diye bir ipucu ver.
6. Her zaman Turkce yaz.
7. Sonunda emojilerle tesvik et: "Bunu anladiysan Matematigin %80'ini anladin demektir!"
8. CEVABININ EN SON SATIRINA su formatta ders ve konu bilgisini yaz (bu satir ogrenciye gosterilmeyecek):
   [KONU: Ders Adi > Konu Adi]
   Ornek: [KONU: Matematik > Turev]
   Ornek: [KONU: Fizik > Newton Kanunlari]
   Ornek: [KONU: Turkce > Paragraf]

ASLA yapma:
- Karmasik matematiksel gosterim kullanma
- "Bu trivial bir soru" veya "Acikca goruluyor ki" gibi seyler soyleme
- Ogrenciyi asagilama`;

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

  // AI cevabindan ders ve konu bilgisini ayikla
  const parseSubjectTopic = (text) => {
    const match = text.match(/\[KONU:\s*(.+?)\s*>\s*(.+?)\s*\]/);
    if (match) {
      return {
        subject: match[1],
        topic: match[2],
        cleanText: text.replace(/\[KONU:.*?\]/, '').trim(),
      };
    }
    return { subject: 'Diger', topic: 'Belirsiz', cleanText: text };
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      base64: true,
      quality: 0.7,
      selectionLimit: 30,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newQuestions = result.assets.map((asset) => ({
        uri: asset.uri,
        base64: asset.base64,
        explanation: '',
        subject: '',
        topic: '',
        chat: [],
        saved: false,
      }));
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
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newQuestions = [{
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
        explanation: '',
        subject: '',
        topic: '',
        chat: [],
        saved: false,
      }];
      setQuestions(newQuestions);
      setCurrentIndex(0);
      analyzeSingle(newQuestions, 0);
    }
  };

  const callGemini = async (contents) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );
    const data = await response.json();
    if (data.candidates && data.candidates[0]) {
      return data.candidates[0].content.parts[0].text;
    }
    return null;
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
      const text = await callGemini([{
        parts: [
          { text: SYSTEM_PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: qs[index].base64 } }
        ]
      }]);
      if (text) {
        const updated = processAiResponse(qs, index, text);
        setQuestions(updated);
      } else {
        const updated = [...qs];
        updated[index].explanation = 'Bir hata olustu. Fotografi tekrar yukle.';
        setQuestions(updated);
      }
    } catch {
      const updated = [...qs];
      updated[index].explanation = 'Baglanti hatasi. Interneti kontrol et.';
      setQuestions(updated);
    }
    setLoading(false);
  };

  const analyzeBatch = async (qs) => {
    setProcessingBatch(true);
    setLoading(true);
    let updated = [...qs];

    for (let i = 0; i < qs.length; i++) {
      setBatchProgress(`Soru ${i + 1}/${qs.length} cozuluyor...`);
      setCurrentIndex(i);
      try {
        const text = await callGemini([{
          parts: [
            { text: SYSTEM_PROMPT },
            { inline_data: { mime_type: 'image/jpeg', data: qs[i].base64 } }
          ]
        }]);
        if (text) {
          updated = processAiResponse(updated, i, text);
        } else {
          updated[i].explanation = 'Bu soru cozulemedi.';
        }
      } catch {
        updated[i].explanation = 'Baglanti hatasi. Bu soru atlanildi.';
      }
      setQuestions([...updated]);
    }

    setCurrentIndex(0);
    setProcessingBatch(false);
    setLoading(false);
    setBatchProgress('');
  };

  // Dogru/Yanlis kaydet
  const saveResult = async (isCorrect) => {
    if (!currentQ || currentQ.saved) return;

    const updated = [...questions];
    updated[currentIndex].saved = true;
    setQuestions(updated);

    try {
      await supabase.from('sessions').insert({
        subject: currentQ.subject || 'Diger',
        topic: currentQ.topic || 'Belirsiz',
        is_correct: isCorrect,
        ai_explanation: currentQ.explanation.substring(0, 2000),
      });
    } catch {
      // Sessizce devam et — offline olabilir
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
      const contents = [];
      contents.push({
        role: 'user',
        parts: [
          { text: SYSTEM_PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: currentQ.base64 } }
        ]
      });
      contents.push({
        role: 'model',
        parts: [{ text: currentQ.explanation }]
      });

      for (const msg of updated[currentIndex].chat) {
        if (msg.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.text }] });
        } else {
          contents.push({ role: 'model', parts: [{ text: msg.text }] });
        }
      }

      const text = await callGemini(contents);
      if (text) {
        const { cleanText } = parseSubjectTopic(text);
        updated[currentIndex].chat.push({ role: 'ai', text: cleanText });
        setQuestions([...updated]);
      }
    } catch {
      updated[currentIndex].chat.push({ role: 'ai', text: 'Baglanti hatasi. Tekrar dene.' });
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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Soru Coz</Text>
        <Text style={styles.subtitle}>
          Tek fotograf cek veya galeriden birden fazla sec!
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.pickButton} onPress={takePhoto}>
            <Text style={styles.pickButtonText}>Fotograf Cek</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
            <Text style={styles.pickButtonText}>
              Galeriden Sec {questions.length > 1 ? `(${questions.length})` : ''}
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
              <Text style={styles.navButtonText}>Onceki</Text>
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
            <ActivityIndicator size="small" color="#FFD700" />
            <Text style={styles.progressText}>{batchProgress}</Text>
          </View>
        )}

        {currentQ && (
          <Image source={{ uri: currentQ.uri }} style={styles.preview} resizeMode="contain" />
        )}

        {loading && !processingBatch && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00D4FF" />
            <Text style={styles.loadingText}>AI dusunuyor...</Text>
          </View>
        )}

        {currentQ && currentQ.explanation !== '' && (
          <>
            {/* Ders/Konu etiketi */}
            {currentQ.subject !== '' && (
              <View style={styles.topicTag}>
                <Text style={styles.topicTagText}>
                  {currentQ.subject} {'>'} {currentQ.topic}
                </Text>
              </View>
            )}

            <View style={styles.explanationBox}>
              <Text style={styles.explanationLabel}>AI Aciklamasi</Text>
              <Text style={styles.explanationText}>{currentQ.explanation}</Text>
            </View>

            {/* Dogru/Yanlis butonlari */}
            {!currentQ.saved && !processingBatch && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Bu soruyu dogru mu yapmistin?</Text>
                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    style={[styles.resultButton, styles.correctButton]}
                    onPress={() => saveResult(true)}
                  >
                    <Text style={styles.resultButtonText}>Dogru yaptim</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resultButton, styles.wrongButton]}
                    onPress={() => saveResult(false)}
                  >
                    <Text style={styles.resultButtonText}>Yanlis yaptim</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {currentQ.saved && (
              <View style={styles.savedBox}>
                <Text style={styles.savedText}>Kaydedildi! Istatistiklerinde gorunecek.</Text>
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
            <ActivityIndicator size="small" color="#00D4FF" />
            <Text style={styles.loadingText}>Cevap yaziliyor...</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {currentQ && currentQ.explanation !== '' && !processingBatch && (
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Anlamadigin yeri sor..."
            placeholderTextColor="#666"
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
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#00D4FF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#AAAAAA', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickButton: {
    flex: 1, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#00D4FF',
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  pickButtonText: { color: '#00D4FF', fontSize: 15, fontWeight: '600' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 16 },
  navButton: { backgroundColor: '#1A1A1A', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  navDisabled: { opacity: 0.3 },
  navButtonText: { color: '#FFFFFF', fontSize: 14 },
  navCounter: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
  progressBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A', padding: 12, borderRadius: 8, marginBottom: 16, gap: 10 },
  progressText: { color: '#FFD700', fontSize: 14 },
  preview: { width: '100%', height: 250, borderRadius: 12, marginBottom: 16, backgroundColor: '#1A1A1A' },
  loadingBox: { alignItems: 'center', paddingVertical: 20 },
  loadingText: { color: '#AAAAAA', marginTop: 8, fontSize: 14 },
  topicTag: { backgroundColor: '#1A1A2E', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start', marginBottom: 8 },
  topicTagText: { color: '#FFD700', fontSize: 13, fontWeight: '600' },
  explanationBox: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, marginBottom: 12 },
  explanationLabel: { color: '#00D4FF', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  explanationText: { color: '#FFFFFF', fontSize: 15, lineHeight: 24 },
  resultRow: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  resultLabel: { color: '#AAAAAA', fontSize: 14, marginBottom: 12 },
  resultButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  resultButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  correctButton: { backgroundColor: '#1B5E20' },
  wrongButton: { backgroundColor: '#B71C1C' },
  resultButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  savedBox: { backgroundColor: '#1A2E1A', borderRadius: 8, padding: 10, marginBottom: 12, alignItems: 'center' },
  savedText: { color: '#66BB6A', fontSize: 13 },
  chatSection: { marginBottom: 12 },
  chatBubble: { borderRadius: 12, padding: 12, marginBottom: 8, maxWidth: '85%' },
  userBubble: { backgroundColor: '#00D4FF', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#1A1A1A', alignSelf: 'flex-start' },
  chatText: { color: '#FFFFFF', fontSize: 14, lineHeight: 22 },
  userChatText: { color: '#0D0D0D' },
  chatInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#222', gap: 8,
  },
  chatInput: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12, color: '#FFFFFF', fontSize: 15, maxHeight: 100 },
  sendButton: { backgroundColor: '#00D4FF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  sendDisabled: { opacity: 0.4 },
  sendButtonText: { color: '#0D0D0D', fontWeight: 'bold', fontSize: 15 },
});
