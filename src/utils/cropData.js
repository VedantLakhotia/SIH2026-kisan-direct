// Central crop metadata with high quality images, emojis, benchmark prices, and categories
export const CROP_PRESETS = [
  {
    name: 'Tomato',
    emoji: '🍅',
    category: 'Vegetable',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 32,
    suggestedPoolPrice: 22,
    defaultTargetKg: 100,
    unit: 'kg',
    description: 'Vine-ripened, farm-fresh juicy red tomatoes directly from Meerut farms.'
  },
  {
    name: 'Onion',
    emoji: '🧅',
    category: 'Vegetable',
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 28,
    suggestedPoolPrice: 18,
    defaultTargetKg: 200,
    unit: 'kg',
    description: 'Crisp, pungent Nasik-grade red onions with excellent shelf life.'
  },
  {
    name: 'Potato',
    emoji: '🥔',
    category: 'Vegetable',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 22,
    suggestedPoolPrice: 15,
    defaultTargetKg: 250,
    unit: 'kg',
    description: 'Freshly harvested soil-dusted potatoes, perfect for daily curries and roasting.'
  },
  {
    name: 'Spinach',
    emoji: '🥬',
    category: 'Leafy Green',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 30,
    suggestedPoolPrice: 20,
    defaultTargetKg: 60,
    unit: 'kg',
    description: 'Crisp morning-harvest organic palak, pesticide-free and packed with iron.'
  },
  {
    name: 'Cauliflower',
    emoji: '🥦',
    category: 'Vegetable',
    image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 42,
    suggestedPoolPrice: 30,
    defaultTargetKg: 80,
    unit: 'kg',
    description: 'Compact, ivory-white pesticide-free heads with tight curds.'
  },
  {
    name: 'Carrot',
    emoji: '🥕',
    category: 'Vegetable',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 38,
    suggestedPoolPrice: 26,
    defaultTargetKg: 100,
    unit: 'kg',
    description: 'Sweet, vibrant red Desi carrots fresh from northern soil.'
  },
  {
    name: 'Mango',
    emoji: '🥭',
    category: 'Fruit',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 85,
    suggestedPoolPrice: 60,
    defaultTargetKg: 150,
    unit: 'kg',
    description: 'Naturally ripened Dasheri and Chausa mangoes, fragrant and sweet.'
  },
  {
    name: 'Banana',
    emoji: '🍌',
    category: 'Fruit',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 40,
    suggestedPoolPrice: 25,
    defaultTargetKg: 120,
    unit: 'kg',
    description: 'Premium Robusta bananas ripened with natural methods, no carbides.'
  },
  {
    name: 'Rice',
    emoji: '🌾',
    category: 'Grain',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 50,
    suggestedPoolPrice: 35,
    defaultTargetKg: 400,
    unit: 'kg',
    description: 'Aged traditional Basmati rice with distinct aroma and long slender grain.'
  },
  {
    name: 'Wheat',
    emoji: '🍞',
    category: 'Grain',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 32,
    suggestedPoolPrice: 22,
    defaultTargetKg: 500,
    unit: 'kg',
    description: 'Sharbati golden grain wheat, double-cleaned and sun-dried.'
  },
  {
    name: 'Peas',
    emoji: '🟢',
    category: 'Vegetable',
    image: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 55,
    suggestedPoolPrice: 40,
    defaultTargetKg: 80,
    unit: 'kg',
    description: 'Plump, tender green peas with natural sweetness.'
  }
];

export function getCropDetails(cropName) {
  if (!cropName) return CROP_PRESETS[0];
  const found = CROP_PRESETS.find(
    c => c.name.toLowerCase() === cropName.toLowerCase() ||
         cropName.toLowerCase().includes(c.name.toLowerCase())
  );
  if (found) return found;

  return {
    name: cropName,
    emoji: '🌱',
    category: 'Fresh Produce',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80',
    benchmarkMandiPrice: 35,
    suggestedPoolPrice: 25,
    defaultTargetKg: 100,
    unit: 'kg',
    description: 'Direct farm produce sourced sustainably.'
  };
}
