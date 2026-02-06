import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Target, Gamepad2, Settings, LogOut, LayoutDashboard, Trophy } from 'lucide-react'
import './Home.css'

export default function Home() {
    const { user, signOut, loading } = useAuth()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth')
        }
    }, [user, loading, navigate])

    const handleLogout = async () => {
        await signOut()
        navigate('/auth')
    }

    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Player'
    const initial = username.charAt(0).toUpperCase()

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner" />
            </div>
        )
    }

    return (
        <div className="home-container">
            {/* Animated Background */}
            <div className="bg-animated">
                <div className="bg-blob bg-blob-1" />
                <div className="bg-blob bg-blob-2" />
                <div className="bg-blob bg-blob-3" />
            </div>

            {/* Navbar */}
            <nav className="navbar">
                <Link to="/" className="nav-logo text-gradient">CodlyQuiz</Link>

                <div className="nav-user">
                    <span className="nav-username">{username}</span>
                    <div className="dropdown">
                        <button
                            className="nav-avatar"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            {initial}
                        </button>

                        {dropdownOpen && (
                            <motion.div
                                className="dropdown-menu"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Link to="/dashboard" className="dropdown-item">
                                    <LayoutDashboard size={18} />
                                    My Quizzes
                                </Link>
                                <Link to="/leaderboard" className="dropdown-item">
                                    <Trophy size={18} />
                                    Leaderboard
                                </Link>
                                <Link to="/settings" className="dropdown-item">
                                    <Settings size={18} />
                                    Settings
                                </Link>
                                <div className="dropdown-divider" />
                                <button className="dropdown-item danger" onClick={handleLogout}>
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="hero">
                <motion.h1
                    className="hero-title text-gradient"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    Let's Play!
                </motion.h1>

                <motion.p
                    className="hero-subtitle"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                    Create amazing quizzes or join a game. Challenge your friends and have fun learning together!
                </motion.p>

                {/* Action Cards */}
                <motion.div
                    className="action-cards"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <Link to="/dashboard" className="action-card glass-card host">
                        <div className="action-icon">
                            <Target size={40} />
                        </div>
                        <h2 className="action-title">Host a Quiz</h2>
                        <p className="action-desc">Create and manage your quizzes, then host live games</p>
                    </Link>

                    <Link to="/join" className="action-card glass-card join">
                        <div className="action-icon">
                            <Gamepad2 size={40} />
                        </div>
                        <h2 className="action-title">Join a Game</h2>
                        <p className="action-desc">Enter a game PIN to join an existing quiz session</p>
                    </Link>

                    <Link to="/leaderboard" className="action-card glass-card leaderboard">
                        <div className="action-icon">
                            <Trophy size={40} />
                        </div>
                        <h2 className="action-title">Leaderboard</h2>
                        <p className="action-desc">See the top players and global rankings</p>
                    </Link>
                </motion.div>
            </main>
        </div>
    )
}
