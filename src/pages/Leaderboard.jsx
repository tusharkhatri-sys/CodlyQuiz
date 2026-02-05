import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Trophy, Medal, Target, Gamepad2, ArrowLeft } from 'lucide-react'
import './Leaderboard.css'

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    const fetchLeaderboard = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .gt('games_played', 0)
            .order('total_points', { ascending: false })
            .limit(10)

        if (!error && data) {
            setLeaders(data)
        }
        setLoading(false)
    }

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇'
        if (rank === 2) return '🥈'
        if (rank === 3) return '🥉'
        return `#${rank}`
    }

    const getRankClass = (rank) => {
        if (rank === 1) return 'gold'
        if (rank === 2) return 'silver'
        if (rank === 3) return 'bronze'
        return ''
    }

    return (
        <div className="leaderboard-page">
            {/* Animated Background */}
            <div className="bg-animated">
                <div className="bg-blob bg-blob-1" />
                <div className="bg-blob bg-blob-2" />
                <div className="bg-blob bg-blob-3" />
            </div>

            <header className="lb-header">
                <Link to="/" className="back-btn">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-gradient">🏆 Global Leaderboard</h1>
            </header>

            <main className="lb-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                    </div>
                ) : leaders.length === 0 ? (
                    <div className="empty-state glass-card">
                        <Trophy size={60} />
                        <h2>No players yet!</h2>
                        <p>Be the first to play and top the leaderboard!</p>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        <div className="podium-section">
                            {leaders.slice(0, 3).map((player, i) => {
                                const order = i === 0 ? 1 : i === 1 ? 0 : 2 // Reorder: 2nd, 1st, 3rd
                                const actualRank = i + 1
                                return (
                                    <motion.div
                                        key={player.id}
                                        className={`podium-card ${getRankClass(actualRank)}`}
                                        style={{ order }}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: (2 - i) * 0.2 }}
                                    >
                                        <div className="podium-avatar">
                                            {player.avatar_url ? (
                                                <img src={player.avatar_url} alt={player.username} />
                                            ) : (
                                                player.username?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="podium-rank">{getRankIcon(actualRank)}</div>
                                        <div className="podium-name">{player.display_name || player.username}</div>
                                        <div className="podium-points">{player.total_points.toLocaleString()} pts</div>
                                        <div className="podium-stats">
                                            <span><Gamepad2 size={14} /> {player.games_played}</span>
                                            <span><Trophy size={14} /> {player.games_won}</span>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* Rest of the leaderboard */}
                        <div className="lb-table glass-card">
                            <div className="lb-table-header">
                                <span>Rank</span>
                                <span>Player</span>
                                <span>Games</span>
                                <span>Wins</span>
                                <span>Points</span>
                            </div>

                            {leaders.map((player, i) => (
                                <motion.div
                                    key={player.id}
                                    className={`lb-row ${getRankClass(i + 1)}`}
                                    initial={{ x: -50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <span className="rank">{getRankIcon(i + 1)}</span>
                                    <span className="player">
                                        <div className="player-avatar">
                                            {player.avatar_url ? (
                                                <img src={player.avatar_url} alt="" />
                                            ) : (
                                                player.username?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        {player.display_name || player.username}
                                    </span>
                                    <span className="games">{player.games_played}</span>
                                    <span className="wins">{player.games_won}</span>
                                    <span className="points">{player.total_points.toLocaleString()}</span>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
