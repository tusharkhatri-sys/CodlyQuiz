import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AVATARS, AVATAR_TIERS, getAvatarPrice, getAvatarsByTier } from '../utils/avatars'
import { ArrowLeft, Coins, Check, Lock, Sparkles } from 'lucide-react'
import './AvatarShop.css'

export default function AvatarShop() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [coins, setCoins] = useState(0)
    const [ownedAvatars, setOwnedAvatars] = useState([])
    const [selectedAvatar, setSelectedAvatar] = useState('fox')
    const [selectedTier, setSelectedTier] = useState('ALL')
    const [purchasing, setPurchasing] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        if (user) {
            loadUserData()
        }
    }, [user])

    const loadUserData = async () => {
        // Get user profile (coins, selected avatar)
        const { data: profile } = await supabase
            .from('profiles')
            .select('coins, selected_avatar, username')
            .eq('id', user.id)
            .single()

        if (profile) {
            setCoins(profile.coins)
            setSelectedAvatar(profile.selected_avatar)
        }

        // Get owned avatars
        const { data: avatars } = await supabase
            .from('user_avatars')
            .select('avatar_id')
            .eq('user_id', user.id)

        if (avatars) {
            setOwnedAvatars(avatars.map(a => a.avatar_id))
        }
    }

    const purchaseAvatar = async (avatar) => {
        const price = getAvatarPrice(avatar)

        if (coins < price) {
            setMessage({ type: 'error', text: 'Not enough coins! 💰' })
            setTimeout(() => setMessage(null), 3000)
            return
        }

        setPurchasing(true)

        // Call purchase function
        const { data, error } = await supabase
            .rpc('purchase_avatar', {
                avatar_id_param: avatar.id,
                price: price
            })

        if (error) {
            setMessage({ type: 'error', text: 'Purchase failed!' })
        } else if (data === true) {
            setCoins(prev => prev - price)
            setOwnedAvatars(prev => [...prev, avatar.id])
            setMessage({ type: 'success', text: `${avatar.name} unlocked! 🎉` })
        } else {
            setMessage({ type: 'error', text: 'Not enough coins!' })
        }

        setPurchasing(false)
        setTimeout(() => setMessage(null), 3000)
    }

    const equipAvatar = async (avatarId) => {
        await supabase
            .from('profiles')
            .update({ selected_avatar: avatarId })
            .eq('id', user.id)

        setSelectedAvatar(avatarId)
        setMessage({ type: 'success', text: 'Avatar equipped! ✨' })
        setTimeout(() => setMessage(null), 2000)
    }

    const getFilteredAvatars = () => {
        if (selectedTier === 'ALL') return AVATARS
        return getAvatarsByTier(selectedTier)
    }

    const isOwned = (avatarId) => ownedAvatars.includes(avatarId)
    const isEquipped = (avatarId) => selectedAvatar === avatarId

    return (
        <div className="shop-container">
            {/* Header */}
            <header className="shop-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Avatar Shop</h1>
                <div className="coin-balance">
                    <Coins size={24} />
                    <span>{coins}</span>
                </div>
            </header>

            {/* Tier Filter */}
            <div className="tier-filter">
                <button
                    className={`tier-btn ${selectedTier === 'ALL' ? 'active' : ''}`}
                    onClick={() => setSelectedTier('ALL')}
                >
                    All
                </button>
                {Object.entries(AVATAR_TIERS).map(([key, tier]) => (
                    <button
                        key={key}
                        className={`tier-btn ${selectedTier === key ? 'active' : ''}`}
                        style={{ '--tier-color': tier.color }}
                        onClick={() => setSelectedTier(key)}
                    >
                        {tier.icon} {tier.name}
                    </button>
                ))}
            </div>

            {/* Message Toast */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        className={`toast ${message.type}`}
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                    >
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Avatar Grid */}
            <div className="avatar-grid">
                {getFilteredAvatars().map((avatar, index) => {
                    const tier = AVATAR_TIERS[avatar.tier]
                    const owned = avatar.tier === 'FREE' || isOwned(avatar.id)
                    const equipped = isEquipped(avatar.id)
                    const price = getAvatarPrice(avatar)

                    return (
                        <motion.div
                            key={avatar.id}
                            className={`avatar-card ${avatar.tier.toLowerCase()} ${owned ? 'owned' : 'locked'} ${equipped ? 'equipped' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            {/* Tier Badge */}
                            <div className="tier-badge" style={{ background: tier.color }}>
                                {tier.icon}
                            </div>

                            {/* Avatar Emoji */}
                            <div
                                className="avatar-emoji"
                                style={{ background: avatar.bg }}
                            >
                                {avatar.emoji}
                                {!owned && <div className="lock-overlay"><Lock size={30} /></div>}
                                {equipped && <div className="equipped-badge"><Check size={20} /></div>}
                            </div>

                            {/* Avatar Name */}
                            <div className="avatar-name">{avatar.name}</div>

                            {/* Action Button */}
                            {owned ? (
                                equipped ? (
                                    <button className="action-btn equipped-btn" disabled>
                                        <Check size={16} /> Equipped
                                    </button>
                                ) : (
                                    <button
                                        className="action-btn equip-btn"
                                        onClick={() => equipAvatar(avatar.id)}
                                    >
                                        <Sparkles size={16} /> Equip
                                    </button>
                                )
                            ) : (
                                <button
                                    className="action-btn buy-btn"
                                    onClick={() => purchaseAvatar(avatar)}
                                    disabled={purchasing || coins < price}
                                >
                                    <Coins size={16} /> {price}
                                </button>
                            )}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
