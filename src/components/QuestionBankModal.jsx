import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Plus, Check, X, Loader2, Shuffle } from 'lucide-react'
import './QuestionBankModal.css'

export default function QuestionBankModal({ isOpen, onClose, onImport }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedQuestions, setSelectedQuestions] = useState([])
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // Fetch questions when modal opens or search changes
    useEffect(() => {
        if (isOpen) {
            fetchQuestions()
        } else {
            // Reset state on close
            setQuestions([])
            setSelectedQuestions([])
            setSearchTerm('')
        }
    }, [isOpen, debouncedSearch])

    const fetchQuestions = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('questions')
                .select(`
                    *,
                    answer_options(*),
                    quizzes!inner(title, is_public)
                `)
                .eq('quizzes.is_public', true)
                .order('created_at', { ascending: false })
                .limit(50)

            if (debouncedSearch) {
                query = query.ilike('question_text', `%${debouncedSearch}%`)
            }

            const { data, error } = await query

            if (error) throw error
            setQuestions(data || [])
        } catch (error) {
            console.error('Error fetching question bank:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleSelection = (question) => {
        if (selectedQuestions.find(q => q.id === question.id)) {
            setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id))
        } else {
            setSelectedQuestions([...selectedQuestions, question])
        }
    }

    const handleImport = () => {
        onImport(selectedQuestions)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <div className="modal-header">
                    <h2>Import from Question Bank</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search questions (e.g. HTML, Science...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="questions-list">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 size={30} className="spinner" />
                            <p>Loading questions...</p>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="empty-state">
                            <p>No public questions found.</p>
                        </div>
                    ) : (
                        questions.map(q => {
                            const isSelected = !!selectedQuestions.find(sq => sq.id === q.id)
                            return (
                                <div
                                    key={q.id}
                                    className={`bank-question-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => toggleSelection(q)}
                                >
                                    <div className="checkbox">
                                        {isSelected && <Check size={14} strokeWidth={4} />}
                                    </div>
                                    <div className="q-info">
                                        <p className="q-text">{q.question_text}</p>
                                        <div className="q-tags">
                                            <span className="quiz-tag">{q.quizzes?.title}</span>
                                            <span className="points-tag">{q.points} pts</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="modal-footer">
                    <div className="selection-count">
                        {selectedQuestions.length} selected
                    </div>
                    <button
                        className="btn btn-primary import-btn"
                        onClick={handleImport}
                        disabled={selectedQuestions.length === 0}
                    >
                        <Plus size={20} />
                        Import & Shuffle Options
                    </button>
                </div>
            </div>
        </div>
    )
}
