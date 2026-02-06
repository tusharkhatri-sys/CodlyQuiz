// CodlyQuiz Avatar System with Tiers and Prices

// Avatar Tiers
export const AVATAR_TIERS = {
    FREE: { name: 'Free', price: 0, color: '#27AE60', icon: '🆓' },
    COMMON: { name: 'Common', price: 50, color: '#95A5A6', icon: '⚪' },
    RARE: { name: 'Rare', price: 150, color: '#3498DB', icon: '🔵' },
    EPIC: { name: 'Epic', price: 300, color: '#9B59B6', icon: '🟣' },
    LEGENDARY: { name: 'Legendary', price: 500, color: '#F1C40F', icon: '🟡' }
}

// All Avatars with Tiers
export const AVATARS = [
    // FREE TIER (Default unlocked)
    { id: 'fox', emoji: '🦊', name: 'Fox', bg: '#FF6B35', tier: 'FREE' },
    { id: 'frog', emoji: '🐸', name: 'Frog', bg: '#26890C', tier: 'FREE' },
    { id: 'lion', emoji: '🦁', name: 'Lion', bg: '#D89E00', tier: 'FREE' },
    { id: 'panda', emoji: '🐼', name: 'Panda', bg: '#333333', tier: 'FREE' },
    { id: 'turtle', emoji: '🐢', name: 'Turtle', bg: '#1ABC9C', tier: 'FREE' },
    { id: 'bee', emoji: '🐝', name: 'Bee', bg: '#F1C40F', tier: 'FREE' },

    // COMMON TIER (50 coins)
    { id: 'robot', emoji: '🤖', name: 'Robot', bg: '#5D6D7E', tier: 'COMMON' },
    { id: 'ghost', emoji: '👻', name: 'Ghost', bg: '#95A5A6', tier: 'COMMON' },
    { id: 'dino', emoji: '🦖', name: 'Dino', bg: '#27AE60', tier: 'COMMON' },
    { id: 'koala', emoji: '🐨', name: 'Koala', bg: '#7F8C8D', tier: 'COMMON' },
    { id: 'shark', emoji: '🦈', name: 'Shark', bg: '#2980B9', tier: 'COMMON' },
    { id: 'flamingo', emoji: '🦩', name: 'Flamingo', bg: '#FF69B4', tier: 'COMMON' },
    { id: 'owl', emoji: '🦉', name: 'Owl', bg: '#8B4513', tier: 'COMMON' },
    { id: 'crab', emoji: '🦀', name: 'Crab', bg: '#E74C3C', tier: 'COMMON' },

    // RARE TIER (150 coins)
    { id: 'unicorn', emoji: '🦄', name: 'Unicorn', bg: '#E056FD', tier: 'RARE' },
    { id: 'dragon', emoji: '🐲', name: 'Dragon', bg: '#26890C', tier: 'RARE' },
    { id: 'wolf', emoji: '🐺', name: 'Wolf', bg: '#5D6D7E', tier: 'RARE' },
    { id: 'eagle', emoji: '🦅', name: 'Eagle', bg: '#8B4513', tier: 'RARE' },
    { id: 'phoenix', emoji: '🔥', name: 'Phoenix', bg: '#E74C3C', tier: 'RARE' },
    { id: 'tiger', emoji: '🐯', name: 'Tiger', bg: '#FF8C00', tier: 'RARE' },
    { id: 'octopus', emoji: '🐙', name: 'Octopus', bg: '#9B59B6', tier: 'RARE' },

    // EPIC TIER (300 coins)
    { id: 'dark_knight', emoji: '⚔️', name: 'Dark Knight', bg: '#2C3E50', tier: 'EPIC' },
    { id: 'wizard', emoji: '🧙', name: 'Wizard', bg: '#8E44AD', tier: 'EPIC' },
    { id: 'king', emoji: '👑', name: 'King', bg: '#F39C12', tier: 'EPIC' },
    { id: 'ice_queen', emoji: '❄️', name: 'Ice Queen', bg: '#3498DB', tier: 'EPIC' },
    { id: 'ninja', emoji: '🥷', name: 'Shadow Ninja', bg: '#1A1A2E', tier: 'EPIC' },
    { id: 'fire_spirit', emoji: '🔮', name: 'Fire Spirit', bg: '#E74C3C', tier: 'EPIC' },

    // LEGENDARY TIER (500 coins)
    { id: 'golden_dragon', emoji: '🐉', name: 'Golden Dragon', bg: 'linear-gradient(135deg, #FFD700, #FFA500)', tier: 'LEGENDARY' },
    { id: 'diamond_fox', emoji: '💎', name: 'Diamond Fox', bg: 'linear-gradient(135deg, #00D2FF, #3A7BD5)', tier: 'LEGENDARY' },
    { id: 'rainbow_unicorn', emoji: '🌈', name: 'Rainbow Unicorn', bg: 'linear-gradient(135deg, #FF6B6B, #4ECDC4, #45B7D1)', tier: 'LEGENDARY' },
    { id: 'alien_king', emoji: '👾', name: 'Alien King', bg: 'linear-gradient(135deg, #00F260, #0575E6)', tier: 'LEGENDARY' },
    { id: 'mystic_mask', emoji: '🎭', name: 'Mystic Mask', bg: 'linear-gradient(135deg, #8E2DE2, #4A00E0)', tier: 'LEGENDARY' },
]

// Helper functions
export const getAvatarById = (id) => {
    return AVATARS.find(a => a.id === id) || AVATARS[0]
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
