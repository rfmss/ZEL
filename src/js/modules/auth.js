import { store } from './store.js';
import { lang } from './lang.js';

export const auth = {
    init() {
        const hasKey = localStorage.getItem('lit_auth_key');
        
        // Verifica o estado do "Cadeado"
        // Se lit_is_locked for 'true', significa que o usuário bloqueou manualmente (Alt+L)
        // Se for 'false' ou null, e tiver senha, significa que foi um F5 e deve liberar direto.
        
        if (!hasKey) {
            // Sem senha criada -> Vai para Setup
            this.showSetup();
        } else {
            const isLocked = localStorage.getItem('lit_is_locked');
            if (isLocked === 'true') {
                // Estava bloqueado manualmente -> Mostra cadeado
                this.lock(); 
            } else {
                // Estava desbloqueado -> Libera direto (Resistência a F5)
                this.unlock(true); 
            }
        }

        this.setupEvents();
    },

    setupEvents() {
        // Seleção de Idioma
        document.querySelectorAll('.flag-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.flag-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                lang.setLang(btn.getAttribute('data-lang'));
            };
        });

        // Criação de Sessão
        document.getElementById('btnCreateSession').onclick = () => {
            const p1 = document.getElementById('setupPass1').value;
            const p2 = document.getElementById('setupPass2').value;
            if (p1 && p1 === p2 && p1.trim() !== "") {
                localStorage.setItem('lit_auth_key', p1);
                this.unlock();
            } else {
                alert("Senhas inválidas ou divergentes.");
            }
        };

        // Lógica de Desbloqueio
        const tryUnlock = () => {
            const input = document.getElementById('authPass');
            const stored = localStorage.getItem('lit_auth_key');
            
            if (input.value === stored) {
                this.unlock();
            } else {
                this.shakeInput(input);
            }
        };

        document.getElementById('btnUnlock').onclick = tryUnlock;
        document.getElementById('authPass').onkeydown = (e) => { if(e.key === 'Enter') tryUnlock(); };

        // Botão de Pânico (Caveira) - AGORA COM PROTEÇÃO
        document.getElementById('emergencyReset').onclick = () => {
            const stored = localStorage.getItem('lit_auth_key');
            // Pede a senha para confirmar a destruição
            const pass = prompt("DIGITE A SENHA DE ACESSO PARA CONFIRMAR O EXTERMÍNIO:");
            
            if (pass === stored) {
                if(confirm(lang.db[lang.current].reset_warn)) {
                    store.hardReset();
                }
            } else {
                alert("SENHA INCORRETA. OPERAÇÃO CANCELADA.");
            }
        };
    },

    // Ação de Bloquear (Chamada pelo Alt+L)
    lock() {
        const gate = document.getElementById('gatekeeper');
        const viewSetup = document.getElementById('viewSetup');
        const viewLock = document.getElementById('viewLock');

        localStorage.setItem('lit_is_locked', 'true'); // Grava que está trancado
        
        gate.style.display = 'flex';
        gate.style.opacity = '1';
        viewSetup.style.display = 'none';
        viewLock.style.display = 'flex';
        
        setTimeout(() => {
            const input = document.getElementById('authPass');
            if(input) input.focus();
        }, 100);
    },

    // Ação de Desbloquear
    unlock(skipAnim = false) {
        const gate = document.getElementById('gatekeeper');
        localStorage.setItem('lit_is_locked', 'false'); // Grava que está livre
        
        if (skipAnim) {
            gate.style.display = 'none';
        } else {
            gate.style.opacity = '0';
            setTimeout(() => gate.style.display = 'none', 500);
        }
        
        // Limpa o input para a próxima vez
        const input = document.getElementById('authPass');
        if(input) input.value = '';
    },

    showSetup() {
        document.getElementById('gatekeeper').style.display = 'flex';
        document.getElementById('viewSetup').style.display = 'flex';
        document.getElementById('viewLock').style.display = 'none';
    },

    shakeInput(el) {
        const msg = document.getElementById('authMsg');
        if(msg) {
            msg.innerText = lang.db[lang.current].wrong_pass;
            msg.style.color = '#ff4444';
        }
        el.value = '';
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 500);
    }
};
