/* Prototype host only. No business permission, balance or device ownership is changed here. */
(() => {
  // Existing dedicated review launchers already provide isolated, non-configurable stores.
  if (/\/(?:points-review|select-review|channel-approved-review)\.html$/.test(location.pathname)) { window.HaloDemoSessionReady = true; return; }
  const namespace = "haloDemoSession:";
  const valid = value => /^[a-f0-9]{32}$/.test(value || "");
  const url = new URL(location.href);
  function freshId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, "0")).join("");
  }
  if (url.searchParams.has("demo") && !valid(url.searchParams.get("demo"))) {
    const normalized = url.searchParams.get("demo").replaceAll("-", "").toLowerCase();
    url.searchParams.set("demo", valid(normalized) ? normalized : freshId());
    history.replaceState(null, "", url);
  }
  const id = url.searchParams.get("demo"), prefix = valid(id) ? `${namespace}${id}:` : "";
  const translated = new WeakSet();
  if (prefix) {
    for (const name of ["localStorage", "sessionStorage"]) {
      // Do not silently fall back to the legacy bucket when browser storage is unavailable.
      let store;
      try { store = window[name]; } catch { /* Calls below surface a storage failure, not another session. */ }
      const keys = () => Array.from({ length: store.length }, (_, i) => store.key(i)).filter(key => key?.startsWith(prefix));
      const scoped = {
        get length() { return keys().length; },
        key(index) { return keys()[index]?.slice(prefix.length) ?? null; },
        getItem(key) { return store.getItem(prefix + String(key)); },
        setItem(key, value) { store.setItem(prefix + String(key), String(value)); },
        removeItem(key) { store.removeItem(prefix + String(key)); },
        clear() { keys().forEach(key => store.removeItem(key)); }
      };
      Object.defineProperty(window, name, { configurable: true, value: scoped });
    }
  }
  // A tab in another demo must not trigger account-change handlers in this one.
  window.addEventListener("storage", event => {
    if (translated.has(event)) return;
    if (!prefix) {
      if (event.key?.startsWith(namespace)) event.stopImmediatePropagation();
      return;
    }
    event.stopImmediatePropagation();
    if (event.key !== null && !event.key.startsWith(prefix)) return;
    const local = new StorageEvent("storage", { key: event.key?.slice(prefix.length) ?? null, oldValue: event.oldValue, newValue: event.newValue, url: event.url });
    translated.add(local);
    window.dispatchEvent(local);
  }, true);
  window.HaloDemoSessionReady = true;
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.createElement("button");
    button.type = "button"; button.id = "demo-tools"; button.textContent = "演示";
    button.setAttribute("aria-label", "原型演示工具");
    document.querySelector(".stage-tools")?.prepend(button);
    const dialog = document.createElement("dialog");
    dialog.id = "demo-dialog"; dialog.setAttribute("aria-labelledby", "demo-title");
    dialog.innerHTML = '<h2 id="demo-title">原型演示</h2><p>这是交互演示，不会发送短信、真实扣款或连接硬件。请勿填写真实身份或银行卡信息。</p><p>登录手机号可填 <b>13900000000</b>，勾选协议并获取验证码后，填写 <b>000000</b>。</p><p>重新体验会打开一份独立的新进度，不删除旧记录。记录仅保存在当前浏览器，分享链接不会带走你的记录。</p><button type="button" id="demo-new">保留进度，重新体验</button><button type="button" id="demo-previous">返回上次体验</button><button type="button" id="demo-close">继续当前体验</button>';
    document.body.append(dialog);
    button.onclick = () => dialog.showModal();
    dialog.querySelector("#demo-close").onclick = () => dialog.close();
    const previous = url.searchParams.get("demoPrevious");
    dialog.querySelector("#demo-previous").hidden = !prefix || !(valid(previous) || previous === "legacy");
    function destination(next, prior) {
      const target = new URL("index.html", location.href);
      target.searchParams.set("v", "6.5.3-demo");
      if (next) target.searchParams.set("demo", next);
      if (prior) target.searchParams.set("demoPrevious", prior);
      target.hash = "ONB-01";
      return target.href;
    }
    dialog.querySelector("#demo-new").onclick = () => location.assign(destination(freshId(), prefix ? id : "legacy"));
    dialog.querySelector("#demo-previous").onclick = () => location.assign(destination(valid(previous) ? previous : "", id));
  });
})();
