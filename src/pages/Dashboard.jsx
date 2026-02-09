import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, Play, Edit, Trash2, MoreVertical, ArrowLeft, Users } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [quizzes, setQuizzes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeMenu, setActiveMenu] = useState(null)
    const [retryCount, setRetryCount] = useState(0)

    useEffect(() => {
        let mounted = true

        const load = async () => {
            if (!user) {
                if (mounted) setLoading(false)
                return
            }
            await fetchQuizzes()
        }

        load()

        return () => { mounted = false }
    }, [user, retryCount])

    const fetchQuizzes = async () => {
        if (!user) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Check connection first
            const { error: healthError } = await supabase.from('quizzes').select('count', { count: 'exact', head: true })

            if (healthError) throw new Error('Database connection failed')

            // Helper for timeout
            const fetchPromise = supabase
                .from('quizzes')
                .select('*, questions(count)')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false })

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out. Please check your internet.')), 10000)
            )

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

            if (error) throw error

            // Transform data to include question count
            const quizzesWithCount = (data || []).map(quiz => ({
                ...quiz,
                questionCount: quiz.questions?.[0]?.count || 0
            }))
            setQuizzes(quizzesWithCount)
        } catch (err) {
            console.error('Error fetching quizzes:', err)
            setError(err.message || 'Failed to load quizzes')
        } finally {
            setLoading(false)
        }
    }

    const deleteQuiz = async (quizId) => {
        if (!confirm('Are you sure you want to delete this quiz?')) return

        try {
            const { error } = await supabase
                .from('quizzes')
                .delete()
                .eq('id', quizId)

            if (error) throw error
            setQuizzes(quizzes.filter(q => q.id !== quizId))
        } catch (error) {
            console.error('Error deleting quiz:', error)
        }
    }

    const startGame = async (quiz) => {
        // Generate game PIN and create session
        try {
            const gamePin = String(Math.floor(100000 + Math.random() * 900000))

            const { data, error } = await supabase
                .from('game_sessions')
                .insert({
                    quiz_id: quiz.id,
                    host_id: user.id,
                    game_pin: gamePin,
                    status: 'waiting'
                })
                .select()
                .single()

            if (error) throw error
            navigate(`/host/${data.id}`)
        } catch (error) {
            console.error('Error starting game:', error)
            alert('Failed to start game. Please try again.')
        }
    }

    return (
        <div className="dashboard-container">
            {/* Animated Background */}
            <div className="bg-animated">
                <div className="bg-blob bg-blob-1" />
                <div className="bg-blob bg-blob-2" />
                <div className="bg-blob bg-blob-3" />
            </div>

            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <Link to="/" className="back-btn">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-gradient">My Quizzes</h1>
                </div>

                <Link to="/create" className="btn btn-primary">
                    <Plus size={20} />
                    <span>Create Quiz</span>
                </Link>
            </header>

            {/* Content */}
            <main className="dashboard-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Loading your quizzes...</p>
                    </div>
                ) : error ? (
                    <div className="error-state glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2>Failed to load quizzes</h2>
                        <p style={{ color: '#ff6b6b', marginBottom: '1.5rem' }}>{error}</p>
                        <button className="btn btn-primary" onClick={() => setRetryCount(c => c + 1)}>
                            Try Again
                        </button>
                    </div>
                ) : quizzes.length === 0 ? (
                    <motion.div
                        className="empty-state glass-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="empty-icon">🎯</div>
                        <h2>No quizzes yet</h2>
                        <p>Create your first quiz and start hosting games!</p>
                        <Link to="/create" className="btn btn-primary">
                            <Plus size={20} />
                            <span>Create Quiz</span>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="quizzes-grid">
                        {quizzes.map((quiz, index) => (
                            <motion.div
                                key={quiz.id}
                                className="quiz-card glass-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="quiz-cover" style={{
                                    background: quiz.cover_image
                                        ? `url(${quiz.cover_image})`
                                        : `linear-gradient(135deg, hsl(${index * 60}, 70%, 50%), hsl(${index * 60 + 30}, 70%, 40%))`
                                }}>
                                    <div className="quiz-menu">
                                        <button
                                            className="menu-btn"
                                            onClick={() => setActiveMenu(activeMenu === quiz.id ? null : quiz.id)}
                                        >
                                            <MoreVertical size={20} />
                                        </button>

                                        {activeMenu === quiz.id && (
                                            <div className="menu-dropdown">
                                                <Link to={`/create?edit=${quiz.id}`} className="menu-item">
                                                    <Edit size={16} />
                                                    Edit
                                                </Link>
                                                <button
                                                    className="menu-item danger"
                                                    onClick={() => deleteQuiz(quiz.id)}
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="quiz-info">
                                    <h3 className="quiz-title">{quiz.title}</h3>
                                    <p className="quiz-meta">
                                        {quiz.questionCount || 0} questions • {quiz.times_played || 0} plays
                                    </p>
                                </div>

                                <div className="quiz-actions">
                                    <button
                                        className="btn btn-primary btn-block"
                                        onClick={() => startGame(quiz)}
                                    >
                                        <Play size={18} />
                                        <span>Host Game</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
