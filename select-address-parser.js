/* Bounded, local-only best-effort parsing; callers merge only returned fields. */
(() => {
  "use strict";
  const keys = ["name", "phone", "detail"];
  const provinces = "北京|天津|上海|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门";
  const provinceStart = new RegExp("^(?:" + provinces + ")");
  const provinceAnywhere = new RegExp(provinces);
  const addressMark = /[市区县旗镇乡街路道村号栋幢室楼座园弄巷]|单元/;
  const nameLabelSource = "收货人|收件人|姓名|联系人";
  const phoneLabelSource = "手机号码|手机号|手机|联系电话|联系方式|电话";
  const addressLabelSource = "收货地址|收件地址|所在地区|详细地址|地区|地址";
  // Unpunctuated labels need a field boundary. A street containing “手机维修” is not a phone label.
  const bareLabelSource = nameLabelSource + "|" + addressLabelSource + "|(?:" + phoneLabelSource + ")(?=\\s*[:：]|[ \\t]*(?:$|[\\n,，;；|、]))";
  const labelPattern = new RegExp("(^|[\\s,，;；|、【\\[(（])(" + bareLabelSource + ")\\s*[:：]?\\s*|(" + nameLabelSource + "|" + phoneLabelSource + "|" + addressLabelSource + ")\\s*[:：]\\s*", "g");
  const nameLabels = /^(收货人|收件人|姓名|联系人)$/;
  const phoneLabels = /^(手机号码|手机号|手机|联系电话|联系方式|电话)$/;
  const prose = /你好|谢谢|请问|天气|今天|明天|测试|这是|不知道|随便|没有|不确定|请填写|请联系|电话号码|手机号|收货地址|收件地址|联系人/;
  const clean = value => value.replace(/^[\s:：,，;；、|【】\[\]（）()]+|[\s:：,，;；、|【】\[\]（）()]+$/g, "").replace(/[ \t]+/g, " ").trim();
  const result = (fields, issue) => ({ fields, ...(issue ? { issue } : {}), missing: keys.filter(key => !fields[key]) });
  const isName = (value, explicit = false) => value.length >= 2 && value.length <= (explicit ? 40 : 20)
    && /^[\u3400-\u9fffA-Za-z·.'\- ]+$/.test(value) && !prose.test(value)
    && !provinceStart.test(value) && !/[市区县镇乡街路号栋幢室楼]/.test(value)
    && (explicit || /^[\u3400-\u9fff·]{2,12}$/.test(value) || /^[A-Z][A-Za-z]+(?:[ .'-][A-Z][A-Za-z]+){1,3}$/.test(value));
  const isAddressPart = value => value.length >= 2 && value.length <= 200 && !prose.test(value)
    && !/[<>={}]/.test(value) && /[\u3400-\u9fff]/.test(value) && addressMark.test(value);

  function parse(input) {
    if (typeof input !== "string" || !input.trim()) return result({}, "empty");
    if (input.length > 2000) return result({}, "too-long");
    const text = input.normalize("NFKC").replace(/\r\n?/g, "\n").replace(/[\u200b-\u200d\ufeff]/g, "");
    // Do not interpret links, email addresses, markup, or embedded instructions as shipping data.
    if (/(?:https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|<\/?[A-Za-z][^>]*>)/i.test(text)) return result({}, "unrecognized");
    const phones = [];
    const phonePattern = /(^|[^\dA-Za-z])((?:(?:\+86|0086)[ \t-]*)?1[3-9](?:[ \t-]*\d){9})(?!\d)/g;
    const withoutPhones = text.replace(phonePattern, (match, boundary, raw) => {
      phones.push(raw.replace(/\D/g, "").replace(/^(?:0086|86)(?=1\d{10}$)/, ""));
      return boundary + "\n";
    });
    const uniquePhones = [...new Set(phones)];
    if (uniquePhones.length > 1) return result({}, "ambiguous");

    const rows = [];
    let pendingLabel = "";
    withoutPhones.replace(labelPattern, (_, boundary, bareLabel, colonLabel) => "\n\uE000" + (bareLabel || colonLabel) + "\uE001")
      .split(/[\n,，;；|、]+/).forEach(part => {
        const marker = part.match(/^\s*\uE000([^\uE001]+)\uE001/);
        const label = marker ? marker[1] : pendingLabel;
        const value = clean(marker ? part.slice(marker[0].length) : part);
        pendingLabel = !value && marker && !phoneLabels.test(label) ? label : "";
        if (value) rows.push({ label, value });
      });

    const explicitNames = [], inferredNames = [], addressParts = [];
    let addressStarted = false, addressGroups = 0;
    // Labels are detected from the original text because a phone-only row disappears after extraction.
    const explicitPhone = /(?:手机号码|手机号|手机|联系电话|联系方式|电话)\s*[:：]?\s*(?:(?:\+86|0086)[ \t-]*)?1[3-9]/.test(text);
    rows.forEach(({ label, value }) => {
      const regionAt = value.search(provinceAnywhere);
      if (nameLabels.test(label)) {
        const name = clean(regionAt > 0 ? value.slice(0, regionAt) : value);
        if (isName(name, true)) explicitNames.push(name);
        if (regionAt > 0) value = clean(value.slice(regionAt));
        else return;
      }
      if (label && !nameLabels.test(label) && !phoneLabels.test(label)) {
        if (isAddressPart(value) || /^(所在地区|地区)$/.test(label) && provinceStart.test(value) && value.length <= 60) {
          if (/^(收货地址|收件地址|地址)$/.test(label) && addressStarted) addressGroups += 1;
          addressParts.push(value); addressStarted = true;
        }
        return;
      }
      if (regionAt > 0 && !nameLabels.test(label)) {
        const name = clean(value.slice(0, regionAt));
        if (isName(name)) { inferredNames.push(name); value = clean(value.slice(regionAt)); }
      }
      if (provinceStart.test(value) && isAddressPart(value)) {
        if (addressParts.some(part => provinceStart.test(part))) addressGroups += 1;
        addressParts.push(value); addressStarted = true;
      } else if (addressStarted && isAddressPart(value)) {
        addressParts.push(value);
      } else if (!phoneLabels.test(label) && isName(value)) {
        inferredNames.push(value);
      }
    });

    const names = [...new Set(explicitNames.length ? explicitNames : inferredNames)];
    if (names.length > 1 || addressGroups > 0) return result({}, "ambiguous");
    const fields = {};
    const detail = addressParts.join("").replace(/\s+/g, " ").trim();
    if (detail.length >= 5 && detail.length <= 200) fields.detail = detail;
    // A bare phone is useful. A number buried in unrelated prose is not a shipping record.
    const barePhone = clean(withoutPhones).length === 0;
    if (uniquePhones.length && (barePhone || explicitPhone || fields.detail || names.length)) fields.phone = uniquePhones[0];
    if (names.length && (explicitNames.length || fields.phone || fields.detail)) fields.name = names[0];
    return Object.keys(fields).length ? result(fields) : result({}, "unrecognized");
  }
  window.HALO_SELECT_ADDRESS_PARSER = { parse };
})();
