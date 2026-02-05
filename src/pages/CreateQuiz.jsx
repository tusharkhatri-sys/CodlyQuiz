import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
    ArrowLeft, Plus, Trash2, Save, Clock,
    CheckCircle, Image, GripVertical
} from 'lucide-react'
import './CreateQuiz.css'

const ANSWER_COLORS = ['#E21B3C', '#1368CE', '#D89E00', '#26890C']
const ANSWER_SHAPES = ['▲', '◆', '●', '■']

export default function CreateQuiz() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const editId = searchParams.get('edit') // Get quiz ID if editing

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [quizTimeLimit, setQuizTimeLimit] = useState(20) // Quiz-level timer
    const [questions, setQuestions] = useState([createEmptyQuestion()])
    const [activeQuestion, setActiveQuestion] = useState(0)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)

    function createEmptyQuestion() {
        return {
            id: Date.now(),
            dbId: null, // Database ID for updates
            text: '',
            points: 1000,
            options: [
                { text: '', isCorrect: false, dbId: null },
                { text: '', isCorrect: false, dbId: null },
                { text: '', isCorrect: false, dbId: null },
                { text: '', isCorrect: false, dbId: null }
            ]
        }
    }

    // Load existing quiz if editing
    useEffect(() => {
        if (editId) {
            loadQuiz(editId)
        }
    }, [editId])

    const loadQuiz = async (quizId) => {
        setLoading(true)
        try {
            const { data: quiz, error: quizError } = await supabase
                .from('quizzes')
                .select('*')
                .eq('id', quizId)
                .single()

            if (quizError) throw quizError

            setTitle(quiz.title)
            setDescription(quiz.description || '')
            setIsEditing(true)

            // Get time limit from first question (quiz-level)

            // Load questions
            const { data: questionsData } = await supabase
                .from('questions')
                .select('*, answer_options(*)')
                .eq('quiz_id', quizId)
                .order('order_index')

            if (questionsData && questionsData.length > 0) {
                // Set quiz time limit from first question
                setQuizTimeLimit(questionsData[0].time_limit || 20)

                const mappedQuestions = questionsData.map(q => ({
                    id: Date.now() + Math.random(),
                    dbId: q.id,
                    text: q.question_text,
                    points: q.points,
                    options: q.answer_options
                        .sort((a, b) => a.option_index - b.option_index)
                        .map(o => ({
                            text: o.answer_text,
                            isCorrect: o.is_correct,
                            dbId: o.id
                        }))
                        .concat(
                            // Fill remaining slots with empty options
                            Array(4 - q.answer_options.length).fill(null).map(() => ({
                                text: '',
                                isCorrect: false,
                                dbId: null
                            }))
                        )
                        .slice(0, 4) // Max 4 options
                }))
                setQuestions(mappedQuestions)
            }
        } catch (err) {
            console.error('Error loading quiz:', err)
            setError('Failed to load quiz')
        } finally {
            setLoading(false)
        }
    }

    const addQuestion = () => {
        const newQuestion = createEmptyQuestion()
        setQuestions([...questions, newQuestion])
        setActiveQuestion(questions.length)
    }

    const removeQuestion = (index) => {
        if (questions.length === 1) return
        const newQuestions = questions.filter((_, i) => i !== index)
        setQuestions(newQuestions)
        if (activeQuestion >= newQuestions.length) {
            setActiveQuestion(newQuestions.length - 1)
        }
    }

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions]
        newQuestions[index] = { ...newQuestions[index], [field]: value }
        setQuestions(newQuestions)
    }

    const updateOption = (qIndex, oIndex, field, value) => {
        const newQuestions = [...questions]
        const newOptions = [...newQuestions[qIndex].options]

        if (field === 'isCorrect' && value) {
            newOptions.forEach((opt, i) => {
                opt.isCorrect = i === oIndex
            })
        } else {
            newOptions[oIndex] = { ...newOptions[oIndex], [field]: value }
        }

        newQuestions[qIndex].options = newOptions
        setQuestions(newQuestions)
    }

    const validateQuiz = () => {
        if (!title.trim()) return 'Please enter a quiz title'

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i]
            if (!q.text.trim()) return `Question ${i + 1} is empty`

            const filledOptions = q.options.filter(o => o.text.trim())
            if (filledOptions.length < 2) {
                return `Question ${i + 1} needs at least 2 answer options`
            }

            if (!q.options.some(o => o.isCorrect)) {
                return `Question ${i + 1} needs a correct answer`
            }
        }

        return null
    }

    const saveQuiz = async () => {
        const validationError = validateQuiz()
        if (validationError) {
            setError(validationError)
            return
        }

        setSaving(true)
        setError('')

        try {
            let quizId = editId

            if (isEditing) {
                // Update existing quiz
                const { error: updateError } = await supabase
                    .from('quizzes')
                    .update({
                        title: title.trim(),
                        description: description.trim(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editId)

                if (updateError) throw updateError

                // Delete old questions and options
                await supabase
                    .from('questions')
                    .delete()
                    .eq('quiz_id', editId)

            } else {
                // Create new quiz
                const { data: quiz, error: quizError } = await supabase
                    .from('quizzes')
                    .insert({
                        creator_id: user.id,
                        title: title.trim(),
                        description: description.trim(),
                        is_public: false
                    })
                    .select()
                    .single()

                if (quizError) throw quizError
                quizId = quiz.id
            }

            // Create questions
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i]

                const { data: question, error: qError } = await supabase
                    .from('questions')
                    .insert({
                        quiz_id: quizId,
                        question_text: q.text.trim(),
                        time_limit: quizTimeLimit, // Use quiz-level timer
                        points: q.points,
                        order_index: i
                    })
                    .select()
                    .single()

                if (qError) throw qError

                // Create answer options
                const options = q.options
                    .filter(o => o.text.trim())
                    .map((o, index) => ({
                        question_id: question.id,
                        answer_text: o.text.trim(),
                        is_correct: o.isCorrect,
                        option_index: index
                    }))

                const { error: optError } = await supabase
                    .from('answer_options')
                    .insert(options)

                if (optError) throw optError
            }

            navigate('/dashboard')
        } catch (err) {
            console.error('Error saving quiz:', err)
            setError('Failed to save quiz. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner" />
            </div>
        )
    }

    const currentQ = questions[activeQuestion]

    return (
        <div className="create-container">
            {/* Animated Background */}
            <div className="bg-animated">
                <div className="bg-blob bg-blob-1" />
                <div className="bg-blob bg-blob-2" />
                <div className="bg-blob bg-blob-3" />
            </div>

            {/* Header */}
            <header className="create-header">
                <div className="header-left">
                    <Link to="/dashboard" className="back-btn">
                        <ArrowLeft size={20} />
                    </Link>
                    <input
                        type="text"
                        className="title-input"
                        placeholder="Quiz title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="header-center">
                    <div className="quiz-timer-setting">
                        <Clock size={18} />
                        <select
                            value={quizTimeLimit}
                            onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                            className="timer-select"
                        >
                            <option value={5}>5 sec</option>
                            <option value={10}>10 sec</option>
                            <option value={15}>15 sec</option>
                            <option value={20}>20 sec</option>
                            <option value={30}>30 sec</option>
                            <option value={45}>45 sec</option>
                            <option value={60}>60 sec</option>
                            <option value={90}>90 sec</option>
                            <option value={120}>2 min</option>
                        </select>
                        <span className="timer-label">per question</span>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={saveQuiz}
                    disabled={saving}
                >
                    {saving ? (
                        <div className="spinner" />
                    ) : (
                        <Save size={20} />
                    )}
                    <span>{saving ? 'Saving...' : (isEditing ? 'Update Quiz' : 'Save Quiz')}</span>
                </button>
            </header>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            <div className="create-layout">
                {/* Sidebar - Question List */}
                <aside className="question-sidebar glass-card">
                    <div className="sidebar-header">
                        <span>Questions</span>
                        <button className="add-btn" onClick={addQuestion}>
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="question-list">
                        {questions.map((q, index) => (
                            <motion.div
                                key={q.id}
                                className={`question-item ${index === activeQuestion ? 'active' : ''}`}
                                onClick={() => setActiveQuestion(index)}
                                layout
                            >
                                <span className="q-number">{index + 1}</span>
                                <span className="q-preview">
                                    {q.text || 'New question'}
                                </span>
                                {questions.length > 1 && (
                                    <button
                                        className="delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            removeQuestion(index)
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </aside>

                {/* Main Editor */}
                <main className="question-editor">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeQuestion}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="editor-content"
                        >
                            {/* Question Text */}
                            <div className="question-input-wrapper glass-card">
                                <textarea
                                    className="question-input"
                                    placeholder="Type your question here..."
                                    value={currentQ.text}
                                    onChange={(e) => updateQuestion(activeQuestion, 'text', e.target.value)}
                                    rows={3}
                                />
                            </div>

                            {/* Answer Options */}
                            <div className="answers-grid">
                                {currentQ.options.map((option, oIndex) => (
                                    <div
                                        key={oIndex}
                                        className={`answer-card ${option.isCorrect ? 'correct' : ''}`}
                                        style={{ '--answer-color': ANSWER_COLORS[oIndex] }}
                                    >
                                        <div className="answer-shape">{ANSWER_SHAPES[oIndex]}</div>
                                        <input
                                            type="text"
                                            className="answer-input"
                                            placeholder={`Add answer ${oIndex + 1}`}
                                            value={option.text}
                                            onChange={(e) => updateOption(activeQuestion, oIndex, 'text', e.target.value)}
                                        />
                                        <button
                                            className={`correct-btn ${option.isCorrect ? 'active' : ''}`}
                                            onClick={() => updateOption(activeQuestion, oIndex, 'isCorrect', true)}
                                            title="Mark as correct"
                                        >
                                            <CheckCircle size={24} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}
