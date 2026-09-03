/* ============================================================
   XV Años · Aidee Samay Erazo Guato
   Lógica interactiva: Sobre, video CON SONIDO, transición fluida
   a música de fondo tras el video y pausa en segundo plano
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Variables del Intro y Sobre ---------- */
  var intro = document.getElementById("intro");
  var envelope = document.getElementById("envelope");
  var introVideo = document.getElementById("introVideo");
  var introVideoEl = document.getElementById("introVideoEl");
  var introVideoSkip = document.getElementById("introVideoSkip");
  var opened = false;
  var introClosed = false;

  try {
    opened = sessionStorage.getItem("xv_intro_opened");
  } catch (e) {}

  /* ---------- Control de Música ---------- */
  var musicBtn = document.getElementById("musicBtn");
  var player = document.getElementById("musicPlayer");
  var isPlaying = false;
  var wasPlayingBeforeHide = false;
  var fadeInterval = null;

  function fadeInMusic(targetVol, durationMs) {
    if (!player) return;
    targetVol = targetVol || 1.0;
    durationMs = durationMs || 2400;
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
    fadeInMusic(1.0, 2400);
  }

  function pauseMusic() {
    clearInterval(fadeInterval);
    isPlaying = false;
    musicBtn.classList.remove("playing");
    musicBtn.setAttribute("aria-pressed", "false");
    if (player) {
      player.pause();
    }
  }

  musicBtn.addEventListener("click", function () {
    if (!isPlaying) {
      startMusic();
    } else {
      pauseMusic();
    }
  });

  /* ---------- Control de Segundo Plano (Pausa al cambiar de app o minimizar) ---------- */
  function handleVisibilityChange() {
    if (document.hidden) {
      // Pausar video si aún está reproduciéndose
      if (introVideoEl && !introClosed) {
        try { introVideoEl.pause(); } catch (e) {}
      }
      // Pausar música
      if (isPlaying) {
        wasPlayingBeforeHide = true;
        pauseMusic();
      }
    } else {
      // Reanudar video si el intro no se ha cerrado
      if (introVideoEl && !introClosed && introVideo.classList.contains("show")) {
        try { introVideoEl.play(); } catch (e) {}
      }
      // Reanudar música si estaba sonando
      if (wasPlayingBeforeHide && introClosed) {
        wasPlayingBeforeHide = false;
        startMusic();
      }
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", function () {
    if (introVideoEl && !introClosed) {
      try { introVideoEl.pause(); } catch (e) {}
    }
    pauseMusic();
  });
  window.addEventListener("blur", function () {
    if (document.hidden) {
      if (introVideoEl && !introClosed) {
        try { introVideoEl.pause(); } catch (e) {}
      }
      if (isPlaying) {
        wasPlayingBeforeHide = true;
        pauseMusic();
      }
    }
  });

  /* ---------- Cierre Seguro del Intro e Inicio de la Música ---------- */
  function closeIntro() {
    if (introClosed) return;
    introClosed = true;

    // Detener y liberar video
    if (introVideoEl) {
      introVideoEl.onended = null;
      introVideoEl.onerror = null;
      introVideoEl.pause();
      try {
        introVideoEl.removeAttribute("src");
        introVideoEl.load();
      } catch (e) {}
    }

    envelope.classList.add("done");
    setTimeout(function () {
      intro.classList.add("closed");
      document.body.style.overflow = "";

      // Iniciar la música de fondo DESPUÉS de terminar el video
      startMusic();

      // Iniciar pétalos
      startPetals();

      try {
        sessionStorage.setItem("xv_intro_opened", "1");
      } catch (e) {}
    }, 340);
  }

  /* ---------- Iniciar Video CON SONIDO desde el Segundo 0 ---------- */
  function startIntroVideo() {
    if (!introVideoEl || !introVideoEl.src) {
      closeIntro();
      return;
    }

    introVideo.classList.add("show");
    
    // Configurar video CON SONIDO y a velocidad normal
    introVideoEl.muted = false;
    introVideoEl.volume = 1.0;
    introVideoEl.playbackRate = 1.0;
    introVideoEl.currentTime = 0;

    var vP = introVideoEl.play();
    if (vP && vP.catch) {
      vP.catch(function (err) {
        // Si el navegador móvil bloquea audio de video en un escenario estricto, reproducir en mute
        console.warn("Autoplay with sound restricted, falling back to muted video", err);
        introVideoEl.muted = true;
        introVideoEl.play().catch(function () {
          setTimeout(closeIntro, 400);
        });
      });
    }

    var handled = false;
    function finishVideo() {
      if (handled) return;
      handled = true;
      introVideo.classList.add("fade");
      setTimeout(function () {
        closeIntro();
        introVideo.classList.remove("show", "fade");
      }, 350);
    }

    introVideoEl.onended = finishVideo;
    introVideoEl.onerror = finishVideo;

    // Temporizador de seguridad
    var maxDuration = (introVideoEl.duration && !isNaN(introVideoEl.duration) && introVideoEl.duration > 0)
      ? (introVideoEl.duration * 1000 + 1500)
      : 12000;
    var safetyTimer = setTimeout(finishVideo, maxDuration);

    if (introVideoSkip) {
      introVideoSkip.onclick = function (e) {
        e.stopPropagation();
        clearTimeout(safetyTimer);
        finishVideo();
      };
    }

    introVideo.onclick = function () {
      clearTimeout(safetyTimer);
      finishVideo();
    };
  }

  /* ---------- Apertura del Sobre ---------- */
  function openEnvelope() {
    if (envelope.classList.contains("open")) {
      return;
    }
    envelope.classList.add("open");

    // 1. Pre-autorización silenciosa del reproductor de música con el toque del usuario
    if (player) {
      player.volume = 0;
      var p = player.play();
      if (p && p.then) {
        p.then(function () {
          player.pause();
          player.currentTime = 0;
        }).catch(function () {});
      }
    }

    // 2. Al abrir la solapa del sobre (700ms), inicia el video CON SONIDO
    setTimeout(startIntroVideo, 700);
  }

  if (opened) {
    introClosed = true;
    intro.classList.add("closed");
    document.body.style.overflow = "";
    startPetals();
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
    }, { threshold: 0.12 });
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
  var charTimer = setTimeout(splitChars, 1000);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      clearTimeout(charTimer);
      splitChars();
    });
  }

  /* ---------- Lluvia de Pétalos de Rosa Optimizada ---------- */
  var petalField = document.getElementById("petalField");
  var PETAL_GRADS = [
    ["#e9a7bb", "#c96a8f"],
    ["#f0b8ca", "#d9829f"],
    ["#f6cfda", "#e8a5b8"],
    ["#f9e0e8", "#eec1cf"],
    ["#f4d9c4", "#e6b48f"]
  ];
  var petalCount = 0;
  var petalsRunning = false;
  var maxPetals = (window.innerWidth < 600) ? 8 : 12;

  function spawnPetal(initial) {
    if (!petalField) return;
    var p = document.createElement("span");
    p.className = "petal";
    var g = PETAL_GRADS[Math.floor(Math.random() * PETAL_GRADS.length)];
    p.style.left = (Math.random() * 96) + "vw";
    p.style.width = (10 + Math.random() * 8) + "px";
    p.style.height = (14 + Math.random() * 10) + "px";
    p.style.background = "radial-gradient(120% 120% at 30% 25%, " + g[0] + " 0%, " + g[1] + " 78%)";
    p.style.setProperty("--sway", (10 + Math.random() * 20).toFixed(0) + "px");
    p.style.setProperty("--tilt", (Math.random() > 0.5 ? -1 : 1));
    var dur = 8 + Math.random() * 6;
    p.style.animationDuration = dur + "s";
    if (initial) p.style.animationDelay = (-Math.random() * 8).toFixed(2) + "s";
    setTimeout(function () {
      if (p.parentNode) {
        petalField.removeChild(p);
        petalCount--;
      }
    }, (dur + 9) * 1000);
    petalField.appendChild(p);
    petalCount++;
  }

  function startPetals() {
    if (petalsRunning || !petalField) return;
    petalsRunning = true;
    for (var i = 0; i < 4; i++) spawnPetal(true);
    setInterval(function () {
      if (!document.hidden && petalCount < maxPetals) spawnPetal(false);
    }, 2000);
  }

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
