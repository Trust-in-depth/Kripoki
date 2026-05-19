# Kripoki

Kripoki, Solidity akıllı sözleşmeleri için geliştirilmiş yapay zeka destekli bir güvenlik analiz platformudur. Amaç, sözleşme kodunu daha anlaşılır, daha erişilebilir ve daha hızlı değerlendirilebilir hale getirmektir.


## Tanıtım

Akıllı sözleşmelerde güvenlik hataları, dağıtımdan sonra ciddi maddi kayıplara yol açabilir. Kripoki, geliştiricilerin ve araştırmacıların Solidity sözleşmelerini tek bir arayüz üzerinden analiz edebilmesini sağlar. Kullanıcı, sözleşmesini yükler veya yapıştırır, analiz modelini seçer ve sonuçları görsel paneller üzerinden inceler.

Proje; frontend tarafında modern bir analiz arayüzü, backend tarafında model tabanlı yorumlama katmanı ve Supabase destekli analiz geçmişi yapısını bir araya getirir. Ayrıca cüzdan bağlantısı sayesinde kullanıcıya özel geçmiş takibi yapılabilir.

## Neden Kripoki?

- Solidity sözleşmelerini hızlı biçimde analiz etmek için
- Güven skoru, risk ve kritik zafiyetleri tek ekranda görmek için
- Gas verimliliğini sözleşme yapısına göre değerlendirmek için
- Analiz geçmişini saklayıp tekrar açabilmek için
- Geliştirici dostu, kurulabilir ve genişletilebilir bir yapı kullanmak için

## Kimler İçin Uygun?

- Solidity geliştiricileri
- Web3 güvenlik araştırmacıları
- Akıllı sözleşme denetimi öğrenen öğrenciler
- Demo, bitirme projesi veya araştırma prototipi hazırlayan ekipler

## Proje Bileşenleri

- `audit-shield`: React + Vite + Tailwind tabanlı frontend
- `audit-backend`: FastAPI tabanlı backend ve model servis katmanı

Bu README, projeyi GitHub üzerinden klonladıktan sonra sıfırdan nasıl kuracağınızı ve nasıl çalıştıracağınızı anlatır.

## Özellikler

- Solidity kodunu editöre yapıştırarak veya dosya yükleyerek analiz başlatma
- GraphCodeBERT tabanlı akıllı sözleşme güvenlik analizi
- Dinamik güven skoru, risk, kritik zafiyet ve gas verimliliği gösterimi
- Cüzdan bağlantısı sonrası kullanıcıya özel analiz geçmişi
- Supabase üzerinde analiz geçmişi saklama
- Geçmiş kayda tıklayıp ilgili analizi yeniden açabilme

## Proje Yapısı

```text
SmartContract/
├─ README.md
├─ audit-backend/
│  ├─ main.py
│  └─ model_save/
│     ├─ graphBert/
│     └─ CNN_BILSTM/
└─ audit-shield/
   ├─ src/
   ├─ supabase/
   │  └─ wallet_history_setup.sql
   ├─ package.json
   └─ .env.example
```

## Gereksinimler

- Node.js 20 veya üzeri
- npm 10 veya üzeri
- Python 3.13 önerilir
- Git
- MetaMask veya benzeri EVM cüzdanı
- Supabase hesabı

## 1. Projeyi Klonlama

```powershell
git clone <REPO_URL>
cd SmartContract
```

## 2. Frontend Kurulumu

```powershell
cd audit-shield
npm install
```

Önce örnek ortam dosyasını kopyalayın:

```powershell
Copy-Item .env.example .env
```

Frontend, Supabase bağlantısı için aşağıdaki ortam değişkenlerini bekler:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`audit-shield` klasörü içindeki `.env` dosyasını kendi değerlerinizle doldurun.

## 3. Supabase Kurulumu

Supabase için herhangi bir masaüstü uygulaması indirmeniz gerekmez. Kurulum web paneli üzerinden yapılır.

### 3.1 Supabase projesi oluşturma

1. [Supabase Dashboard](https://supabase.com/dashboard) adresine gidin.
2. Yeni bir proje oluşturun veya mevcut projeyi açın.

### 3.2 Project URL ve anon key alma

1. Proje ekranında `Connect` penceresini açın.
2. Buradaki `Project URL` değerini alın.
3. `Settings` > `API Keys` bölümünden `anon` anahtarını alın.
4. Bu iki değeri `audit-shield/.env` dosyasına ekleyin.

### 3.3 Veritabanı tablosunu oluşturma

1. Sol menüden `SQL Editor` bölümüne girin.
2. `New query` oluşturun.
3. [wallet_history_setup.sql](audit-shield/supabase/wallet_history_setup.sql) dosyasının içeriğini kopyalayın.
4. SQL Editor içine yapıştırın.
5. `Run` butonuna basın.

Bu SQL dosyası:

- `audit_results` tablosunu oluşturur
- `wallet_address` alanını ekler
- `source_code` alanını ekler
- analiz geçmişi için gerekli index ve policy yapılarını kurar

## 4. Backend Kurulumu

Backend klasörüne geçin:

```powershell
cd audit-backend
```

Sanal ortam oluşturun:

```powershell
py -3.13 -m venv .venv
```

Sanal ortamı aktif edin:

```powershell
.\.venv\Scripts\Activate.ps1
```

Gerekli paketleri kurun:

```powershell
pip install fastapi uvicorn torch transformers
```

Backend’i başlatın:

```powershell
py -3.13 main.py
```

Alternatif olarak:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend varsayılan olarak şu adreste çalışır:

```text
http://localhost:8000
```

Sağlık kontrolü için:

```text
http://localhost:8000/health
```

## 5. Frontend’i Çalıştırma

Yeni bir terminal açın ve frontend klasörüne gidin:

```powershell
cd audit-shield
npm run dev
```

Uygulama genelde şu adreste açılır:

```text
http://localhost:5173
```

## 6. Cüzdan Bağlama

1. MetaMask eklentisini Chrome, Edge veya Brave üzerinde kurun.
2. Test amacıyla mümkünse boş veya ayrı bir cüzdan kullanın.
3. Uygulamayı MetaMask’ın gerçekten çalıştığı normal tarayıcıda açın.
4. Sağ üstteki cüzdan butonuna tıklayın.

Not:

- Eğer `MetaMask Yok` görüyorsanız tarayıcı eklentisi algılanmamıştır.
- Uygulama içi önizlemelerde tarayıcı eklentileri her zaman çalışmayabilir.

## 7. Analiz Akışı

1. Bir model seçin.
2. Solidity sözleşmesini editöre yapıştırın veya `.sol` dosyası yükleyin.
3. `Analizi Başlat` butonuna basın.
4. Sonuçlar sağ panelde görünecektir.
5. Geçmişte son 10 kayıt gösterilir.
6. Geçmişteki bir kayda tıklarsanız aynı analiz tekrar açılır.

## 8. Önemli Notlar

- Backend şu anda yalnızca Solidity’e benzeyen içerikleri analiz eder.
- Geçerli Solidity olmayan düz metinler için skor üretilmez.
- `source_code` veritabanında tutulduğu için yeni kayıtlar tekrar açıldığında sözleşme içeriği de geri yüklenir.
- `graphBert` modeli hazırdır.
- `CNN_BILSTM` klasörü eksik artifact içeriyorsa sequential model kullanılamayabilir.

## 9. Sorun Giderme

### Python bulunamıyor

Eğer `python` komutu çalışmıyorsa şunu deneyin:

```powershell
py -3.13 main.py
```

### MetaMask algılanmıyor

- Sayfayı normal Chrome, Edge veya Brave içinde açın.
- MetaMask’ın kurulu ve kilidinin açık olduğundan emin olun.
- Sayfayı yenileyin.

### Supabase URL bulunamıyor

Şuradan alın:

- `Connect` penceresi
- veya `Settings` > `API Keys`

### History kaydı açılıyor ama kontrat görünmüyor

Bu genelde eski kayıtlarda `source_code` alanı olmadığı anlamına gelir. SQL dosyasını yeniden çalıştırın ve yeni analiz kayıtları oluşturun.

## 10. Geliştirme Komutları

Frontend:

```powershell
cd audit-shield
npm run dev
npm run lint
npx tsc -b
```

Backend:

```powershell
cd audit-backend
py -3.13 main.py
```

## Güvenlik Uyarısı

- Gerçek varlık tuttuğunuz ana cüzdanı bağlamayın.
- Bu proje için ayrı bir test cüzdanı kullanın.
- Seed phrase veya private key bilgilerinizi hiçbir yere paylaşmayın.
