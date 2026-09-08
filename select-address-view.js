/* SEL-07 presentation only. The commercial extension owns address drafts and order snapshots. */
(() => {
  "use strict";

  function render(vm) {
    const { e, icon } = vm;
    const rows = vm.rows || [];
    const formMode = vm.mode === "form" && !vm.locked;
    const header = `<header class="select-address-header"><button type="button" data-action="${formMode ? "commercial:address-form:close" : "go:SEL-05"}" aria-label="${formMode ? "返回地址列表" : "返回确认订单"}">${icon("back")}</button><h1>${formMode ? vm.form?.id ? "编辑地址" : "新增地址" : "收货地址"}</h1><span aria-hidden="true"></span></header>`;
    const demo = '<p class="select-address-demo">本地原型，请勿填写真实收货信息</p>';
    const page = (body, footer = "") => `<div class="select-address">${header}<div class="select-address-scroll">${body}</div>${demo}${footer}</div>`;
    const footer = (label, action, disabled = false, hint = "") => `<footer class="select-address-footer">${hint ? `<p id="address-confirm-hint">${e(hint)}</p>` : ""}<button type="button" class="primary" data-action="${action}" ${disabled ? 'disabled aria-describedby="address-confirm-hint"' : ""}>${label}</button></footer>`;
    const notice = vm.notice ? `<p class="select-address-notice" role="status">${e(vm.notice)}${vm.undo ? '<button type="button" data-action="commercial:address-undo">撤销</button>' : ""}</p>` : vm.undo ? '<div class="select-address-notice" role="status"><span>地址已删除</span><button type="button" data-action="commercial:address-undo">撤销</button></div>' : "";

    if (vm.locked) {
      return page('<section class="select-address-empty"><h2>请查看原订单</h2><p>订单已提交，收货信息保留在原订单中。</p></section>', vm.lockedOrderId ? footer("查看原订单", `commercial:open-order:${e(vm.lockedOrderId)}`) : "");
    }
    if (formMode) {
      const form = vm.form || {};
      const errors = vm.formErrors || {};
      const paste = vm.paste || {};
      const pastePanel = `<section class="select-address-paste" aria-label="粘贴收货信息"><button type="button" class="select-address-paste-read" data-action="commercial:address-paste-read" ${paste.busy ? 'disabled aria-busy="true"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="7" y="3" width="10" height="5" rx="1.5"/><path d="M7 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2M8 12h8M8 16h5"/></svg><span>${paste.busy ? '读取中…' : '粘贴并识别'}</span></button><div class="select-address-paste-help"><small>自动填写姓名、手机号和地址</small><button type="button" data-action="commercial:address-paste-manual" aria-expanded="${Boolean(paste.expanded)}" aria-controls="address-paste-manual">${paste.expanded ? '收起' : '手动粘贴'}</button></div>${paste.message ? `<div id="address-paste-status" class="select-address-paste-status" role="status" tabindex="-1"><span>${e(paste.message)}</span>${paste.undo ? '<button type="button" data-action="commercial:address-paste-undo">撤销填写</button>' : ''}</div>` : ''}${paste.expanded ? `<div id="address-paste-manual"><label for="address-paste-text">整段收货信息</label><textarea id="address-paste-text" rows="3" placeholder="粘贴姓名、手机号和完整地址" autocomplete="off" spellcheck="false">${e(paste.text || '')}</textarea><button type="button" data-action="commercial:address-paste-fill">识别填写</button></div>` : ''}</section>`;
      const fieldError = key => `<p class="select-address-field-error" id="address-error-${key}" ${errors[key] ? 'role="alert"' : "hidden"}>${e(errors[key] || "")}</p>`;
      const fieldState = key => errors[key] ? `aria-invalid="true" aria-describedby="address-error-${key}"` : "";
      const body = `${notice}<form class="select-address-form" id="select-address-form" aria-label="${form.id ? "编辑收货地址" : "新增收货地址"}" novalidate><div class="select-address-field"><label for="address-name">收货人</label><input id="address-name" name="name" type="text" autocomplete="name" placeholder="请输入收货人姓名" value="${e(form.name || "")}" ${fieldState("name")}>${fieldError("name")}</div><div class="select-address-field"><label for="address-phone">手机号</label><input id="address-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="请输入手机号" value="${e(form.phone || "")}" ${fieldState("phone")}>${fieldError("phone")}</div><div class="select-address-field"><label for="address-detail">详细地址</label><textarea id="address-detail" name="detail" autocomplete="street-address" placeholder="请填写省、市、区及街道门牌号" rows="4" ${fieldState("detail")}>${e(form.detail || "")}</textarea>${fieldError("detail")}</div>${form.simulated ? '<p class="select-address-form-note">正在编辑示例地址</p>' : ""}</form><button type="button" class="select-address-form-cancel" data-action="commercial:address-form:close">取消</button>`;
      return page(pastePanel + body, footer("保存地址", "commercial:address-save"));
    }

    const target = vm.deleteTarget;
    const deletion = target ? `<section class="select-address-delete-panel" aria-labelledby="address-delete-title"><h2 id="address-delete-title">删除这个地址？</h2><strong>${e(target.name)}</strong><p>${e(target.detail)}</p>${(target.affectsCheckout || target.id === vm.appliedId) ? '<p class="select-address-delete-note">这是本单正在使用的地址。删除后需重新选择，才能提交订单。已提交的订单不受影响。</p>' : ""}<div><button type="button" class="select-address-quiet" data-action="commercial:address-delete-cancel">保留地址</button><button type="button" class="select-address-danger" data-action="commercial:address-delete-confirm">确认删除</button></div></section>` : "";
    const cards = rows.map(row => `<article class="select-address-card ${row.id === vm.selectedId && row.valid ? "is-selected" : ""}" data-address-id="${e(row.id)}"><label class="select-address-choice"><span class="select-address-copy"><span class="select-address-person"><strong>${e(row.name)}</strong><span>${e(row.phone)}</span></span><span class="select-address-detail">${e(row.detail)}</span>${row.simulated || row.id === vm.appliedId ? `<span class="select-address-tags">${row.id === vm.appliedId ? '<small>本单使用中</small>' : ""}${row.simulated ? '<small class="is-example">示例</small>' : ""}</span>` : ""}</span><span class="select-address-radio-target"><input type="radio" name="select-address" value="${e(row.id)}" data-action="commercial:address-select:${e(row.id)}" aria-label="使用${e(row.name)}的地址，${e(row.detail)}" ${row.id === vm.selectedId && row.valid ? "checked" : ""} ${row.valid ? "" : 'disabled aria-describedby="address-invalid-' + e(row.id) + '"'}></span></label>${row.valid ? "" : `<p class="select-address-invalid" id="address-invalid-${e(row.id)}">地址信息不完整，请先编辑</p>`}<div class="select-address-card-actions"><button type="button" data-action="commercial:address-edit:${e(row.id)}" aria-label="编辑${e(row.name)}的地址">编辑</button><button type="button" data-action="commercial:address-delete:${e(row.id)}" aria-label="删除${e(row.name)}的地址">删除</button></div></article>`).join("");
    const add = '<button type="button" class="select-address-add" data-action="commercial:address-new"><span aria-hidden="true">＋</span>新增地址</button>';
    if (!rows.length) {
      return page(`${notice}${deletion}<section class="select-address-empty"><h2>还没有收货地址</h2><p>新增一个地址，用于接收你的商品。</p><button type="button" class="primary" data-action="commercial:address-new">新增地址</button></section>`);
    }
    const canConfirm = vm.confirmEnabled && rows.some(row => row.id === vm.selectedId && row.valid);
    return page(`${notice}${deletion}<section class="select-address-list" aria-label="选择收货地址">${cards}</section>${add}`, footer("使用此地址", "commercial:address-confirm", !canConfirm, canConfirm ? "" : "请选择一个完整的收货地址"));
  }

  window.HALO_SELECT_ADDRESS_VIEW = { render };
})();
