/* * ZEL OS v5.5 - CORE MODULE
 * Fixes: Memo persistence bug (Ghost Data)
 */

import { store } from './modules/store.js';
import { ui } from './modules/ui.js';
import { editorFeatures } from './modules/editor.js';
import { lang } from './modules/lang.js';
import { auth } from './modules/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 ZEL SYSTEM BOOTING v5.5...");

    store.init();
    ui.init();
    
    lang.init();
    auth.init();
    
    ui.initPomodoro();
    
    const editorEl = document.getElementById("editor");
    editorFeatures.init(editorEl);
    
    loadActiveDocument();
    setupEventListeners();

    // TRAVA DE SEGURANÇA (Anti-Close)
    window.addEventListener("beforeunload", (e) => {
        e.preventDefault();
        e.returnValue = "Deseja encerrar o sistema ZEL?";
    });
});

function loadActiveDocument() {
    const activeDoc = store.getActive();
    const editorEl = document.getElementById("editor");
    
    if (activeDoc) {
        // Carrega o conteúdo salvo
        editorEl.innerHTML = activeDoc.content || ""; 
        
        const docLabel = (lang.db && lang.db[lang.current]) ? lang.db[lang.current].doc_label : "DOC:";
        document.getElementById("currentDocLabel").innerText = `${docLabel} ${activeDoc.name}`;
        
        // [CORREÇÃO v5.5] Força a limpeza do campo Memo
        // Usa o operador || "" para garantir que se for null/undefined, ele limpa o campo visualmente
        document.getElementById("memoArea").value = store.data.memo || "";
        
        if (activeDoc.cursorPos) {
            setTimeout(() => editorFeatures.setCursorPos(activeDoc.cursorPos), 100);
        } else {
            const gate = document.getElementById("gatekeeper");
            if (!gate || gate.style.display === "none") {
                editorEl.focus(); 
            }
        }
    }
}

function setupEventListeners() {
    initHelpTabs();

    // Gavetas
    document.getElementById("tabFiles").onclick = () => ui.openDrawer('files', { renderFiles: renderProjectList });
    document.getElementById("tabNav").onclick = () => ui.openDrawer('nav', { renderNav: renderNavigation });
    document.getElementById("tabMemo").onclick = () => ui.openDrawer('memo', {});
    document.getElementById("closeDrawer").onclick = () => ui.closeDrawer();

    document.addEventListener('click', (e) => {
        const d = document.getElementById("drawer");
        const h = document.querySelector(".hud");
        if (e.target.closest('#gatekeeper')) return;
        if (d.classList.contains("open") && !d.contains(e.target) && !h.contains(e.target)) ui.closeDrawer();
    });

    // Importar/Exportar
    const btnImport = document.getElementById("btnImport");
    const fileInput = document.getElementById("fileInput");
    btnImport.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (file.name.endsWith('.json')) {
                if (store.importData(evt.target.result)) { 
                    alert("✅ BACKUP RESTAURADO COM SUCESSO!"); 
                    location.reload(); 
                }
            } else {
                store.createProject(file.name, evt.target.result); 
                loadActiveDocument(); renderProjectList(); ui.closeDrawer();
            }
        };
        reader.readAsText(file);
        fileInput.value = ''; 
    };

    document.getElementById("btnSave").onclick = () => document.getElementById("exportModal").classList.add("active");
    document.getElementById("closeModalExport").onclick = () => document.getElementById("exportModal").classList.remove("active");

    // Downloads e QR
    document.getElementById("actionDownloadJson").onclick = () => {
        store.save(document.getElementById("editor").innerHTML, document.getElementById("memoArea").value);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.data));
        const a = document.createElement('a'); a.href = dataStr; a.download = `ZEL_BACKUP_${Date.now()}.json`; a.click();
    };
    document.getElementById("actionDownloadTxt").onclick = () => editorFeatures.exportTxt();
    
    document.getElementById("actionQrCode").onclick = () => {
        const qrContainer = document.getElementById("qrContainer");
        const qrDiv = document.getElementById("qrcode");
        const linkZone = document.getElementById("qrLinkZone");
        qrDiv.innerHTML = ""; linkZone.innerHTML = ""; qrContainer.style.display = "block";
        const text = document.getElementById("editor").innerText;
        const magicLink = store.generateShareLink(text);
        if (magicLink.length > 2800) alert("⚠️ TEXTO MUITO LONGO.");
        else new QRCode(qrDiv, { text: magicLink, width: 180, height: 180, correctLevel : QRCode.CorrectLevel.L });
    };

    document.getElementById("closeModalHelp").onclick = () => document.getElementById("helpModal").classList.remove("active");

    // Evento do Botão Lock
    const btnLock = document.getElementById("btnLock");
    if(btnLock) btnLock.onclick = () => auth.lock();

    // Teclas
    const searchInput = document.getElementById("search");
    const editorEl = document.getElementById("editor");
    
    document.addEventListener("keydown", (e) => {
        const gate = document.getElementById("gatekeeper");
        if (gate && gate.style.display !== "none" && gate.style.display !== "") return;

        if (e.key === "F1") { 
            e.preventDefault(); 
            document.getElementById("helpModal").classList.add("active"); 
            setTimeout(() => {
                const activeTab = document.querySelector('.help-tab.active');
                if(activeTab) activeTab.focus();
            }, 50);
        } 
        
        if ((e.ctrlKey && e.shiftKey && e.code === "KeyF") || e.key === "F11") { e.preventDefault(); editorFeatures.toggleFullscreen(); }
        if (e.key === "Enter" && document.activeElement === searchInput) document.getElementById("btnSearch").click();
        if (e.ctrlKey && e.key === "f") { e.preventDefault(); searchInput.focus(); }

        if (e.key === "Escape") {
            if (document.activeElement === searchInput) { document.getElementById("btnClear").click(); searchInput.blur(); }
            let closed = false;
            document.querySelectorAll(".modal-overlay.active").forEach(m => { 
                if (m.id !== "gatekeeper") {
                    m.classList.remove("active"); 
                    if(m.id==="resetModal") {
                        document.getElementById("step2Reset").style.display="none"; 
                        document.getElementById("resetPassInput").value = "";
                        document.getElementById("resetMsg").innerText = "";
                    }
                    closed=true; 
                }
            });
            if(document.getElementById("drawer").classList.contains("open")) { ui.closeDrawer(); closed=true; }
            if(closed) editorEl.focus();
        }

        if (e.altKey) {
            if (e.key === "1") { e.preventDefault(); ui.openDrawer('files', { renderFiles: renderProjectList }); }
            if (e.key === "2") { e.preventDefault(); ui.openDrawer('nav', { renderNav: renderNavigation }); }
            if (e.key === "3") { e.preventDefault(); ui.openDrawer('memo', {}); }
            if (e.key === "0") { e.preventDefault(); ui.closeDrawer(); }
            if (e.code === "KeyL") { e.preventDefault(); auth.lock(); }
            if (e.code === "KeyT") { e.preventDefault(); ui.toggleTheme(); }
            if (e.code === "KeyM") { e.preventDefault(); document.getElementById("btnAudio").click(); }
            if (e.code === "KeyP") { e.preventDefault(); ui.togglePomodoro(); }
            if (e.code === "KeyF") { e.preventDefault(); document.getElementById("btnFontType").click(); }
        }

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 's') { e.preventDefault(); document.getElementById("btnSave").click(); }
            if (e.key === 'o') { e.preventDefault(); document.getElementById("fileInput").click(); }
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const activeTag = document.activeElement.tagName.toLowerCase();
            if (activeTag !== 'input' && activeTag !== 'textarea' && document.activeElement !== editorEl) {
                e.preventDefault(); editorEl.focus();   
                const activeDoc = store.getActive();
                if(activeDoc && activeDoc.cursorPos) editorFeatures.setCursorPos(activeDoc.cursorPos);
                document.execCommand("insertText", false, e.key);
                editorFeatures.playSound('type');
                editorFeatures.triggerFocusMode();
            }
        }
    });

    const btnInsert = document.getElementById("btnInsertChapter");
    if (btnInsert) btnInsert.onclick = () => { editorFeatures.insertChapter(); ui.openDrawer('nav', { renderNav: renderNavigation }); };

    document.querySelectorAll(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", (e) => {
            if (overlay.id === "gatekeeper") return;
            if (e.target === overlay) {
                overlay.classList.remove("active");
                if(overlay.id === "resetModal") {
                     document.getElementById("step2Reset").style.display = "none";
                     document.getElementById("resetPassInput").value = "";
                     document.getElementById("resetMsg").innerText = "";
                }
            }
        });
    });

    document.getElementById("btnNewProject").onclick = () => {
        const name = prompt("Nome do Arquivo:");
        if(name) { store.createProject(name); loadActiveDocument(); renderProjectList(); }
    };
    
    document.getElementById("btnThemeToggle").onclick = () => ui.toggleTheme();
    document.getElementById("hudFs").onclick = () => editorFeatures.toggleFullscreen();
    
    // --- LÓGICA DA CAVEIRA (Reset Interno) ---
    const resetModal = document.getElementById("resetModal");
    const step2 = document.getElementById("step2Reset");
    const passInput = document.getElementById("resetPassInput");
    const msg = document.getElementById("resetMsg");

    document.getElementById("btnHardReset").onclick = () => {
        resetModal.classList.add("active");
        step2.style.display = "none";
        if(passInput) passInput.value = "";
        if(msg) msg.innerText = "";
    };
    
    document.getElementById("closeModalReset").onclick = () => resetModal.classList.remove("active");
    
    document.getElementById("btnConfirmReset1").onclick = () => {
        step2.style.display = "block";
        setTimeout(() => { if(passInput) passInput.focus(); }, 100);
    };
    
    const triggerReset = () => {
        const storedKey = localStorage.getItem('lit_auth_key');
        const inputVal = passInput ? passInput.value : "";
        
        if (!storedKey || inputVal === storedKey) {
            if(msg) msg.innerText = "EXECUTANDO PROTOCOLO...";
            setTimeout(() => store.hardReset(), 500); 
        } else {
            if(msg) msg.innerText = "SENHA INCORRETA. ACESSO NEGADO.";
            if(passInput) {
                passInput.value = "";
                passInput.focus();
                passInput.classList.add('shake');
                setTimeout(() => passInput.classList.remove('shake'), 500);
            }
        }
    };

    document.getElementById("btnConfirmReset2").onclick = triggerReset;
    
    if(passInput) {
        passInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") triggerReset();
        });
    }

    editorEl.addEventListener("input", () => {
        const cursorPos = editorFeatures.getCursorPos();
        store.save(editorEl.innerHTML, document.getElementById("memoArea").value, cursorPos);
    });
    
    editorEl.addEventListener("keyup", () => store.save(undefined, undefined, editorFeatures.getCursorPos()));
    editorEl.addEventListener("click", () => store.save(undefined, undefined, editorFeatures.getCursorPos()));
    
    document.getElementById("memoArea").addEventListener("input", (e) => store.save(undefined, e.target.value));
}

// Funções auxiliares mantidas iguais
function initHelpTabs() {
    const tabs = document.querySelectorAll('.help-tab');
    const panels = document.querySelectorAll('.help-panel');
    tabs.forEach((tab, index) => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        };
        tab.addEventListener('keydown', (e) => {
            let targetIndex = null;
            if (e.key === 'ArrowRight') targetIndex = index + 1;
            if (e.key === 'ArrowLeft') targetIndex = index - 1;
            if (targetIndex !== null) {
                if (targetIndex < 0) targetIndex = tabs.length - 1;
                if (targetIndex >= tabs.length) targetIndex = 0;
                tabs[targetIndex].focus(); tabs[targetIndex].click(); 
            }
        });
    });
}

function renderProjectList() {
    const list = document.getElementById("projectList");
    list.innerHTML = "";
    store.data.projects.forEach(proj => {
        const div = document.createElement("div");
        div.className = `list-item ${proj.id === store.data.activeId ? 'active' : ''}`;
        div.style.display = "flex"; div.style.alignItems = "center"; div.style.justifyContent = "space-between"; div.style.gap = "10px";

        const infoDiv = document.createElement("div");
        infoDiv.style.flex = "1"; infoDiv.style.cursor = "pointer";
        infoDiv.innerHTML = `<div class="file-name-display">${proj.name}</div><div class="list-item-meta">${proj.date.split(',')[0]}</div>`;
        infoDiv.onclick = () => { store.setActive(proj.id); loadActiveDocument(); renderProjectList(); };

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "file-actions-inline"; actionsDiv.style.display = "flex"; actionsDiv.style.gap = "5px";

        const btnEdit = document.createElement("button");
        btnEdit.className = "btn-icon-small"; btnEdit.innerHTML = "<i class='ph ph-pencil-simple'></i>";
        btnEdit.onclick = (e) => { e.stopPropagation(); enableInlineRename(infoDiv, proj.id, proj.name); };

        const btnDel = document.createElement("button");
        btnDel.className = "btn-icon-small danger"; btnDel.innerHTML = "<i class='ph ph-trash'></i>";
        btnDel.onclick = (e) => { e.stopPropagation(); if(confirm(`Apagar "${proj.name}"?`)) { store.deleteProject(proj.id); renderProjectList(); if(store.data.projects.length>0) loadActiveDocument(); } };

        actionsDiv.appendChild(btnEdit); actionsDiv.appendChild(btnDel);
        div.appendChild(infoDiv); div.appendChild(actionsDiv);
        list.appendChild(div);
    });
}

function enableInlineRename(container, id, currentName) {
    container.onclick = null;
    container.innerHTML = `<input type="text" class="inline-rename-input" value="${currentName}">`;
    const input = container.querySelector("input"); input.focus();
    const save = () => { if(input.value.trim()) { store.renameProject(id, input.value); } renderProjectList(); };
    input.addEventListener("blur", save);
    input.addEventListener("keydown", (e) => { if(e.key === "Enter") input.blur(); });
}

function renderNavigation() {
    const list = document.getElementById("chapterList"); list.innerHTML = "";
    const headers = document.getElementById("editor").querySelectorAll("h1, h2, .chapter-mark");
    if (headers.length === 0) { list.innerHTML = "<div class='help-text'>Use 'Inserir Marcador' para navegar.</div>"; return; }
    headers.forEach((header, index) => {
        const div = document.createElement("div"); div.className = "list-item"; div.style.justifyContent = "flex-start";
        div.innerHTML = `<i class=\"ph ph-caret-right\" style=\"margin-right:8px;\"></i> ${header.innerText || "Capítulo " + (index+1)}`;
        div.onclick = () => header.scrollIntoView({ behavior: "smooth", block: "center" });
        list.appendChild(div);
    });
}
