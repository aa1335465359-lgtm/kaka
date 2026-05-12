
export const STEPS = [
    { id: 1, title: "核心骨相", sub: "Identity" },
    { id: 2, title: "面部细节", sub: "Details" },
    { id: 3, title: "数字分身", sub: "Anchor Gen" },
    { id: 4, title: "风格逻辑", sub: "Style Logic" },
    { id: 5, title: "协议生成", sub: "Protocol" } 
];

export const ETHNICITY_OPTIONS = [
    { id: 'east_asian', label: '东亚 (East Asian)', sub: '东方温婉 / 细腻骨相' },
    { id: 'korean', label: '韩系 (Korean)', sub: '清透水光 / 鹅蛋脸' },
    { id: 'caucasian', label: '欧美 (Caucasian)', sub: '立体深邃 / 高对比度' },
    { id: 'latina', label: '拉美 (Latina)', sub: '健康肤色 / 热情风格' },
    { id: 'mixed', label: '混血 (Mixed)', sub: '独特融合 / 高级感' },
];

export const SIMPLE_AGE_OPTIONS = [
    { id: 'young', label: '青年 (18-28)' },
    { id: 'middle', label: '中年 (30-50)' },
    { id: 'senior', label: '大龄 (55+)' },
];

export const SIMPLE_FACE_FEATURES = [
    { id: 'sweet', label: '幼态甜美 (Sweet)' },
    { id: 'cool', label: '清冷厌世 (Cool)' },
    { id: 'sharp', label: '高智折叠 (Sharp)' },
    { id: 'fox', label: '妩媚系 (Foxy)' },
];

export const SIMPLE_HAIR_STYLES = [
    { id: 'long_straight', label: '黑长直 (Straight)' },
    { id: 'wavy', label: '法式微卷 (Wavy)' },
    { id: 'bob', label: '干练短发 (Bob)' },
    { id: 'bun', label: '贴头皮造型 (Bun)' },
];

export const SIMPLE_BODY_TYPES = [
    { id: 'petite', label: '娇小 (Petite)' },
    { id: 'standard', label: '标准 (Standard)' },
    { id: 'curvy', label: '曲线 (Curvy)' },
    { id: 'plus_size', label: '大码 (Plus Size)' },
    { id: 'heavy', label: '特大码 (4XL-5XL)' },
    { id: 'muscular', label: '健硕 (Muscular)' },
];

export const ADVANCED_CONFIG = {
    face: {
        title: "面部构造 (Face Sculpting)",
        subtitle: "决定模特的“底子”，这是识别度的来源。",
        sections: [
            {
                key: 'faceShape', label: '脸型 (Face Shape)',
                options: ['圆脸 (Round)', '方脸 (Square)', '鹅蛋脸 (Oval)', '心形脸 (Heart)', '菱形脸 (Diamond)']
            },
            {
                key: 'eyeType', label: '五官-眼型 (Eye Shape)',
                options: ['杏眼 (Almond)', '丹凤眼 (Phoenix)', '深邃眼窝 (Deep-set)', '下垂眼 (Downturned)']
            },
            {
                key: 'eyeColor', label: '五官-瞳色 (Eye Color)',
                options: ['常见色 (Brown/Black)', '蓝色 (Blue)', '绿色 (Green)', '灰色 (Grey)']
            },
            {
                key: 'noseShape', label: '五官-鼻型 (Nose Shape)',
                options: ['小翘鼻 (Button)', '高鼻梁 (High Bridge)', '鹰钩鼻 (Hooked)', '宽鼻翼 (Wide)']
            },
            {
                key: 'lipShape', label: '五官-唇形 (Lip Shape)',
                options: ['厚唇 (Plump)', '薄唇 (Thin)', 'M唇 (Cupid Bow)']
            },
            {
                key: 'skinTone', label: '皮肤-色调 (Skin Tone)',
                options: ['冷白 (Fair Cold)', '自然 (Natural)', '黄调 (Warm Yellow)', '小麦色 (Tan)', '深棕 (Dark Brown)', '黑巧色 (Deep Chocolate)']
            },
            {
                key: 'skinTexture', label: '皮肤-质感 (Texture)',
                options: ['无暇磨皮 (Airbrushed)', '真实肌理 (Realistic)', '雀斑/瑕疵 (Freckles)']
            }
        ]
    },
    makeup: {
        title: "妆容风格 (Makeup & Styling)",
        subtitle: "决定模特的“后天修饰”，直接影响产品的价格感。",
        sections: [
            {
                key: 'makeupIntensity', label: '妆面浓度 (Intensity)',
                options: ['伪素颜 (No-Makeup Look)', '日常通勤 (Soft Glam)', '浓颜/派对 (Full Glam/Bold)']
            },
            {
                key: 'lipTexture', label: '口红质地 (Lip Texture)',
                options: ['哑光 (Matte)', '水光 (Glossy)']
            },
            {
                key: 'eyebrows', label: '眉形 (Eyebrows)',
                options: ['野生眉 (Feathery)', '挑眉 (Arched)', '平眉 (Straight)']
            }
        ]
    },
    hair: {
        title: "毛发系统 (Hair System)",
        subtitle: "发型是改变气质成本最低的方式，也是种族特征的重要体现。",
        sections: [
            {
                key: 'hairTexture', label: '发质/卷度 (Texture)',
                options: ['直发 (Straight)', '微卷 (Wavy)', '羊毛卷 (Curly)', '爆炸头 (Coily/Afro)']
            },
            {
                key: 'hairLength', label: '发型长度 (Length)',
                options: ['超短 (Pixie)', '及肩 (Bob)', '长发 (Long)']
            },
            {
                key: 'hairStyle', label: '发型形态 (Style)',
                options: ['披发 (Down)', '高马尾 (High Ponytail)', '丸子头 (Bun)', '脏辫 (Braids)']
            },
            {
                key: 'hairBangs', label: '刘海 (Bangs)',
                options: ['无刘海 (None)', '法式刘海 (French)', '空气刘海 (Air)']
            },
            {
                key: 'hairColor', label: '发色 (Color)',
                options: ['自然黑 (Natural Black)', '深棕 (Dark Brown)', '金发 (Blonde)', '潮色漂染 (Dyed)']
            }
        ]
    },
    body: {
        title: "身体体征 (Body Anatomy)",
        subtitle: "大码类目核心：必须精确控制肉长在哪里。",
        sections: [
            {
                key: 'ageGroup', label: '年龄段 (Age Group)',
                options: ['18-24 (Gen Z)', '25-34 (Young Adult)', '35-44 (Mature)', '45-54 (Mid-life)', '55-64 (Senior)', '65-80 (Elderly)']
            },
            {
                key: 'bodyShape', label: '体型分类 (Body Shape)',
                options: ['沙漏型 (Hourglass)', '梨形 (Pear)', '苹果型 (Apple)', '矩形/H型 (Rectangle)']
            },
            {
                key: 'bodyDefinition', label: '肌肉与体脂 (Definition)',
                options: ['肉感 (Soft/Curvy)', '紧致 (Toned/Fit)']
            },
            {
                key: 'chestVolume', label: '胸部量感 (Chest)',
                options: ['平胸 (Flat)', '适中 (Average)', '丰满 (Full)']
            },
            {
                key: 'hipVolume', label: '臀部量感 (Hip)',
                options: ['扁平 (Flat)', '适中 (Average)', '挺翘 (Peach Butt)']
            }
        ]
    }
};

export const CAMERAS = [
    { id: 'iphone', label: 'iPhone 原相机', desc: '真实质感 / 数码锐利' },
    { id: 'film', label: '胶片相机 (Film)', desc: '复古颗粒 / 温暖怀旧' },
    { id: 'dslr', label: '商业单反 (DSLR)', desc: '高清画质 / 影棚标准' },
];

export const SCENE_TAGS = [
    { id: 'white_studio', label: '纯白影棚' },
    { id: 'grey_studio', label: '高级灰幕' },
    { id: 'warm_studio', label: '暖色背景' },
    { id: 'sun_window', label: '阳光窗边' },
    { id: 'french_room', label: '法式居家' },
    { id: 'minimal_wall', label: '极简墙面' },
    { id: 'office_glass', label: '办公落地窗' },
    { id: 'cafe_outdoor', label: '咖啡店外摆' },
    { id: 'cafe_indoor', label: '咖啡店室内' },
    { id: 'city_street', label: '城市街景' },
    { id: 'park_bench', label: '公园长椅' },
    { id: 'green_lawn', label: '草坪绿植' },
    { id: 'art_gallery', label: '美术馆' },
    { id: 'stairs', label: '楼梯间' },
    { id: 'rooftop', label: '天台视野' },
    { id: 'bookstore', label: '书店一角' },
    { id: 'flower_shop', label: '花店门口' },
    { id: 'shopping_mall', label: '商场中庭' },
    { id: 'hotel_lobby', label: '酒店大堂' },
    { id: 'brick_wall', label: '复古砖墙' },
];

export const LIGHTING_OPTIONS = [
    { id: 'soft_diffused', label: '柔光 (Soft)', desc: '均匀通透，适合大多数女装' },
    { id: 'hard_sun', label: '强光 (Hard)', desc: '质感强，阴影清晰' },
    { id: 'natural_window', label: '自然光 (Natural)', desc: '真实生活感' },
    { id: 'studio_flash', label: '影棚闪光 (Flash)', desc: '高清晰度，锐利' },
    { id: 'warm_sunset', label: '夕阳暖光 (Sunset)', desc: '氛围感，逆光' },
    { id: 'cool_clean', label: '冷调清透 (Cool)', desc: '清冷高级感' },
];

export const EXPRESSION_OPTIONS = [
    { id: 'calm', label: '冷静克制' },
    { id: 'smile', label: '微笑亲和' },
    { id: 'lifestyle', label: '生活感' },
    { id: 'runway', label: '走秀感' },
    { id: 'lookbook', label: 'Lookbook' },
    { id: 'interaction', label: '环境互动' },
    { id: 'sexy', label: '性感张力' },
    { id: 'gentle', label: '温柔安静' },
    { id: 'aloof', label: '高级疏离' },
    { id: 'relaxed', label: '松弛感' },
    { id: 'queen', label: '女王感' },
    { id: 'elite', label: '精英感' },
];
