/* Form shape validation only. Identity and business authenticity require backend review. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HaloPartnerParty=api;})(typeof window==='object'?window:globalThis,function(){
  const clean = value => String(value || '').trim();
  const company = draft => draft.payeeType === '企业或个体工商户';
  function fields(draft) {
    return company(draft) ? {companyName:clean(draft.companyName),taxNumber:clean(draft.taxNumber).toUpperCase()} : {personName:clean(draft.personName),idNumber:clean(draft.idNumber).toUpperCase()};
  }
  function businessMissing(draft) {
    if(clean(draft.companyName).length<2)return '请填写公司或个体工商户名称。';
    if(!/^[0-9A-Z]{15,20}$/.test(clean(draft.taxNumber).toUpperCase()))return '请填写 15–20 位税号或统一社会信用代码。';
    return '';
  }
  function missing(draft) {
    if(!['自然人','企业或个体工商户'].includes(draft.payeeType))return '请选择申请身份。';
    if(company(draft))return businessMissing(draft);
    if(clean(draft.personName).length<2)return '请填写姓名。';
    if(!/^\d{17}[\dX]$/.test(clean(draft.idNumber).toUpperCase()))return '请填写 18 位身份证号码，末位可以是 X。';
    return '';
  }
  const mask = value => {const v=clean(value);return v ? v.slice(0,3)+'***********'+v.slice(-4) : '未记录';};
  return {company,fields,missing,businessMissing,mask};
});
