(function () {
  // Presentation only: existing result IDs and data-quality gates remain authoritative.
  const states = {
    restore: { label: "休息日", image: "assets/body-weather-rest.svg", scene: "静云", copies: ["今天多休息，能缓的事先缓一缓。", "不急的事先放一放，今天多歇一会儿。"] },
    slow: { label: "慢行日", image: "assets/body-weather-slow.svg", scene: "云隙透光", copies: ["日常照常安排，中间记得歇一会儿。", "按日常节奏来，做一阵就歇一会儿。"] },
    balance: { label: "平常日", image: "assets/body-weather-usual.svg", scene: "开阔晴空", copies: ["和平时差不多，按自己的节奏来。", "今天的状态接近平时，照常安排就好。"] },
    active: { label: "活力日", image: "assets/body-weather-active.svg", scene: "放射日光", copies: ["今天状态不错，想做的事可以安排上。", "状态不错，今天可以做点想做的事。"] },
  };
  function get(key, variant = 0) {
    const value = Object.prototype.hasOwnProperty.call(states, key) ? states[key] : null;
    if (!value) return null;
    const index = Number.isInteger(variant) ? ((variant % value.copies.length) + value.copies.length) % value.copies.length : 0;
    return { ...value, key, copy: value.copies[index], copyVariant: index };
  }
  function artwork(key) {
    const value = get(key);
    return value ? `<img class="bw-artwork" src="${value.image}" width="240" height="180" alt="" aria-hidden="true" data-weather-art="${value.key}">` : "";
  }
  window.HaloBodyWeatherVisuals = Object.freeze({ keys: Object.freeze(Object.keys(states)), get, artwork });
})();
