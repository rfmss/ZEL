export const editorFeatures = {
    editor: null,
    fontList: ['"Share Tech Mono", monospace', '"IBM Plex Mono", monospace', '"VT323", monospace', '"Courier New", monospace'],
    journalFont: '"Cormorant Garamond", serif',
    
    // SFX Objects
    sfx: {
        type: new Audio("src/assets/audio/type.wav"),
        enter: new Audio("src/assets/audio/enter.wav"),
        backspace: new Audio("src/assets/audio/backspace.wav"),
        music: new Audio("src/assets/audio/music.mp3")
    },
    
    // Audio Engine
    audioCtx: null, sfxBuffers: {}, gainNode: null,
    musicPlayer: new Audio("src/assets/audio/music.mp3"),
    focusTimer: null,
    
    init(editorElement) {
        this.editor = editorElement;
        this.initFonts();
        this.initAudioEngine(); 
        this.initAudioUI();
        this.initSearch();
        this.initThemeObserver();
        this.initSensoryFeatures(); 
        this.initCleanPaste();
        this.initInlineCommands(); // Slash Commands
    },

    // --- COMANDOS INLINE (MÁGICA DO TECLADO) ---
    initInlineCommands() {
        this.editor.addEventListener('input', (e) => {
            const sel = window.getSelection();
            if (!sel.rangeCount) return;
            
            const node = sel.focusNode;
            if (node.nodeType !== 3) return; // Garante nó de texto

            const text = node.textContent;
            
            // Regex para capturar --comando no final
            const match = text.match(/(--[a-zA-Z]+)$/);
            
            if (match) {
                const command = match[1]; 
                
                if (this.executeInlineCommand(command)) {
                    // Apaga o comando do texto visualmente
                    const newText = text.substring(0, match.index);
                    node.textContent = newText;
                    
                    // Restaura cursor no final
                    const range = document.createRange();
                    range.setStart(node, newText.length);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        });
    },

    executeInlineCommand(cmd) {
        switch(cmd) {
            case '--h': // Agora é --h (Mais rápido)
                document.getElementById('helpModal').classList.add('active'); 
                // Foca na aba ativa para navegação imediata via teclado
                setTimeout(() => {
                    const activeTab = document.querySelector('.help-tab.active');
                    if(activeTab) activeTab.focus();
                }, 50);
                return true;
            case '--save':
                document.getElementById('exportModal').classList.add('active');
                return true;
            case '--open':
                document.getElementById('btnImport').click();
                return true;
            case '--theme':
                document.getElementById('btnThemeToggle').click();
                return true;
            case '--dark':
                document.body.setAttribute("data-theme", "tva");
                localStorage.setItem("lit_theme_pref", "tva");
                return true;
            case '--light':
                document.body.setAttribute("data-theme", "ibm-light");
                localStorage.setItem("lit_theme_pref", "ibm-light");
                return true;
            case '--zen':
            case '--fs':
                this.toggleFullscreen();
                return true;
            case '--music':
                document.getElementById('btnAudio').click();
                return true;
            case '--pomo':
                const pBtn = document.getElementById('pomodoroBtn');
                if(pBtn) pBtn.click();
                return true;
            default: return false; 
        }
    },

    // --- CLEAN PASTE ---
    initCleanPaste() {
        this.editor.addEventListener("paste", (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData("text/plain");
            document.execCommand("insertText", false, text);
            this.playSound('type');
        });
    },

    // --- AUDIO ENGINE ---
    initAudioEngine() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = 0.3; 
        this.gainNode.connect(this.audioCtx.destination);

        this.loadBuffer('type', 'src/assets/audio/type.wav');
        this.loadBuffer('enter', 'src/assets/audio/enter.wav');
        this.loadBuffer('backspace', 'src/assets/audio/backspace.wav');
        
        this.musicPlayer.volume = 0.5;
        this.musicPlayer.loop = true;
    },

    async loadBuffer(name, url) {
        try {
            const r = await fetch(url);
            const b = await r.arrayBuffer();
            this.sfxBuffers[name] = await this.audioCtx.decodeAudioData(b);
        } catch (e) { console.warn(`Erro som ${name}:`, e); }
    },

    playSound(name) {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const b = this.sfxBuffers[name];
        if (!b) return;
        const s = this.audioCtx.createBufferSource();
        s.buffer = b; s.connect(this.gainNode); s.start(0);
    },

    // --- SENSORY ---
    initSensoryFeatures() {
        this.editor.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.playSound('enter');
            else if (e.key === "Backspace") this.playSound('backspace');
            else if (!e.metaKey && !e.ctrlKey) this.playSound('type');
            
            this.triggerFocusMode();
            this.handleTypewriterScroll();
        });
        document.addEventListener("click", (e) => { if (e.target !== this.editor) this.resetFocusMode(false); });
    },

    triggerFocusMode() {
        document.body.classList.remove("slow-return"); 
        document.body.classList.add("focus-active"); 
        clearTimeout(this.focusTimer);
        this.focusTimer = setTimeout(() => { this.resetFocusMode(true); }, 10000);
    },

    resetFocusMode(slow) {
        clearTimeout(this.focusTimer);
        if (slow) document.body.classList.add("slow-return");
        document.body.classList.remove("focus-active");
    },

    handleTypewriterScroll() {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const r = sel.getRangeAt(0).getBoundingClientRect();
            const h = window.innerHeight;
            if (r.top > (h / 2)) {
                if (this.editor.parentElement) this.editor.parentElement.scrollBy({ top: r.top - (h / 2), behavior: 'smooth' });
            }
        }
    },

    // --- THEME & FONT ---
    initThemeObserver() {
        const obs = new MutationObserver((mutations) => {
            mutations.forEach((m) => { if (m.attributeName === "data-theme") this.applyFont(); });
        });
        obs.observe(document.body, { attributes: true });
    },

    initFonts() {
        this.applyFont();
        document.getElementById("btnFontType").onclick = () => {
            if (document.body.getAttribute("data-theme") === "journal") return;
            let i = parseInt(localStorage.getItem("lit_pref_font")) || 0;
            i = (i + 1) % this.fontList.length;
            localStorage.setItem("lit_pref_font", i);
            this.applyFont();
        };
        document.getElementById("fontPlus").onclick = () => {
            let s = parseInt(window.getComputedStyle(this.editor).fontSize);
            this.editor.style.fontSize = (s + 2) + "px";
        };
        document.getElementById("fontMinus").onclick = () => {
            let s = parseInt(window.getComputedStyle(this.editor).fontSize);
            this.editor.style.fontSize = (s - 2) + "px";
        };
    },

    applyFont() {
        const t = document.body.getAttribute("data-theme");
        if (t === "journal") {
            this.editor.style.fontFamily = this.journalFont;
            this.editor.style.fontSize = "24px";
            this.editor.style.lineHeight = "1.8";
        } else {
            let i = parseInt(localStorage.getItem("lit_pref_font")) || 0;
            this.editor.style.fontFamily = this.fontList[i];
            this.editor.style.fontSize = (i === 2) ? "26px" : "22px";
            this.editor.style.lineHeight = "1.7";
        }
    },

    initAudioUI() {
        const btn = document.getElementById("btnAudio");
        btn.onclick = () => {
            if(this.musicPlayer.paused) { 
                // Fade In
                this.musicPlayer.volume = 0;
                this.musicPlayer.play().catch(e => {}); 
                let vol = 0;
                const fade = setInterval(() => { if (vol < 0.5) { vol += 0.05; this.musicPlayer.volume = vol; } else clearInterval(fade); }, 100);
                btn.innerHTML = '<i class="ph ph-pause"></i> SOM'; btn.classList.add("active");
            } else { 
                // Fade Out
                let vol = this.musicPlayer.volume;
                const fade = setInterval(() => { 
                    if (vol > 0.05) { vol -= 0.05; this.musicPlayer.volume = vol; } 
                    else { clearInterval(fade); this.musicPlayer.pause(); } 
                }, 100);
                btn.innerHTML = '<i class="ph ph-speaker-high"></i> SOM'; btn.classList.remove("active");
            }
        };
    },

    initSearch() {
        const i = document.getElementById("search");
        const b = document.getElementById("btnSearch");
        const c = document.getElementById("btnClear");
        const s = () => {
            const v = i.value.trim(); if(!v) return;
            const t = this.editor.innerHTML.replace(/<\/?mark>/g, ""); 
            if(t.match(new RegExp(`(${v})`, "gi"))) this.editor.innerHTML = t.replace(new RegExp(`(${v})`, "gi"), "<mark>$1</mark>");
        };
        b.onclick = s;
        c.onclick = () => { this.editor.innerHTML = this.editor.innerHTML.replace(/<\/?mark>/g, ""); i.value = ""; };
    },

    exportTxt() {
        const b = new Blob([this.editor.innerText], {type:"text/plain"});
        const a = document.createElement("a"); a.href = window.URL.createObjectURL(b);
        a.download = `ZEL_Doc_${Date.now()}.txt`; a.click();
    },

    insertChapter() {
        document.execCommand('insertHTML', false, `<br><div style="border-bottom:1px dashed var(--color-accent); opacity:0.5; margin:30px 0;"></div><h2 class="chapter-mark" style="color:var(--color-accent); margin-top:0;">NOVO CAPÍTULO</h2><p>...</p>`);
    },
    
    toggleFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else if (document.exitFullscreen) document.exitFullscreen();
    }
};
