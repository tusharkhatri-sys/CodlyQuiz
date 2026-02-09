import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Users, Play, Copy, Check, ChevronRight, Trophy, Zap, Volume2, VolumeX } from 'lucide-react'
import { AVATARS } from '../utils/avatars'
import { audioManager } from '../utils/audio'
import { getCoinsForRank } from '../utils/avatars'
import './HostGame.css'

const ANSWER_COLORS = ['#E21B3C', '#1368CE', '#D89E00', '#26890C']
const ANSWER_SHAPES = ['▲', '◆', '●', '■']

export default function HostGame() {
    const { sessionId } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isClosing, setIsClosing] = useState(false)

    const [session, setSession] = useState(null)
    const [quiz, setQuiz] = useState(null)
    const [questions, setQuestions] = useState([])
    const [players, setPlayers] = useState([])
    const [gameState, setGameState] = useState('waiting') // waiting, countdown, question, stats, leaderboard, finished
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [timeLeft, setTimeLeft] = useState(0)
    const [answers, setAnswers] = useState([])
    const [copied, setCopied] = useState(false)
    const [leaderboard, setLeaderboard] = useState([])
    const [answerStats, setAnswerStats] = useState([])
    const [countdown, setCountdown] = useState(3)
    const [coinsAwarded, setCoinsAwarded] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [retryCount, setRetryCount] = useState(0)

    const [isMuted, setIsMuted] = useState(audioManager.isMuted)

    useEffect(() => {
        fetchSessionData()
        audioManager.playBgm('lobby')

        return () => audioManager.stopBgm()
    }, [sessionId, retryCount])

    const toggleMute = () => {
        const muted = audioManager.toggleMute()
        setIsMuted(muted)
    }

    useEffect(() => {
        // Unique channel name to avoid collisions
        const channelId = `game_session:${sessionId}`

        console.log('Setting up real-time subscription for session:', sessionId)

        const gameChannel = supabase
            .channel(channelId)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'game_players', filter: `session_id=eq.${sessionId}` },
                (payload) => {
                    console.log('New player joined:', payload.new)
                    setPlayers(prev => [...prev, payload.new])
                    audioManager.playSfx('join')
                }
            )
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'player_answers' },
                (payload) => {
                    console.log('New answer received:', payload.new)
                    setAnswers(prev => [...prev, payload.new])
                }
            )
            .subscribe((status) => {
                console.log(`Subscription status for ${channelId}:`, status)
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Real-time connection established')
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Real-time connection failed')
                    setError('Real-time connection failed. Retrying...')
                }
            })

        return () => {
            console.log('Cleaning up subscription for:', sessionId)
            supabase.removeChannel(gameChannel)
        }
    }, [sessionId])

    // Timer countdown
    useEffect(() => {
        if (gameState === 'question' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
            return () => clearTimeout(timer)
        } else if (gameState === 'question' && timeLeft === 0) {
            showAnswerStats()
        }
    }, [timeLeft, gameState])

    // Game countdown
    useEffect(() => {
        if (gameState === 'countdown' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else if (gameState === 'countdown' && countdown === 0) {
            showQuestion()
        }
    }, [countdown, gameState])

    const fetchSessionData = async () => {
        setLoading(true)
        setError(null)
        try {
            // Helper for timeout
            const fetchPromise = supabase
                .from('game_sessions')
                .select('*, quizzes(*)')
                .eq('id', sessionId)
                .single()

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Session fetch timed out')), 8000)
            )

            const { data: sessionData, error } = await Promise.race([fetchPromise, timeoutPromise])

            if (error) throw error
            if (!sessionData) throw new Error('Session not found')

            setSession(sessionData)
            setQuiz(sessionData.quizzes)

            // Parallel fetch for questions and players
            const questionsPromise = supabase
                .from('questions')
                .select('*, answer_options(*)')
                .eq('quiz_id', sessionData.quiz_id)
                .order('order_index')

            const playersPromise = supabase
                .from('game_players')
                .select('*')
                .eq('session_id', sessionId)

            const [questionsResult, playersResult] = await Promise.all([questionsPromise, playersPromise])

            setQuestions(questionsResult.data || [])
            setPlayers(playersResult.data || [])

            setLoading(false)
        } catch (err) {
            console.error('Error fetching session:', err)
            setError(err.message || 'Failed to load game session.')
            setLoading(false)
        }
    }

    const copyPin = () => {
        navigator.clipboard.writeText(session?.game_pin)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const getPlayerAvatar = (player) => {
        const avatar = AVATARS.find(a => a.id === player.avatar_id) || AVATARS[0]
        return avatar
    }

    const startGame = async () => {
        try {
            if (questions.length === 0) {
                alert('No questions in this quiz!')
                return
            }

            // Set immediately for UI
            setCurrentIndex(0)
            setCurrentQuestion(questions[0])
            setGameState('countdown')
            setCountdown(3)
            audioManager.playSfx('start')
            audioManager.playBgm('game')

            // Update DB to 'countdown' so players see preview
            const { error } = await supabase
                .from('game_sessions')
                .update({
                    status: 'countdown',
                    current_question_index: 0
                })
                .eq('id', sessionId)

            if (error) throw error

        } catch (error) {
            console.error('Error starting game:', error)
            alert('Failed to start game. Check console for details.')
        }
    }

    const showQuestion = async () => {
        try {
            setCurrentQuestion(questions[currentIndex])
            setTimeLeft(questions[currentIndex].time_limit)
            setGameState('question')
            setAnswers([])

            const { error } = await supabase
                .from('game_sessions')
                .update({
                    status: 'playing', // Switch to playing when countdown ends
                    current_question_index: currentIndex,
                    question_started_at: new Date().toISOString()
                })
                .eq('id', sessionId)

            if (error) throw error
        } catch (error) {
            console.error('Error showing question:', error)
        }
    }

    const showAnswerStats = () => {
        const q = questions[currentIndex]
        const questionAnswers = answers.filter(a => a.question_id === q.id)

        // Calculate stats for each option
        const stats = q.answer_options
            .sort((a, b) => a.option_index - b.option_index)
            .map((option, i) => {
                const count = questionAnswers.filter(a => a.selected_option_index === i).length
                return {
                    ...option,
                    count,
                    percentage: players.length > 0 ? Math.round((count / players.length) * 100) : 0,
                    color: ANSWER_COLORS[i],
                    shape: ANSWER_SHAPES[i]
                }
            })

        setAnswerStats(stats)
        setGameState('stats')
    }

    const showLeaderboard = async () => {
        try {
            // Player scores are updated by players themselves in PlayGame.jsx
            // Host just needs to fetch the latest scores

            const { data, error } = await supabase
                .from('game_players')
                .select('*')
                .eq('session_id', sessionId)
                .order('score', { ascending: false })

            if (error) throw error

            setLeaderboard(data || [])
            setPlayers(data || []) // Update local player list with new scores
            setGameState('leaderboard')
        } catch (error) {
            console.error('Error updating leaderboard:', error)
        }
    }

    // Award Coins when game finishes
    useEffect(() => {
        if (gameState === 'finished' && leaderboard.length > 0 && !coinsAwarded) {
            awardCoins()
        }
    }, [gameState, leaderboard, coinsAwarded])

    const awardCoins = async () => {
        setCoinsAwarded(true)

        // Loop through leaderboard and award coins based on rank
        for (let i = 0; i < leaderboard.length; i++) {
            const player = leaderboard[i]
            const rank = i + 1
            const coins = getCoinsForRank(rank)

            // Only award if player is linked to a user account
            if (player.user_id) {
                await supabase.rpc('add_coins', {
                    user_uuid: player.user_id,
                    amount: coins
                })
            }
        }
    }

    const nextQuestion = async () => {
        const nextIdx = currentIndex + 1

        if (nextIdx >= questions.length) {
            finishGame()
        } else {
            setCurrentIndex(nextIdx)
            setCurrentQuestion(questions[nextIdx]) // Pre-load
            setGameState('countdown')
            setCountdown(3)

            // Update DB to 'countdown' for preview
            try {
                await supabase
                    .from('game_sessions')
                    .update({
                        status: 'countdown',
                        current_question_index: nextIdx
                    })
                    .eq('id', sessionId)
            } catch (err) {
                console.error("Error syncing next question countdown:", err)
            }
        }
    }

    const finishGame = async () => {
        try {
            const { error } = await supabase
                .from('game_sessions')
                .update({ status: 'finished', ended_at: new Date().toISOString() })
                .eq('id', sessionId)

            if (error) throw error

            setGameState('finished')
        } catch (error) {
            console.error('Error finishing game:', error)
        }
    }

    const endGame = async () => {
        if (isClosing) return
        setIsClosing(true)

        try {
            // Update session status to closed to kick players
            const { error } = await supabase
                .from('game_sessions')
                .update({ status: 'closed' })
                .eq('id', sessionId)

            if (error) throw error

            navigate('/dashboard')
        } catch (error) {
            console.error('Error closing lobby:', error)
            // Navigate anyway so host isn't stuck
            navigate('/dashboard')
        }
    }

    if (loading) {
        return (
            <div className="host-container">
                <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                    <div className="loading-spinner" />
                    <p style={{ marginTop: '1rem', color: 'white' }}>Loading game session...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="host-container">
                <div className="error-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                    <h1>Connection Error</h1>
                    <p style={{ marginBottom: '2rem', maxWidth: '400px' }}>{error}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setLoading(true)
                            setError(null)
                            setRetryCount(c => c + 1)
                        }}
                        style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}
                    >
                        Try Again
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/dashboard')}
                        style={{ marginTop: '1rem' }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    // If not loading and no error, but session/quiz data is still missing (e.g., due to a very specific edge case or initial fetch issue not caught by error)
    if (!session || !quiz) {
        return (
            <div className="host-container">
                <div className="loading-overlay">
                    <div className="loading-spinner" />
                </div>
            </div>
        )
    }

    return (
        <div className="host-container">
            <button className="mute-btn-fixed" onClick={toggleMute}>
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <AnimatePresence mode="wait">
                {/* WAITING ROOM */}
                {gameState === 'waiting' && (
                    <motion.div
                        key="waiting"
                        className="waiting-room"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="pin-display glass-card">
                            <button
                                className="close-btn-absolute"
                                onClick={endGame}
                                title="Close Lobby"
                            >
                                x
                            </button>
                            <span className="pin-label">Game PIN</span>
                            <div className="pin-number">{session.game_pin}</div>
                            <button className="copy-btn" onClick={copyPin}>
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        <div className="join-url">
                            Join at <span>localhost:5173/join</span>
                        </div>

                        <div className="players-section glass-card">
                            <div className="players-header">
                                <Users size={24} />
                                <span>{players.length} Players</span>
                                <button className="btn-text danger" onClick={endGame} disabled={isClosing}>
                                    {isClosing ? 'Closing...' : 'Close Lobby'}
                                </button>
                            </div>

                            <div className="players-grid">
                                {players.map((player, i) => {
                                    const avatar = getPlayerAvatar(player)
                                    return (
                                        <motion.div
                                            key={player.id}
                                            className="player-chip"
                                            style={{ background: avatar.bg }}
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', delay: i * 0.1 }}
                                        >
                                            <span className="chip-avatar">{avatar.emoji}</span>
                                            <span className="chip-name">{player.nickname}</span>
                                        </motion.div>
                                    )
                                })}

                                {players.length === 0 && (
                                    <div className="no-players">Waiting for players to join...</div>
                                )}
                            </div>
                        </div>

                        {players.length > 0 && (
                            <motion.button
                                className="btn btn-primary btn-large start-btn"
                                onClick={startGame}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Play size={24} />
                                Start Game
                            </motion.button>
                        )}
                    </motion.div>
                )}

                {/* COUNTDOWN */}
                {gameState === 'countdown' && (
                    <motion.div
                        key="countdown"
                        className="countdown-screen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="countdown-number"
                            key={countdown}
                            initial={{ scale: 3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {countdown === 0 ? 'GO!' : countdown}
                        </motion.div>
                        <div className="question-preview">
                            Question {currentIndex + 1} of {questions.length}
                        </div>
                    </motion.div>
                )}

                {/* QUESTION SCREEN */}
                {gameState === 'question' && currentQuestion && (
                    <motion.div
                        key="question"
                        className="question-screen"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="question-header">
                            <div className="question-count">
                                {currentIndex + 1} / {questions.length}
                            </div>
                            <motion.div
                                className={`timer ${timeLeft <= 5 ? 'urgent' : ''}`}
                                animate={timeLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 0.5 }}
                            >
                                {timeLeft}
                            </motion.div>
                            <div className="answer-count">
                                <Zap size={18} />
                                {answers.filter(a => a.question_id === currentQuestion.id).length} / {players.length}
                            </div>
                        </div>

                        <motion.div
                            className="question-text glass-card"
                            initial={{ y: -50 }}
                            animate={{ y: 0 }}
                        >
                            {currentQuestion.question_text}
                        </motion.div>

                        <div className="answers-display">
                            {(!currentQuestion.answer_options || currentQuestion.answer_options.length === 0) && (
                                <div style={{ color: 'white', fontSize: '1.5rem', gridColumn: '1 / -1', textAlign: 'center' }}>
                                    ⚠️ No options data found for these question.
                                    <br /><span style={{ fontSize: '1rem', opacity: 0.8 }}>(Check console for details)</span>
                                </div>
                            )}
                            {console.log('Rendering Question:', currentQuestion)}
                            {(currentQuestion.answer_options || [])
                                .sort((a, b) => a.option_index - b.option_index)
                                .map((option, i) => (
                                    <motion.div
                                        key={option.id}
                                        className="answer-option"
                                        style={{ background: ANSWER_COLORS[i] }}
                                        initial={{ x: i % 2 === 0 ? -100 : 100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <span className="answer-shape">{ANSWER_SHAPES[i]}</span>
                                        <span className="answer-text">{option.answer_text}</span>
                                    </motion.div>
                                ))}
                        </div>
                    </motion.div>
                )}

                {/* ANSWER STATS SCREEN - Kahoot Style */}
                {gameState === 'stats' && (
                    <motion.div
                        key="stats"
                        className="stats-screen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Question Card - White */}
                        <motion.div
                            className="question-text glass-card"
                            initial={{ y: -30 }}
                            animate={{ y: 0 }}
                        >
                            {currentQuestion?.question_text}
                            <button
                                className="next-btn"
                                onClick={showLeaderboard}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    padding: '10px 20px',
                                    background: '#333',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Next
                            </button>
                        </motion.div>

                        {/* Bar Chart - Answer counts */}
                        <div className="bar-chart-container" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                            gap: '12px',
                            height: '200px',
                            marginBottom: '30px'
                        }}>
                            {answerStats.map((stat, i) => {
                                const maxCount = Math.max(...answerStats.map(s => s.count), 1)
                                const barHeight = (stat.count / maxCount) * 150 + 40
                                return (
                                    <motion.div
                                        key={i}
                                        style={{
                                            width: '80px',
                                            height: barHeight,
                                            background: stat.color,
                                            borderRadius: '8px 8px 0 0',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            padding: '10px',
                                            boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
                                        }}
                                        initial={{ height: 0 }}
                                        animate={{ height: barHeight }}
                                        transition={{ delay: i * 0.1, type: 'spring' }}
                                    >
                                        <span style={{ fontSize: '1.5rem' }}>{stat.shape}</span>
                                        <span style={{ fontWeight: 800, color: 'white' }}>{stat.count}</span>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* Player Answer Cards with ✓/✗ */}
                        <div className="answers-display">
                            {answerStats.map((stat, i) => {
                                const option = currentQuestion.answer_options.find(o => o.option_index === i)
                                return (
                                    <motion.div
                                        key={i}
                                        className={`answer-option ${stat.is_correct ? 'correct' : ''}`}
                                        style={{ background: stat.color }}
                                        initial={{ x: i % 2 === 0 ? -50 : 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                    >
                                        <span className="answer-shape">{stat.shape}</span>
                                        <span className="answer-text" style={{ flex: 1, fontWeight: 700, fontSize: '1.2rem' }}>
                                            {option?.answer_text || 'Loading...'}
                                        </span>

                                        <span style={{ fontSize: '1.5rem' }}>
                                            {stat.is_correct ? '✓' : '✗'}
                                        </span>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* LEADERBOARD SCREEN */}
                {gameState === 'leaderboard' && (
                    <motion.div
                        key="leaderboard"
                        className="leaderboard-screen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <h2 className="lb-title text-gradient">🏆 Leaderboard</h2>

                        <div className="lb-list">
                            {leaderboard.slice(0, 5).map((player, i) => {
                                const avatar = getPlayerAvatar(player)
                                const prevRank = players.findIndex(p => p.id === player.id)
                                const movement = prevRank - i

                                return (
                                    <motion.div
                                        key={player.id}
                                        className={`lb-item rank-${i + 1}`}
                                        initial={{ x: -100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.2, type: 'spring' }}
                                        layout
                                    >
                                        <span className="lb-rank">{i + 1}</span>
                                        <div className="lb-avatar" style={{ background: avatar.bg }}>
                                            {avatar.emoji}
                                        </div>
                                        <span className="lb-name">{player.nickname}</span>
                                        <motion.span
                                            className="lb-score"
                                            initial={{ scale: 1.5 }}
                                            animate={{ scale: 1 }}
                                        >
                                            {player.score}
                                        </motion.span>
                                    </motion.div>
                                )
                            })}
                        </div>

                        <motion.button
                            className="btn btn-primary btn-large"
                            onClick={nextQuestion}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1.2 }}
                        >
                            {currentIndex + 1 >= questions.length ? (
                                <>Final Results</>
                            ) : (
                                <>
                                    Next Question
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                )}

                {/* FINISHED SCREEN - Kahoot Style */}
                {gameState === 'finished' && (
                    <motion.div
                        key="finished"
                        className="finished-screen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                        >
                            <h1 className="winner-title">🏆 WINNER 🏆</h1>
                        </motion.div>

                        {/* Winner Card - Only show if we have a winner */}
                        {leaderboard[0] && (
                            <motion.div
                                className="winner-card glass-card"
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="winner-avatar" style={{ background: getPlayerAvatar(leaderboard[0]).bg }}>
                                    {getPlayerAvatar(leaderboard[0]).emoji}
                                </div>
                                <div className="winner-name">{leaderboard[0].nickname}</div>
                                <div className="winner-score">{leaderboard[0].score} points</div>
                            </motion.div>
                        )}

                        {/* Podium - Show all 3 places if available */}
                        {leaderboard.length > 1 && (
                            <div className="podium">
                                {[1, 0, 2].map((order, visualIndex) => {
                                    const player = leaderboard[order]
                                    if (!player) return null
                                    const avatar = getPlayerAvatar(player)
                                    const heights = [180, 140, 110] // 1st, 2nd, 3rd heights

                                    return (
                                        <motion.div
                                            key={player.id}
                                            className={`podium-place place-${order + 1}`}
                                            style={{ height: heights[order], order: visualIndex }}
                                            initial={{ y: 200, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 + visualIndex * 0.2, type: 'spring' }}
                                        >
                                            <div className="podium-avatar" style={{ background: avatar.bg }}>
                                                {avatar.emoji}
                                            </div>
                                            <div className="podium-name">{player.nickname}</div>
                                            <div className="podium-score">{player.score}</div>
                                            <div className="podium-rank">{order + 1}</div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}

                        <motion.button
                            className="btn btn-secondary btn-large"
                            onClick={endGame}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                        >
                            Back to Dashboard
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
