# ♟️ AI Chess Battle

Modern, etkileşimli ve güçlü bir satranç uygulaması: AI vs AI, İnsan vs AI ve gelişmiş pozisyon analizi.  
React + TypeScript ile geliştirilmiş, gerçek zamanlı Stockfish değerlendirmesi ve OpenAI entegrasyonu ile.

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- **Node.js** v14+
- **OpenAI API anahtarı**

### Kurulum

1. **Projeyi klonlayın**

   ```bash
   git clone [repository-url]
   cd ai-chess-battle
   ```

2. **Bağımlılıkları yükleyin**

   ```bash
   npm install
   ```

3. **Ortam değişkenlerini ayarlayın**
   `.env` dosyası oluşturun:

   ```env
   REACT_APP_OPENAI_KEY=your_openai_api_key_here
   ```

4. **Uygulamayı başlatın**
   ```bash
   npm start
   ```
   Ardından [http://localhost:3000](http://localhost:3000) adresini ziyaret edin.

---

## ✨ Özellikler

### 🎨 Modern Arayüz

- Temiz, merkezde satranç tahtası
- Hızlı oyun modu seçimi ve popüler AI modeli seçimi
- Gerçek zamanlı değerlendirme çubuğu

### 🎯 Oyun Modları

- **Basit Mod:** Hızlı AI vs AI, sade arayüz
- **İnsan vs AI:** Gerçek zamanlı değerlendirme ile AI'ya karşı oynayın
- **Karmaşık Mod:** AI'nın stratejik hafızası ve detaylı analiz

### 🤖 AI Özellikleri

- Çoklu AI modeli desteği (gpt-4o, o3, o4-mini, vb.)
- Stratejik hafıza: Açılış, hedefler, analizler
- Detaylı hamle ve pozisyon açıklamaları

### 🎮 Etkileşimli Özellikler

- Kare ve ok vurgulama (satranç.com tarzı)
- Sürükle-bırak ile hamle yapma
- Kompakt ve renkli hamle geçmişi

---

## 🛠️ Teknik Özellikler

- **React + TypeScript** mimarisi
- **Material-UI v5** ile modern bileşenler
- **Chess.js** ile oyun kuralları ve doğrulama
- **Stockfish 16** WASM entegrasyonu
- **OpenAI API** ile gelişmiş hamle üretimi
- Servis tabanlı kod yapısı ve özel hook'lar

---

## 🎯 Kullanım Kılavuzu

### Başlangıç

1. Oyun modunu seçin (Basit, İnsan vs AI, Karmaşık)
2. Oyuncuları ve AI modellerini ayarlayın
3. Başlat'a tıklayın ve oyunun tadını çıkarın!

### Özellikler

- **Değerlendirme Çubuğu:** Gerçek zamanlı Stockfish analizi, mat algılama, derinlik gösterimi
- **Tahta:** Sağ tık ile vurgulama, sürükle-bırak hamleler
- **Hamle Geçmişi:** Kompakt, renkli ve kaydırılabilir

---

## 📁 Proje Yapısı

```
src/
├── components/          # React bileşenleri
│   ├── Chessboard.tsx
│   ├── EvaluationBar.tsx
│   ├── ModernControlPanel.tsx
│   └── CompactMoveHistory.tsx
├── services/            # İş mantığı ve API servisleri
│   ├── aiService.ts
│   ├── chessService.ts
│   ├── stockfishService.ts
│   └── memoryService.ts
└── types/               # TypeScript tip tanımları
```

---

## 🔧 Geliştirme

- **Üretim için derleme:**
  ```bash
  npm run build
  ```
- **Çevre değişkenleri:**
  - `REACT_APP_OPENAI_API_KEY` - OpenAI API anahtarınız

---

## 🤝 Katkı Sağlama

1. Fork alın
2. Özellik dalı oluşturun (`git checkout -b feature/harika-ozellik`)
3. Değişikliklerinizi commit'leyin
4. Dalı push'layın
5. Pull Request açın

---

## 📝 Lisans

MIT Lisansı ile lisanslanmıştır. Detaylar için LICENSE dosyasına bakın.

---

## 🎯 Gelecek Geliştirmeler

- Stockfish ile daha derin analiz
- Oyun veritabanı ve tekrar oynatma
- Turnuva modu
- Gelişmiş analiz tahtası
- Özel açılış kitapları
- Ses efektleri ve tema seçenekleri

---

Satranç ve yapay zekanın keyfini çıkarın! 🏆
