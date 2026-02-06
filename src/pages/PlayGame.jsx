import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Trophy, Clock, Volume2, VolumeX, Zap, EyeOff, Coins } from 'lucide-react'
import { audioManager } from '../utils/audio'
import { getCoinsForRank } from '../utils/avatars'
import './PlayGame.css'

const ANSWER_COLORS = ['#E21B3C', '#1368CE', '#D89E00', '#26890C']
const ANSWER_SHAPES = ['▲', '◆', '●', '■']

export default function PlayGame() {
    const { sessionId } = useParams()
    const [searchParams] = useSearchParams()
    const playerId = searchParams.get('player')

    const [session, setSession] = useState(null)
    const [player, setPlayer] = useState(null)
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [options, setOptions] = useState([])
    const [gameState, setGameState] = useState('waiting') // waiting, question, answered, result, finished
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [isCorrect, setIsCorrect] = useState(null)
    const [pointsEarned, setPointsEarned] = useState(0)
    const [timeLeft, setTimeLeft] = useState(0)
    const [questionStartTime, setQuestionStartTime] = useState(null)
    const [rank, setRank] = useState(null)
    const [totalScore, setTotalScore] = useState(0)
    const [streak, setStreak] = useState(0)
    const [isMuted, setIsMuted] = useState(audioManager.isMuted)

    // Power-up States
    const [powerups, setPowerups] = useState({ fifty: 1, double: 1 })
    const [hiddenOptions, setHiddenOptions] = useState([]) // Indices of hidden options
    const [activeMultiplier, setActiveMultiplier] = useState(1) // Current turn multiplier

    // Reset powerups per question
    useEffect(() => {
        if (gameState === 'question') {
            setHiddenOptions([])
            setActiveMultiplier(1)
        }
    }, [gameState])

    // Audio cleanup
    useEffect(() => {
        return () => audioManager.stopBgm()
    }, [])

    const toggleMute = () => {
        const muted = audioManager.toggleMute()
        setIsMuted(muted)
    }

    // Initial fetch and realtime subscription
    useEffect(() => {
        fetchInitialData()

        // Subscribe to session changes
        const channel = supabase
            .channel('session_updates')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
                (payload) => {
                    handleSessionUpdate(payload.new)
                }
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [sessionId])

    // Timer countdown
    useEffect(() => {
        if (gameState === 'question' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
            return () => clearTimeout(timer)
        } else if (gameState === 'question' && timeLeft === 0) {
            // Time's up - auto submit no answer
            if (!selectedAnswer) {
                submitAnswer(null)
            }
        }
    }, [timeLeft, gameState])

    const fetchInitialData = async () => {
        // Fetch session
        const { data: sessionData } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (sessionData) {
            setSession(sessionData)

            if (sessionData.status === 'playing') {
                await loadCurrentQuestion(sessionData)
            }
        }

        // Fetch player
        const { data: playerData } = await supabase
            .from('game_players')
            .select('*')
            .eq('id', playerId)
            .single()

        if (playerData) {
            setPlayer(playerData)
            setTotalScore(playerData.score)
            setStreak(playerData.current_streak || 0)
        }
    }

    const handleSessionUpdate = async (newSession) => {
        setSession(newSession)

        if (newSession.status === 'playing') {
            // loadCurrentQuestion will set appropriate gameState
            await loadCurrentQuestion(newSession)
        } else if (newSession.status === 'finished') {
            fetchFinalRank()
            setGameState('finished')
        } else if (newSession.status === 'cancelled' || newSession.status === 'closed') {
            // Session closed by host - kick player
            alert('Game session has been closed by the host!')
            navigate('/join')
        }
    }

    const loadCurrentQuestion = async (sessionData) => {
        const { data: questions } = await supabase
            .from('questions')
            .select('*, answer_options(*)')
            .eq('quiz_id', sessionData.quiz_id)
            .order('order_index')

        if (questions && questions[sessionData.current_question_index]) {
            const q = questions[sessionData.current_question_index]

            // Check if player already answered this question
            const { data: existingAnswer } = await supabase
                .from('player_answers')
                .select('*')
                .eq('player_id', playerId)
                .eq('question_id', q.id)
                .single()

            if (existingAnswer) {
                // Already answered - show result
                setCurrentQuestion(q)
                setOptions(q.answer_options.sort((a, b) => a.option_index - b.option_index))
                setSelectedAnswer(existingAnswer.selected_option_index)
                setIsCorrect(existingAnswer.is_correct)
                setPointsEarned(existingAnswer.points_earned)
                setGameState('result')
                return
            }

            setCurrentQuestion(q)
            setOptions(q.answer_options.sort((a, b) => a.option_index - b.option_index))
            setTimeLeft(q.time_limit)
            setQuestionStartTime(Date.now())
            setGameState('question')
            setSelectedAnswer(null)
            setIsCorrect(null)
        }
    }

    const handlePowerup = (type) => {
        if (powerups[type] <= 0) return
        if (gameState !== 'question') return

        if (type === 'fifty') {
            const correctIndex = options.findIndex(o => o.is_correct)
            const wrongIndices = options
                .map((_, i) => i)
                .filter(i => i !== correctIndex)

            // Randomly hide 2 wrong options
            const shuffled = wrongIndices.sort(() => 0.5 - Math.random())
            const toHide = shuffled.slice(0, 2)

            setHiddenOptions(toHide)
        } else if (type === 'double') {
            setActiveMultiplier(2)
        }

        audioManager.playSfx('join') // Use join sound as powerup sound for now
        setPowerups(prev => ({ ...prev, [type]: prev[type] - 1 }))
    }

    const submitAnswer = async (optionIndex) => {
        if (selectedAnswer !== null) return // Already answered

        setSelectedAnswer(optionIndex)
        setGameState('answered')

        const timeTaken = Date.now() - questionStartTime
        const correctOption = options.find(o => o.is_correct)
        const correct = optionIndex !== null && options[optionIndex]?.is_correct

        setIsCorrect(correct)

        // Play sound effect
        if (correct) {
            audioManager.playSfx('correct')
        } else {
            audioManager.playSfx('wrong')
        }

        // Update local streak state
        let newStreak = streak
        if (correct) {
            newStreak += 1
        } else {
            newStreak = 0
        }
        setStreak(newStreak)

        // Calculate points (faster = more points)
        let points = 0
        if (correct) {
            const maxTime = currentQuestion.time_limit * 1000
            const timeBonus = Math.max(0, 1 - (timeTaken / maxTime))
            let basePoints = Math.round(currentQuestion.points * (0.5 + 0.5 * timeBonus))

            // Streak Multiplier
            let multiplier = 1
            if (newStreak >= 5) multiplier = 2
            else if (newStreak >= 3) multiplier = 1.5
            else if (newStreak >= 2) multiplier = 1.2

            points = Math.round(basePoints * multiplier * activeMultiplier)
        }
        setPointsEarned(points)

        // Save answer to database
        await supabase.from('player_answers').insert({
            player_id: playerId,
            question_id: currentQuestion.id,
            selected_option_index: optionIndex,
            is_correct: correct,
            time_taken_ms: timeTaken,
            points_earned: points
        })

        // Update player score and streak
        // Always update to save streak even if points is 0
        const newScore = totalScore + points
        setTotalScore(newScore)

        await supabase
            .from('game_players')
            .update({
                score: newScore,
                current_streak: newStreak
            })
            .eq('id', playerId)

        setGameState('result')
    }

    const fetchFinalRank = async () => {
        const { data } = await supabase
            .from('game_players')
            .select('*')
            .eq('session_id', sessionId)
            .order('score', { ascending: false })

        if (data) {
            const playerRank = data.findIndex(p => p.id === playerId) + 1
            setRank(playerRank)
            const me = data.find(p => p.id === playerId)
            if (me) setTotalScore(me.score)
        }
    }

    if (!session || !player) {
        return (
            <div className="play-container">
                <div className="loading-overlay">
                    <div className="loading-spinner" />
                </div>
            </div>
        )
    }

    return (
        <div className="play-container">
            {/* Game Status Bar */}
            <div className="game-status-bar">
                <div className="score-display">
                    Score: {totalScore}
                </div>
                {streak >= 3 && (
                    <motion.div
                        className="streak-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                    >
                        🔥 {streak} Streak!
                    </motion.div>
                )}
                <button className="mute-btn-fixed" onClick={toggleMute}>
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {/* WAITING STATE */}
                {gameState === 'waiting' && (
                    <motion.div
                        key="waiting"
                        className="play-state waiting-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="waiting-content">
                            <div className="player-avatar">
                                {player.nickname.charAt(0).toUpperCase()}
                            </div>
                            <h2>{player.nickname}</h2>
                            <p>You're in! Waiting for the host to start...</p>
                            <div className="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* QUESTION STATE - Show colored answer buttons */}
                {gameState === 'question' && (
                    <motion.div
                        key="question"
                        className="play-state question-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="question-timer">
                            <Clock size={24} />
                            <span className={timeLeft <= 5 ? 'urgent' : ''}>{timeLeft}</span>
                        </div>

                        {/* Powerups UI */}
                        <div className="powerups-container">
                            <button
                                className={`powerup-btn ${powerups.fifty === 0 ? 'used' : ''}`}
                                onClick={() => handlePowerup('fifty')}
                                disabled={powerups.fifty === 0}
                            >
                                <EyeOff size={20} />
                                <span>50/50</span>
                            </button>
                            <button
                                className={`powerup-btn ${powerups.double === 0 ? 'used' : ''} ${activeMultiplier === 2 ? 'active' : ''}`}
                                onClick={() => handlePowerup('double')}
                                disabled={powerups.double === 0}
                            >
                                <Zap size={20} />
                                <span>2x</span>
                            </button>
                        </div>

                        <div className="answer-buttons">
                            {options.map((option, i) => (
                                <motion.button
                                    key={option.id}
                                    className={`answer-btn ${hiddenOptions.includes(i) ? 'hidden' : ''}`}
                                    style={{ background: ANSWER_COLORS[i] }}
                                    onClick={() => submitAnswer(i)}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={hiddenOptions.includes(i)}
                                >
                                    <span className="shape">{ANSWER_SHAPES[i]}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ANSWERED STATE */}
                {gameState === 'answered' && (
                    <motion.div
                        key="answered"
                        className="play-state answered-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="answered-icon">
                            <Clock size={60} />
                        </div>
                        <h2>Answer submitted!</h2>
                        <p>Waiting for timer...</p>
                    </motion.div>
                )}

                {/* RESULT STATE */}
                {gameState === 'result' && (
                    <motion.div
                        key="result"
                        className={`play-state result-state ${isCorrect ? 'correct' : 'incorrect'}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <motion.div
                            className="result-icon"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                        >
                            {isCorrect ? <CheckCircle size={80} /> : <XCircle size={80} />}
                        </motion.div>

                        <h2>{isCorrect ? 'Correct' : 'Incorrect'}</h2>

                        {isCorrect && streak >= 1 && (
                            <motion.div
                                className="streak-display"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                Answer Streak <span className="streak-number">{streak}</span>
                            </motion.div>
                        )}

                        {isCorrect && (
                            <motion.div
                                className="points-earned"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                            >
                                + {pointsEarned}
                            </motion.div>
                        )}

                        {isCorrect && rank && rank <= 3 && (
                            <motion.p
                                className="podium-message"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ color: '#26890C', fontWeight: 700, marginTop: 16 }}
                            >
                                You're on the podium!
                            </motion.p>
                        )}
                    </motion.div>
                )}

                {/* FINISHED STATE */}
                {gameState === 'finished' && (
                    <motion.div
                        key="finished"
                        className="play-state finished-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring' }}
                        >
                            <Trophy size={80} className="trophy-icon" />
                        </motion.div>

                        <h1>Game Over!</h1>

                        <div className="final-rank glass-card">
                            <span className="rank-label">Your Rank</span>
                            <span className="rank-number">#{rank}</span>
                        </div>

                        <div className="final-score">
                            <span>{totalScore}</span> points
                        </div>

                        {/* Coins Earned */}
                        <motion.div
                            className="coins-earned"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                        >
                            <Coins size={24} />
                            <span>+{getCoinsForRank(rank)} coins earned!</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
