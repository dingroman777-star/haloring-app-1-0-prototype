/* Explicit local receipt simulation. Browsing/querying never creates an outcome. */
(() => {
  const terminal = ["paid", "failed", "rejected"];
  const labels = { processing: "处理中", paid: "已到账（演示）", failed: "处理失败", rejected: "申请未通过" };
  function valid(row) {
    if (!row || typeof row.id !== "string" || !row.id.trim() || !Number.isSafeInteger(row.amountCents) || row.amountCents <= 0) return false;
    if (row.status === "processing") return true;
    const receipt = row.receipt;
    return terminal.includes(row.status) && receipt?.simulated === true && receipt.withdrawalId === row.id && receipt.status === row.status && receipt.amountCents === row.amountCents && typeof receipt.id === "string" && Number.isFinite(Date.parse(receipt.postedAt)) && (row.status === "paid" ? !row.returnedCents : row.returnedCents === row.amountCents && Boolean(receipt.reason));
  }
  function apply(receipt) {
    const store = window.haloChannelStorage, saved = store.read(), rows = saved.withdrawals || [];
    const row = rows.find(item => item?.id === receipt.withdrawalId);
    if (!row || rows.filter(item => item?.id === row.id).length !== 1 || !valid(row)) throw new Error("Unknown withdrawal");
    if (row.receipt?.id === receipt.id) return false;
    if (row.status !== "processing" || !terminal.includes(receipt.status) || receipt.simulated !== true || receipt.amountCents !== row.amountCents || !Number.isFinite(Date.parse(receipt.postedAt))) throw new Error("Receipt mismatch");
    const returned = receipt.status === "paid" ? 0 : row.amountCents;
    const available = saved.channelAvailableCents + returned;
    if (!Number.isSafeInteger(available) || available < 0) throw new Error("Invalid available balance");
    const next = { ...row, status: receipt.status, receipt, returnedCents: returned };
    if (!valid(next)) throw new Error("Invalid receipt");
    store.commit({ ...saved, channelAvailableCents: available, withdrawals: rows.map(item => item.id === row.id ? next : item) });
    return true;
  }
  window.HALO_CHANNEL_SETTLEMENT = { valid, apply, label: status => labels[status] || "待核对" };
})();
