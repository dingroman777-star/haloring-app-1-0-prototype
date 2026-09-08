/* HAL-02 manages existing local conversations; browsing never changes message dates. */
(() => {
  window.createHaloHistory = function ({ state, screen, modalRoot, esc, go, write, checkSaved, newSource, closeModal, track }) {
    let query = String(state.conversationQuery || ""), filter = "all", mounted = false, commerceBaseline = null, deletion = null;
    const labels = { draft: "草稿", active: "可继续", paused: "已暂停", archived: "已归档" };
    const encoded = id => encodeURIComponent(id);
    const find = id => state.conversations.find(c => c.id === id && c.status !== "deleted");
    const clock = value => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
    const title = c => String(c.title || "未命名对话");
    const preview = c => c.draft?.trim() ? `草稿：${c.draft.trim()}` : String(c.messages?.at(-1)?.text || "还没有发送消息");
    function date(value) {
      if (!clock(value)) return "日期未记录";
      const d = new Date(value), now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      return sameDay ? `今天 ${d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}` : d.toLocaleDateString("zh-CN", { ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}), month: "numeric", day: "numeric" });
    }
    function readCommerce() {
      try { const raw = localStorage.getItem("haloV5CommercialProgress"); const value = JSON.parse(raw); return value && typeof value === "object" && !Array.isArray(value) ? JSON.stringify(value) : null; } catch { return null; }
    }
    function feedback(text, failed = false) {
      const node = modalRoot.querySelector(".hh-modal-error") || screen.querySelector(".hh-feedback");
      if (!node) return;
      node.textContent = text; node.classList.toggle("is-error", failed); node.setAttribute("role", failed ? "alert" : "status");
      if (failed) { node.setAttribute("tabindex", "-1"); node.focus({ preventScroll: true }); node.scrollIntoView({ block: "nearest" }); }
    }
    function safe(show = true) {
      if (state.current !== "HAL-02" || !mounted) return false;
      let message = checkSaved();
      if (!message) {
        const current = readCommerce();
        if (!current) message = "暂时无法核对本机记录，请稍后重试。原记录没有改变。";
        else if (!commerceBaseline || current !== commerceBaseline) message = "记录已在其他页面更新。请刷新后再操作，最新内容会保留。";
      }
      if (message && show) feedback(message, true);
      return !message;
    }
    function commit(changes) {
      if (!safe()) return false;
      if (!write(changes)) { feedback("这次没能保存，原对话没有改变。请重试。", true); return false; }
      return true;
    }
    function results() {
      const all = state.conversations.filter(c => c.status !== "deleted");
      const needle = query.trim().toLocaleLowerCase();
      const matched = all.filter(c => (filter === "all" || (filter === "draft" ? c.status === "draft" || Boolean(c.draft?.trim()) : c.status === filter)) && (!needle || [c.title, c.draft, ...(c.messages || []).map(m => m.text)].join(" ").toLocaleLowerCase().includes(needle))).sort((a,b) => clock(b.updatedAt) - clock(a.updatedAt));
      if (!matched.length) {
        const heading = needle ? "没有找到相关对话" : filter === "draft" ? "没有未发送的草稿" : filter === "archived" ? "还没有归档的对话" : "从第一句开始";
        const description = needle ? "换个关键词，或清除搜索再看看。" : filter === "draft" ? "在对话里输入但还没发送的内容，会保留在这里。" : filter === "archived" ? "归档后仍可查看，也能随时继续。" : "和 Halo 聊过的内容，会保存在这里。";
        return `<section class="hh-empty"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 9h28a5 5 0 0 1 5 5v17a5 5 0 0 1-5 5H23l-12 7v-7h-1a5 5 0 0 1-5-5V14a5 5 0 0 1 5-5Z"/><path d="M15 20h18M15 27h11"/></svg><h2>${heading}</h2><p>${description}</p><button type="button" class="primary" data-action="${needle ? "history:clear" : filter !== "all" ? "history:filter:all" : "history:new"}">${needle ? "清除搜索" : filter !== "all" ? "查看全部对话" : "开始新对话"}</button></section>`;
      }
      return `<p class="hh-count" role="status">${needle ? `找到 ${matched.length} 段对话` : `${matched.length} 段对话`}</p><ul class="hh-list">${matched.map(c => `<li><button type="button" class="hh-open" data-action="history:open:${esc(encoded(c.id))}" aria-label="打开对话：${esc(title(c))}"><span class="hh-row-meta"><time ${clock(c.updatedAt) ? `datetime="${esc(c.updatedAt)}"` : ""}>${esc(date(c.updatedAt))}</time><span class="hh-state ${c.status === "draft" ? "is-draft" : ""}">${c.id === state.activeConversationId ? "当前 · " : ""}${labels[c.status] || "已保存"}</span></span><strong>${esc(title(c))}</strong><span class="hh-preview">${esc(preview(c))}</span></button><button type="button" class="hh-more" data-action="history:menu:${esc(encoded(c.id))}" aria-label="管理对话：${esc(title(c))}"><span aria-hidden="true">•••</span></button></li>`).join("")}</ul>`;
    }
    function page() {
      query = String(state.conversationQuery || "");
      return `<section class="hh-page"><header class="hh-header"><button type="button" data-action="history:back" aria-label="返回 Halo">‹</button><h1>历史对话</h1><button type="button" class="hh-new" data-action="history:new">新对话</button></header><div class="hh-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg><label class="hh-sr" for="conversation-search">搜索对话标题和内容</label><input id="conversation-search" type="search" placeholder="搜索对话标题和内容" autocomplete="off" value="${esc(query)}"><button type="button" data-action="history:clear" aria-label="清除搜索" ${query ? "" : "hidden"}>×</button></div><nav class="hh-filters" aria-label="对话筛选">${[["all","全部"],["draft","草稿"],["archived","已归档"]].map(([id,label])=>`<button type="button" aria-pressed="${filter === id}" data-action="history:filter:${id}">${label}</button>`).join("")}</nav><p class="hh-feedback" role="status"></p><div class="hh-results">${results()}</div></section>`;
    }
    function refreshList(message = "") {
      const node = screen.querySelector(".hh-results");
      if (!node) return;
      node.innerHTML = results();
      screen.querySelectorAll(".hh-filters button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.action === `history:filter:${filter}`)));
      const clear = screen.querySelector('.hh-search [data-action="history:clear"]');
      if (clear) clear.hidden = !query;
      feedback(message);
    }
    function search(value) {
      if (state.current !== "HAL-02") return;
      query = String(value);
      // Updating only results preserves the active input and Chinese IME selection.
      refreshList();
      commit({ conversationQuery: query });
    }
    function menu(id) {
      if (!safe()) return;
      const c = find(id); if (!c) return feedback("这段对话已不在列表中，请刷新后查看。", true);
      deletion = null;
      const action = (label, type) => `<button type="button" data-action="history:${type}:${esc(encoded(id))}">${label}</button>`;
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal hh-menu"><header><h2>管理这段对话</h2><button type="button" data-action="close-modal">关闭</button></header><p class="hh-menu-title">${esc(title(c))}</p><p class="hh-menu-status">${labels[c.status] || "已保存"} · ${esc(date(c.updatedAt))}</p><p class="hh-modal-error" role="alert"></p><div class="hh-menu-actions">${["paused","archived"].includes(c.status) ? action("继续对话", "resume") : c.status === "active" ? action("暂停对话", "pause") : ""}${c.status !== "archived" ? action("归档对话", "archive") : ""}${action("删除对话", "delete")}</div></section></div>`;
    }
    function updateStatus(id, status) {
      const c = find(id); if (!c) return feedback("这段对话已不在列表中，请刷新后查看。", true);
      const changes = { conversations: state.conversations.map(entry => entry.id === id ? { ...entry, status } : entry) };
      if (id === state.activeConversationId) changes.conversationStatus = status;
      if (!commit(changes)) return false;
      track("halo_conversation_state_changed", { conversation_id:id, status, source_page:"HAL-02" });
      closeModal(); refreshList(status === "archived" ? "已归档，可在“已归档”中查看。" : status === "paused" ? "已暂停，消息和草稿都会保留。" : "可以继续这段对话了。");
      return true;
    }
    function open(id) {
      const c = find(id); if (!c) return feedback("这段对话已不在列表中，请刷新后查看。", true);
      if (!commit({ activeConversationId:id, chat:c.messages.map(m=>({...m})), haloDraft:String(c.draft || ""), haloSource:c.source ? {...c.source}:null, haloContext:c.source?.kind || "none", conversationStatus:c.status, haloToolsOpen:false })) return;
      closeModal(); go("HAL-01");
    }
    function requestDelete(id) {
      if (!safe()) return;
      const c=find(id); if(!c) return;
      deletion = { id, token:crypto.randomUUID(), fingerprint:JSON.stringify(c) };
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal hh-delete" data-history-token="${deletion.token}"><h2>删除这段对话？</h2><p class="hh-menu-title">${esc(title(c))}</p><p>这段对话的消息和草稿将从本机原型中删除，无法恢复。单独保存的感受记录、健康数据和其他对话不会改变。</p><p class="hh-modal-error" role="alert"></p><div class="hh-delete-actions"><button type="button" class="primary" data-action="history:cancel">取消，保留对话</button><button type="button" class="danger-button" data-action="history:confirm:${deletion.token}">删除对话</button></div></section></div>`;
    }
    function remove(token) {
      if (!deletion || deletion.token !== token || modalRoot.querySelector(".hh-delete")?.dataset.historyToken !== token || !safe()) return;
      const c=find(deletion.id); if (!c || JSON.stringify(c) !== deletion.fingerprint) return feedback("这段对话已更新，请取消后重新核对。",true);
      const id=c.id, changes={conversations:state.conversations.map(entry=>entry.id===id ? {...entry,status:"deleted",title:"已删除会话",messages:[],draft:"",source:null,context:"none"}:entry)};
      if(state.activeConversationId===id) Object.assign(changes,{activeConversationId:"",chat:[],haloDraft:"",haloSource:null,haloContext:"none",conversationStatus:"new"});
      if(!commit(changes))return;
      deletion=null; closeModal(); refreshList("这段对话已从本机原型中删除。");
      track("halo_conversation_state_changed",{conversation_id:id,status:"deleted",source_page:"HAL-02",simulated:true});
      const focus=screen.querySelector(".hh-feedback"); focus?.setAttribute("tabindex","-1"); focus?.focus({preventScroll:true});
    }
    function afterRender() {
      if(state.current!=="HAL-02") {mounted=false;commerceBaseline=null;deletion=null; if(modalRoot.querySelector(".hh-menu,.hh-delete"))closeModal();return;}
      if(!mounted) {commerceBaseline=readCommerce();mounted=true;}
    }
    function handle(action) {
      if(typeof action!=="string")return false;
      // Retired destructive handlers cannot replay after closing or leaving a dialog.
      if(action.startsWith("halo-delete-conversation-confirm:")) return true;
      if(action.startsWith("conversation-state:")) {if(state.current==="HAL-02") menu(state.activeConversationId);return true;}
      if(state.current==="HAL-02" && action.startsWith("open-conversation:")) {open(action.slice(18));return true;}
      if(state.current==="HAL-02" && (action==="previous" || action==="halo-new-conversation")) action=action==="previous"?"history:back":"history:new";
      if(!action.startsWith("history:"))return false;
      if(state.current!=="HAL-02")return true;
      const [,type,...parts]=action.split(":");let id;try{id=decodeURIComponent(parts.join(":"));}catch{return true;}
      if(type==="back")go("HAL-01");
      if(type==="clear") {const input=screen.querySelector("#conversation-search");if(input){input.value="";search("");input.focus();}}
      if(type==="filter" && ["all","draft","archived"].includes(id)) {filter=id;refreshList();}
      if(type==="open")open(id);
      if(type==="menu")menu(id);
      if(type==="pause" && find(id)?.status==="active")updateStatus(id,"paused");
      if(type==="archive" && find(id)?.status!=="archived")updateStatus(id,"archived");
      if(type==="resume" && ["paused","archived"].includes(find(id)?.status)) {const c=find(id);if(updateStatus(id,c.messages.length?"active":"draft"))open(id);}
      if(type==="delete")requestDelete(id);
      if(type==="confirm")remove(id);
      if(type==="cancel") {deletion=null;closeModal();}
      if(type==="new") {if(safe()){const source=newSource();if(commit({activeConversationId:"",chat:[],haloDraft:"",haloSource:source,haloContext:source?.kind||"none",conversationStatus:"new",haloToolsOpen:false})){closeModal();go("HAL-01");}}}
      return true;
    }
    return {page,afterRender,handle,search,canLeave:()=>safe(),blocksPersist:()=>state.current==="HAL-02" && mounted && !safe(false)};
  };
})();
