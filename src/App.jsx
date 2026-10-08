import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Calendar, ShoppingBag, Utensils, Bookmark, ExternalLink, 
  Dices, ChevronRight, Edit3, Check, RotateCcw, Plus, X, 
  Lightbulb, Sparkles, ChefHat, Info
} from 'lucide-react';

const EXTERNAL_PRICE_SOURCE = {
  name: "當季好康物價參考 (HokHong)",
  url: "https://hokhong.tw/cheap/"
};

const COOKWARE_OPTIONS = [
  { id: 'pan', name: '平底/炒鍋', icon: '🍳' },
  { id: 'pot', name: '湯鍋/燉鍋', icon: '🥣' },
  { id: 'cooker', name: '電鍋/電子鍋', icon: '🍚' },
  { id: 'airfryer', name: '氣炸鍋', icon: '♨️' },
  { id: 'oven', name: '烤箱', icon: '🔥' },
  { id: 'microwave', name: '微波爐', icon: '⚡' }
];

// 完整 57 種蔬菜資料庫
const ALL_VEGETABLES = [
  // --- 葉菜花菜類 (16種) ---
  { id: 'cabbage', name: '高麗菜', category: 'leafy', peakMonths: [11, 12, 1, 2, 3], regularMonths: [4, 8, 9, 10], roles: ['veg_only', 'soup', 'one_pot'], tips: { badge: '手感偏輕、葉球蓬鬆', points: ['拿在手上蓬鬆清脆，死重者纖維較粗', '切口約50元硬幣大透白不發黑'], note: '挑選球體澎鬆、葉脈間距寬的通常清甜脆口。' } },
  { id: 'chinese_cabbage', name: '大白菜', category: 'leafy', peakMonths: [11, 12, 1, 2], regularMonths: [3, 4, 8, 9, 10], roles: ['veg_only', 'soup', 'one_pot'], tips: { badge: '緊實沉重、葉白厚實', points: ['沉甸甸水分足', '葉片緊密包裹無黑腐'], note: '秋冬天冷時最甘甜，開陽白菜或入湯極佳。' } },
  { id: 'cauliflower', name: '白花椰', category: 'leafy', peakMonths: [11, 12, 1, 2, 3], regularMonths: [4, 8, 9, 10], roles: ['veg_only'], tips: { badge: '花球緊密、無散開', points: ['花球緊密顏色純白', '花蕾未發黃散開'], note: '冬天平地產無蟲害最爽脆。' } },
  { id: 'spinach', name: '菠菜', category: 'leafy', peakMonths: [11, 12, 1, 2, 3], regularMonths: [], roles: ['veg_only'], tips: { badge: '葉片翠綠、根部鮮粉紅', points: ['葉脈細緻深綠', '根帶鮮粉紅甜度高'], note: '冬季限定，建議2天內煮完。' } },
  { id: 'lettuce', name: '萵苣', category: 'leafy', peakMonths: [11, 12, 1, 2, 3], regularMonths: [4, 8, 9, 10], roles: ['veg_only'], tips: { badge: '葉脆鮮亮、無折損', points: ['切口乾淨無褐變', '葉片挺立無萎蔫'], note: '冬天最鮮嫩無苦味。' } },
  { id: 'mustard_green', name: '刈菜', category: 'leafy', peakMonths: [12, 1, 2], regularMonths: [], roles: ['veg_only', 'soup'], tips: { badge: '葉柄厚實光潤', points: ['菜柄寬厚微挺', '葉完整無大面積蟲傷'], note: '微苦回甘燉雞湯絕配。' } },
  { id: 'sweet_potato_leaf', name: '地瓜葉', category: 'leafy', peakMonths: [5, 6, 7, 8, 9, 10], regularMonths: [1, 2, 3, 4, 11, 12], roles: ['veg_only'], tips: { badge: '嫩葉無傷、梗短嫩脆', points: ['輕折末端能清脆折斷', '葉片嫩綠無水傷'], note: '盛夏平價耐熱，大火蒜炒極佳。' } },
  { id: 'water_spinach', name: '空心菜', category: 'leafy', peakMonths: [4, 5, 6, 7, 8, 9, 10], regularMonths: [11, 12, 1, 2, 3], roles: ['veg_only', 'veg_meat', 'one_pot'], tips: { badge: '梗細孔小、葉挺翠', points: ['空心管徑細小嫩脆', '梗勿過粗過硬'], note: '大火沙茶炒牛肉靈魂。' } },
  { id: 'bok_choy', name: '青江菜', category: 'leafy', peakMonths: [10, 11, 12, 1, 2, 3], regularMonths: [4, 5, 6, 7, 8, 9], roles: ['veg_only', 'veg_meat', 'one_pot'], tips: { badge: '葉柄肥厚、株型矮壯', points: ['根部至葉柄緊實如匙', '葉深綠無爛葉'], note: '香菇燴青江菜百搭漂亮。' } },
  { id: 'pak_choi', name: '小白菜', category: 'leafy', peakMonths: [10, 11, 12, 1, 2, 3, 4], regularMonths: [5, 6, 7, 8, 9], roles: ['veg_only', 'soup', 'one_pot'], tips: { badge: '水嫩潔白無枯黃', points: ['葉柄清脆無萎爛', '快炒或煮麵熟得快'], note: '家常快翻必備。' } },
  { id: 'yu_choy', name: '油菜', category: 'leafy', peakMonths: [11, 12, 1, 2, 3], regularMonths: [4, 5, 6, 7, 8, 9, 10], roles: ['veg_only'], tips: { badge: '莖細嫩多汁、花苞未開', points: ['花苞緊閉未開黃花嫩度佳', '色澤濃綠'], note: '冬春天冷甜度高。' } },
  { id: 'a_choy', name: 'A菜 (油麥菜)', category: 'leafy', peakMonths: [10, 11, 12, 1, 2, 3, 4], regularMonths: [5, 6, 7, 8, 9], roles: ['veg_only'], tips: { badge: '葉挺拔潔淨無折損', points: ['狹長挺拔', '切口無乾涸褐化'], note: '豆豉蒜炒香氣足。' } },
  { id: 'amaranth', name: '莧菜', category: 'leafy', peakMonths: [5, 6, 7, 8, 9], regularMonths: [4, 10], roles: ['veg_only', 'soup'], tips: { badge: '葉質柔軟、紅綠勻稱', points: ['梗部捏起柔軟', '新鮮帶根保鮮好'], note: '蒜香吻仔魚莧菜羹首選。' } },
  { id: 'malabar_spinach', name: '皇宮菜', category: 'leafy', peakMonths: [5, 6, 7, 8, 9, 10], regularMonths: [], roles: ['veg_only'], tips: { badge: '葉肥厚油亮帶黏液', points: ['嫩梢葉片肥厚光澤', '折斷處帶天然黏液'], note: '麻油薑絲快炒風味最佳。' } },
  { id: 'tong_ho', name: '茼蒿', category: 'leafy', peakMonths: [11, 12, 1, 2], regularMonths: [], roles: ['veg_only', 'soup', 'one_pot'], tips: { badge: '葉厚微白粉乾爽', points: ['無水傷發黑發黏', '葉尖無枯黃'], note: '冬天火鍋與湯圓必備。' } },
  { id: 'broccoli', name: '青花菜 (綠花椰)', category: 'leafy', peakMonths: [11, 12, 1, 2, 3], regularMonths: [4, 5, 6, 7, 8, 9, 10], roles: ['veg_only', 'veg_meat'], tips: { badge: '花蕾細密深綠無黃', points: ['花球緊密凸起', '花莖切口濕潤無中空'], note: '冬天在地產最甜脆，炒蝦仁肉片皆宜。' } },

  // --- 瓜果豆莢類 (15種) ---
  { id: 'bell_pepper', name: '甜椒', category: 'melon_bean', peakMonths: [11, 12, 1, 2, 3, 4], regularMonths: [5, 6, 7, 8, 9, 10], roles: ['veg_meat', 'veg_only', 'one_pot'], tips: { badge: '皮緊肉厚、蒂頭翠綠', points: ['表皮光亮彈性足', '沉甸感水分充沛'], note: '冬春設施最厚甜，咖哩配色王。' } },
  { id: 'tomato', name: '番茄', category: 'melon_bean', peakMonths: [12, 1, 2, 3, 4], regularMonths: [5, 6, 7, 8, 9, 10, 11], roles: ['veg_meat', 'soup', 'one_pot'], tips: { badge: '果形圓整紅潤鮮綠', points: ['無裂果果蒂挺拔', '茄紅素風味濃'], note: '番茄炒蛋、番茄牛肉湯必備。' } },
  { id: 'cucumber', name: '小黃瓜', category: 'melon_bean', peakMonths: [4, 5, 6, 7, 8, 9], regularMonths: [10, 11, 12, 1, 2, 3], roles: ['veg_meat', 'veg_only'], tips: { badge: '粗細均勻、刺瘤扎手', points: ['瓜身挺直刺瘤明顯', '兩端均勻不虛軟'], note: '春末盛夏最平價脆口。' } },
  { id: 'bitter_melon', name: '苦瓜', category: 'melon_bean', peakMonths: [5, 6, 7, 8, 9], regularMonths: [3, 4, 10, 11], roles: ['veg_meat', 'soup'], tips: { badge: '果瘤圓大飽滿透亮', points: ['顆粒大苦味適中', '無黑斑水傷'], note: '夏日消暑鹹蛋苦瓜或排骨湯。' } },
  { id: 'eggplant', name: '茄子', category: 'melon_bean', peakMonths: [5, 6, 7, 8, 9], regularMonths: [3, 4, 10, 11], roles: ['veg_meat', 'veg_only', 'one_pot'], tips: { badge: '皮深紫發亮、果身有彈性', points: ['萼片與果身有白帶代表嫩', '無斑點凹陷'], note: '塔香茄子肉末蓋飯。' } },
  { id: 'loofah', name: '絲瓜', category: 'melon_bean', peakMonths: [5, 6, 7, 8, 9], regularMonths: [3, 4, 10, 11], roles: ['veg_meat', 'veg_only', 'soup', 'one_pot'], tips: { badge: '沉重結實、輕壓有彈性', points: ['重量沉紋理清', '無空心軟爛感'], note: '絲瓜蛤蜊麵線一鍋搞定。' } },
  { id: 'winter_melon', name: '冬瓜', category: 'melon_bean', peakMonths: [5, 6, 7, 8, 9, 10], regularMonths: [3, 4, 11], roles: ['soup', 'veg_meat', 'one_pot'], tips: { badge: '果肉厚白硬實、帶白霜', points: ['肉質緊密無虛黃', '皮帶均勻白霜代表成熟甜美'], note: '盛夏清熱消暑，蛤蜊冬瓜湯必備。' } },
  { id: 'zucchini', name: '櫛瓜 (西葫蘆)', category: 'melon_bean', peakMonths: [11, 12, 1, 2, 3, 4], regularMonths: [5, 6, 7, 8, 9, 10], roles: ['veg_meat', 'veg_only', 'one_pot'], tips: { badge: '身形粗細勻稱、表皮光澤', points: ['手握堅挺無軟皺', '免削皮切片快熟'], note: '平底鍋乾煎或氣炸撒胡椒鹽5分鐘搞定。' } },
  { id: 'green_bean', name: '四季豆 (敏豆)', category: 'melon_bean', peakMonths: [4, 5, 6, 7, 8, 9, 10], regularMonths: [1, 2, 3, 11, 12], roles: ['veg_meat', 'veg_only'], tips: { badge: '豆莢翠綠細嫩無枯斑', points: ['折斷清脆帶水氣', '籽粒勿過於凸起粗老'], note: '乾煸四季豆或肉絲快炒家常王。' } },
  { id: 'okra', name: '秋葵', category: 'melon_bean', peakMonths: [5, 6, 7, 8, 9], regularMonths: [4, 10], roles: ['veg_only', 'veg_meat'], tips: { badge: '長度約食指、茸毛完整', points: ['稜角分明無黑斑', '頂部尖端輕折有彈性不易斷老'], note: '滾水燙2分鐘沾醬油膏即上桌。' } },
  { id: 'large_cucumber', name: '大黃瓜 (刺瓜)', category: 'melon_bean', peakMonths: [4, 5, 6, 7, 8, 9], regularMonths: [10, 11, 12, 1, 2, 3], roles: ['soup', 'veg_meat'], tips: { badge: '瓜身筆直、拿取沉甸重手', points: ['皮色均勻深綠刺瘤完好', '無黃斑軟化'], note: '大黃瓜貢丸湯、大黃瓜鑲肉家常經典。' } },
  { id: 'yardlong_bean', name: '菜豆 (長豇豆)', category: 'melon_bean', peakMonths: [7, 8, 9], regularMonths: [], roles: ['veg_meat', 'veg_only'], tips: { badge: '豆莢細嫩、折斷帶水氣', points: ['粗細一致無凸鼓', '爽脆無水枯'], note: '盛夏傳統市場必備。' } },
  { id: 'snow_pea', name: '豌豆', category: 'melon_bean', peakMonths: [12, 1, 2, 3], regularMonths: [], roles: ['veg_meat', 'veg_only'], tips: { badge: '莢色鮮綠、折口脆嫩', points: ['豆莢飽滿爽脆無枯斑', '表面細毛光亮'], note: '冬春快炒肉絲或清炒。' } },
  { id: 'edamame', name: '毛豆', category: 'melon_bean', peakMonths: [4, 5, 6, 10, 11, 12], regularMonths: [], roles: ['veg_meat', 'one_pot'], tips: { badge: '豆莢飽滿、茸毛白淨', points: ['2~3粒圓潤飽滿豆仁', '表皮絨毛完好'], note: '炊飯或炒肉末極佳。' } },
  { id: 'corn', name: '玉米', category: 'melon_bean', peakMonths: [11, 12, 1, 2, 3, 4], regularMonths: [5, 6], roles: ['soup', 'veg_meat', 'one_pot'], tips: { badge: '外葉青綠、米粒整齊', points: ['玉米鬚乾燥深褐', '輕掐有清澈汁漿'], note: '排骨湯甘甜靈魂。' } },

  // --- 根莖澱粉類 (11種) ---
  { id: 'potato', name: '馬鈴薯', category: 'root_stem', peakMonths: [1, 2, 3, 4], regularMonths: [5, 6, 7, 8, 9, 10, 11, 12], roles: ['veg_meat', 'soup', 'one_pot'], tips: { badge: '表皮光滑微乾、無發芽綠皮', points: ['手握堅實無軟點', '切勿有發芽或發綠部位（含龍葵鹼）'], note: '咖哩、馬鈴薯燉肉一鍋到底神物。' } },
  { id: 'pumpkin', name: '南瓜', category: 'root_stem', peakMonths: [5, 6, 7, 8, 9, 10], regularMonths: [1, 2, 3, 4, 11, 12], roles: ['soup', 'veg_meat', 'one_pot'], tips: { badge: '果蒂乾燥木質化、手感沉重', points: ['表皮紋理深刻緊密', '拍打聲音清脆紮實'], note: '電鍋南瓜雞肉炊飯甘甜綿密。' } },
  { id: 'taro', name: '芋頭', category: 'root_stem', peakMonths: [9, 10, 11, 12, 1, 2], regularMonths: [3, 4, 5, 6, 7, 8], roles: ['soup', 'one_pot'], tips: { badge: '手感輕實鬆軟、切口粉白', points: ['拿在手上手感較輕的通常較鬆綿', '切口黏液拉絲帶粉質'], note: '芋頭米粉湯、芋頭香菇炊飯香氣濃郁。' } },
  { id: 'lotus_root', name: '蓮藕', category: 'root_stem', peakMonths: [7, 8, 9, 10], regularMonths: [6, 11], roles: ['soup', 'veg_meat'], tips: { badge: '藕節短粗飽滿、外皮帶泥', points: ['表皮無傷無變黑', '孔洞清潔無泥沙滲入'], note: '秋季蓮藕排骨湯清甜滋潤。' } },
  { id: 'onion', name: '洋蔥', category: 'root_stem', peakMonths: [2, 3, 4], regularMonths: [1, 5, 6, 7, 8, 9, 10, 11, 12], roles: ['veg_meat', 'soup', 'one_pot'], tips: { badge: '表皮乾燥光滑、球體緊實', points: ['沉重堅硬頂部未芽', '外皮薄緊貼'], note: '一鍋到底靈魂底料，燉飯炒麵必備。' } },
  { id: 'radish', name: '蘿蔔', category: 'root_stem', peakMonths: [11, 12, 1, 2, 3], regularMonths: [4, 5, 6, 7, 8, 9, 10], roles: ['soup', 'veg_meat', 'one_pot'], tips: { badge: '手感沉重、表皮光滑細緻', points: ['沉甸感代表水分足無空心', '無裂紋少鬚根'], note: '冬季產期水嫩清甜，排骨湯靈魂。' } },
  { id: 'carrot', name: '胡蘿蔔', category: 'root_stem', peakMonths: [12, 1, 2, 3, 4], regularMonths: [5, 6, 7, 8, 9, 10, 11], roles: ['soup', 'veg_meat', 'one_pot'], tips: { badge: '色澤橙紅、帶泥新鮮', points: ['表皮平滑無分叉', '蒂頭細小者芯嫩'], note: '冬春採收期甜味足，平時冷藏常備。' } },
  { id: 'bamboo_shoot', name: '竹筍', category: 'root_stem', peakMonths: [5, 6, 7, 8, 9], regularMonths: [4], roles: ['soup', 'veg_meat', 'one_pot'], tips: { badge: '牛角彎曲、切口細白無綠頭', points: ['筍身略彎似牛角', '切口白嫩無綠頭不苦'], note: '綠竹筍涼拌或炊飯鮮嫩如梨。' } },
  { id: 'water_bamboo', name: '茭白筍', category: 'root_stem', peakMonths: [5, 6, 9, 10, 11], regularMonths: [4, 7, 8], roles: ['veg_meat', 'veg_only'], tips: { badge: '筍身飽滿、苞葉潔白', points: ['筍肉飽滿結實不过長', '切口水嫩無黑心'], note: '炒肉絲或蒜香乾煸非常脆口。' } },
  { id: 'yam', name: '山藥', category: 'root_stem', peakMonths: [10, 11, 12, 1, 2, 3], regularMonths: [4, 5, 6, 7, 9], roles: ['soup'], tips: { badge: '粗細均勻、切口白淨', points: ['外皮無斑鬚根均勻', '切口黏液拉絲稠'], note: '秋冬進補排骨湯溫和潤口。' } },
  { id: 'sweet_potato', name: '地瓜', category: 'root_stem', peakMonths: [12, 1, 2, 3, 4], regularMonths: [5, 8, 9, 10], roles: ['soup', 'veg_meat', 'one_pot'], tips: { badge: '紡錘體型、無發芽黑斑', points: ['表皮乾爽無蟲孔', '紮實無軟爛點'], note: '冬春品種最甜綿鬆軟。' } },

  // --- 菇蕈木耳類 (7種) ---
  { id: 'shimeji', name: '鴻喜菇 / 雪白菇', category: 'mushroom', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], regularMonths: [], roles: ['veg_meat', 'veg_only', 'soup', 'one_pot'], tips: { badge: '整株緊密無出水、菌傘圓整', points: ['菇帽緊密完整無裂', '撕開根部免洗直接下鍋'], note: '一鍋到底炊飯、炒蛋超方便。' } },
  { id: 'black_fungus', name: '黑木耳', category: 'mushroom', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], regularMonths: [], roles: ['veg_meat', 'veg_only', 'one_pot'], tips: { badge: '肉厚有彈性、背面絨毛均勻', points: ['手摸微潤不黏滑', '質地肥厚軟韌有光澤'], note: '木耳炒蛋或肉絲高纖爽脆。' } },
  { id: 'oyster_mushroom', name: '秀珍菇', category: 'mushroom', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], regularMonths: [], roles: ['veg_meat', 'veg_only', 'soup', 'one_pot'], tips: { badge: '菇蓋約50元硬幣、菌褶乾爽', points: ['菇柄粗短緊實', '袋裝無出水浸泡'], note: '溫室全年穩定，清炒肉絲極快軟嫩。' } },
  { id: 'king_oyster', name: '杏鮑菇', category: 'mushroom', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], regularMonths: [], roles: ['veg_meat', 'veg_only', 'one_pot'], tips: { badge: '菌柄結實粗壯、菇帽乾爽', points: ['純白有彈性表面乾爽', '菇帽未完全開傘'], note: '溫室環控穩定，乾煸炒肉百搭。' } },
  { id: 'shiitake', name: '香菇', category: 'mushroom', peakMonths: [11, 12, 1, 2, 3], regularMonths: [4, 5, 6, 7, 8, 9, 10], roles: ['soup', 'veg_meat', 'veg_only', 'one_pot'], tips: { badge: '菇傘厚實、菌褶乾爽白皙', points: ['邊緣向內微捲未散', '無酸敗異味'], note: '冬菇生長慢香氣最濃郁。' } },
  { id: 'enoki', name: '金針菇', category: 'mushroom', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], regularMonths: [], roles: ['soup', 'veg_meat', 'one_pot'], tips: { badge: '整束純白緊密、根部乾爽', points: ['挺直不軟爛無出水', '袋內無過多水氣'], note: '全年均價入湯快熟。' } },
  { id: 'daylily', name: '金針花', category: 'mushroom', peakMonths: [8, 9, 10], regularMonths: [4, 5, 6], roles: ['soup', 'veg_meat'], tips: { badge: '花苞含苞待放、黃亮爽脆', points: ['未開花蕾口感最爽脆', '無硫磺酸味'], note: '夏末秋初新鮮金針排骨湯極甜。' } },

  // --- 辛香料與靈魂香草 (8種) ---
  { id: 'ginger', name: '生薑 (老薑/嫩薑)', category: 'flavoring', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], regularMonths: [], roles: ['flavoring'], tips: { badge: '薑塊堅硬結實、表皮乾燥', points: ['夏秋嫩薑爽脆帶粉紅', '秋冬老薑皮皺辛辣去腥佳'], note: '魚湯、麻油料理、絲瓜不可或缺。' } },
  { id: 'basil', name: '九層塔', category: 'flavoring', peakMonths: [4, 5, 6, 7, 8, 9, 10], regularMonths: [1, 2, 3, 11, 12], roles: ['flavoring'], tips: { badge: '葉片深綠完整、無黑斑水傷', points: ['香氣濃郁刺鼻為佳', '葉尖無受潮發黑'], note: '塔香煎蛋、三杯料理靈魂。' } },
  { id: 'coriander', name: '香菜 (芫荽)', category: 'flavoring', peakMonths: [11, 12, 1, 2, 3], regularMonths: [4, 5, 6, 7, 8, 9, 10], roles: ['flavoring'], tips: { badge: '葉綠挺拔無爛葉、帶泥新鮮', points: ['根系完整香氣足', '無出水發黃軟爛'], note: '起鍋灑一把提香增色。' } },
  { id: 'scallion', name: '青蔥', category: 'flavoring', peakMonths: [12, 1, 2, 3, 4], regularMonths: [5, 6, 7, 8, 9, 10, 11], roles: ['flavoring'], tips: { badge: '蔥白長潔淨、葉身挺直', points: ['蔥白部分越長越甜', '葉身挺直無枯尖'], note: '冬季三星蔥最厚甜多汁。' } },
  { id: 'garlic', name: '大蒜', category: 'flavoring', peakMonths: [3, 4, 5], regularMonths: [1, 2, 6, 7, 8, 9, 10, 11, 12], roles: ['flavoring'], tips: { badge: '蒜球硬挺、蒜衣緊實無芽', points: ['蒜瓣堅硬無空洞', '無青綠嫩芽'], note: '爆香必備。' } },
  { id: 'chili', name: '辣椒', category: 'flavoring', peakMonths: [5, 6, 7, 8, 9], regularMonths: [1, 2, 3, 4, 10, 11, 12], roles: ['flavoring'], tips: { badge: '果皮光亮緊緻、蒂頭翠綠', points: ['捏起堅硬不軟爛', '色澤鮮亮'], note: '醒胃開胃。' } },
  { id: 'celery', name: '芹菜', category: 'flavoring', peakMonths: [11, 12, 1, 2, 3], regularMonths: [4, 12], roles: ['flavoring', 'veg_meat'], tips: { badge: '菜梗水嫩挺直、折斷清脆', points: ['梗部飽滿脆硬', '切口無黑心'], note: '冬季炒肉絲花枝極香。' } },
  { id: 'peanut', name: '花生', category: 'flavoring', peakMonths: [6, 7, 11, 12], regularMonths: [], roles: ['flavoring', 'soup'], tips: { badge: '莢粒飽滿、外殼乾淨', points: ['沉手紋路清', '無發霉斑點'], note: '水煮鮮香。' } }
];

// 水果清單 (36種)
const ALL_FRUITS = [
  { id: 'kiwi', name: '奇異果', months: [1,2,3,4,5,6,7,8,9,10,11,12], tips: { badge: '絨毛完整、蒂頭微軟有彈性', points: ['輕壓兩端微有彈性即成熟甜美', '表皮無壓痕凹陷'] } },
  { id: 'blueberry', name: '藍莓', months: [1,2,3,4,5,6,7,8,9,10,11,12], tips: { badge: '白果粉均勻厚實、果粒結實', points: ['外表乾爽不軟爛', '深藍紫色澤純淨無出水'] } },
  { id: 'cherry', name: '櫻桃', months: [5,6,7,8,12,1,2], tips: { badge: '果梗鮮綠翠硬、果皮緊繃泛光', points: ['果身硬朗有彈性', '顏色暗紅發亮甜度最高'] } },
  { id: 'murcott', name: '茂谷柑 / 桶柑', months: [1,2,3,4], tips: { badge: '皮薄光滑、手感沉實墜手', points: ['皮薄緊繃橙紅', '水分多甜度高'] } },
  { id: 'papaya', name: '木瓜', months: [1,2,3,4,5,6,7,8,9,10,11,12], tips: { badge: '果形飽滿微黃、無壓痕', points: ['果溝微黃泛紅', '手感微軟帶香'] } },
  { id: 'jujube', name: '印度棗', months: [1,2,3,12], tips: { badge: '果皮亮綠光滑、果蒂深凹', points: ['果蒂深凹最甜', '無皺縮痕跡'] } },
  { id: 'kumquat', name: '金桔', months: [1,2,11,12], tips: { badge: '果皮油亮橙黃', points: ['果粒結實飽滿', '香氣清新濃郁'] } },
  { id: 'orange', name: '柳丁', months: [1,11,12], tips: { badge: '手感沉重油胞細', points: ['皮薄沉重水分多', '底有圓印印記為佳'] } },
  { id: 'banana', name: '香蕉', months: [1,2,3,4,5,6,7,8,9,10,11,12], tips: { badge: '稜線平緩果柄鮮', points: ['黃澄無黑爛壓痕', '帶芝麻細斑最香甜'] } },
  { id: 'strawberry', name: '草莓', months: [1,2,3,4,12], tips: { badge: '鮮紅透亮萼翠綠', points: ['顆粒分明立體', '無出水軟爛'] } },
  { id: 'melon', name: '甜瓜', months: [1,2,3,4,5,6,8,9,10,11,12], tips: { badge: '果臍微軟散清香', points: ['網紋均勻細密', '底部輕壓微彈'] } },
  { id: 'ponkan', name: '椪柑', months: [1,2,3,10,11,12], tips: { badge: '果形扁平沉重', points: ['橙黃微粗糙', '沉甸多汁感'] } },
  { id: 'guava', name: '番石榴', months: [1,2,3,4,5,6,7,8,9,10,11,12], tips: { badge: '果皮凹凸粗微黃綠', points: ['手捏微硬帶彈', '皮粗者通常甘脆'] } },
  { id: 'starfruit', name: '楊桃', months: [1,2,3,4,7,8,9,10,11,12], tips: { badge: '稜邊飽滿果色橙黃', points: ['五稜厚實完整', '色轉黃甜度高'] } },
  { id: 'grape', name: '葡萄', months: [1,3,4,5,6,7,8,9,10,11,12], tips: { badge: '果粉完整果粒結實', points: ['果穗完整無落粒', '均勻包白果粉'] } },
  { id: 'wax_apple', name: '蓮霧', months: [1,2,3,4,5,6,7,8,9,12], tips: { badge: '黑透紅萼片張開', points: ['黑透紅肚臍開最甜', '結實無空心感'] } },
  { id: 'sugar_apple', name: '釋迦', months: [1,2,3,4,7,8,9,12], tips: { badge: '鱗目均勻開展', points: ['鱗溝微黃展開熟度足', '輕壓微軟可吃'] } },
  { id: 'passion_fruit', name: '百香果', months: [2,3,4,5,6,7,8,9,10,11,12], tips: { badge: '手感沉重無水聲', points: ['外皮略有細皺更甜', '手感沉甸果肉滿'] } },
  { id: 'loquat', name: '枇杷', months: [2,3,4,5], tips: { badge: '茸毛完整圓潤', points: ['細毛完好無碰傷', '深橙黃色肉厚'] } },
  { id: 'watermelon', name: '西瓜', months: [3,4,5,6,7,8,9,10,11], tips: { badge: '果臍窄小拍聲脆', points: ['紋路間距分明', '輕拍渾厚咚咚聲'] } },
  { id: 'plum_ume', name: '梅', months: [3,4,5], tips: { badge: '果形飽滿無病斑', points: ['青梅脆梅醃漬', '黃熟梅香足釀醋'] } },
  { id: 'coconut', name: '椰子', months: [3,4,5,6], tips: { badge: '重量沉重水聲滿', points: ['外皮無龜裂', '能聽見清脆水聲'] } },
  { id: 'mango', name: '芒果', months: [4,5,6,7,9], tips: { badge: '皮細油光果香濃', points: ['果蒂周圍飽滿', '香氣濃厚'] } },
  { id: 'peach', name: '桃', months: [4,5,6,7], tips: { badge: '絨毛均勻頂圓潤', points: ['蒂切口無黑斑', '輕壓微有彈性'] } },
  { id: 'plum', name: '李', months: [5,6,7], tips: { badge: '光滑有果粉硬實', points: ['身緊實無軟爛', '新鮮採收果粉厚'] } },
  { id: 'litchi', name: '荔枝', months: [5,6,7], tips: { badge: '殼鮮紅刺手結實', points: ['鱗棘尖突有彈性', '結實飽滿不虛軟'] } },
  { id: 'pear', name: '梨', months: [5,6,7,8,9,10,11], tips: { badge: '果臍深凹斑細小', points: ['端正圓整', '斑點細緻肉嫩'] } },
  { id: 'pineapple', name: '鳳梨', months: [6,7,8,9,10], tips: { badge: '果目開展散清香', points: ['矮胖圓筒形肉厚', '拍聲如拍肉水分足'] } },
  { id: 'pitaya', name: '火龍果', months: [6,7,8,9,10,11], tips: { badge: '圓短肥胖鱗翠綠', points: ['外皮鮮紅艷麗', '萼片微綠挺拔'] } },
  { id: 'lemon', name: '檸檬', months: [7,8,9], tips: { badge: '皮薄油亮多汁', points: ['有彈性不乾癟', '油胞細緻香氣足'] } },
  { id: 'avocado', name: '酪梨', months: [7,8,9,10], tips: { badge: '微軟帶有彈性', points: ['表皮黑紫即成熟', '輕壓微彈無塌陷'] } },
  { id: 'longan', name: '龍眼', months: [7,8], tips: { badge: '土黃飽滿無裂殼', points: ['果粒大且均勻', '外殼堅挺無發霉'] } },
  { id: 'pomelo', name: '文旦', months: [8,9], tips: { badge: '上尖下寬毛孔細', points: ['沉甸多汁感', '辭水微皺更甜'] } },
  { id: 'persimmon', name: '柿子', months: [8,9,10,11,12], tips: { badge: '橙紅均勻萼貼平', points: ['無黑斑裂痕', '甜柿質硬脆甜'] } },
  { id: 'apple', name: '蘋果', months: [8,9,10,11], tips: { badge: '果臍深凹帶條紋', points: ['手感沉重堅實', '底部黃綠微開'] } },
  { id: 'grapefruit', name: '葡萄柚', months: [9,10,11], tips: { badge: '皮薄滑沉重多汁', points: ['果形圓潤端正', '手感比外觀重'] } }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('shopping');
  const [marketCategory, setMarketCategory] = useState('vegetable');
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [showOutOfSeason, setShowOutOfSeason] = useState(false);
  const [cookMode, setCookMode] = useState('classic');

  const [vegetables, setVegetables] = useState(ALL_VEGETABLES);
  const [fruits, setFruits] = useState(ALL_FRUITS);
  const [selectedVegIds, setSelectedVegIds] = useState(['cabbage', 'onion', 'potato', 'green_bean']);
  const [selectedFruitIds, setSelectedFruitIds] = useState(['kiwi']);

  const [activeTipItem, setActiveTipItem] = useState(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState('');

  // 雲端食譜清單
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '', role: 'one_pot', primaryVeg: '洋蔥', cookware: 'cooker', ingredients: '', steps: '', note: '', url: ''
  });

  // 三菜一湯菜色
  const [plannerDishes, setPlannerDishes] = useState({
    meat: { 
      name: '香煎脆皮去骨雞腿排', source: '常用拿手菜 ⭐', role: 'meat', veg: '', cookware: 'pan',
      ingredients: '去骨雞腿排 1片、蒜頭 4瓣、胡椒鹽適量',
      steps: '1. 雞皮朝下乾煎逼油。\n2. 翻面加蒜瓣煎至兩面金黃香脆。', note: '天然雞油香脆多汁。'
    },
    veg_meat: { 
      name: '乾煸蒜香四季豆肉末', source: '經典家常菜 ⭐', role: 'veg_meat', veg: '四季豆 (敏豆)', cookware: 'pan',
      ingredients: '四季豆 1把、肉末 50g、蒜末 2瓣、胡椒鹽',
      steps: '1. 四季豆下鍋煎至表皮微皺。\n2. 爆香蒜碎與肉末，下四季豆大火翻炒加椒鹽起鍋。', note: '鹹香脆甜。'
    },
    veg_only: { 
      name: '蒜香清炒高麗菜', source: '矩陣模板', role: 'veg_only', veg: '高麗菜', cookware: 'pan',
      ingredients: '高麗菜 1大盤、蒜末 3瓣、鹽半匙',
      steps: '大火熱油爆香蒜，下高麗菜燜翻2分鐘加鹽起鍋。', note: '大火高溫清脆。'
    },
    soup: { 
      name: '冬瓜蛤蜊鮮排骨湯', source: '湯品模板', role: 'soup', veg: '冬瓜', cookware: 'pot',
      ingredients: '冬瓜 200g、蛤蜊 100g、排骨 200g、薑片',
      steps: '排骨冷水燉冬瓜25分鐘，起鍋前投蛤蜊煮開。', note: '清甜解熱退火。'
    }
  });

  // 一鍋到底菜色
  const [onePotDish, setOnePotDish] = useState({
    main: {
      name: '日式洋蔥秀珍菇雞肉炊飯', source: '電鍋一鍵到底 ⭐', role: 'one_pot', veg: '洋蔥、秀珍菇', cookware: 'cooker',
      ingredients: '白米 2杯、雞腿肉丁 150g、洋蔥半顆、秀珍菇1包、醬油味醂高湯',
      steps: '洗米加入調味高湯，鋪滿洋蔥秀珍菇雞肉丁，電鍋煮熟燜15分鐘翻勻！', note: '零油煙無負擔。'
    },
    side: {
      name: '蒜炒高麗菜', source: '5分鐘快速配菜', role: 'veg_only', veg: '高麗菜', cookware: 'pan',
      ingredients: '高麗菜、蒜頭、鹽少許', steps: '大火蒜香快翻2分鐘出鍋。', note: '搭配主鍋清口解膩。'
    }
  });

  const [viewingDishRecipe, setViewingDishRecipe] = useState(null);

  // 1. Firebase 實時同步自訂食譜
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "recipes"), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (list.length > 0) {
          setSavedRecipes(list);
        } else {
          // 若雲端尚未有資料，填入初始範例
          setSavedRecipes([
            { id: 'init_1', name: '日式洋蔥秀珍菇雞肉炊飯', role: 'one_pot', primaryVeg: '洋蔥', cookware: 'cooker', ingredients: '白米2杯、洋蔥半顆、秀珍菇1包、雞肉丁150g', steps: '洗米鋪料，電鍋外鍋1.2杯水煮熟燜15分。', note: '零油煙。', isFav: true },
            { id: 'init_2', name: '香煎脆皮去骨雞腿排', role: 'meat', primaryVeg: '', cookware: 'pan', ingredients: '去骨雞腿排1片、蒜瓣4瓣', steps: '雞皮朝下乾煎翻面金黃。', note: '天然雞油炒菜香。', isFav: true }
          ]);
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn("Firestore 連線中...", e);
    }
  }, []);

  const getCookwareBadge = (cid) => {
    const item = COOKWARE_OPTIONS.find(c => c.id === cid) || { icon: '🍳', name: '平底鍋' };
    return `${item.icon} ${item.name}`;
  };

  const displayedVegetables = useMemo(() => {
    if (showOutOfSeason) return vegetables;
    return vegetables.filter(v => v.peakMonths.includes(selectedMonth) || v.regularMonths.includes(selectedMonth));
  }, [vegetables, selectedMonth, showOutOfSeason]);

  const groupedVeg = useMemo(() => ({
    leafy: displayedVegetables.filter(v => v.category === 'leafy'),
    melon_bean: displayedVegetables.filter(v => v.category === 'melon_bean'),
    root_stem: displayedVegetables.filter(v => v.category === 'root_stem'),
    mushroom: displayedVegetables.filter(v => v.category === 'mushroom'),
    flavoring: displayedVegetables.filter(v => v.category === 'flavoring')
  }), [displayedVegetables]);

  const displayedFruits = useMemo(() => {
    if (showOutOfSeason) return fruits;
    return fruits.filter(f => f.months.includes(selectedMonth));
  }, [fruits, selectedMonth, showOutOfSeason]);

  const toggleVeg = (id) => {
    setSelectedVegIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleFruit = (id) => {
    setSelectedFruitIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openTip = (item, type = 'veg') => {
    setActiveTipItem({ ...item, itemType: type });
    setEditedNote(item.tips.note || '');
    setIsEditingNote(false);
  };

  const saveTipNote = () => {
    if (!activeTipItem) return;
    if (activeTipItem.itemType === 'veg') {
      setVegetables(prev => prev.map(v => v.id === activeTipItem.id ? { ...v, tips: { ...v.tips, note: editedNote } } : v));
    } else {
      setFruits(prev => prev.map(f => f.id === activeTipItem.id ? { ...f, tips: { ...f.tips, note: editedNote } } : f));
    }
    setActiveTipItem(prev => ({ ...prev, tips: { ...prev.tips, note: editedNote } }));
    setIsEditingNote(false);
  };

  const rollDish = (slot) => {
    const pool = vegetables.filter(v => selectedVegIds.includes(v.id));
    const matchedRecipes = savedRecipes.filter(r => 
      r.role === slot && (!r.primaryVeg || selectedVegIds.some(id => vegetables.find(v => v.id === id)?.name === r.primaryVeg))
    );

    if (matchedRecipes.length > 0 && Math.random() > 0.3) {
      const picked = matchedRecipes[Math.floor(Math.random() * matchedRecipes.length)];
      const dishObj = {
        name: picked.name, veg: picked.primaryVeg || '', source: '雲端收藏食譜 ⭐', role: slot, cookware: picked.cookware || 'pan',
        ingredients: picked.ingredients || '家常適量', steps: picked.steps || '家常翻炒即可。', note: picked.note || '', url: picked.url || ''
      };
      setPlannerDishes(p => ({ ...p, [slot]: dishObj }));
      if (viewingDishRecipe?.slot === slot) setViewingDishRecipe({ ...dishObj, slot });
      return;
    }

    if (slot === 'meat') {
      const meats = [
        { name: '香煎脆皮去骨雞腿排', ing: '雞腿排 1片、蒜瓣 3瓣', stp: '雞皮朝下乾煎翻面金黃。', nte: '外脆內多汁。', cw: 'pan' },
        { name: '清蒸檸檬鱸魚片', ing: '鱸魚片、薑絲、檸檬汁', stp: '電鍋蒸8分鐘淋醬汁。', nte: '清爽無油煙。', cw: 'cooker' },
        { name: '氣炸酥烤松阪豬', ing: '松阪豬肉 200g、蒜片', stp: '氣炸鍋 190度12分。', nte: '外脆彈牙。', cw: 'airfryer' }
      ];
      const m = meats[Math.floor(Math.random() * meats.length)];
      const dishObj = { name: m.name, veg: '', source: '家常肉品庫', role: 'meat', cookware: m.cw, ingredients: m.ing, steps: m.stp, note: m.nte };
      setPlannerDishes(p => ({ ...p, meat: dishObj }));
      if (viewingDishRecipe?.slot === slot) setViewingDishRecipe({ ...dishObj, slot });
    } else if (slot === 'veg_meat') {
      const v = pool.filter(x => x.roles.includes('veg_meat'));
      const veg = v.length ? v[Math.floor(Math.random() * v.length)].name : '洋蔥';
      const dishObj = {
        name: `${veg}炒肉絲`, veg, source: '矩陣模板', role: 'veg_meat', cookware: 'pan',
        ingredients: `${veg} 適量、豬肉絲 150g、蒜頭 2瓣`,
        steps: `1. 肉絲抓醃。\n2. 熱油下【${veg}】翻炒。\n3. 下肉絲快炒熟透起鍋。`, note: '大火快翻保持軟嫩。'
      };
      setPlannerDishes(p => ({ ...p, veg_meat: dishObj }));
      if (viewingDishRecipe?.slot === slot) setViewingDishRecipe({ ...dishObj, slot });
    } else if (slot === 'veg_only') {
      const v = pool.filter(x => x.roles.includes('veg_only'));
      const veg = v.length ? v[Math.floor(Math.random() * v.length)].name : '高麗菜';
      const dishObj = {
        name: `蒜香清炒${veg}`, veg, source: '矩陣模板', role: 'veg_only', cookware: 'pan',
        ingredients: `${veg} 1盤、蒜瓣 3瓣、鹽半小匙`,
        steps: `熱鍋爆香蒜末，下【${veg}】大火燜炒加鹽出鍋。`, note: '菜葉清脆爽口。'
      };
      setPlannerDishes(p => ({ ...p, veg_only: dishObj }));
      if (viewingDishRecipe?.slot === slot) setViewingDishRecipe({ ...dishObj, slot });
    } else if (slot === 'soup') {
      const v = pool.filter(x => x.roles.includes('soup'));
      const veg = v.length ? v[Math.floor(Math.random() * v.length)].name : '蘿蔔';
      const dishObj = {
        name: `${veg}排骨湯`, veg, source: '矩陣模板', role: 'soup', cookware: 'pot',
        ingredients: `${veg} 適量、排骨 250g、薑片 2片`,
        steps: `排骨汆燙後與【${veg}】加水慢燉30分鐘加鹽。`, note: '湯頭清甜回甘。'
      };
      setPlannerDishes(p => ({ ...p, soup: dishObj }));
      if (viewingDishRecipe?.slot === slot) setViewingDishRecipe({ ...dishObj, slot });
    }
  };

  const rollOnePot = (part) => {
    if (part === 'main') {
      const onePotOptions = [
        { name: '日式洋蔥秀珍菇雞肉炊飯', veg: '洋蔥、秀珍菇', type: '電鍋一鍵到底', cw: 'cooker', ing: '白米2杯、洋蔥半顆、秀珍菇1包、雞肉丁150g', stp: '洗米加醬油味醂高湯，鋪洋蔥秀珍菇雞肉，電鍋煮熟燜15分。', nte: '零油煙，飯粒吸飽鮮甜。' },
        { name: '氣炸南瓜黑椒時蔬烤雞', veg: '南瓜、四季豆', type: '氣炸鍋一鍵到底', cw: 'airfryer', ing: '南瓜塊150g、雞腿肉200g、四季豆、香料鹽', stp: '拌油椒鹽，氣炸180度12分翻面200度3分。', nte: '免顧火少油煙。' },
        { name: '台式高麗菜肉絲炒米粉', veg: '高麗菜', type: '炒鍋一鍋到底', cw: 'pan', ing: '高麗菜絲、肉絲、泡軟米粉2團、烏醋醬油', stp: '爆香肉絲與高麗菜，加水煮滾下米粉燜煮收汁淋烏醋。', nte: '經典台味一鍋到底。' },
        { name: '日式馬鈴薯燉牛肉煲', veg: '馬鈴薯、洋蔥', type: '湯鍋燉煮到底', cw: 'pot', ing: '馬鈴薯2顆切塊、洋蔥1顆、牛肉片200g、日式醬油', stp: '炒香洋蔥與肉片，加入馬鈴薯與高湯微火燉煮20分鐘。', nte: '拌飯無敵神物。' }
      ];
      const chosen = onePotOptions[Math.floor(Math.random() * onePotOptions.length)];
      const obj = {
        name: chosen.name, veg: chosen.veg, source: `${chosen.type} ⭐`, role: 'one_pot', cookware: chosen.cw,
        ingredients: chosen.ing, steps: chosen.stp, note: chosen.nte
      };
      setOnePotDish(p => ({ ...p, main: obj }));
      if (viewingDishRecipe?.slot === 'one_pot_main') setViewingDishRecipe({ ...obj, slot: 'one_pot_main' });
    } else {
      const pool = vegetables.filter(v => selectedVegIds.includes(v.id));
      const v = pool.filter(x => x.roles.includes('veg_only'));
      const veg = v.length ? v[Math.floor(Math.random() * v.length)].name : '地瓜葉';
      const obj = {
        name: `蒜炒${veg}`, veg, source: '5分鐘快速配菜', role: 'veg_only', cookware: 'pan',
        ingredients: `${veg} 1把、蒜頭 2瓣、鹽少許`,
        steps: `大火蒜香快翻2分鐘出鍋。`, note: '搭配主鍋清口解膩。'
      };
      setOnePotDish(p => ({ ...p, side: obj }));
      if (viewingDishRecipe?.slot === 'one_pot_side') setViewingDishRecipe({ ...obj, slot: 'one_pot_side' });
    }
  };

  const openDishRecipe = (slot, customDish = null) => {
    const dish = customDish || plannerDishes[slot];
    setViewingDishRecipe({ ...dish, slot });
  };

  // 2. 儲存新增食譜至 Firebase Firestore
  const handleSaveNewRecipe = async (e) => {
    e.preventDefault();
    if (!newRecipe.name.trim()) return;

    try {
      await addDoc(collection(db, "recipes"), {
        ...newRecipe,
        isFav: true,
        createdAt: new Date()
      });
      setShowAddRecipeModal(false);
      setNewRecipe({ name: '', role: 'one_pot', primaryVeg: '洋蔥', cookware: 'cooker', ingredients: '', steps: '', note: '', url: '' });
    } catch (err) {
      console.error("寫入 Firestore 失敗：", err);
      alert("儲存失敗，請檢查網路連線或 Firebase 設定！");
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col justify-between font-sans pb-20 shadow-md">
      {/* 頂部 Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ChefHat className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-lg text-slate-800">當令好食・排菜助手</span>
        </div>
        <a 
          href={EXTERNAL_PRICE_SOURCE.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 transition flex items-center space-x-1"
        >
          <span>物價行情</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </header>

      {/* 主畫面 */}
      <main className="flex-1 p-4 space-y-4">
        
        {/* ================= TAB 1: 當令採買 ================= */}
        {activeTab === 'shopping' && (
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" /> 採買月份：
              </span>
              <div className="flex space-x-1 overflow-x-auto py-1">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-2.5 py-0.5 text-xs rounded-full font-medium transition ${
                      selectedMonth === m ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {m}月
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-white p-1.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex bg-slate-100 p-0.5 rounded-lg font-bold">
                <button
                  onClick={() => setMarketCategory('vegetable')}
                  className={`px-3 py-1 rounded-md transition ${marketCategory === 'vegetable' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                >
                  🥬 蔬菜 ({displayedVegetables.length})
                </button>
                <button
                  onClick={() => setMarketCategory('fruit')}
                  className={`px-3 py-1 rounded-md transition ${marketCategory === 'fruit' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}
                >
                  🍎 水果 ({displayedFruits.length})
                </button>
              </div>

              <label className="flex items-center space-x-1 cursor-pointer pr-1 text-slate-600">
                <input 
                  type="checkbox" 
                  checked={showOutOfSeason} 
                  onChange={(e) => setShowOutOfSeason(e.target.checked)}
                  className="rounded text-emerald-600 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-medium">顯示非當令</span>
              </label>
            </div>

            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs text-emerald-800">
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>已選蔬菜 <strong>{selectedVegIds.length}</strong> 種 ｜ 水果 <strong>{selectedFruitIds.length}</strong> 種</span>
              </div>
              <button onClick={() => setActiveTab('planner')} className="bg-emerald-600 text-white px-2.5 py-1 rounded-md font-semibold text-xs shadow-sm hover:bg-emerald-700 flex items-center">
                去排菜 <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* 蔬菜清單 */}
            {marketCategory === 'vegetable' && (
              <div className="space-y-3">
                {[
                  { title: '🥬 葉菜花菜類', desc: `共 ${groupedVeg.leafy.length} 種，清炒必備`, items: groupedVeg.leafy },
                  { title: '🥒 瓜果豆莢類', desc: `共 ${groupedVeg.melon_bean.length} 種，冬瓜/四季豆/櫛瓜`, items: groupedVeg.melon_bean },
                  { title: '🥕 根莖澱粉類', desc: `共 ${groupedVeg.root_stem.length} 種，馬鈴薯/南瓜/芋頭/蘿蔔`, items: groupedVeg.root_stem },
                  { title: '🍄 菇蕈木耳類', desc: `共 ${groupedVeg.mushroom.length} 種，雪白菇/黑木耳提鮮`, items: groupedVeg.mushroom },
                  { title: '🧄 辛香料備忘', desc: `共 ${groupedVeg.flavoring.length} 種，薑/九層塔/蒜/蔥`, items: groupedVeg.flavoring }
                ].map(group => {
                  if (group.items.length === 0) return null;
                  return (
                    <div key={group.title} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-xs text-slate-700">{group.title}</h3>
                        <span className="text-[10px] text-slate-400">{group.desc}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {group.items.map(veg => {
                          const isChecked = selectedVegIds.includes(veg.id);
                          const isPeak = veg.peakMonths.includes(selectedMonth);
                          const isRegular = veg.regularMonths.includes(selectedMonth);
                          const isOffSeason = !isPeak && !isRegular;

                          return (
                            <div 
                              key={veg.id} 
                              onClick={() => toggleVeg(veg.id)}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                                isChecked 
                                  ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-900' 
                                  : isOffSeason 
                                    ? 'bg-slate-50/80 border-slate-200 text-slate-400' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <span className="truncate">{veg.name}</span>
                              <div className="flex items-center space-x-1 shrink-0">
                                {isPeak && <span className="bg-amber-100 text-amber-800 text-[10px] px-1 rounded font-semibold">旺</span>}
                                {isOffSeason && <span className="bg-slate-200 text-slate-500 text-[9px] px-1 rounded">非當令</span>}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openTip(veg, 'veg'); }} 
                                  className="text-slate-400 hover:text-emerald-600 p-1"
                                >
                                  <Lightbulb className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 水果清單 */}
            {marketCategory === 'fruit' && (
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-xs text-slate-700">🍉 當令/市場常見水果</h3>
                  <span className="text-[10px] text-slate-400">點擊💡查看挑選法</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {displayedFruits.map(fruit => {
                    const isChecked = selectedFruitIds.includes(fruit.id);
                    const isSeason = fruit.months.includes(selectedMonth);

                    return (
                      <div 
                        key={fruit.id} 
                        onClick={() => toggleFruit(fruit.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked 
                            ? 'bg-amber-50 border-amber-500 font-bold text-amber-900' 
                            : !isSeason
                              ? 'bg-slate-50/80 border-slate-200 text-slate-400'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{fruit.name}</span>
                        <div className="flex items-center space-x-1 shrink-0">
                          {isSeason ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1 rounded font-semibold">當季</span>
                          ) : (
                            <span className="bg-slate-200 text-slate-500 text-[9px] px-1 rounded">非當令</span>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); openTip(fruit, 'fruit'); }} 
                            className="text-slate-400 hover:text-amber-600 p-1"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 2: 每日排菜 ================= */}
        {activeTab === 'planner' && (
          <div className="space-y-4">
            
            {/* 烹調模式切換 */}
            <div className="bg-slate-200 p-1 rounded-xl flex text-xs font-bold shadow-inner">
              <button
                onClick={() => setCookMode('classic')}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
                  cookMode === 'classic' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>🍱 經典三菜一湯</span>
              </button>
              <button
                onClick={() => setCookMode('one_pot')}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
                  cookMode === 'one_pot' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>🍲 省時一鍋到底</span>
              </button>
            </div>

            {/* 手邊蔬菜標籤 */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">🛒 今日買回的素材：</span>
                <button onClick={() => setActiveTab('shopping')} className="text-xs text-emerald-600 hover:underline">
                  增減食材
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedVegIds.map(id => {
                  const v = vegetables.find(x => x.id === id);
                  return <span key={id} className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">{v?.name}</span>;
                })}
                {selectedFruitIds.map(id => {
                  const f = fruits.find(x => x.id === id);
                  return <span key={id} className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">🍎 {f?.name}</span>;
                })}
              </div>
            </div>

            {/* 模式 A：三菜一湯 */}
            {cookMode === 'classic' && (
              <div className="space-y-2.5">
                <div className="text-[11px] text-slate-500 px-1">點擊卡片可查看食材、廚具與步驟：</div>

                {/* 格 1: 主肉品 */}
                <div 
                  onClick={() => openDishRecipe('meat')}
                  className="bg-white p-3 rounded-xl border-l-4 border-l-rose-500 border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-50/70 transition shadow-sm"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-rose-600">槽位 1：主肉品</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {getCookwareBadge(plannerDishes.meat.cookware)}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">{plannerDishes.meat.name}</div>
                    <div className="text-[10px] text-slate-400">{plannerDishes.meat.source}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); rollDish('meat'); }} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center space-x-1">
                    <Dices className="w-3 h-3" /> <span>換</span>
                  </button>
                </div>

                {/* 格 2: 菜＋肉 */}
                <div 
                  onClick={() => openDishRecipe('veg_meat')}
                  className="bg-white p-3 rounded-xl border-l-4 border-l-amber-500 border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-50/70 transition shadow-sm"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-amber-600">槽位 2：菜 ＋ 肉 ({plannerDishes.veg_meat.veg})</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {getCookwareBadge(plannerDishes.veg_meat.cookware)}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">{plannerDishes.veg_meat.name}</div>
                    <div className="text-[10px] text-slate-400">{plannerDishes.veg_meat.source}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); rollDish('veg_meat'); }} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center space-x-1">
                    <Dices className="w-3 h-3" /> <span>換</span>
                  </button>
                </div>

                {/* 格 3: 純蔬菜 */}
                <div 
                  onClick={() => openDishRecipe('veg_only')}
                  className="bg-white p-3 rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-50/70 transition shadow-sm"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-emerald-600">槽位 3：純蔬菜 ({plannerDishes.veg_only.veg})</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {getCookwareBadge(plannerDishes.veg_only.cookware)}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">{plannerDishes.veg_only.name}</div>
                    <div className="text-[10px] text-slate-400">{plannerDishes.veg_only.source}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); rollDish('veg_only'); }} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center space-x-1">
                    <Dices className="w-3 h-3" /> <span>換</span>
                  </button>
                </div>

                {/* 格 4: 湯品 */}
                <div 
                  onClick={() => openDishRecipe('soup')}
                  className="bg-white p-3 rounded-xl border-l-4 border-l-sky-500 border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-50/70 transition shadow-sm"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-sky-600">槽位 4：湯品 ({plannerDishes.soup.veg})</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {getCookwareBadge(plannerDishes.soup.cookware)}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">{plannerDishes.soup.name}</div>
                    <div className="text-[10px] text-slate-400">{plannerDishes.soup.source}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); rollDish('soup'); }} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center space-x-1">
                    <Dices className="w-3 h-3" /> <span>換</span>
                  </button>
                </div>

                <button 
                  onClick={() => ['meat', 'veg_meat', 'veg_only', 'soup'].forEach(rollDish)}
                  className="w-full bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-slate-900 transition mt-2 flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> <span>整套三菜一湯重抽</span>
                </button>
              </div>
            )}

            {/* 模式 B：省時一鍋到底 */}
            {cookMode === 'one_pot' && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200/80 p-2.5 rounded-xl text-xs text-amber-900">
                  ⚡ <strong>今晚偷懶模式：</strong>只需一個鍋具，主食＋肉蛋＋蔬菜全包！
                </div>

                {/* 主鍋 */}
                <div 
                  onClick={() => openDishRecipe('one_pot_main', onePotDish.main)}
                  className="bg-white p-3.5 rounded-xl border-l-4 border-l-amber-600 border border-slate-200 space-y-1.5 cursor-pointer hover:bg-slate-50/70 transition shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        🥘 一鍋到底主角
                      </span>
                      <span className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                        {getCookwareBadge(onePotDish.main.cookware)}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); rollOnePot('main'); }} 
                      className="text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded font-medium text-slate-700 flex items-center space-x-1"
                    >
                      <Dices className="w-3 h-3" /> <span>換主鍋</span>
                    </button>
                  </div>
                  <div className="font-bold text-slate-800 text-base">{onePotDish.main.name}</div>
                  <div className="text-xs text-slate-500">
                    使用蔬菜：<span className="font-semibold text-slate-700">{onePotDish.main.veg}</span> ｜ {onePotDish.main.source}
                  </div>
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 p-1.5 rounded">
                    💡 點擊看免顧火步驟與比例 ↗
                  </div>
                </div>

                {/* 爽口小菜 */}
                <div 
                  onClick={() => openDishRecipe('one_pot_side', onePotDish.side)}
                  className="bg-white p-3 rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-50/70 transition shadow-sm"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">選配：快炒 / 清湯</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {getCookwareBadge(onePotDish.side.cookware)}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">{onePotDish.side.name}</div>
                    <div className="text-[10px] text-slate-400">{onePotDish.side.source}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); rollOnePot('side'); }} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center space-x-1">
                    <Dices className="w-3 h-3" /> <span>換</span>
                  </button>
                </div>

                <button 
                  onClick={() => { rollOnePot('main'); rollOnePot('side'); }}
                  className="w-full bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-slate-900 transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> <span>重新推薦一鍋到底組合</span>
                </button>
              </div>
            )}

            {/* 飯後水果 */}
            {selectedFruitIds.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl text-xs flex items-center justify-between shadow-sm">
                <span className="font-bold text-amber-900">🍉 今日飯後水果：</span>
                <span className="font-semibold text-amber-800">
                  {selectedFruitIds.map(id => fruits.find(f => f.id === id)?.name).join('、')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: 食譜收藏 ================= */}
        {activeTab === 'recipes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-slate-800">私房菜色與靈感庫</h2>
                <p className="text-[11px] text-slate-500">已連線雲端資料庫，新增即時同步</p>
              </div>
              <button 
                onClick={() => setShowAddRecipeModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增菜色</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {savedRecipes.map(recipe => {
                const isExpanded = expandedRecipeId === recipe.id;
                const roleBadge = 
                  recipe.role === 'one_pot' ? '🍲 一鍋到底' :
                  recipe.role === 'meat' ? '純肉類' : 
                  recipe.role === 'veg_meat' ? '菜＋肉' : 
                  recipe.role === 'veg_only' ? '純蔬菜' : '湯品';

                return (
                  <div 
                    key={recipe.id} 
                    className={`rounded-xl border shadow-sm overflow-hidden transition ${
                      recipe.role === 'one_pot' ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div 
                      onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                      className="p-3 cursor-pointer flex justify-between items-center hover:bg-slate-50/50"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-800">{recipe.name}</span>
                          {recipe.isFav && <span className="text-amber-500 text-xs">⭐</span>}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            recipe.role === 'one_pot' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {roleBadge}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            {getCookwareBadge(recipe.cookware)}
                          </span>
                          {recipe.primaryVeg && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                              蔬菜：{recipe.primaryVeg}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-slate-400 text-xs font-bold">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-white/80 text-xs space-y-2">
                        <div className="flex items-center space-x-2 text-slate-600 bg-slate-50 p-2 rounded-lg">
                          <span className="font-bold text-slate-700">🍳 使用器具：</span>
                          <span className="font-semibold text-blue-800">{getCookwareBadge(recipe.cookware)}</span>
                        </div>

                        {recipe.ingredients && (
                          <div>
                            <span className="font-bold text-slate-700">🛒 主要食材：</span>
                            <p className="text-slate-600 mt-0.5">{recipe.ingredients}</p>
                          </div>
                        )}

                        {recipe.steps && (
                          <div>
                            <span className="font-bold text-slate-700">🍳 做法步驟：</span>
                            <div className="text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
                              {recipe.steps}
                            </div>
                          </div>
                        )}

                        {recipe.note && (
                          <div className="bg-amber-50 border border-amber-200/60 p-2 rounded-lg text-amber-900">
                            💡 <strong>心得提醒：</strong>{recipe.note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ================= 食譜做法彈窗 Modal ================= */}
      {viewingDishRecipe && (
        <div className="fixed inset-0 bg-black/40 z-30 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-4 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
            
            <div className="flex justify-between items-start border-b pb-2">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold">
                    {viewingDishRecipe.source}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
                    {getCookwareBadge(viewingDishRecipe.cookware)}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-800 mt-1">
                  {viewingDishRecipe.name}
                </h3>
              </div>
              <button onClick={() => setViewingDishRecipe(null)} className="text-slate-400 font-bold p-1 text-base">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-700">🛒 準備食材與調味：</div>
              <p className="text-slate-600 leading-relaxed">{viewingDishRecipe.ingredients}</p>
            </div>

            <div className="text-xs space-y-1.5">
              <div className="font-bold text-slate-700">🍳 做法步驟：</div>
              <div className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line">
                {viewingDishRecipe.steps}
              </div>
            </div>

            {viewingDishRecipe.note && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900">
                💡 <strong>烹飪提醒：</strong>{viewingDishRecipe.note}
              </div>
            )}

            <div className="pt-2 flex space-x-2">
              <button 
                onClick={() => {
                  if (viewingDishRecipe.slot.startsWith('one_pot')) {
                    rollOnePot(viewingDishRecipe.slot === 'one_pot_main' ? 'main' : 'side');
                  } else {
                    rollDish(viewingDishRecipe.slot);
                  }
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition"
              >
                🎲 不合適，換一道
              </button>
              <button 
                onClick={() => setViewingDishRecipe(null)}
                className="flex-1 bg-slate-800 text-white font-bold py-2 rounded-xl text-xs hover:bg-slate-900 transition"
              >
                確定煮這道
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 新增食譜彈窗 Modal ================= */}
      {showAddRecipeModal && (
        <div className="fixed inset-0 bg-black/40 z-30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-slate-800">新增家常菜色</h4>
              <button onClick={() => setShowAddRecipeModal(false)} className="text-slate-400 font-bold p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRecipe} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">菜色名稱 *</label>
                <input 
                  type="text" 
                  required
                  placeholder="如：南瓜雞肉炊飯、氣炸鹹豬肉" 
                  value={newRecipe.name}
                  onChange={e => setNewRecipe({ ...newRecipe, name: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">槽位歸屬 *</label>
                  <select 
                    value={newRecipe.role}
                    onChange={e => setNewRecipe({ ...newRecipe, role: e.target.value })}
                    className="w-full border rounded-lg p-1.5 bg-white font-medium"
                  >
                    <option value="one_pot">🍲 一鍋到底料理</option>
                    <option value="meat">純肉類</option>
                    <option value="veg_meat">菜＋肉</option>
                    <option value="veg_only">純蔬菜</option>
                    <option value="soup">湯品</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">使用主要廚具 *</label>
                  <select 
                    value={newRecipe.cookware}
                    onChange={e => setNewRecipe({ ...newRecipe, cookware: e.target.value })}
                    className="w-full border rounded-lg p-1.5 bg-white font-medium text-blue-900"
                  >
                    {COOKWARE_OPTIONS.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">搭配蔬菜</label>
                <select 
                  value={newRecipe.primaryVeg}
                  onChange={e => setNewRecipe({ ...newRecipe, primaryVeg: e.target.value })}
                  className="w-full border rounded-lg p-1.5 bg-white"
                >
                  <option value="">無特定</option>
                  {vegetables.map(v => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">主要食材與份量</label>
                <input 
                  type="text" 
                  placeholder="如：白米2杯、南瓜半顆、雞腿肉150g" 
                  value={newRecipe.ingredients}
                  onChange={e => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">做法步驟</label>
                <textarea 
                  placeholder="1. 洗米放料 2. 電鍋外鍋一杯水按下..." 
                  rows={3}
                  value={newRecipe.steps}
                  onChange={e => setNewRecipe({ ...newRecipe, steps: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">私房心得 / 筆記</label>
                <input 
                  type="text" 
                  placeholder="如：南瓜自帶甜味少放味精" 
                  value={newRecipe.note}
                  onChange={e => setNewRecipe({ ...newRecipe, note: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddRecipeModal(false)}
                  className="flex-1 bg-slate-100 text-slate-600 font-semibold py-2 rounded-lg"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 text-white font-semibold py-2 rounded-lg hover:bg-emerald-700"
                >
                  儲存菜色
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 挑選訣竅彈窗 ================= */}
      {activeTipItem && (
        <div className="fixed inset-0 bg-black/40 z-30 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-4 shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-base text-slate-800">
                {activeTipItem.name} 挑選訣竅
                <span className="text-xs font-normal text-slate-500 ml-2">
                  ({activeTipItem.itemType === 'veg' ? '蔬菜' : '水果'})
                </span>
              </h4>
              <button onClick={() => setActiveTipItem(null)} className="text-slate-400 font-bold p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 font-medium">
              ⚖️ 速挑手感：<strong>{activeTipItem.tips.badge}</strong>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-700">選購要點：</div>
              {activeTipItem.tips.points.map((p, i) => <div key={i}>• {p}</div>)}
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 flex items-center">
                  <Edit3 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> 私房採買筆記：
                </span>
                {!isEditingNote ? (
                  <button onClick={() => setIsEditingNote(true)} className="text-emerald-600 underline">修改</button>
                ) : (
                  <button onClick={saveTipNote} className="text-white bg-emerald-600 px-2 py-0.5 rounded text-[11px] flex items-center">
                    <Check className="w-3 h-3 mr-0.5" /> 儲存
                  </button>
                )}
              </div>
              {!isEditingNote ? (
                <p className="italic text-slate-600">"{activeTipItem.tips.note || '尚無筆記，點擊「修改」記下心得！'}"</p>
              ) : (
                <textarea 
                  value={editedNote} 
                  onChange={(e) => setEditedNote(e.target.value)} 
                  className="w-full border rounded p-1 text-xs" 
                  rows={2} 
                />
              )}
            </div>

            <button onClick={() => setActiveTipItem(null)} className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold">
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 底部導覽列 */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 px-6 py-2.5 flex justify-between items-center z-20">
        <button 
          onClick={() => setActiveTab('shopping')} 
          className={`text-xs flex flex-col items-center ${activeTab === 'shopping' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">當令採買</span>
        </button>
        <button 
          onClick={() => setActiveTab('planner')} 
          className={`text-xs flex flex-col items-center ${activeTab === 'planner' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">每日排菜</span>
        </button>
        <button 
          onClick={() => setActiveTab('recipes')} 
          className={`text-xs flex flex-col items-center ${activeTab === 'recipes' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">食譜收藏</span>
        </button>
      </nav>
    </div>
  );
}