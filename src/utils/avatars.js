// CodlyQuiz Avatar System - Kahoot Style Characters
// Uses SVG-wrapped Emojis for consistent, cute avatars

// Avatar Tiers
export const AVATAR_TIERS = {
    FREE: { name: 'Free', price: 0, color: '#46178F', icon: '🆓' }, // Kahoot Purple
    COMMON: { name: 'Common', price: 50, color: '#27AE60', icon: '⚪' },
    RARE: { name: 'Rare', price: 100, color: '#2980B9', icon: '🔵' },
    EPIC: { name: 'Epic', price: 150, color: '#8E44AD', icon: '🟣' },
    LEGENDARY: { name: 'Legendary', price: 250, color: '#F1C40F', icon: '🟡' }
}

// Background colors for avatars (Pastel/Vibrant palette)
const BG_COLORS = [
    '#FFD1DC', '#FFABAB', '#FFC3A0', '#FF677D', '#D4A5A5', // Reds/Pinks
    '#392F5A', '#31A2AC', '#61C0BF', '#6B4226', '#D9BF77', // Earth/Teals
    '#ACD8AA', '#FFE66D', '#2F9599', '#F7DB4F', '#F9CF00', // Yellows/Greens
    '#4ECDC4', '#C7F464', '#FF6B6B', '#45B7D1', '#E0F2F1'  // Vibrant Mix
];

// Helper to generate SVG Data URI
const generateAvatarSvg = (emoji, bgColor) => {
    // Basic SVG with colored rounded rectangle and centered emoji
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${bgColor}" rx="15"/>
        <text x="50" y="70" font-size="65" text-anchor="middle" style="font-family: 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif;">${emoji}</text>
    </svg>
    `.trim();
    // Fix for Unicode/Emoji in btoa
    // buffers emoji -> utf-8 -> binary string -> base64
    const encoded = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${encoded}`;
}

// Old DiceBear generator (kept for backward compatibility if needed, but unused)
const getDiceBearUrl = (seed, style) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`
}

// All Avatars - Kahoot Style Animals & Characters
export const AVATARS = [
    // ROW 1
    { id: 'bear', name: 'Bear', tier: 'FREE', emoji: '🐻', color: '#8D6E63' },
    { id: 'moose', name: 'Moose', tier: 'FREE', emoji: '🦌', color: '#A1887F' },
    { id: 'dog', name: 'Dog', tier: 'FREE', emoji: '🐶', color: '#FFCCBC' },
    { id: 'cat', name: 'Cat', tier: 'FREE', emoji: '🐱', color: '#FFE0B2' },
    { id: 'mouse', name: 'Mouse', tier: 'FREE', emoji: '🐭', color: '#F5F5F5' },
    { id: 'rabbit', name: 'Rabbit', tier: 'FREE', emoji: '🐰', color: '#E1BEE7' },

    // ROW 2
    { id: 'fox', name: 'Fox', tier: 'COMMON', emoji: '🦊', color: '#FFAB91' },
    { id: 'wolf', name: 'Wolf', tier: 'COMMON', emoji: '🐺', color: '#B0BEC5' },
    { id: 'raccoon', name: 'Raccoon', tier: 'COMMON', emoji: '🦝', color: '#90A4AE' },
    { id: 'panda', name: 'Panda', tier: 'COMMON', emoji: '🐼', color: '#FFFFFF' },
    { id: 'frog', name: 'Frog', tier: 'COMMON', emoji: '🐸', color: '#C5E1A5' },
    { id: 'owl', name: 'Owl', tier: 'COMMON', emoji: '🦉', color: '#D7CCC8' },

    // ROW 3
    { id: 'chick', name: 'Chick', tier: 'COMMON', emoji: '🐥', color: '#FFF59D' },
    { id: 'parrot', name: 'Parrot', tier: 'COMMON', emoji: '🦜', color: '#C8E6C9' },
    { id: 'penguin', name: 'Penguin', tier: 'COMMON', emoji: '🐧', color: '#81D4FA' },
    { id: 'polarbear', name: 'Polar Bear', tier: 'RARE', emoji: '🐻‍❄️', color: '#E0F7FA' },
    { id: 'snowman', name: 'Snowman', tier: 'RARE', emoji: '⛄', color: '#B2EBF2' },
    { id: 'sheep', name: 'Sheep', tier: 'RARE', emoji: '🐑', color: '#F8BBD0' },

    // ROW 4
    { id: 'tiger', name: 'Tiger', tier: 'RARE', emoji: '🐯', color: '#FFCC80' },
    { id: 'koala', name: 'Koala', tier: 'RARE', emoji: '🐨', color: '#CFD8DC' },
    { id: 'kangaroo', name: 'Kangaroo', tier: 'RARE', emoji: '🦘', color: '#D7CCC8' },
    { id: 'horse', name: 'Horse', tier: 'EPIC', emoji: '🐴', color: '#BCAAA4' },
    { id: 'unicorn', name: 'Unicorn', tier: 'EPIC', emoji: '🦄', color: '#F3E5F5' },
    { id: 'dragon', name: 'Dragon', tier: 'EPIC', emoji: '🐲', color: '#A5D6A7' },

    // ROW 5
    { id: 'monster_green', name: 'Alien', tier: 'EPIC', emoji: '👾', color: '#B39DDB' },
    { id: 'monster_red', name: 'Ogre', tier: 'EPIC', emoji: '👹', color: '#EF9A9A' },
    { id: 'brain', name: 'Brain', tier: 'LEGENDARY', emoji: '🧠', color: '#F48FB1' },
    { id: 'zombie', name: 'Zombie', tier: 'LEGENDARY', emoji: '🧟', color: '#80CBC4' },
    { id: 'skull', name: 'Skull', tier: 'LEGENDARY', emoji: '💀', color: '#EEEEEE' },
    { id: 'earth', name: 'Earth', tier: 'LEGENDARY', emoji: '🌍', color: '#4DB6AC' }
]

// Helper functions
export const getAvatarById = (id) => {
    return AVATARS.find(a => a.id === id) || AVATARS[0]
}

export const getAvatarImage = (avatar) => {
    // Handle string ID input
    if (typeof avatar === 'string') {
        const found = getAvatarById(avatar)
        if (found) avatar = found
        else return getDiceBearUrl(avatar, 'adventurer-neutral') // Fallback
    }

    // Return Emoji SVG if available
    if (avatar && avatar.emoji) {
        return generateAvatarSvg(avatar.emoji, avatar.color || '#f0f0f0')
    }

    // Legacy fallback (shouldn't be reached if using provided list)
    return getDiceBearUrl(avatar?.id || 'default', 'adventurer-neutral')
}

export const getAvatarPrice = (avatar) => {
    return AVATAR_TIERS[avatar.tier].price
}

export const getAvatarsByTier = (tier) => {
    return AVATARS.filter(a => a.tier === tier)
}

export const getFreeAvatars = () => {
    return AVATARS.filter(a => a.tier === 'FREE').map(a => a.id)
}

// Random nickname generators
export const ADJECTIVES = [
    'Super', 'Mega', 'Ultra', 'Turbo', 'Hyper', 'Epic', 'Crazy', 'Wild',
    'Sneaky', 'Speedy', 'Mighty', 'Happy', 'Lucky', 'Brave', 'Cool', 'Funky'
]

export const NOUNS = [
    'Ninja', 'Wizard', 'Dragon', 'Phoenix', 'Tiger', 'Shark', 'Eagle', 'Wolf',
    'Panda', 'Lion', 'Fox', 'Bear', 'Hawk', 'Falcon', 'Cobra', 'Panther'
]

export const generateNickname = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    const num = Math.floor(Math.random() * 99) + 1
    return `${adj}${noun}${num}`
}

export const getRandomAvatar = () => {
    const freeAvatars = AVATARS.filter(a => a.tier === 'FREE')
    return freeAvatars[Math.floor(Math.random() * freeAvatars.length)]
}

// Coin rewards based on rank
export const COIN_REWARDS = {
    1: 40,  // 1st place
    2: 25,  // 2nd place
    3: 15,  // 3rd place
    default: 5  // Participation
}

export const getCoinsForRank = (rank) => {
    return COIN_REWARDS[rank] || COIN_REWARDS.default
}

