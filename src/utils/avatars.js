// Funny avatar options like Kahoot
export const AVATARS = [
    { id: 1, emoji: '🦊', name: 'Fox', bg: '#FF6B35' },
    { id: 2, emoji: '🐸', name: 'Frog', bg: '#26890C' },
    { id: 3, emoji: '🦁', name: 'Lion', bg: '#D89E00' },
    { id: 4, emoji: '🐼', name: 'Panda', bg: '#333333' },
    { id: 5, emoji: '🦄', name: 'Unicorn', bg: '#E056FD' },
    { id: 6, emoji: '🐙', name: 'Octopus', bg: '#E21B3C' },
    { id: 7, emoji: '🦋', name: 'Butterfly', bg: '#1368CE' },
    { id: 8, emoji: '🐲', name: 'Dragon', bg: '#26890C' },
    { id: 9, emoji: '👻', name: 'Ghost', bg: '#95A5A6' },
    { id: 10, emoji: '🤖', name: 'Robot', bg: '#5D6D7E' },
    { id: 11, emoji: '🦖', name: 'Dino', bg: '#27AE60' },
    { id: 12, emoji: '🐨', name: 'Koala', bg: '#7F8C8D' },
    { id: 13, emoji: '🦈', name: 'Shark', bg: '#2980B9' },
    { id: 14, emoji: '🦩', name: 'Flamingo', bg: '#FF69B4' },
    { id: 15, emoji: '🦉', name: 'Owl', bg: '#8B4513' },
    { id: 16, emoji: '🐯', name: 'Tiger', bg: '#FF8C00' },
    { id: 17, emoji: '🦊', name: 'Red Fox', bg: '#E74C3C' },
    { id: 18, emoji: '🐺', name: 'Wolf', bg: '#5D6D7E' },
    { id: 19, emoji: '🦝', name: 'Raccoon', bg: '#7B7D7D' },
    { id: 20, emoji: '🐢', name: 'Turtle', bg: '#1ABC9C' },
    { id: 21, emoji: '🦎', name: 'Lizard', bg: '#2ECC71' },
    { id: 22, emoji: '🐉', name: 'Big Dragon', bg: '#9B59B6' },
    { id: 23, emoji: '🐝', name: 'Bee', bg: '#F1C40F' },
    { id: 24, emoji: '🦀', name: 'Crab', bg: '#E74C3C' },
]

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
    return AVATARS[Math.floor(Math.random() * AVATARS.length)]
}
