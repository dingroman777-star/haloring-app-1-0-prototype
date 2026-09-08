/* Local night-content planning. No playback, health inference, or external AI request. */
(() => {
  window.createHaloNightPlaylist = function ({ state, active, content }) {
    const ids = ["scan", "breath", "sound"];
    const goals = ["relax", "quiet", "brief"];
    const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
    const object = value => value && typeof value === "object" && !Array.isArray(value);
    const text = (value, fallback = "", max = 320) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
    const numeric = value => typeof value === "number" || typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : NaN;
    const duration = value => { const n = numeric(value); return Number.isFinite(n) && n > 0 && n <= 1440 ? n : null; };
    const copy = value => JSON.parse(JSON.stringify(value));
    const bound = () => typeof active === "function" ? active() === true : active === true;
    const details = {
      scan: {
        title: "安静身体扫描", format: "身体扫描", sound: "轻声引导 + 极简环境音",
        description: "跟着轻声引导，依次留意身体不同部位的感觉。",
        intro: "不用努力放松，也不用做对什么。找一个舒服的姿势，听到哪里，就把注意力轻轻放到哪里。",
        steps: ["坐下或躺好，找一个舒服的姿势", "跟随引导，依次留意身体的感觉", "走神了也没关系，想起时再回到声音"],
        fit: "想暂时放下手边的事，安静待一会儿",
        boundary: "不需要忍耐不舒服的姿势，随时可以调整或停止。不是治疗或诊断。",
      },
      breath: {
        title: "呼吸慢下来", format: "呼吸节律", sound: "轻声节拍 + 留白",
        description: "用一小段轻声引导，把注意力放回自然呼吸。",
        intro: "按自己舒服的节奏呼吸，不憋气，不用刻意吸得很深。声音只是陪伴，不必追上每一个节拍。",
        steps: ["让坐姿舒服一些，肩膀自然放下", "听着引导，留意每一次自然呼吸", "不舒服时停下引导，恢复自己的节奏"],
        fit: "时间不多，想先安静几分钟",
        boundary: "不要求屏息或用力呼吸；感到不舒服时停止。不能替代专业帮助。",
      },
      sound: {
        title: "夜间白噪音", format: "环境声音", sound: "连续环境音 · 无人声引导",
        description: "没有需要跟随的步骤，留一段安静的声音作陪。",
        intro: "调到舒服的音量，就可以把手机放下。不必专心听，也不需要完成任何练习。",
        steps: ["先把音量调到舒服的大小", "选择坐着、躺着，或安静做自己的事", "听够了可随时暂停或结束"],
        fit: "不想听引导，只想留一点背景声音",
        boundary: "效果因人而异，不承诺帮助入睡。不要用过大的音量掩盖周围需要留意的声音。",
      },
      "sound-tail": {
        title: "无引导白噪音", format: "环境声音", sound: "白噪音 · 无人声引导",
        description: "独立的 20 分钟白噪音，可以单独选择，也可以放进组合。",
        intro: "这是单独的一段内容。加入组合后才会播放，不会自动接在其他内容后面。",
        steps: ["调好音量", "可单独听，也可调整它在组合中的顺序", "结束后按组合顺序继续，没有下一段就停止"],
        fit: "想在引导结束后，再留一会儿背景声音",
        boundary: "不自动延长播放，不保证睡眠效果；不需要时可以移出组合。",
      },
    };
    function catalog() {
      const isBound = bound();
      const times = isBound ? { scan: 12, breath: 8, sound: 30 } : { scan: 10, breath: 5, sound: 15 };
      return [...ids, ...(isBound ? ["sound-tail"] : [])].map(id => {
        const fallback = details[id];
        let existing = {};
        if (id !== "sound-tail" && typeof content === "function") {
          try { const value = content(id); if (object(value)) existing = value; } catch (_) { /* Use known local content, never fabricate a remote response. */ }
        }
        return {
          id, title: text(existing.title, id === "sound-tail" || isBound ? fallback.title : ({ scan: "10 分钟身体扫描", breath: "5 分钟睡前呼吸", sound: "15 分钟安睡音频" })[id], 160),
          duration: id === "sound-tail" ? 20 : times[id],
          format: text(existing.format, fallback.format, 100), sound: text(existing.sound, fallback.sound, 160),
          description: fallback.description, intro: fallback.intro, steps: [...fallback.steps],
          fit: text(existing.fit, fallback.fit, 240), boundary: fallback.boundary,
        };
      });
    }
    function goal() {
      if (!goals.includes(state.nightRecommendationGoal)) state.nightRecommendationGoal = "relax";
      return state.nightRecommendationGoal;
    }
    function recommendation(requested) {
      const selected = goals.includes(requested) ? requested : goal();
      const config = {
        relax: { title: "呼吸与身体放松", reason: "先听一段呼吸引导，再慢慢留意身体的感觉。", ids: ["breath", "scan"] },
        quiet: { title: "安静陪你一会儿", reason: "先跟随身体扫描，再留一段没有人声的背景声音。", ids: ["scan", "sound"] },
        brief: { title: "先轻松几分钟", reason: "只安排一段短呼吸引导，不再追加其他内容。", ids: ["breath"] },
      }[selected];
      const directory = catalog(), tracks = config.ids.map(id => directory.find(item => item.id === id));
      return { id: `night-rec-v1:${selected}:${bound() ? "bound" : "public"}`, title: config.title, reason: config.reason, ids: [...config.ids], tracks: copy(tracks), total: tracks.reduce((sum, track) => sum + track.duration, 0), source: "prototype-demo" };
    }
    function normalizedPlan() {
      const directory = catalog(), allowed = new Set(directory.map(item => item.id));
      const stored = state.nightPlan;
      const initialized = object(stored);
      let selected;
      if (!initialized) {
        selected = [ids.includes(state.nightChoice) ? state.nightChoice : "scan"];
        if (bound() && state.toggles?.nightTail === true) selected.push("sound-tail");
      } else selected = Array.isArray(stored.ids) ? stored.ids : [];
      const valid = [...new Set(selected.filter(id => typeof id === "string" && allowed.has(id)))].slice(0, 4);
      let mode = initialized && stored.mode === "recommendation" ? "recommendation" : "custom";
      const recommendationId = initialized ? text(stored.recommendationId, "", 80) : "";
      const match = /^night-rec-v1:(relax|quiet|brief):(bound|public)$/.exec(recommendationId);
      if (mode === "recommendation" && (!match || recommendation(match[1]).ids.join("|") !== valid.join("|"))) mode = "custom";
      state.nightPlan = { version: 1, ids: valid, mode, ...(mode === "recommendation" ? { recommendationId } : {}) };
      return state.nightPlan;
    }
    function plan() {
      goal();
      const normalized = normalizedPlan(), directory = catalog();
      const tracks = normalized.ids.map(id => directory.find(item => item.id === id));
      const recommendedGoal = normalized.mode === "recommendation" ? normalized.recommendationId.split(":")[1] : "";
      return { ...copy(normalized), tracks: copy(tracks), total: tracks.reduce((sum, track) => sum + track.duration, 0), title: recommendedGoal ? recommendation(recommendedGoal).title : tracks.map(track => track.title).join(" + ") };
    }
    function setGoal(value) { if (!goals.includes(value)) return false; state.nightRecommendationGoal = value; return true; }
    function useRecommendation() {
      const next = recommendation();
      state.nightPlan = { version: 1, ids: [...next.ids], mode: "recommendation", recommendationId: next.id };
      return true;
    }
    function edit(next) { state.nightPlan = { version: 1, ids: [...next], mode: "custom" }; return true; }
    function add(id) {
      if (!catalog().some(item => item.id === id)) return false;
      const current = normalizedPlan();
      return current.ids.includes(id) ? false : edit([...current.ids, id]);
    }
    function remove(id) {
      if (typeof id !== "string") return false;
      const current = normalizedPlan();
      return !current.ids.includes(id) ? false : edit(current.ids.filter(item => item !== id));
    }
    function move(id, delta) {
      if (typeof id !== "string" || ![-1, 1].includes(delta)) return false;
      const current = normalizedPlan(), from = current.ids.indexOf(id), to = from + delta;
      if (from < 0 || to < 0 || to >= current.ids.length) return false;
      const next = [...current.ids]; [next[from], next[to]] = [next[to], next[from]];
      return edit(next);
    }
    function setSingle(id) { return catalog().some(item => item.id === id) ? edit([id]) : false; }
    function snapshot() {
      const current = plan();
      if (!current.tracks.length) return null;
      return { tracks: copy(current.tracks), duration: current.total, title: current.title, contentId: current.ids[0], primaryDuration: current.tracks[0].duration, appendNoise: false, planMode: current.mode, recommendationId: current.recommendationId || "" };
    }
    function snapshotTrack(value, index) {
      if (!object(value)) return null;
      const minutes = duration(value.duration);
      if (minutes === null) return null;
      return { id: text(value.id, `saved-track-${index}`, 80), title: text(value.title, "已保存的内容", 160), duration: minutes,
        format: text(value.format, "", 100), sound: text(value.sound, "", 160), description: text(value.description), intro: text(value.intro, "", 800),
        steps: Array.isArray(value.steps) ? value.steps.filter(item => typeof item === "string" && item.trim()).slice(0, 12).map(item => item.trim().slice(0, 240)) : [],
        fit: text(value.fit, "", 240), boundary: text(value.boundary, "", 400), ...(value.legacy === true ? { legacy: true } : {}) };
    }
    function sessionTracks(session) {
      if (!object(session)) return [];
      if (Array.isArray(session.tracks)) return session.tracks.slice(0, 32).map(snapshotTrack).filter(Boolean);
      const total = duration(session.duration);
      if (total === null) return [];
      const hasTail = session.appendNoise === true;
      // Old duration included the tail. Prefer its explicit primaryDuration, otherwise subtract it once.
      const first = hasTail ? duration(session.primaryDuration) || duration(total - 20) : total;
      if (first === null) return [];
      const primary = snapshotTrack({ id: text(session.contentId, "legacy-primary", 80), title: text(session.title, "已保存的内容", 160), duration: first, legacy: true }, 0);
      return [primary, ...(hasTail ? [snapshotTrack({ id: "legacy-sound-tail", title: "接续白噪音", duration: 20, format: "环境声音", sound: "白噪音 · 无人声引导", legacy: true }, 1)] : [])];
    }
    function segment(session, seconds) {
      const tracks = sessionTracks(session);
      if (!tracks.length) return { index: -1, track: null, elapsedSeconds: 0, totalSeconds: 0, complete: true };
      const total = tracks.reduce((sum, track) => sum + track.duration * 60, 0);
      const raw = numeric(seconds), position = Number.isFinite(raw) ? Math.max(0, Math.min(total, raw)) : 0;
      let start = 0;
      for (let index = 0; index < tracks.length; index++) {
        const track = tracks[index], length = track.duration * 60;
        if (position < start + length || index === tracks.length - 1) return { index, track: copy(track), elapsedSeconds: Math.min(length, Math.max(0, position - start)), totalSeconds: length, complete: position >= total };
        start += length;
      }
    }
    return { catalog, plan, recommendation, setGoal, useRecommendation, add, remove, move, setSingle, sessionTracks, segment, snapshot };
  };
})();
