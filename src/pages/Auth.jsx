import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react'
import './Auth.css'

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')

    const { signIn, signUp, signInWithGoogle } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            if (isLogin) {
                const { error } = await signIn(email, password)
                if (error) throw error
                navigate('/')
            } else {
                if (username.length < 3) {
                    throw new Error('Username must be at least 3 characters')
                }
                const { error } = await signUp(email, password, username)
                if (error) throw error
                setSuccess('Account created! Please check your email to verify.')
                setTimeout(() => setIsLogin(true), 2000)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        const { error } = await signInWithGoogle()
        if (error) setError(error.message)
    }

    const toggleMode = () => {
        setIsLogin(!isLogin)
        setError('')
        setSuccess('')
    }

    return (
        <div className="auth-container">
            {/* Animated Background */}
            <div className="bg-animated">
                <div className="bg-blob bg-blob-1" />
                <div className="bg-blob bg-blob-2" />
                <div className="bg-blob bg-blob-3" />
            </div>

            <motion.div
                className="auth-card glass-card"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                key={isLogin ? 'login' : 'register'}
            >
                {/* Header */}
                <div className="auth-header">
                    <h1 className="auth-logo text-gradient">CodlyQuiz</h1>
                    <p className="auth-subtitle">
                        {isLogin ? "Welcome back! Let's play 🎮" : "Join the quiz revolution! 🚀"}
                    </p>
                </div>

                {/* Messages */}
                {error && <div className="message message-error">{error}</div>}
                {success && <div className="message message-success">{success}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="input-group">
                            <label>Username</label>
                            <div className="input-with-icon">
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="coolplayer123"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    minLength={3}
                                    maxLength={20}
                                />
                                <User className="input-icon" size={20} />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email</label>
                        <div className="input-with-icon">
                            <input
                                type="email"
                                className="input-field"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Mail className="input-icon" size={20} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-with-icon">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <Lock className="input-icon" size={20} />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-large"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner" />
                                <span>Please wait...</span>
                            </>
                        ) : isLogin ? (
                            <>
                                <span>Login</span>
                                <ArrowRight size={20} />
                            </>
                        ) : (
                            <>
                                <span>Create Account</span>
                                <UserPlus size={20} />
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle */}
                <div className="auth-footer">
                    <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
                    <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }}>
                        {isLogin ? 'Sign up' : 'Login'}
                    </a>
                </div>
            </motion.div>
        </div>
    )
}
