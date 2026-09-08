/* Team-build presentation of explicit scoped synthetic report samples only.
 * Existing business controllers continue to own navigation and eligibility. */
(() => {
  document.addEventListener('DOMContentLoaded',()=>{
    if(!window.HALO_TEAM_DEMO)return;
    const screen=document.getElementById('screen');if(!screen)return;
    let selected='heart';
    function paint(){
      let app,commerce;try{app=JSON.parse(localStorage.getItem('haloV5AppProgress'));commerce=JSON.parse(localStorage.getItem('haloV5CommercialProgress'));}catch{return;}
      if(!app?.signedIn||!app.authVerified)return;
      const expiry=commerce?.teamPointsExpiry,node=screen.querySelector('.ph-expiry small');
      if(node&&commerce.accountRef===app.authPhone&&expiry?.simulated&&expiry.remaining===commerce.pointsBalance&&!commerce.pendingPointsCorrection&&Date.parse(expiry.earliestAt)>Date.now()){
        const text=`当前模拟积分最早于 ${new Date(expiry.earliestAt).toLocaleDateString('zh-CN')} 到期`;
        if(node.textContent!==text)node.textContent=text;
      }
      const record=app.studioRecords?.[app.selectedStudioEventId],host=screen.querySelector('.studio-post-data'),sample=record?.teamMeasurements;
      if(!host||host.querySelector('.team-measurements')||record?.accountRef!==app.authPhone||record.reportStatus!=='generated'||!sample?.simulated||!record.healthConsent||!record.activityConsent||record.deletionStatus!=='ready')return;
      const panel=document.createElement('div');panel.className='team-measurements';
      function chart(){
        const values=sample[selected],heart=selected==='heart',label=heart?'心率':'呼吸频率',unit='次/分';
        if(!Array.isArray(values)||values.length!==6||!values.every(n=>typeof n==='number'&&Number.isFinite(n)))return;
        const bottom=heart?50:10,top=heart?90:20;
        const y=v=>135-(v-bottom)/(top-bottom)*100;
        const points=values.map((v,i)=>`${32+i*47},${y(v)}`).join(' ');
        panel.innerHTML=`<h3>活动中的身体记录 <small>模拟</small></h3><div class="team-chart-tabs"><button data-chart="heart" aria-pressed="${heart}">心率</button><button data-chart="breath" aria-pressed="${!heart}">呼吸频率</button></div><svg viewBox="0 0 300 176" role="img" aria-label="${label}，每 10 分钟一个模拟值，单位${unit}">${[bottom,(bottom+top)/2,top].map(v=>`<line x1="30" x2="275" y1="${y(v)}" y2="${y(v)}" stroke="#d8e0d6"/><text x="24" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('')}<polyline points="${points}" fill="none" stroke="#557961" stroke-width="2.5"/>${values.map((v,i)=>`<circle cx="${32+i*47}" cy="${y(v)}" r="3" fill="#557961"><title>${i*10} 分钟：${v}${unit}</title></circle>`).join('')}<text x="30" y="160">开始</text><text x="150" y="160">30 分</text><text x="270" y="160" text-anchor="end">结束</text></svg><p>${label}（${unit}）：${values.join(' · ')}<br>仅用于演示报告布局，不是实际测量，也不能据此判断活动效果。</p>`;
        for(const button of panel.querySelectorAll('button'))button.onclick=()=>{selected=button.dataset.chart;chart();};
      }
      chart();host.querySelector('.studio-post-empty')?.replaceWith(panel);
    }
    new MutationObserver(paint).observe(screen,{childList:true,subtree:true});paint();
  });
})();
