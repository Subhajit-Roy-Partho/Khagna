export const SEED_STORES = [
  { name: "Fresh Bazaar", city: "Kolkata", address: "Park Street", lat: 22.555, lng: 88.352, phone: "", is_online: 0, image_url: "" },
  { name: "Al Madina Grocers", city: "Dubai", address: "Deira", lat: 25.269, lng: 55.309, phone: "", is_online: 0, image_url: "" },
  { name: "Desi Mart", city: "Chicago", address: "Devon Ave", lat: 41.997, lng: -87.688, phone: "", is_online: 0, image_url: "" },
  { name: "Khagna Online", city: "Online", address: "Ships everywhere", lat: 0, lng: 0, phone: "", is_online: 1, image_url: "" },
];

export const SEED_ITEMS = [
  { name_en: "Basmati Rice", name_bn: "বাসমতী চাল", name_alt: "long grain rice", category: "grocery", image_url: "", base_unit: "kg" },
  { name_en: "Red Lentils (Masoor Dal)", name_bn: "মসুর ডাল", name_alt: "masoor dal", category: "grocery", image_url: "", base_unit: "kg" },
  { name_en: "Mustard Oil", name_bn: "সরষের তেল", name_alt: "sorser tel", category: "grocery", image_url: "", base_unit: "kg" },
  { name_en: "Hilsa Fish", name_bn: "ইলিশ মাছ", name_alt: "ilish", category: "fish", image_url: "", base_unit: "kg" },
  { name_en: "Eggs (12 pc)", name_bn: "ডিম", name_alt: "dim, dozen eggs", category: "grocery", image_url: "", base_unit: "piece" },
];

export const SEED_CARDS = [
  { name: "Cashback Plus", bank: "HDFC", image_url: "", annual_fee: 500, rating: 4.5, apply_url: "" },
  { name: "Travel Miles Elite", bank: "Emirates NBD", image_url: "", annual_fee: 1500, rating: 4.7, apply_url: "" },
  { name: "Grocery Rewards", bank: "Chase", image_url: "", annual_fee: 0, rating: 4.2, apply_url: "" },
];

export const SEED_BENEFITS = [
  // card index 0
  { card: 0, category: "grocery", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "up to $50/mo", description: "5% cashback on grocery stores" },
  { card: 0, category: "dining", merchant_place: "restaurants", reward_rate: 2, reward_type: "cashback", cap: "", description: "2% on dining" },
  { card: 1, category: "travel", merchant_place: "airlines", reward_rate: 4, reward_type: "miles", cap: "", description: "4x miles on airline booking" },
  { card: 1, category: "grocery", merchant_place: "any", reward_rate: 1, reward_type: "miles", cap: "", description: "1x on groceries" },
  { card: 2, category: "grocery", merchant_place: "online", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on online grocery" },
  { card: 2, category: "fuel", merchant_place: "any", reward_rate: 2, reward_type: "points", cap: "", description: "2x on fuel" },
];
