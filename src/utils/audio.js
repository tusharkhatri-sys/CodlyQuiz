class AudioManager {
    constructor() {
        this.bgm = {
            lobby: new Audio('/sounds/lobby.mp3'),
            game: new Audio('/sounds/game.mp3'),
        }

        // Loop BGMs
        Object.values(this.bgm).forEach(audio => {
            audio.loop = true
            audio.volume = 0.3
        })

        this.sfx = {
            correct: new Audio('/sounds/correct.mp3'),
            wrong: new Audio('/sounds/wrong.mp3'),
            tick: new Audio('/sounds/tick.mp3'),
            join: new Audio('/sounds/join.mp3'),
            start: new Audio('/sounds/start.mp3'),
            win: new Audio('/sounds/win.mp3'),
        }

        // Set volumes
        this.sfx.correct.volume = 0.6
        this.sfx.wrong.volume = 0.6
        this.sfx.join.volume = 0.5

        this.currentBgm = null
        this.isMuted = localStorage.getItem('quiz_muted') === 'true'
        this.applyMute()
    }

    playBgm(type) {
        if (this.currentBgm) {
            this.currentBgm.pause()
            this.currentBgm.currentTime = 0
        }

        if (this.bgm[type]) {
            this.currentBgm = this.bgm[type]
            if (!this.isMuted) {
                this.currentBgm.play().catch(e => console.log('Audio autoplay blocked:', e))
            }
        }
    }

    stopBgm() {
        if (this.currentBgm) {
            this.currentBgm.pause()
            this.currentBgm.currentTime = 0
            this.currentBgm = null
        }
    }

    playSfx(type) {
        if (this.isMuted) return

        if (this.sfx[type]) {
            const sound = this.sfx[type].cloneNode()
            sound.volume = this.sfx[type].volume
            sound.play().catch(e => console.log('SFX play blocked:', e))
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted
        localStorage.setItem('quiz_muted', this.isMuted)
        this.applyMute()
        return this.isMuted
    }

    applyMute() {
        if (this.isMuted) {
            if (this.currentBgm) this.currentBgm.pause()
        } else {
            if (this.currentBgm) this.currentBgm.play().catch(() => { })
        }
    }
}

export const audioManager = new AudioManager()
