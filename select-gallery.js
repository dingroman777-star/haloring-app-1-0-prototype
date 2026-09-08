(function () {
  // Product media only. This module never selects a SKU or writes commerce assets/orders.
  const MEDIA = [
    { id: "overall", src: "assets/select-ring-hero-v1.png", title: "整体外观", note: "图示：瓷白", alt: "瓷白智能戒指整体外观", kind: "overall" },
    { id: "inside", src: "assets/ring-porcelain-onboarding.jpg", title: "内侧细节", note: "图示：瓷白", alt: "瓷白戒指内侧细节，来自现有产品图", kind: "inside" },
    { id: "wearing", src: "assets/select-ring-wearing-v1.png", title: "佩戴示意", note: "AI 佩戴示意 · 瓷白", alt: "手指佩戴瓷白戒指的 AI 示意图，不代表实拍效果", kind: "wearing" },
    { id: "app", src: "assets/select-app-connect-v1.png", title: "连接 Halo App", note: "App 界面示例", alt: "当前 Halo App 首次连接引导界面示例", kind: "app" },
  ];
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({ prev:'<path d="m14 6-6 6 6 6"/>', next:'<path d="m10 6 6 6-6 6"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>', zoom:'<path d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5"/>' })[name]}</svg>`;
  const imageFrame = (index, { lazy = false, viewer = false } = {}) => {
    const media = MEDIA[index];
    const tag = viewer ? 'div' : 'button';
    return `<div class="sg-media sg-${media.kind}" data-media-index="${index}" data-load-state="loading"><${tag} class="sg-open" ${viewer ? '' : `type="button" data-gallery-open="${index}" aria-label="放大查看${media.title}，${media.note}"`}><img src="${media.src}" alt="${media.alt}" loading="${lazy ? 'lazy' : 'eager'}" decoding="async" draggable="false"></${tag}><div class="sg-image-state" role="status"><span>正在加载图片</span><button type="button" data-gallery-retry="${index}" hidden>重新加载</button></div>${viewer ? '' : `<span class="sg-expand" aria-hidden="true">${icon('zoom')}</span>`}</div>`;
  };
  function hero() {
    return `<section class="select-gallery" aria-label="产品图片，左右滑动浏览"><div class="sg-strip" tabindex="0" aria-label="产品图库，可用左右方向键切换">${MEDIA.map((media, index) => `<figure class="sg-slide" role="group" aria-roledescription="幻灯片" aria-label="第 ${index+1} 张，共 ${MEDIA.length} 张">${imageFrame(index, { lazy: index !== 0 })}<figcaption>${media.kind === 'wearing' ? media.note : `${media.title} · ${media.note}`}</figcaption></figure>`).join('')}</div><div class="sg-controls"><button type="button" data-gallery-step="-1" aria-label="上一张图片">${icon('prev')}</button><div class="sg-dots" role="group" aria-label="选择图片">${MEDIA.map((media,index) => `<button type="button" data-gallery-index="${index}" aria-label="查看第 ${index+1} 张：${media.title}" aria-pressed="${index===0}"><i></i></button>`).join('')}</div><span class="sg-count" aria-live="polite">1 / ${MEDIA.length}</span><button type="button" data-gallery-step="1" aria-label="下一张图片">${icon('next')}</button></div></section>`;
  }
  function details() {
    return `<section class="select-product-story" aria-labelledby="select-product-story-title"><header><h2 id="select-product-story-title">产品详情</h2><p>从外观到佩戴，了解这枚戒指。</p></header>
      <article>${imageFrame(1,{lazy:true})}<div class="sg-story-copy"><h3>陶瓷外层，钛金属内层</h3><p>近看戒指的弧面、内侧与边缘细节。</p></div></article>
      <article>${imageFrame(2,{lazy:true})}<div class="sg-story-copy"><small>AI 佩戴示意 · 瓷白</small><h3>看看戴在手上的样子</h3><p>大小和松紧，需要试戴后再决定。</p></div></article>
      <article class="sg-app-story">${imageFrame(3,{lazy:true})}<div class="sg-story-copy"><small>App 界面示例</small><h3>连接后，开始记录</h3><p>在 Halo App 连接并激活戒指。佩戴、同步后，再查看你的睡眠与日常身体状态。</p><ol><li>连接戒指</li><li>佩戴并同步</li><li>查看记录</li></ol></div></article>
    </section>`;
  }
  let active = null;
  function mount(state, persist, productId) {
    active?.destroy(); active = null;
    const host = document.querySelector('.select-detail[data-product-id="ring"]');
    if (productId !== 'ring' || !host || document.getElementById('screen')?.dataset.page !== 'SEL-03') return;
    if (!state.productMediaViews || typeof state.productMediaViews !== 'object') state.productMediaViews = {};
    const saved = state.productMediaViews[productId] || {};
    const view = { index: Number.isInteger(saved.index) ? Math.max(0,Math.min(MEDIA.length-1,saved.index)) : 0, top: Number.isFinite(saved.top) ? Math.max(0,saved.top) : 0 };
    state.productMediaViews[productId] = view;
    const controller = new AbortController(), signal = controller.signal;
    const strip = host.querySelector('.sg-strip'), scroller = host.querySelector('.select-detail-scroll');
    let saveTimer = 0, scrollTimer = 0, viewer = null, returnFocus = null, viewerIndex = view.index, dragging = null, suppressClickUntil = 0, destroyed = false;
    const remember = () => { clearTimeout(saveTimer); saveTimer = setTimeout(persist,150); };
    const setIndex = index => {
      const focusedSlide = document.activeElement?.closest('.sg-slide');
      const focusedControl = document.activeElement?.closest('[data-gallery-step]');
      view.index = Math.max(0,Math.min(MEDIA.length-1,index));
      host.querySelectorAll('[data-gallery-index]').forEach(button => button.setAttribute('aria-pressed',String(Number(button.dataset.galleryIndex)===view.index)));
      host.querySelector('.sg-count').textContent = `${view.index+1} / ${MEDIA.length}`;
      host.querySelector('[data-gallery-step="-1"]').disabled = view.index === 0;
      host.querySelector('[data-gallery-step="1"]').disabled = view.index === MEDIA.length-1;
      strip.querySelectorAll('.sg-slide').forEach((slide,index) => { slide.inert = index !== view.index; });
      if (focusedSlide?.inert || focusedControl?.disabled) strip.focus({preventScroll:true});
      remember();
    };
    const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
    function selectIndex(index, smooth = true) {
      setIndex(index);
      strip.scrollTo({ left: view.index * strip.clientWidth, behavior: smooth && !reducedMotion() ? 'smooth' : 'instant' });
    }
    function updateImage(img) {
      const frame = img.closest('.sg-media'); if (!frame || !img.complete) return;
      frame.dataset.loadState = img.naturalWidth ? 'ready' : 'failed';
      const trigger = frame.querySelector('button.sg-open');
      if (trigger) trigger.disabled = !img.naturalWidth;
      frame.querySelector('.sg-image-state > span').textContent = img.naturalWidth ? '' : '图片暂时没加载出来';
      frame.querySelector('[data-gallery-retry]').hidden = Boolean(img.naturalWidth);
    }
    function inspectImages(root) { root.querySelectorAll('.sg-media img').forEach(updateImage); }
    function retry(frame) {
      const img = frame?.querySelector('img'); if (!img) return;
      if (frame.contains(document.activeElement)) (viewer?.querySelector('[data-viewer-action="close"]') || strip).focus({preventScroll:true});
      frame.dataset.loadState = 'loading'; frame.querySelector('.sg-image-state > span').textContent = '正在重新加载';
      frame.querySelector('[data-gallery-retry]').hidden = true;
      const url = new URL(MEDIA[Number(frame.dataset.mediaIndex)].src,location.href); url.searchParams.set('retry',String(Date.now())); img.src = url.href;
    }
    function closeViewer({ restore = true, pop = true } = {}) {
      if (!viewer) return false;
      viewer.remove(); viewer = null;
      [...host.children].forEach(child => { child.inert = false; });
      if (restore && returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
      returnFocus = null;
      if (pop && history.state?.selectPhotoViewer) history.back();
      return true;
    }
    function showViewer(index, initial = false) {
      if (host.querySelector('.select-sku-overlay')) return;
      viewerIndex = Math.max(0,Math.min(MEDIA.length-1,index));
      if (initial) {
        returnFocus = document.activeElement; viewer = document.createElement('section'); viewer.className = 'select-photo-viewer';
        viewer.setAttribute('role','dialog'); viewer.setAttribute('aria-modal','true'); viewer.setAttribute('aria-labelledby','sg-viewer-title');
        [...host.children].forEach(child => { child.inert = true; }); host.append(viewer);
        history.pushState({...history.state, selectPhotoViewer:true},'',location.href);
      }
      if (!viewer) return;
      const focusedAction = viewer.contains(document.activeElement) ? document.activeElement.dataset.viewerAction : '';
      const media = MEDIA[viewerIndex];
      viewer.innerHTML = `<header><h2 id="sg-viewer-title">${media.title}</h2><button type="button" data-viewer-action="close" aria-label="关闭大图">${icon('close')}</button></header><div class="sg-viewer-image">${imageFrame(viewerIndex,{viewer:true})}</div><footer><p>${media.note}</p><div><button type="button" data-viewer-action="prev" aria-label="上一张大图" ${viewerIndex===0?'disabled':''}>${icon('prev')}</button><span aria-live="polite">${viewerIndex+1} / ${MEDIA.length}</span><button type="button" data-viewer-action="next" aria-label="下一张大图" ${viewerIndex===MEDIA.length-1?'disabled':''}>${icon('next')}</button></div></footer>`;
      inspectImages(viewer);
      (viewer.querySelector(`[data-viewer-action="${focusedAction}"]:not(:disabled)`) || viewer.querySelector('[data-viewer-action="close"]')).focus({preventScroll:true});
    }
    host.addEventListener('load',event=>{if(event.target instanceof HTMLImageElement) updateImage(event.target);},{capture:true,signal});
    host.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement) updateImage(event.target);},{capture:true,signal});
    host.addEventListener('click',event=>{
      if (Date.now()<suppressClickUntil && event.target.closest('.sg-media')) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      const button = event.target.closest('button'); if (!button || button.disabled) return;
      if (button.hasAttribute('data-gallery-retry')) { retry(button.closest('.sg-media')); return; }
      if (button.hasAttribute('data-gallery-index')) { selectIndex(Number(button.dataset.galleryIndex)); return; }
      if (button.hasAttribute('data-gallery-step')) { selectIndex(view.index+Number(button.dataset.galleryStep)); return; }
      if (button.hasAttribute('data-gallery-open')) { showViewer(Number(button.dataset.galleryOpen),true); return; }
      if (button.dataset.viewerAction === 'close') closeViewer();
      if (button.dataset.viewerAction === 'prev') showViewer(viewerIndex-1);
      if (button.dataset.viewerAction === 'next') showViewer(viewerIndex+1);
    },{signal,capture:true});
    host.addEventListener('keydown',event=>{
      if ((viewer || event.target.closest('.select-gallery')) && ['Escape','ArrowLeft','ArrowRight','Tab'].includes(event.key)) event.stopPropagation();
      if (viewer) {
        if (event.key==='Escape') { event.preventDefault(); closeViewer(); return; }
        if (['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); showViewer(viewerIndex+(event.key==='ArrowLeft'?-1:1)); return; }
        if (event.key==='Tab') {
          const buttons=[...viewer.querySelectorAll('button:not(:disabled):not([tabindex="-1"])')].filter(button=>button.getClientRects().length);
          const first=buttons[0],last=buttons.at(-1);
          if (event.shiftKey&&document.activeElement===first) { event.preventDefault(); last.focus(); }
          if (!event.shiftKey&&document.activeElement===last) { event.preventDefault(); first.focus(); }
        }
      } else if (event.target.closest('.select-gallery') && ['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); selectIndex(view.index+(event.key==='ArrowLeft'?-1:1)); }
    },{signal});
    strip.addEventListener('scroll',()=>{
      const index=Math.round(strip.scrollLeft/Math.max(1,strip.clientWidth));
      if(index!==view.index)setIndex(index);
      clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{if(!dragging)selectIndex(view.index,false);},160);
    },{signal,passive:true});
    host.addEventListener('pointerdown',event=>{
      const surface = event.target.closest('.sg-strip, .sg-viewer-image'); if(!surface || event.button!==0)return;
      dragging={surface,x:event.clientX,y:event.clientY,left:strip.scrollLeft,pointerId:event.pointerId,mouse:event.pointerType==='mouse',moved:false};
    },{signal});
    host.addEventListener('pointermove',event=>{
      if(!dragging || event.pointerId!==dragging.pointerId)return;
      const dx=event.clientX-dragging.x,dy=event.clientY-dragging.y;
      if(Math.hypot(dx,dy)>10)dragging.moved=true;
      if(dragging.mouse && Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>6){
        event.preventDefault();dragging.surface.setPointerCapture(event.pointerId);
        if(!viewer){strip.classList.add('sg-dragging');strip.scrollLeft=dragging.left-dx;}
      }
    },{signal});
    const finishPointer = event => {
      if(!dragging || event.pointerId!==dragging.pointerId)return;
      const dx=event.clientX-dragging.x,dy=event.clientY-dragging.y,gesture=dragging;dragging=null;
      if(gesture.moved)suppressClickUntil=Date.now()+400;
      strip.classList.remove('sg-dragging');
      if(event.type==='pointercancel')return;
      if(viewer && Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy))showViewer(viewerIndex+(dx<0?1:-1));
      if(gesture.mouse&&!viewer&&gesture.moved)selectIndex(Math.round(strip.scrollLeft/strip.clientWidth));
    };
    host.addEventListener('pointerup',finishPointer,{signal});host.addEventListener('pointercancel',finishPointer,{signal});
    scroller.addEventListener('scroll',()=>{view.top=scroller.scrollTop;remember();},{signal,passive:true});
    window.addEventListener('popstate',()=>{
      if(viewer)closeViewer({pop:false});
      // Forward/reload does not reopen a stale modal entry.
      if(history.state?.selectPhotoViewer){const clean={...history.state};delete clean.selectPhotoViewer;history.replaceState(clean,'',location.href);}
    },{signal});
    window.addEventListener('pagehide',()=>{view.top=scroller.scrollTop;persist();},{signal});
    const resize = new ResizeObserver(()=>selectIndex(view.index,false));resize.observe(strip);
    setIndex(view.index);strip.scrollLeft=view.index*strip.clientWidth;scroller.scrollTop=view.top;
    inspectImages(host);
    active={close:closeViewer,destroy(){if(destroyed)return;destroyed=true;view.top=scroller.scrollTop;closeViewer({restore:false,pop:false});clearTimeout(saveTimer);clearTimeout(scrollTimer);controller.abort();resize.disconnect();persist();}};
  }
  window.HALO_SELECT_GALLERY={hero,details,mount,close:()=>active?.close(),destroy:()=>{active?.destroy();active=null;}};
})();
