
import React, { useState, useEffect } from 'react';
import { GarmentModification, ModificationCategory } from '../../types';
import { Button } from '../Button';
import { ShirtIcon, DressIcon, SkirtIcon, MagicWandIcon, ArrowRightIcon } from '../Icons';

interface DesignStepProps {
  originalImage: string;
  onGenerate: (modification: GarmentModification) => void;
  onBack: () => void;
}

// Custom Icons for categories to avoid emojis
const CamiIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21V11.5L9 5h6l2 6.5V21H7zM9 5L7 21M15 5l2 16" />
    </svg>
);

const JumpsuitIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v16h6v-6h4v6h6V6a2 2 0 00-2-2h-2" />
    </svg>
);

const LongTeeIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.38 3.4a1.64 1.64 0 0 0-1.54 1.13l-4.24 14.86H9.4L5.16 4.53A1.64 1.64 0 0 0 3.62 3.4H2v18h20V3.4h-1.62z" opacity="0.5"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l2 13h12l2-13" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l-2 8h4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 8l2 8h-4" />
    </svg>
);

const CategoryIcons: Record<string, React.ReactNode> = {
    'dress': <DressIcon className="w-6 h-6" />,
    'jumpsuit': <JumpsuitIcon className="w-6 h-6" />,
    'skirt': <SkirtIcon className="w-6 h-6" />,
    'cami': <CamiIcon className="w-5 h-5" />,
    'short_tee': <ShirtIcon className="w-6 h-6" />,
    'long_tee': <LongTeeIcon className="w-6 h-6" />,
};

// --- DATA CONFIGURATION ---
const CATEGORIES = [
    { id: 'dress', label: '连衣裙', icon: CategoryIcons.dress },
    { id: 'jumpsuit', label: '连体裤', icon: CategoryIcons.jumpsuit },
    { id: 'skirt', label: '半身裙', icon: CategoryIcons.skirt },
    { id: 'cami', label: '吊带背心', icon: CategoryIcons.cami },
    { id: 'short_tee', label: '短袖T恤', icon: CategoryIcons.short_tee },
    { id: 'long_tee', label: '长袖T恤', icon: CategoryIcons.long_tee },
];

// Configuration per category to control visible sections and options
const CONFIG_BY_CATEGORY: Record<string, {
    showLength: boolean;
    showSleeve: boolean;
    details: { id: string; label: string }[];
}> = {
    'dress': {
        showLength: true,
        showSleeve: true,
        details: [
            { id: 'cinched waist', label: '收腰' },
            { id: 'puff sleeve', label: '泡泡袖' },
            { id: 'backless', label: '露背' },
            { id: 'slit', label: '裙摆开叉' },
            { id: 'a-line', label: 'A字版型' },
            { id: 'mermaid', label: '鱼尾裙摆' },
            { id: 'v-neck', label: 'V领' },
            { id: 'square-neck', label: '方领' },
            { id: 'ruffle', label: '荷叶边' },
        ]
    },
    'jumpsuit': {
        showLength: false,
        showSleeve: true,
        details: [
            { id: 'wide leg', label: '阔腿' },
            { id: 'straight leg', label: '直筒' },
            { id: 'waist belt', label: '配腰带' },
            { id: 'cargo style', label: '工装风' },
            { id: 'v-neck', label: 'V领' },
            { id: 'sleeveless', label: '无袖设计' },
        ]
    },
    'skirt': {
        showLength: true,
        showSleeve: false,
        details: [
            { id: 'high waist', label: '高腰' },
            { id: 'pleated', label: '百褶' },
            { id: 'pencil', label: '包臀' },
            { id: 'slit', label: '开叉' },
            { id: 'asymmetrical', label: '不规则' },
            { id: 'cargo', label: '工装口袋' },
        ]
    },
    'cami': {
        showLength: false, // Usually standard or crop, handled in details
        showSleeve: false,
        details: [
            { id: 'crop', label: '短款露脐' },
            { id: 'regular fit', label: '常规长度' },
            { id: 'lace trim', label: '蕾丝边' },
            { id: 'satin', label: '丝绸感' },
            { id: 'cowl neck', label: '荡领' },
            { id: 'cross back', label: '交叉露背' },
        ]
    },
    'short_tee': {
        showLength: false,
        showSleeve: false,
        details: [
            { id: 'oversized', label: 'Oversize' },
            { id: 'crop', label: '短款露脐' },
            { id: 'fitted', label: '修身显瘦' },
            { id: 'shoulder pad', label: '垫肩' },
            { id: 'round neck', label: '圆领' },
            { id: 'v-neck', label: 'V领' },
        ]
    },
    'long_tee': {
        showLength: false,
        showSleeve: false,
        details: [
            { id: 'oversized', label: 'Oversize' },
            { id: 'fitted', label: '修身打底' },
            { id: 'raglan', label: '插肩袖' },
            { id: 'off shoulder', label: '露肩' },
            { id: 'mock neck', label: '半高领' },
        ]
    }
};

const COLOR_OPTIONS = [
    { id: 'original', label: '原色 (Original)', en: 'Original' },
    { id: 'black', label: '黑色 (Black)', en: 'Black' },
    { id: 'white', label: '白色 (White)', en: 'White' },
    { id: 'red', label: '红色 (Red)', en: 'Red' },
    { id: 'blue', label: '蓝色 (Blue)', en: 'Blue' },
    { id: 'green', label: '绿色 (Green)', en: 'Green' },
    { id: 'yellow', label: '黄色 (Yellow)', en: 'Yellow' },
    { id: 'pink', label: '粉色 (Pink)', en: 'Pink' },
];

const FABRIC_OPTIONS = [
    { id: 'original', label: '原面料 (Original)', en: 'Original' },
    { id: 'cotton', label: '纯棉 (Cotton)', en: 'Cotton' },
    { id: 'silk', label: '真丝 (Silk)', en: 'Silk' },
    { id: 'linen', label: '亚麻 (Linen)', en: 'Linen' },
    { id: 'denim', label: '牛仔 (Denim)', en: 'Denim' },
    { id: 'leather', label: '皮革 (Leather)', en: 'Leather' },
    { id: 'velvet', label: '丝绒 (Velvet)', en: 'Velvet' },
    { id: 'satin', label: '缎面 (Satin)', en: 'Satin' },
];

const LENGTH_OPTIONS = [
    { id: 'mini', label: '超短 (Mini)' },
    { id: 'knee', label: '及膝 (Knee)' },
    { id: 'midi', label: '中长 (Midi)' },
    { id: 'floor', label: '及地 (Maxi)' },
];

const SLEEVE_OPTIONS = [
    { id: 'sleeveless', label: '无袖' },
    { id: 'short', label: '短袖' },
    { id: 'long', label: '长袖' },
    { id: 'puff', label: '泡泡袖' },
];

// Mapping for Prompt Generation
const CATEGORY_PROMPTS: Record<string, string> = {
    'dress': 'Dress',
    'jumpsuit': 'Jumpsuit',
    'skirt': 'Skirt',
    'cami': 'Camisole Top',
    'short_tee': 'Short Sleeve T-Shirt',
    'long_tee': 'Long Sleeve T-Shirt'
};

export const DesignStep: React.FC<DesignStepProps> = ({ originalImage, onGenerate, onBack }) => {
  // --- STATE ---
  const [category, setCategory] = useState<ModificationCategory>('dress');
  const [color, setColor] = useState<string>('original');
  const [fabric, setFabric] = useState<string>('original');
  const [length, setLength] = useState<string>('knee'); 
  const [sleeve, setSleeve] = useState<string>('sleeveless'); 
  const [details, setDetails] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // --- EFFECT: ONBOARDING ONCE ---
  useEffect(() => {
    const hasSeen = localStorage.getItem('styleweave_design_onboarding');
    if (!hasSeen) {
        setShowOnboarding(true);
    }
  }, []);

  const handleDismissOnboarding = () => {
      localStorage.setItem('styleweave_design_onboarding', 'true');
      setShowOnboarding(false);
  };

  // Reset details when category changes to avoid invalid combinations
  useEffect(() => {
    setDetails([]);
  }, [category]);

  // --- LOGIC ---
  const toggleDetail = (id: string) => {
      setDetails(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const handleGenerate = () => {
      const lengthMap: Record<string, string> = { 'mini': 'Mini length (above knee)', 'knee': 'Knee length', 'midi': 'Midi calf length', 'floor': 'Floor length maxi' };
      const sleeveMap: Record<string, string> = { 'sleeveless': 'Sleeveless', 'short': 'Short sleeves', 'long': 'Long sleeves', 'puff': 'Puff sleeves' };
      
      const config = CONFIG_BY_CATEGORY[category];
      const categoryName = CATEGORY_PROMPTS[category] || category;

      const descParts = [categoryName];
      if (color !== 'original') descParts.push(`Color: ${COLOR_OPTIONS.find(c => c.id === color)?.en}`);
      if (fabric !== 'original') {
          descParts.push(`Fabric: ${FABRIC_OPTIONS.find(f => f.id === fabric)?.en}`);
      } else {
          descParts.push(`Fabric: STRICTLY KEEP ORIGINAL FABRIC MATERIAL AND TEXTURE`);
      }
      if (config.showLength) descParts.push(lengthMap[length]);
      if (config.showSleeve) descParts.push(sleeveMap[sleeve]);
      descParts.push(...details);
      
      const modification: GarmentModification = {
          category,
          description: descParts.join(', '),
          promptModifier: `Change clothing to ${categoryName}. Key Attributes: ${descParts.join(', ')}.`
      };
      
      onGenerate(modification);
  };

  // Current Config
  const currentConfig = CONFIG_BY_CATEGORY[category];

  return (
    <div className="relative w-full h-[calc(100vh-140px)]">
      
      {/* Onboarding Modal - Only shown once */}
      {showOnboarding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
              <div className="bg-white/90 border border-white/50 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                  <div className="flex flex-col items-center text-center space-y-4 pt-2">
                      <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-2xl animate-pulse-slow">✨</div>
                      <h3 className="text-xl font-bold text-gray-900">开启 AI 设计师模式</h3>
                      <div className="text-sm text-gray-600 leading-relaxed space-y-3 text-left bg-gray-50/80 p-5 rounded-xl border border-gray-100">
                          <p className="flex items-start gap-2">
                              <span className="text-blue-600 font-bold">1.</span>
                              <span><b>DNA 锁定：</b>AI 已提取原图的面料材质、印花和关键装饰。</span>
                          </p>
                          <p className="flex items-start gap-2">
                              <span className="text-blue-600 font-bold">2.</span>
                              <span><b>重构逻辑：</b>AI 将保留原图背景和模特，仅像裁缝一样修改衣服版型。</span>
                          </p>
                          <p className="flex items-start gap-2">
                              <span className="text-blue-600 font-bold">3.</span>
                              <span className="text-gray-500">注意：此模式适合微调改款（如改裙长、加袖子）。</span>
                          </p>
                      </div>
                      <button 
                          onClick={handleDismissOnboarding}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all text-sm mt-2"
                      >
                          我知道了，开始设计
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 h-full">
         
         {/* LEFT: Preview */}
         <div className="md:w-5/12 relative rounded-[2rem] overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm flex flex-col">
             <div className="flex-1 flex items-center justify-center bg-gray-50/30 p-8 relative">
                 <img src={originalImage} className="max-w-full max-h-full object-contain drop-shadow-xl z-10" />
                 
                 {/* Removed the "Fabric DNA Locked" badge as requested */}
             </div>
             
             {/* Header Back Button */}
             <div className="absolute top-4 left-4">
                 <button onClick={onBack} className="bg-white/80 backdrop-blur p-2 rounded-full text-gray-600 hover:text-gray-900 border border-white/50 shadow-sm">
                     <ArrowRightIcon className="w-4 h-4 rotate-180" />
                 </button>
             </div>
         </div>

         {/* RIGHT: Controls */}
         <div className="flex-1 flex flex-col h-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm overflow-hidden">
             
             <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2 bg-white/50">
                 <MagicWandIcon className="w-5 h-5 text-blue-600" />
                 <h2 className="text-sm font-bold text-gray-800">款式重构工作台</h2>
             </div>

             <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
                 
                 {/* 1. Category - Expanded list, no emojis */}
                 <div className="space-y-3">
                     <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">基础品类 (Base Category)</label>
                     <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                         {CATEGORIES.map(cat => (
                             <button
                                 key={cat.id}
                                 onClick={() => setCategory(cat.id as ModificationCategory)}
                                 className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-200 aspect-square
                                     ${category === cat.id 
                                         ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-105' 
                                         : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
                                     }
                                 `}
                             >
                                 <div className={`transition-transform duration-300 ${category === cat.id ? 'scale-110' : ''}`}>
                                     {cat.icon}
                                 </div>
                                 <span className="text-xs font-bold">{cat.label}</span>
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* 2. Parameters (Dynamic based on Category) */}
                 <div className="grid grid-cols-1 gap-6">
                     
                     {/* Color Selector */}
                     <div className="space-y-3 animate-fade-in">
                         <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">颜色 (Color)</label>
                         <div className="flex flex-wrap gap-2">
                             {COLOR_OPTIONS.map(opt => (
                                 <button
                                     key={opt.id}
                                     onClick={() => setColor(opt.id)}
                                     className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                         ${color === opt.id 
                                             ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' 
                                             : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                                         }
                                     `}
                                 >
                                     {opt.label.split(' ')[0]}
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* Fabric Selector */}
                     <div className="space-y-3 animate-fade-in">
                         <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">面料 (Fabric)</label>
                         <div className="flex flex-wrap gap-2">
                             {FABRIC_OPTIONS.map(opt => (
                                 <button
                                     key={opt.id}
                                     onClick={() => setFabric(opt.id)}
                                     className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                         ${fabric === opt.id 
                                             ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' 
                                             : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                                         }
                                     `}
                                 >
                                     {opt.label.split(' ')[0]}
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* Length Selector (Conditional) */}
                     {currentConfig.showLength && (
                         <div className="space-y-3 animate-fade-in">
                             <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">长度 (Length)</label>
                             <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-100">
                                 {LENGTH_OPTIONS.map(opt => (
                                     <button
                                         key={opt.id}
                                         onClick={() => setLength(opt.id)}
                                         className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all truncate
                                             ${length === opt.id 
                                                 ? 'bg-white text-blue-600 shadow-sm' 
                                                 : 'text-gray-500 hover:text-gray-700'
                                             }
                                         `}
                                     >
                                         {opt.label.split(' ')[0]}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     )}

                     {/* Sleeve Selector (Conditional) */}
                     {currentConfig.showSleeve && (
                         <div className="space-y-3 animate-fade-in">
                             <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">袖型 (Sleeve)</label>
                             <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-100">
                                 {SLEEVE_OPTIONS.map(opt => (
                                     <button
                                         key={opt.id}
                                         onClick={() => setSleeve(opt.id)}
                                         className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
                                             ${sleeve === opt.id 
                                                 ? 'bg-white text-blue-600 shadow-sm' 
                                                 : 'text-gray-500 hover:text-gray-700'
                                             }
                                         `}
                                     >
                                         {opt.label}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     )}
                 </div>

                 {/* 3. Details (Dynamic List per Category) */}
                 <div className="space-y-3 animate-fade-in">
                     <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">
                         {CATEGORIES.find(c => c.id === category)?.label}专属细节 (Details)
                     </label>
                     <div className="flex flex-wrap gap-2">
                         {currentConfig.details.map(opt => {
                             const isActive = details.includes(opt.id);
                             return (
                                 <button
                                     key={opt.id}
                                     onClick={() => toggleDetail(opt.id)}
                                     className={`px-4 py-2 rounded-full border text-xs font-bold transition-all
                                         ${isActive
                                             ? 'bg-blue-50 text-blue-600 border-blue-200'
                                             : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                                         }
                                     `}
                                 >
                                     {isActive ? '✓ ' : '+ '} {opt.label}
                                 </button>
                             );
                         })}
                     </div>
                 </div>

             </div>

             {/* Footer Action */}
             <div className="p-6 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
                 <Button 
                     onClick={handleGenerate}
                     className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-cyan-500/25 text-sm tracking-widest font-bold"
                 >
                     ✨ 生成设计方案
                 </Button>
             </div>
         </div>
      </div>
    </div>
  );
};
