/* V6.6 retired prototype pages. Keep old records; route old links to retained pages. */
(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HaloPartnerNavigation=api;
})(typeof window==='object'?window:globalThis,()=>{
  const retired=Object.freeze({'CHN-08':'AGT-07','CHN-09':'AGT-07','CHN-10':'AGT-07','CHN-11':'AGT-04','CHN-15':'AGT-04','CHN-16':'AGT-04','CHN-17':'AGT-05','CHN-18':'AGT-05','CHN-19':'AGT-05','CHN-21':'CHN-20','CHN-22':'AGT-05','CHN-24':'AGT-07','CHN-25':'AGT-07','AGT-12':'AGT-05'});
  // Review-directory order only. Never reorder the page registry or business routes.
  const directoryOrder=Object.freeze(['AGT-05','CHN-01','CHN-06','CHN-07','AGT-01','AGT-02','AGT-03','AGT-04','CHN-13','CHN-12','CHN-14','CHN-20','AGT-06','CHN-23','AGT-11','AGT-09','AGT-10']);
  const orderDirectory=items=>{
    const ordered=items.filter(item=>item.group==='渠道经营').slice().sort((a,b)=>{
      const aIndex=directoryOrder.indexOf(a.id),bIndex=directoryOrder.indexOf(b.id);
      return (aIndex<0?directoryOrder.length:aIndex)-(bIndex<0?directoryOrder.length:bIndex);
    });
    let index=0;
    return items.map(item=>item.group==='渠道经营'?ordered[index++]:item);
  };
  const toolsReturn=trail=>{
    const index=Array.isArray(trail)?trail.lastIndexOf('CHN-26'):-1;
    const source=index>0?trail[index-1]:'';
    if(source==='ACA-08')return 'ACA-08';
    return ['AGT-07','AGT-08','CHN-24'].includes(source)?'AGT-07':'AGT-05';
  };
  return {version:'6.6',retired,resolve:id=>retired[id]||id,toolsReturn,directoryOrder,orderDirectory};
});
