/* ============================================================
   XV Años · Aidee Samay Erazo Guato
   Lógica interactiva: Sobre, música con fade-in posterior al video,
   contador regresivo, lluvia de pétalos y animaciones de scroll
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Variables del Intro y Sobre ---------- */
  var intro = document.getElementById("intro");
  var envelope = document.getElementById("envelope");
  var introVideo = document.getElementById("introVideo");
  var introVideoEl = document.getElementById("introVideoEl");
  var opened = false;
  try {
    opened = sessionStorage.getItem("xv_intro_opened");
  } catch (e) {}

  /* ---------- Control de Música con Fade-In Suave ---------- */
  var musicBtn = document.getElementById("musicBtn");
  var player = document.getElementById("musicPlayer");
  var isPlaying = false;
  var fadeInterval = null;

  function fadeInMusic(targetVol, durationMs) {
    if (!player) return;
    targetVol = targetVol || 1.0;
    durationMs = durationMs || 2500;
    clearInterval(fadeInterval);
    player.volume = 0;
    var p = player.play();
    if (p && p.catch) {
      p.catch(function () {
        isPlaying = false;
        musicBtn.classList.remove("playing");
        musicBtn.setAttribute("aria-pressed", "false");
      });
    }
    isPlaying = true;
    musicBtn.classList.add("playing");
    musicBtn.setAttribute("aria-pressed", "true");

    var stepTime = 50;
    var stepVol = targetVol / (durationMs / stepTime);
    fadeInterval = setInterval(function () {
      if (player.volume + stepVol >= targetVol) {
        player.volume = targetVol;
        clearInterval(fadeInterval);
      } else {
        player.volume = Math.min(targetVol, player.volume + stepVol);
      }
    }, stepTime);
  }

  function startMusic() {
    if (isPlaying) return;
    fadeInMusic(1.0, 2500);
  }

  function pauseMusic() {
    clearInterval(fadeInterval);
    isPlaying = false;
    musicBtn.classList.remove("playing");
    musicBtn.setAttribute("aria-pressed", "false");
    player.pause();
  }

  musicBtn.addEventListener("click", function () {
    if (!isPlaying) {
      startMusic();
    } else {
      pauseMusic();
    }
  });

  function closeIntro() {
    envelope.classList.add("done");
    setTimeout(function () {
      intro.classList.add("closed");
      document.body.style.overflow = "";
      // Iniciar la música DESPUÉS de que el video / sobre termine
      startMusic();
      try {
        sessionStorage.setItem("xv_intro_opened", "1");
      } catch (e) {}
    }, 420);
  }

  function playIntroVideo() {
    var videoOk = introVideoEl && introVideoEl.src && introVideoEl.getAttribute("src");
    if (!videoOk) {
      closeIntro();
      return;
    }
    introVideo.classList.add("show");
    
    // Reproducir el video
    var p = introVideoEl.play();
    if (p && p.catch) {
      p.catch(function () {
        closeIntro();
      });
    }

    function onEnd() {
      introVideo.classList.add("fade");
      setTimeout(function () {
        closeIntro();
        introVideo.classList.remove("show", "fade");
      }, 500);
    }

    introVideoEl.addEventListener("ended", onEnd, { once: true });
    introVideoEl.addEventListener("error", function () {
      introVideo.classList.remove("show");
      closeIntro();
    }, { once: true });
  }

  function openEnvelope() {
    if (envelope.classList.contains("open")) {
      return;
    }
    envelope.classList.add("open");
    // NO iniciamos música aquí para que no suene sobre el video
    setTimeout(playIntroVideo, 900);
  }

  if (opened) {
    intro.classList.add("closed");
    document.body.style.overflow = "";
  } else {
    document.body.style.overflow = "hidden";
    envelope.addEventListener("click", openEnvelope);
    envelope.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openEnvelope();
      }
    });
  }

  /* ---------- Reveal al hacer scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Animación Letra por Letra ---------- */
  var CH_ANIMS = ["chA", "chB", "chC", "chD", "chE", "chF"];
  var charEls = document.querySelectorAll(".chars");
  function splitChars() {
    charEls.forEach(function (el) {
      var text = el.textContent;
      el.textContent = "";
      var tokens = text.split(" ");
      var idx = 0;
      tokens.forEach(function (token, t) {
        if (t > 0) {
          el.appendChild(document.createTextNode(" "));
          idx++;
        }
        if (!token) { return; }
        var wrap = document.createElement("span");
        wrap.className = "w";
        for (var c = 0; c < token.length; c++, idx++) {
          var ch = document.createElement("span");
          ch.className = "ch";
          ch.style.setProperty("--i", idx);
          ch.style.setProperty("--ch-anim", CH_ANIMS[idx % CH_ANIMS.length]);
          ch.textContent = token[c];
          wrap.appendChild(ch);
        }
        el.appendChild(wrap);
      });
    });
  }
  var charTimer = setTimeout(splitChars, 1200);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      clearTimeout(charTimer);
      splitChars();
    });
  }

  /* ---------- Lluvia de Pétalos de Rosa ---------- */
  var petalField = document.getElementById("petalField");
  var PETAL_GRADS = [
    ["#e9a7bb", "#c96a8f"],
    ["#f0b8ca", "#d9829f"],
    ["#f6cfda", "#e8a5b8"],
    ["#f9e0e8", "#eec1cf"],
    ["#f4d9c4", "#e6b48f"]
  ];
  var petalCount = 0;

  function spawnPetal(initial) {
    var p = document.createElement("span");
    p.className = "petal";
    var g = PETAL_GRADS[Math.floor(Math.random() * PETAL_GRADS.length)];
    p.style.left = (Math.random() * 98) + "vw";
    p.style.width = (10 + Math.random() * 10) + "px";
    p.style.height = (14 + Math.random() * 12) + "px";
    p.style.background = "radial-gradient(120% 120% at 30% 25%, " + g[0] + " 0%, " + g[1] + " 78%)";
    p.style.setProperty("--sway", (12 + Math.random() * 26).toFixed(0) + "px");
    p.style.setProperty("--tilt", (Math.random() > 0.5 ? -1 : 1));
    var dur = 9 + Math.random() * 7;
    p.style.animationDuration = dur + "s";
    if (initial) p.style.animationDelay = (-Math.random() * 9).toFixed(2) + "s";
    setTimeout(function () {
      if (p.parentNode) {
        petalField.removeChild(p);
        petalCount--;
      }
    }, (dur + 10.5) * 1000);
    petalField.appendChild(p);
    petalCount++;
  }

  function startPetals() {
    for (var i = 0; i < 6; i++) spawnPetal(true);
    setInterval(function () {
      if (petalCount < 14) spawnPetal(false);
    }, 1600);
  }
  if (petalField) startPetals();

  /* ---------- Cuenta Regresiva (Countdown) ---------- */
  var EVENT_DATE = new Date("2026-10-10T11:00:00").getTime();

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function bump(el, value) {
    if (!el) return;
    if (el.textContent === value) return;
    el.textContent = value;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  function tick() {
    var now = Date.now();
    var diff = Math.max(0, EVENT_DATE - now);
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    bump(document.getElementById("cdDays"), pad(d));
    bump(document.getElementById("cdHours"), pad(h));
    bump(document.getElementById("cdMins"), pad(m));
    bump(document.getElementById("cdSecs"), pad(s));
  }
  tick();
  setInterval(tick, 1000);
})();
