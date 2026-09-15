/* Original advisor curriculum, now independent of applications and role activation. */
(() => {
  const pages=['CHN-08','CHN-09','CHN-10'];
  const questions=[
    {id:'product',text:'可以承诺未开售商品的确定交付日期吗？',why:'以当前商品页公布的信息为准，不自行承诺交付日期。'},
    {id:'health',text:'Halo 能诊断失眠吗？',why:'Halo 提供日常身体状态参考，不用于疾病诊断。'},
    {id:'orders',text:'同一订单可同时获得会员推荐奖励和渠道现金收益吗？',why:'同一订单不能重复获得这两类奖励。'}
  ];
  window.HaloAcademyRequiredTraining={pages,create({courses,view,save,escape:e}){
    const data=()=>({done:[],answers:{},passed:false,checked:false,selected:'',...view().requiredTraining});
    const done=()=>courses.filter(c=>data().done.includes(c.id));
    const allDone=()=>done().length===courses.length;
    const passed=()=>allDone()&&data().passed&&questions.every(q=>data().answers[q.id]==='no');
    const button=(label,event,disabled=false,secondary=false)=>`<button class="${secondary?'ac-secondary':'ac-primary'}" data-action="academy:required-${e(event)}" ${disabled?'disabled':''}>${e(label)}</button>`;
    const head=(title,home=false)=>`<article class="academy-home"><header class="ac-header">${button(home?'‹ 返回商学院':'‹ 返回培训','back',false,true)}<h1>${e(title)}</h1></header><p>商学院 · 学习进度独立保存，不影响渠道申请和晋升。</p>`;
    function render(page){
      const s=data();
      if(page==='CHN-08')return head('必修培训',true)+`<section class="ac-panel"><h2>服务基础 · ${done().length} / ${courses.length} 课</h2><progress aria-label="必修培训进度" max="${courses.length}" value="${done().length}"></progress><p>${passed()?'三门课程和培训测评已完成。':'按自己的节奏学习，完成课程后可以参加测评。'}</p></section>`+courses.map((c,i)=>`<button class="ac-course" data-action="academy:required-open:${c.id}"><span class="ac-course-icon">${s.done.includes(c.id)?'✓':i+1}</span><span class="ac-course-copy"><strong>${e(c.title)}</strong><small>${s.done.includes(c.id)?'已完成 · 可回顾':'未完成'}</small></span><span aria-hidden="true">›</span></button>`).join('')+button(passed()?'查看测评结果':'进入培训测评','assessment',!allDone())+(!allDone()?'<p>还有课程未完成，先选择上方课程继续。</p>':'')+'</article>';
      if(page==='CHN-09'){
        const c=courses.find(c=>c.id===s.selected);
        if(!c)return head('培训课程')+'<p>请从培训列表选择课程，原进度仍保留。</p>'+button('返回培训','back')+'</article>';
        return head(c.title)+`<section class="ac-panel"><h2>本课要点</h2><p>${e(c.body)}</p><h2>记住这一点</h2><p>${e(c.takeaway)}</p></section>`+button(s.done.includes(c.id)?'已完成，返回培训':'完成本课',`complete:${c.id}`)+'</article>';
      }
      if(!allDone())return head('培训测评')+'<p>完成三门课程后再进入测评。此要求仅用于学习，不影响申请签约。</p>'+button('返回培训','back')+'</article>';
      return head('培训测评')+(s.checked?`<section class="ac-panel" role="status"><h2>${passed()?'测评已通过':'还有题目需要核对'}</h2><p>${passed()?'成绩已保存在商学院，不改变申请状态或合作身份。':'你的选择已保留，查看解释后可以重新作答。'}</p></section>`:'')+questions.map((q,i)=>`<section class="ac-panel"><h2>第 ${i+1} 题</h2><p>${e(q.text)}</p><div class="ac-filters" aria-label="第 ${i+1} 题答案">${[['yes','可以'],['no','不可以']].map(([v,label])=>`<button data-action="academy:required-answer:${q.id}-${v}" aria-pressed="${s.answers[q.id]===v}">${label}</button>`).join('')}</div>${s.checked?`<p>${s.answers[q.id]==='no'?'✓ 回答正确':'请再核对'} · ${e(q.why)}</p>`:''}</section>`).join('')+button(passed()?'返回商学院':s.checked?'重新核对答案':'核对答案',passed()?'home':'check',!questions.every(q=>['yes','no'].includes(s.answers[q.id])))+'</article>';
    }
    function action(name,value,ctx){
      const page=ctx.applicationContext?.().page;
      if(!pages.includes(page))return true;
      if(name==='required-home'){ctx.go('AGT-07');return true;}
      if(name==='required-back'){ctx.go(page==='CHN-08'?'AGT-07':'CHN-08');return true;}
      const s=data(),next={...s};let route=page;
      if(name==='required-open'&&page==='CHN-08'&&courses.some(c=>c.id===value)){next.selected=value;route='CHN-09';}
      else if(name==='required-complete'&&page==='CHN-09'&&value===s.selected&&courses.some(c=>c.id===value)){next.done=[...new Set([...s.done,value])];route='CHN-08';}
      else if(name==='required-assessment'&&page==='CHN-08'&&allDone()){ctx.go('CHN-10');return true;}
      else if(name==='required-answer'&&page==='CHN-10'&&allDone()){
        const [id,answer]=String(value).split('-');if(!questions.some(q=>q.id===id)||!['yes','no'].includes(answer))return true;
        next.answers={...s.answers,[id]:answer};next.passed=false;next.checked=false;
      }else if(name==='required-check'&&page==='CHN-10'&&allDone()&&questions.every(q=>['yes','no'].includes(s.answers[q.id]))){next.checked=true;next.passed=questions.every(q=>s.answers[q.id]==='no');}
      else return true;
      if(save({...view(),requiredTraining:next})){if(route!==page)ctx.go(route);else ctx.render();}else ctx.render();
      return true;
    }
    return {render,action};
  }};
})();
