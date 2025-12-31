export const ui = {
    elements: {},
    pomodoroInterval: null,
    
    init() {
        this.elements = {
            hud: document.querySelector(".hud"),
            drawer: document.getElementById("drawer"),
            drawerTitle: document.getElementById("drawerTitle"),
            projectList: document.getElementById("projectList"),
            chapterList: document.getElementById("chapterList"),
            memoArea: document.getElementById("memoArea"),
            mobileTrigger: document.getElementById("mobileTrigger"),
            panels: {
                files: document.getElementById("panelFiles"),
                nav: document.getElementById("panelNav"),
                memo: document.getElementById("panelMemo")
            }
        };
        this.initTheme();
        this.initMobile();
    },

    // --- POMODORO SOBERANO (TIMESTAMP) ---
    initPomodoro() {
        // Cria o botão na interface se não existir
        const controls = document.querySelector(".controls-inner");
        if (controls && !document.getElementById("pomodoroBtn")) {
            const div = document.createElement("div"); div.className = "divider"; controls.appendChild(div);
            const btn = document.createElement("button");
            btn.className = "btn"; btn.id = "pomodoroBtn";
            btn.innerHTML = `<i class="ph ph-timer"></i> 25:00`;
            btn.onclick = () => this.togglePomodoro();
            controls.appendChild(btn);
        }
        
        // Verifica se já existe um timer rodando (Resistência a F5)
        this.checkPomodoroState();
    },

    togglePomodoro() {
        const activeTarget = localStorage.getItem("lit_pomo_target");
        
        if (activeTarget) {
            // Se tem alvo, o clique significa PARAR
            this.stopPomodoro();
        } else {
            // Se não tem, o clique significa INICIAR
            // Define o alvo para 25 minutos a partir de agora
            const targetTime = Date.now() + (25 * 60 * 1000); 
            localStorage.setItem("lit_pomo_target", targetTime);
            this.startTicker();
        }
    },

    stopPomodoro() {
        clearInterval(this.pomodoroInterval);
        localStorage.removeItem("lit_pomo_target");
        const btn = document.getElementById("pomodoroBtn");
        if(btn) {
            btn.innerHTML = `<i class="ph ph-timer"></i> 25:00`;
            btn.classList.remove("active");
        }
    },

    checkPomodoroState() {
        const target = localStorage.getItem("lit_pomo_target");
        if (target) {
            // Se existe um alvo salvo, verifica se ainda é válido
            if (parseInt(target) > Date.now()) {
                this.startTicker(); // O tempo ainda não acabou, retoma o contador
            } else {
                this.stopPomodoro(); // O tempo acabou enquanto o site estava fechado
            }
        }
    },

    startTicker() {
        const btn = document.getElementById("pomodoroBtn");
        if(!btn) return;
        
        btn.classList.add("active");
        
        // Limpa qualquer intervalo anterior para evitar duplicidade
        clearInterval(this.pomodoroInterval);

        this.pomodoroInterval = setInterval(() => {
            const target = parseInt(localStorage.getItem("lit_pomo_target"));
            if (!target) { this.stopPomodoro(); return; }

            const now = Date.now();
            const diff = target - now;

            if (diff <= 0) {
                // TEMPO ESGOTADO
                this.stopPomodoro();
                btn.innerHTML = "ACABOU!";
                new Audio("src/assets/audio/enter.wav").play().catch(()=>{}); 
                alert("⏰ POMODORO FINALIZADO!");
            } else {
                // ATUALIZA VISOR
                const min = Math.floor((diff / 1000) / 60).toString().padStart(2, '0');
                const sec = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
                btn.innerHTML = `<i class="ph ph-timer"></i> ${min}:${sec}`;
            }
        }, 1000); // Atualiza a cada segundo
    },

    // --- TEMA E UI (Mantido inalterado, apenas encapsulado corretamente) ---
    initTheme() {
        const currentTheme = localStorage.getItem("lit_theme_pref") || "tva";
        document.body.setAttribute("data-theme", currentTheme);
    },

    toggleTheme() {
        const themes = ["tva", "ibm-light", "ibm-dark", "ibm-blue", "journal", "terminal"];
        const current = document.body.getAttribute("data-theme");
        let nextIndex = themes.indexOf(current) + 1;
        if (nextIndex >= themes.length) nextIndex = 0;
        const newTheme = themes[nextIndex];
        document.body.setAttribute("data-theme", newTheme);
        localStorage.setItem("lit_theme_pref", newTheme);
    },

    initMobile() {
        if(this.elements.mobileTrigger) {
            this.elements.mobileTrigger.onclick = (e) => {
                e.stopPropagation();
                this.elements.hud.classList.toggle("mobile-open");
            };
        }
    },

    openDrawer(panelName, callbacks) {
        const { drawer, panels, hud } = this.elements;
        if (drawer.classList.contains("open") && panels[panelName].style.display === "block") {
            this.closeDrawer();
            return;
        }
        Object.values(panels).forEach(p => p.style.display = "none");
        document.querySelectorAll(".hud-btn").forEach(b => b.classList.remove("active"));

        panels[panelName].style.display = "block";
        drawer.classList.add("open");
        if(window.innerWidth <= 900) hud.classList.add("mobile-open");

        const titles = { files: "ARQUIVOS", nav: "NAVEGAÇÃO", memo: "MEMO" };
        this.elements.drawerTitle.innerText = titles[panelName];

        if(panelName === 'files' && callbacks.renderFiles) callbacks.renderFiles();
        if(panelName === 'nav' && callbacks.renderNav) callbacks.renderNav();
    },

    closeDrawer() {
        this.elements.drawer.classList.remove("open");
        document.querySelectorAll(".hud-btn").forEach(b => b.classList.remove("active"));
        if(window.innerWidth <= 900) this.elements.hud.classList.remove("mobile-open");
    }
};
