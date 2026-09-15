/* HAL-01 visual proposal. Opt-in only; all actions and records use the existing App. */
(() => {
  const params = new URLSearchParams(location.search);
  if (params.get("haloUI") !== "preview") return;
  document.documentElement.classList.add("halo-ui-preview");
  if (params.get("uiCanvas") === "1") document.documentElement.classList.add("halo-ui-canvas");
  const glyph = (name) => {
    const paths = {
      heart: '<path d="M20.4 5.6a5.2 5.2 0 0 0-7.4 0L12 6.7l-1.1-1.1a5.2 5.2 0 0 0-7.4 7.4L12 21l8.4-8a5.2 5.2 0 0 0 0-7.4Z"/>',
      plan: '<rect x="4" y="5" width="16" height="16" rx="4"/><path d="M8 3v4m8-4v4M8 12h8m-8 4h5"/>',
      chat: '<path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-9a9 9 0 0 1 18-1Z"/><path d="M7 11h10m-10 4h6"/>',
      night: '<path d="M19.8 14.6A8.7 8.7 0 0 1 9.4 4.2a8.7 8.7 0 1 0 10.4 10.4Z"/>',
      arrow: '<path d="m9 5 7 7-7 7"/>',
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.chat}</svg>`;
  };
  window.HaloHomeUIPreview = {
    render({ hasChat, source, locked, status, prompts, journey, headerActions, messages, sourceChip, composer, quota, ip, esc }) {
      const shortPrompt = (text) => ({
        "陪我梳理今天的安排": "安排今天", "想找一段睡前放松": "睡前放松", "先听我说一会儿": "听我说说",
        "陪我梳理这份感受": "聊聊这份感受", "帮我读懂今天的状态": "读懂身体状态",
        "帮我梳理这一天的感受": "回顾这一天", "今天的颜色怎么穿？": "今天怎么穿", "怎么把它用在今天？": "试试今日灵感",
      }[text] || text);
      const home = `<div class="hup-home"><section class="hup-greeting"><div class="hup-mascot"><img src="${esc(ip)}" alt="Halo 小伙伴" width="220" height="220"></div><h2>今天，想聊点什么？</h2><p>${source && source.kind !== "body" ? "从你带来的这份记录，接着聊。" : "身体、心情，或生活里的小事。"}</p>${sourceChip}</section><button class="hup-feeling" data-action="halo-open-feeling"><span class="hup-feeling-icon">${glyph("heart")}</span><span><strong>此刻，感觉怎么样？</strong><small>记下感受</small></span><span class="hup-next">${glyph("arrow")}</span></button><section class="hup-topics" aria-label="选择话题开始对话"><div class="hup-section-label">也可以从这里聊起</div><div class="hup-topic-grid">${prompts.map((text, i) => `<button data-action="ask:${esc(text)}" aria-label="${esc(text)}">${glyph(i === 1 ? "night" : i === 0 ? "plan" : "chat")}<span>${esc(shortPrompt(text))}</span></button>`).join("")}</div></section>${journey || `<button class="hup-plan" data-action="halo-open-journey">${glyph("plan")}<span>我的小计划</span>${glyph("arrow")}</button>`}</div>`;
      return `<section class="hal-chat-page hup-page ${hasChat ? "is-conversation" : "is-empty"}" aria-label="Halo 对话"><header class="hal-chat-header"><h1>Halo<span>你的日常伙伴</span></h1><div class="hal-header-actions">${headerActions}</div></header><div class="hal-chat-scroll">${hasChat ? messages : home}</div><footer class="hal-chat-footer">${locked ? `<div class="hal-conversation-state"><span>${status === "paused" ? "这次对话已暂停" : "这次对话已归档"}</span><button data-action="halo-resume-active">继续对话</button></div>` : ""}${quota ? `<div class="hup-quota">${esc(quota)}</div>` : ""}${composer}<div class="hup-footer-note"><span>AI 回答仅供参考</span><button data-action="halo-usage">使用说明</button></div></footer></section>`;
    }
  };
})();
