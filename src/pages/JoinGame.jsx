import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Gamepad2, Shuffle, Sparkles, User } from 'lucide-react'
import { AVATARS, generateNickname, getRandomAvatar, getFreeAvatars } from '../utils/avatars'
import './JoinGame.css'

export default function JoinGame() {
    const { user, loading: authLoading } = useAuth()
    const [pin, setPin] = useState('')
    const [nickname, setNickname] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState(getRandomAvatar())
    const [availableAvatarIds, setAvailableAvatarIds] = useState(getFreeAvatars())
    const [step, setStep] = useState(1) // 1: enter PIN, 2: choose avatar & name
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [session, setSession] = useState(null)
    const navigate = useNavigate()

    const handlePinSubmit = async (e) => {
        e.preventDefault()

        // Wait for auth to initialize before checking pin
        if (authLoading) return

        if (pin.length !== 6) {
            setError('Game PIN must be 6 digits')
            return
        }

        setLoading(true)
        setError('')

        try {
            const { data, error } = await supabase
                .from('game_sessions')
                .select('*, quizzes(title)')
                .eq('game_pin', pin)
                .eq('status', 'waiting')
                .single()

            if (error || !data) {
                throw new Error('Game not found or already started')
            }

            setSession(data)

            // Fetch username and avatar from user_profiles table if logged in
            let defaultNickname = generateNickname()
            let userAvatar = getRandomAvatar()

            if (user) {
                console.log('User is logged in:', user.id)
                // Fetch owned avatars
                const { data: owned } = await supabase
                    .from('user_avatars')
                    .select('avatar_id')
                    .eq('user_id', user.id)

                if (owned) {
                    const ownedIds = owned.map(o => o.avatar_id)
                    // Combine free and owned
                    const allUnlocked = [...new Set([...getFreeAvatars(), ...ownedIds])]
                    setAvailableAvatarIds(allUnlocked)
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('username, selected_avatar')
                    .eq('id', user.id)
                    .single()

                console.log('Profile fetch result:', { profile, profileError })

                if (profile) {
                    if (profile.username) {
                        defaultNickname = profile.username
                        console.log('Using profile username:', defaultNickname)
                    }

                    // Use selected avatar from profile
                    if (profile.selected_avatar) {
                        const foundAvatar = AVATARS.find(a => a.id === profile.selected_avatar)
                        if (foundAvatar) {
                            userAvatar = foundAvatar
                            console.log('Using profile avatar:', userAvatar.id)
                        }
                    }
                }
            } else {
                console.log('User is NOT logged in, using defaults')
            }

            setNickname(defaultNickname)
            setSelectedAvatar(userAvatar)
            setStep(2)
        } catch (err) {
            console.error('Error joining session:', err)
            if (err.code === 'PGRST116') {
                setError('Game not found. Check the PIN and try again.')
            } else {
                setError(err.message || 'Failed to join session')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleJoinGame = async (e) => {
        e.preventDefault()
        if (nickname.trim().length < 2) {
            setError('Nickname must be at least 2 characters')
            return
        }

        setLoading(true)
        setError('')

        try {
            const { data: player, error } = await supabase
                .from('game_players')
                .insert({
                    session_id: session.id,
                    nickname: nickname.trim(),
                    avatar_id: selectedAvatar.id,
                    user_id: user?.id || null // Link to auth user if logged in
                })
                .select()
                .single()

            if (error) throw error

            // Store avatar in localStorage for the game
            localStorage.setItem('playerAvatar', JSON.stringify(selectedAvatar))

            navigate(`/play/${session.id}?player=${player.id}`)
        } catch (err) {
            console.error('Join game error:', err)
            setError(err.message || 'Failed to join game. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handlePinChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
        setPin(value)
        setError('')
    }

    const randomizeNickname = () => {
        setNickname(generateNickname())
    }

    const randomizeAvatar = () => {
        const available = AVATARS.filter(a => availableAvatarIds.includes(a.id))
        if (available.length > 0) {
            const random = available[Math.floor(Math.random() * available.length)]
            setSelectedAvatar(random)
        }
    }

    return (
        <div className="join-container">
            {/* Animated Background */}
            <div className="bg-animated">
                <div className="bg-blob bg-blob-1" />
                <div className="bg-blob bg-blob-2" />
                <div className="bg-blob bg-blob-3" />
            </div>

            <div className="join-content">
                <Link to="/" className="back-link">
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </Link>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            className="join-card glass-card"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="join-header">
                                <div className="join-icon">
                                    <Gamepad2 size={40} />
                                </div>
                                <h1 className="text-gradient">Join Game</h1>
                            </div>

                            {error && <div className="message message-error">{error}</div>}

                            <form onSubmit={handlePinSubmit}>
                                <div className="pin-input-wrapper">
                                    <input
                                        type="text"
                                        className="pin-input"
                                        placeholder="000000"
                                        value={pin}
                                        onChange={handlePinChange}
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <span className="pin-label">Game PIN</span>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-large"
                                    disabled={loading || authLoading}
                                    style={{ width: '100%' }}
                                >
                                    {loading || authLoading ? 'Joining...' : 'Enter Game'}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            className="join-card glass-card avatar-card"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                        >
                            <div className="quiz-preview">
                                <Sparkles size={20} />
                                <span>{session?.quizzes?.title}</span>
                            </div>

                            {error && <div className="message message-error">{error}</div>}

                            <form onSubmit={handleJoinGame}>
                                {/* Selected Avatar Display */}
                                <motion.div
                                    className="selected-avatar"
                                    style={{ background: selectedAvatar.bg }}
                                    key={selectedAvatar.id}
                                    initial={{ scale: 0.8, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', bounce: 0.5 }}
                                >
                                    <span className="avatar-emoji">{selectedAvatar.emoji}</span>
                                </motion.div>

                                {/* Avatar Grid */}
                                <div className="avatar-section">
                                    <div className="section-header">
                                        <span>Choose Avatar</span>
                                        <button type="button" className="random-btn" onClick={randomizeAvatar}>
                                            <Shuffle size={16} />
                                            Random
                                        </button>
                                    </div>

                                    <div className="avatar-grid">
                                        {AVATARS.filter(a => availableAvatarIds.includes(a.id)).map((avatar) => (
                                            <motion.button
                                                key={avatar.id}
                                                type="button"
                                                className={`avatar-option ${selectedAvatar.id === avatar.id ? 'selected' : ''}`}
                                                style={{ background: avatar.bg }}
                                                onClick={() => setSelectedAvatar(avatar)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {avatar.emoji}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Nickname - Read Only */}
                                <div className="nickname-section">
                                    <div className="section-header">
                                        <span><User size={16} /> Your Nickname</span>
                                    </div>
                                    <div className="nickname-display">
                                        {nickname}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block btn-large join-btn"
                                    disabled={loading || nickname.trim().length < 2}
                                >
                                    {loading ? (
                                        <div className="spinner" />
                                    ) : (
                                        <>
                                            <span>Join Game!</span>
                                            <Gamepad2 size={20} />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-secondary btn-block"
                                    onClick={() => { setStep(1); setSession(null); }}
                                >
                                    Enter different PIN
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
