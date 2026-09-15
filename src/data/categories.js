// src/data/categories.js
//
// Ürün kategorileri (ne olduğu) ve yaş grupları (kime uygun olduğu) artık
// AYRI iki alan. Eskiden tek "category" alanı hem ürün tipini hem yaşı
// karıştırıyordu (ör. "Bebek (3-12 ay)") — bu yüzden anasayfada "oyuncak"
// ya da "bebek arabası" diye filtrelemek mümkün değildi, sadece yaşa göre
// filtrelenebiliyordu. e-bebek.com gibi siteler ürün tipine göre
// kategorilendiriyor; biz de ikinci elde anlamlı olan alt kümeyi (tüketim
// ürünleri hariç — bez, mama gibi şeyler ikinci el satılmaz) buna göre
// kurduk, yaş grubunu ayrı bir filtre olarak koruduk.
//
// Her ana kategorinin (Diğer hariç) bir "subcategories" listesi var —
// özellikle Giyim & Tekstil'de detaylı (pantolon, tulum, mont vb.) çünkü
// en çok ilan buradan geliyor. Alt kategori seçimi, o kategoriye ait bir
// listesi varsa formda zorunlu; "Diğer" gibi listesi olmayan kategorilerde
// hiç gösterilmiyor.
//
// ÖNEMLİ — geriye dönük uyumluluk: Bu değişiklikten önce eklenen ürünlerde
// "category" alanı hâlâ eski yaş metnini taşıyor olabilir (ör. "Bebek
// (3-12 ay)") ve "ageGroup"/"subcategory" alanları hiç yok. Bu alanlara
// dair yardımcı fonksiyonlar (categoryLabel, subcategoryLabel,
// ageGroupLabel) bu durumda çökmek yerine ham değeri olduğu gibi gösterir
// — eski ilanlar yeni filtrelerde "Tümü" dışında görünmez ama bozuk da
// görünmez. Sahibi ilanı bir kez düzenleyince yeni alanlara geçer.

export const CATEGORIES = [
  {
    id: 'giyim',
    label: 'Giyim & Tekstil',
    emoji: '👕',
    subcategories: [
      { id: 'tulum', label: 'Tulum' },
      { id: 'pijama', label: 'Pijama' },
      { id: 'tisort-sweatshirt', label: 'Tişört & Sweatshirt' },
      { id: 'pantolon', label: 'Pantolon' },
      { id: 'sort', label: 'Şort' },
      { id: 'elbise-tunik', label: 'Elbise & Tunik' },
      { id: 'mont-kaban', label: 'Mont & Kaban' },
      { id: 'yagmurluk', label: 'Yağmurluk' },
      { id: 'ic-giyim-corap', label: 'İç Giyim & Çorap' },
      { id: 'ayakkabi-bot', label: 'Ayakkabı & Bot' },
      { id: 'aksesuar', label: 'Atkı, Bere & Eldiven' },
      { id: 'mayo-bornoz', label: 'Mayo & Bornoz' },
      { id: 'diger-giyim', label: 'Diğer Giyim' },
    ],
  },
  {
    id: 'arac-gerec',
    label: 'Araç Gereç',
    emoji: '🚗',
    subcategories: [
      { id: 'bebek-arabasi', label: 'Bebek Arabası' },
      { id: 'oto-koltugu', label: 'Oto Koltuğu' },
      { id: 'ana-kucagi-puset', label: 'Ana Kucağı & Puset' },
      { id: 'kanguru-sling', label: 'Bebek Taşıyıcı (Kanguru/Sling)' },
      { id: 'yurutec', label: 'Yürüteç' },
      { id: 'moses-sepeti', label: 'Beşik Sepeti (Moses)' },
      { id: 'diger-arac-gerec', label: 'Diğer Araç Gereç' },
    ],
  },
  {
    id: 'oyuncak',
    label: 'Oyuncak',
    emoji: '🧸',
    subcategories: [
      { id: 'egitici-oyuncak', label: 'Eğitici Oyuncak' },
      { id: 'pelus-oyuncak', label: 'Peluş Oyuncak' },
      { id: 'yapi-lego', label: 'Yapı & Lego' },
      { id: 'oyuncak-bebek', label: 'Oyuncak Bebek & Aksesuar' },
      { id: 'dis-mekan-oyuncak', label: 'Dış Mekan Oyuncakları' },
      { id: 'puzzle-zeka', label: 'Puzzle & Zeka Oyunları' },
      { id: 'muzikal-oyuncak', label: 'Müzikal Oyuncak' },
      { id: 'diger-oyuncak', label: 'Diğer Oyuncak' },
    ],
  },
  {
    id: 'beslenme',
    label: 'Beslenme',
    emoji: '🍼',
    subcategories: [
      { id: 'mama-sandalyesi', label: 'Mama Sandalyesi' },
      { id: 'biberon-emzik', label: 'Biberon & Emzik' },
      { id: 'isitici-sterilizator', label: 'Mama/Süt Isıtıcı & Sterilizatör' },
      { id: 'beslenme-seti', label: 'Beslenme Seti (Kaşık, Kap, Önlük)' },
      { id: 'diger-beslenme', label: 'Diğer Beslenme' },
    ],
  },
  {
    id: 'emzirme-hamilelik',
    label: 'Emzirme & Hamilelik',
    emoji: '🤱',
    subcategories: [
      { id: 'hamile-giyim', label: 'Hamile Giyim' },
      { id: 'emzirme-giyim', label: 'Emzirme Giyim' },
      { id: 'emzirme-yastigi', label: 'Emzirme Yastığı' },
      { id: 'gogus-pompasi', label: 'Göğüs Pompası' },
      { id: 'diger-emzirme', label: 'Diğer' },
    ],
  },
  {
    id: 'banyo-bakim',
    label: 'Banyo & Bakım',
    emoji: '🛁',
    subcategories: [
      { id: 'bebek-kuveti', label: 'Bebek Küveti' },
      { id: 'bakim-degistirme-seti', label: 'Bakım & Değiştirme Seti' },
      { id: 'alt-degistirme-unitesi', label: 'Alt Değiştirme Ünitesi' },
      { id: 'sac-tirnak-bakim', label: 'Saç & Tırnak Bakım Seti' },
      { id: 'diger-banyo-bakim', label: 'Diğer Banyo & Bakım' },
    ],
  },
  {
    id: 'guvenlik',
    label: 'Güvenlik',
    emoji: '🛡️',
    subcategories: [
      { id: 'bariyer', label: 'Kapı & Merdiven Bariyeri' },
      { id: 'priz-kose-koruyucu', label: 'Priz & Köşe Koruyucu' },
      { id: 'telsiz-kamera', label: 'Bebek Telsizi & Kamera' },
      { id: 'diger-guvenlik', label: 'Diğer Güvenlik' },
    ],
  },
  {
    id: 'mobilya-oda',
    label: 'Mobilya & Oda',
    emoji: '🛏️',
    subcategories: [
      { id: 'besik-karyola', label: 'Beşik & Karyola' },
      { id: 'yatak-nevresim', label: 'Yatak & Nevresim' },
      { id: 'gardolap-komodin', label: 'Gardolap & Komodin' },
      { id: 'salincak-ana-kucagi', label: 'Salıncak & Ana Kucağı' },
      { id: 'oda-dekorasyon', label: 'Oda Dekorasyonu' },
      { id: 'diger-mobilya', label: 'Diğer Mobilya' },
    ],
  },
  {
    id: 'kitap-egitici',
    label: 'Kitap & Eğitici Oyuncak',
    emoji: '📚',
    subcategories: [
      { id: 'resimli-hikaye-kitabi', label: 'Resimli / Hikaye Kitabı' },
      { id: 'boyama-etkinlik', label: 'Boyama & Etkinlik Kitabı' },
      { id: 'egitici-set', label: 'Eğitici Set' },
      { id: 'diger-kitap', label: 'Diğer Kitap' },
    ],
  },
  {
    id: 'okul-kirtasiye',
    label: 'Okul & Kırtasiye',
    emoji: '🎒',
    subcategories: [
      { id: 'okul-cantasi', label: 'Okul Çantası' },
      { id: 'kalem-kirtasiye', label: 'Kalem Çantası & Kırtasiye' },
      { id: 'beslenme-cantasi-matara', label: 'Beslenme Çantası & Matara' },
      { id: 'okul-formasi', label: 'Okul Forması' },
      { id: 'diger-okul', label: 'Diğer Okul & Kırtasiye' },
    ],
  },
  {
    id: 'bisiklet-disari',
    label: 'Bisiklet & Dışarı',
    emoji: '🚲',
    subcategories: [
      { id: 'bisiklet', label: 'Bisiklet' },
      { id: 'kaykay-scooter', label: 'Kaykay & Scooter' },
      { id: 'kask-koruyucu', label: 'Kask & Koruyucu' },
      { id: 'oyun-parki-kaydirak', label: 'Oyun Parkı & Kaydırak' },
      { id: 'diger-disari', label: 'Diğer Dışarı' },
    ],
  },
  { id: 'diger', label: 'Diğer', emoji: '🎁', subcategories: [] },
]

export const AGE_GROUPS = [
  { id: 'yenidogan', label: 'Yenidoğan (0-3 ay)' },
  { id: 'bebek', label: 'Bebek (3-12 ay)' },
  { id: 'yurume', label: 'Yürüme Çağı (1-2 yaş)' },
  { id: 'cocuk', label: 'Çocuk (3-6 yaş)' },
  { id: 'okul', label: 'Okul Çağı (7-12 yaş)' },
]

export function categoryLabel(id) {
  const found = CATEGORIES.find((c) => c.id === id)
  return found ? `${found.emoji} ${found.label}` : id || 'Diğer'
}

export function categoryEmoji(id) {
  return CATEGORIES.find((c) => c.id === id)?.emoji || '🎁'
}

export function subcategoriesFor(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId)?.subcategories || []
}

// Alt kategori etiketi — ana kategorinin emojisiyle birlikte (ör. "👕 Pantolon").
// Alt kategori yoksa/eşleşmezse ana kategori etiketine düşer.
export function subcategoryLabel(categoryId, subcategoryId) {
  if (!subcategoryId) return categoryLabel(categoryId)
  const category = CATEGORIES.find((c) => c.id === categoryId)
  const sub = category?.subcategories?.find((s) => s.id === subcategoryId)
  if (!sub) return categoryLabel(categoryId)
  return `${category.emoji} ${sub.label}`
}

export function ageGroupLabel(id) {
  return AGE_GROUPS.find((a) => a.id === id)?.label || id || ''
}
