export const store = {
    data: {
        projects: [],
        activeId: null,
        memo: ""
    },

    init() {
        const saved = localStorage.getItem("zel_data");
        if (saved) {
            try {
                this.data = JSON.parse(saved);
                // Validação de integridade básica
                if (!Array.isArray(this.data.projects)) this.data.projects = [];
            } catch (e) {
                console.error("Erro ao carregar dados:", e);
                // Se der erro, mantém limpo mas não apaga o localStorage antigo por segurança
            }
        } else {
            // Cria projeto padrão se for a primeira vez
            this.createProject("Rascunho Inicial");
        }
    },

    save(content, memo, cursorPos) {
        // 1. Atualiza MEMO (Global)
        if (memo !== undefined) this.data.memo = memo;

        // 2. Atualiza PROJETO ATIVO
        if (this.data.activeId) {
            const active = this.data.projects.find(p => p.id === this.data.activeId);
            if (active) {
                // Só atualiza se veio conteúdo novo (evita undefined sobrescrever texto)
                if (content !== undefined) active.content = content;
                if (cursorPos !== undefined) active.cursorPos = cursorPos;
                
                // Atualiza data de modificação
                active.date = new Date().toLocaleString();
            }
        }

        // 3. PERSISTE NO DISCO (LocalStorage)
        this.persist();
    },

    persist() {
        localStorage.setItem("zel_data", JSON.stringify(this.data));
    },

    createProject(name, content = "") {
        const id = Date.now().toString();
        const newDoc = {
            id: id,
            name: name,
            content: content, // Começa com o conteúdo passado (ou vazio)
            date: new Date().toLocaleString(),
            cursorPos: 0
        };
        this.data.projects.unshift(newDoc); // Adiciona no topo
        this.setActive(id);
        this.persist();
    },

    setActive(id) {
        this.data.activeId = id;
        this.persist();
    },

    getActive() {
        if (!this.data.activeId && this.data.projects.length > 0) {
            this.setActive(this.data.projects[0].id);
        }
        return this.data.projects.find(p => p.id === this.data.activeId);
    },

    renameProject(id, newName) {
        const p = this.data.projects.find(p => p.id === id);
        if (p) {
            p.name = newName;
            this.persist();
        }
    },

    deleteProject(id) {
        this.data.projects = this.data.projects.filter(p => p.id !== id);
        if (this.data.activeId === id) {
            this.data.activeId = this.data.projects.length > 0 ? this.data.projects[0].id : null;
        }
        this.persist();
    },

    // --- IMPORTAR BACKUP ---
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            
            // Valida se é um backup válido do ZEL
            if (!imported.projects || !Array.isArray(imported.projects)) {
                alert("Erro: Arquivo inválido ou corrompido.");
                return false;
            }

            // Mesclar ou Substituir? Aqui vamos SUBSTITUIR para restaurar backup exato
            this.data = imported;
            this.persist();
            return true;
        } catch (e) {
            console.error(e);
            alert("Erro ao ler arquivo JSON.");
            return false;
        }
    },

    // --- HARD RESET ---
    hardReset() {
        localStorage.removeItem("zel_data");     // Dados
        localStorage.removeItem("lit_auth_key"); // Senha
        localStorage.removeItem("lit_lang");     // Idioma
        localStorage.removeItem("lit_pomo_target"); // Pomodoro
        localStorage.removeItem("lit_is_locked"); // Estado Lock
        location.reload(); // Renasce limpo
    },

    generateShareLink(text) {
        return window.location.origin + window.location.pathname + "#view=" + LZString.compressToEncodedURIComponent(text);
    }
};
