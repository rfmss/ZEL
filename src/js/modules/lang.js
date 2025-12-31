export const lang = {
    current: 'pt',
    db: {
        pt: {
            welcome: "INICIALIZANDO SISTEMA",
            create_pass: "CRIE SUA SENHA DE ACESSO",
            repeat_pass: "CONFIRME A SENHA",
            start_btn: "CRIAR SESSÃO",
            locked: "SISTEMA BLOQUEADO",
            unlock_btn: "DESBLOQUEAR",
            wrong_pass: "SENHA INCORRETA",
            reset_warn: "⚠️ PERIGO: ISSO APAGARÁ TUDO. CONTINUAR?"
        },
        en: {
            welcome: "SYSTEM BOOTING",
            create_pass: "CREATE ACCESS PASSWORD",
            repeat_pass: "CONFIRM PASSWORD",
            start_btn: "CREATE SESSION",
            locked: "SYSTEM LOCKED",
            unlock_btn: "UNLOCK",
            wrong_pass: "WRONG PASSWORD",
            reset_warn: "⚠️ WARNING: THIS WILL WIPE EVERYTHING. PROCEED?"
        },
        es: {
            welcome: "INICIANDO SISTEMA",
            create_pass: "CREAR CONTRASEÑA",
            repeat_pass: "CONFIRMAR CONTRASEÑA",
            start_btn: "CREAR SESIÓN",
            locked: "SISTEMA BLOQUEADO",
            unlock_btn: "DESBLOQUEAR",
            wrong_pass: "CONTRASEÑA INCORRECTA",
            reset_warn: "⚠️ PELIGRO: ESTO BORRARÁ TODO. ¿SEGUIR?"
        }
    },
    init() {
        const saved = localStorage.getItem('lit_lang') || 'pt';
        this.setLang(saved);
    },
    setLang(l) {
        this.current = l;
        localStorage.setItem('lit_lang', l);
        this.apply();
    },
    apply() {
        const t = this.db[this.current];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if(t[key]) el.innerText = t[key];
        });
        document.querySelectorAll('input[data-i18n-ph]').forEach(el => {
            const key = el.getAttribute('data-i18n-ph');
            if(t[key]) el.placeholder = t[key];
        });
    }
};
