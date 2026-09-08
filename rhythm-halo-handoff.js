(function () {
  window.createHaloRhythmHandoff = function ({ state, createSource, write }) {
    const clone = value => JSON.parse(JSON.stringify(value));
    const owner = () => state.signedIn ? String(state.authPhone || state.authForm?.phone || "legacy-session") : "";
    const ownerOf = value => String(value?.ownerAccount || value?.accountRef || value?.owner || "");
    const foreign = value => Boolean(ownerOf(value) && ownerOf(value) !== owner());
    const conversations = () => Array.isArray(state.conversations) ? state.conversations : [];
    const current = () => conversations().find(entry => entry?.id === state.activeConversationId);
    const chat = () => Array.isArray(state.chat) ? state.chat : [];
    const draft = () => String(state.haloDraft || "");
    let sequence = 0;
    function failure(error, code = "unavailable") { return { ok: false, error, code }; }
    function accessError() {
      if (!owner()) return "请先登录，再带入这条记录。";
      if (state.current !== "RHY-06") return "请先查看要带入的记录，再确认。";
      if (state.healthDeletionStatus && state.healthDeletionStatus !== "ready") return "健康数据正在处理删除，暂时不能带入记录。";
      if (state.accountDeletionStatus && state.accountDeletionStatus !== "ready") return "账号正在处理注销，暂时不能开始新对话。";
      const active = current();
      if (foreign(active) || foreign(active?.source) || !active && foreign(state.haloSource)) return "当前会话与登录账号不一致，请回到 Halo 核对后再继续。";
      if (active?.status === "deleted") return "上一次会话已删除，请回到 Halo 重新开始后再带入记录。";
      return "";
    }
    function inspect(preview) {
      const error = accessError(), hasConversation = Boolean(current()), hasDraft = Boolean(draft().trim());
      const blank = { canConfirm: false, source: null, error, hasConversation: false, hasDraft: false, willPreserve: false };
      if (error) return blank;
      let source;
      try { source = createSource(preview); } catch { source = null; }
      if (!source || source.kind !== "rhythm" || source.date !== state.selectedRhythmDate) return { ...blank, error: "这条记录已变化或暂不可用，请重新核对内容。" };
      return { canConfirm: true, source: clone(source), error: "", hasConversation, hasDraft, willPreserve: hasConversation || hasDraft || chat().length > 0 };
    }
    function confirm(preview) {
      if (!preview || typeof preview !== "object") return failure("请先查看要带入的记录，再确认。", "confirmation");
      const view = inspect(preview);
      if (!view.canConfirm) return failure(view.error, accessError() ? "unavailable" : "changed");
      const previous = current(), liveChat = chat(), liveDraft = draft(), hasContent = liveChat.length > 0 || Boolean(liveDraft.trim());
      let savedConversations;
      try {
        savedConversations = clone(conversations());
        if (previous) {
          const savedMessages = Array.isArray(previous.messages) ? previous.messages : [];
          // A handoff must not overwrite a newer or different saved conversation
          // with stale visible messages. Normal chat updates are append-only.
          if (savedMessages.length > liveChat.length || savedMessages.some((message, index) => JSON.stringify(message) !== JSON.stringify(liveChat[index]))) return failure("当前会话内容已更新，请回到 Halo 核对后再带入。", "conflict");
          const changed = JSON.stringify(savedMessages) !== JSON.stringify(liveChat) || String(previous.draft || "") !== liveDraft;
          if (changed) {
            const index = savedConversations.findIndex(entry => entry.id === previous.id);
            savedConversations[index] = { ...savedConversations[index], messages: clone(liveChat), draft: liveDraft, updatedAt: new Date().toISOString() };
          }
        } else if (hasContent) {
          let id;
          do { id = `hc-rhythm-handoff-${Date.now()}-${++sequence}`; } while (savedConversations.some(entry => entry?.id === id));
          const status = ["paused", "archived"].includes(state.conversationStatus) ? state.conversationStatus : liveChat.length ? "active" : "draft";
          savedConversations.push({ id, ownerAccount: owner(), status, messages: clone(liveChat), draft: liveDraft,
            source: state.haloSource ? clone(state.haloSource) : null, context: state.haloSource?.kind || "none",
            title: liveChat.find(message => message?.role === "user")?.text?.slice(0, 30) || `草稿 · ${liveDraft.trim().slice(0, 24)}`,
            updatedAt: new Date().toISOString() });
        }
        const changes = { conversations: savedConversations, activeConversationId: "", chat: [], haloDraft: "", conversationStatus: "new",
          haloSource: view.source, haloContext: "rhythm", haloToolsOpen: false };
        // Preserve the old conversation first and establish the new source in the
        // same write. No message, quota mutation or empty history item is created.
        if (write(changes) !== true) return failure("暂时没能带入，之前的对话和草稿都没有改变。请重试。", "storage");
        Object.assign(state, changes);
      } catch { return failure("暂时没能带入，之前的对话和草稿都没有改变。请重试。", "storage"); }
      return { ok: true, error: "" };
    }
    return { inspect, confirm };
  };
})();
