/**
 * App: Huvudkontroll för Befolkningssimulatorn (Fullskärms Myller)
 */
document.addEventListener("DOMContentLoaded", async () => {
    const engine = new PopulationEngine();

    // UI Referenser
    const popNumber = document.getElementById("popNumber");
    const currentYearBadge = document.getElementById("currentYearBadge");
    const eraNote = document.getElementById("eraNote");
    const liveClock = document.getElementById("liveClock");
    const liveRhythmBar = document.getElementById("liveRhythmBar");
    const birthCountVal = document.getElementById("birthCountVal");
    const deathCountVal = document.getElementById("deathCountVal");
    const immigrateCountVal = document.getElementById("immigrateCountVal");
    const emigrateCountVal = document.getElementById("emigrateCountVal");
    const rhythmToast = document.getElementById("rhythmToast");
    const rhythmBirth = document.getElementById("rhythmBirth");
    const rhythmDeath = document.getElementById("rhythmDeath");
    const rhythmImmigrant = document.getElementById("rhythmImmigrant");
    const rhythmEmigrant = document.getElementById("rhythmEmigrant");
    const yearSlider = document.getElementById("yearSlider");
    const selectedYearDisplay = document.getElementById("selectedYearDisplay");
    const timelinePanel = document.getElementById("timelinePanel");
    const toggleTimelineBtn = document.getElementById("toggleTimelineBtn");
    const closeTimelineBtn = document.getElementById("closeTimelineBtn");
    const liveModeBtn = document.getElementById("liveModeBtn");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const findCohortBtn = document.getElementById("findCohortBtn");
    const cohortModal = document.getElementById("cohortModal");
    const closeCohortBtn = document.getElementById("closeCohortBtn");
    const birthYearInput = document.getElementById("birthYearInput");
    const highlightCohortBtn = document.getElementById("highlightCohortBtn");
    const cohortStat = document.getElementById("cohortStat");
    const fullscreenBtn = document.getElementById("fullscreenBtn");

    // Person Card Inspector UI
    const personCard = document.getElementById("personCard");
    const closePersonBtn = document.getElementById("closePersonBtn");
    const personBadge = document.getElementById("personBadge");
    const personTitle = document.getElementById("personTitle");
    const personLocation = document.getElementById("personLocation");
    const personBirthYear = document.getElementById("personBirthYear");
    const personMarital = document.getElementById("personMarital");
    const personMunicipality = document.getElementById("personMunicipality");
    const personCountry = document.getElementById("personCountry");

    // Callback när användaren klickar på en specifik pärla i myllret!
    const onPersonClick = (nearestBead, clientX, clientY) => {
        const profile = engine.generatePersonProfile(nearestBead.age, nearestBead.sex, engine.currentYear);

        personTitle.textContent = profile.displayTitle;
        personLocation.textContent = `📍 ${profile.displayLocation}`;
        personBirthYear.textContent = profile.birthYear;
        personMarital.textContent = profile.marital;
        personMunicipality.textContent = `${profile.municipality} (${profile.municipalityPop} inv.)`;

        if (profile.isForeignBorn) {
            personBadge.textContent = `🌍 Född i ${profile.birthCountry} (Invandrad)`;
            personBadge.style.color = "#00f5a0";
            personBadge.style.borderColor = "rgba(0, 245, 160, 0.4)";
            personBadge.style.background = "rgba(0, 245, 160, 0.12)";
            personCountry.textContent = profile.countryStat || profile.birthCountry;
        } else {
            personBadge.textContent = "🇸🇪 Född i Sverige";
            personBadge.style.color = "#00f5d4";
            personBadge.style.borderColor = "rgba(0, 245, 212, 0.3)";
            personBadge.style.background = "rgba(0, 245, 212, 0.12)";
            personCountry.textContent = "Sverige";
        }

        personCard.classList.remove("hidden");
    };

    // Skapa Viewport Canvas
    const canvas = new ViewportCanvas("canvasContainer", onPersonClick);

    // Stäng person-kort
    if (closePersonBtn) {
        closePersonBtn.addEventListener("click", () => {
            personCard.classList.add("hidden");
        });
    }

    // Ladda SCB-data
    const loaded = await engine.load();
    if (!loaded) {
        popNumber.textContent = "Kunde ej ladda SCB-data";
        return;
    }
    engine.initWallClockCounters();

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    function showYear(year) {
        engine.currentYear = year;
        const popData = engine.getDataForYear(year);
        if (!popData) return;

        popNumber.textContent = formatNumber(popData.total);
        currentYearBadge.textContent = year;
        selectedYearDisplay.textContent = year;
        yearSlider.value = year;
        eraNote.textContent = `(${engine.getEraNote(year)})`;

        canvas.updateFromPopulation(popData);
        updateAgeRuler(canvas, popData);

        if (liveRhythmBar) {
            liveRhythmBar.style.opacity = (year === 2026 && engine.isLive) ? "1.0" : "0.30";
            liveRhythmBar.style.filter = (year === 2026 && engine.isLive) ? "none" : "grayscale(0.6)";
        }
    }

    // Dynamisk Ålderslinjal som anpassar höjd och markörer efter folkmängd och demografi
    function updateAgeRuler(canvas, popData) {
        const ageRuler = document.getElementById("ageRuler");
        if (!ageRuler || !canvas || !popData) return;

        const surfaceY = canvas.currentSurfaceY;
        const botY = canvas.botY;
        const worldH = canvas.worldHeight;

        if (surfaceY === undefined || botY === undefined || !worldH) return;

        // Skärmprocent från fönstrets överkant
        const topPct = (0.5 - (surfaceY / worldH)) * 100;
        const botPct = (0.5 - (botY / worldH)) * 100;
        const heightPct = botPct - topPct;

        ageRuler.style.top = `${topPct.toFixed(2)}%`;
        ageRuler.style.height = `${heightPct.toFixed(2)}%`;

        // Beräkna kumulativ andel äldre för att placera 25, 50, 75 år på rätt fysisk höjd
        const total = popData.total;
        let sumOlder25 = 0;
        let sumOlder50 = 0;
        let sumOlder75 = 0;

        for (let age = 105; age >= 0; age--) {
            const c = popData.ages[age] || [0, 0];
            const cnt = c[0] + c[1];
            if (age >= 25) sumOlder25 += cnt;
            if (age >= 50) sumOlder50 += cnt;
            if (age >= 75) sumOlder75 += cnt;
        }

        // top: 0% är nyfödda (ytan), top: 100% är äldst (botten)
        const pct25 = (1.0 - (sumOlder25 / total)) * 100;
        const pct50 = (1.0 - (sumOlder50 / total)) * 100;
        const pct75 = (1.0 - (sumOlder75 / total)) * 100;

        const r0 = document.getElementById("ruler0");
        const r25 = document.getElementById("ruler25");
        const r50 = document.getElementById("ruler50");
        const r75 = document.getElementById("ruler75");
        const r100 = document.getElementById("ruler100");

        if (r0) r0.style.top = "0%";
        if (r25) r25.style.top = `${pct25.toFixed(1)}%`;
        if (r50) r50.style.top = `${pct50.toFixed(1)}%`;
        if (r75) r75.style.top = `${pct75.toFixed(1)}%`;
        if (r100) r100.style.top = "100%";
    }

    // Starta på 2026 (Idag)
    showYear(2026);

    // Slider
    yearSlider.addEventListener("input", (e) => {
        engine.isLive = false;
        liveModeBtn.classList.remove("active");
        const yr = parseInt(e.target.value, 10);
        showYear(yr);
    });

    // Toast-meddelande vid händelser i live-rytmen
    let toastTimer = null;
    function showRhythmToast(type, text) {
        if (!rhythmToast) return;
        rhythmToast.textContent = text;
        rhythmToast.classList.remove("hidden");

        const targetEl = (type === 'birth') ? rhythmBirth :
                         (type === 'death') ? rhythmDeath :
                         (type === 'immigrate') ? rhythmImmigrant :
                         (type === 'emigrate') ? rhythmEmigrant : null;

        if (targetEl) {
            targetEl.classList.add("flash-pulse");
            setTimeout(() => targetEl.classList.remove("flash-pulse"), 1400);
        }

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            rhythmToast.classList.add("hidden");
        }, 3400);
    }

    // Live Mode
    liveModeBtn.addEventListener("click", () => {
        engine.isLive = true;
        liveModeBtn.classList.add("active");
        showYear(2026);
        showRhythmToast('live', '🔴 Realtidsläge 2026 aktivt');
    });

    // Play / Pause
    let playInterval = null;
    playPauseBtn.addEventListener("click", () => {
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
            playPauseBtn.textContent = "▶ Spela";
            playPauseBtn.classList.remove("active");
        } else {
            engine.isLive = false;
            liveModeBtn.classList.remove("active");
            playPauseBtn.textContent = "⏸ Paus";
            playPauseBtn.classList.add("active");

            playInterval = setInterval(() => {
                let yr = engine.currentYear + 1;
                if (yr > 2070) yr = 1860;
                showYear(yr);
            }, 250);
        }
    });

    // Kohort Modal (Hitta din årskull)
    findCohortBtn.addEventListener("click", () => {
        cohortModal.classList.remove("hidden");
    });

    closeCohortBtn.addEventListener("click", () => {
        cohortModal.classList.add("hidden");
        canvas.setHighlightAge(-1);
    });

    highlightCohortBtn.addEventListener("click", () => {
        const birthYear = parseInt(birthYearInput.value, 10);
        if (isNaN(birthYear) || birthYear < 1915 || birthYear > 2026) {
            cohortStat.textContent = "Ange ett giltigt födelseår mellan 1915 och 2026.";
            return;
        }

        const info = engine.getCohortInfo(birthYear, engine.currentYear);
        if (info) {
            cohortStat.innerHTML = `Födda ${info.birthYear} (${info.age} år): <strong>${formatNumber(info.total)} personer</strong> i Sverige (${formatNumber(info.men)} män, ${formatNumber(info.women)} kvinnor). Utgör ${info.shareOfPopulation}% av befolkningen.`;
            canvas.setHighlightAge(info.age);
        }
    });

    // Tempo-väljare (1x, 10x, 60x)
    const speedBtn = document.getElementById("speedBtn");

    const speeds = [
        { mult: 1.0, label: "⚡ 1x Real" },
        { mult: 10.0, label: "⚡ 10x Fart" },
        { mult: 60.0, label: "⚡ 60x Demo" }
    ];
    let currentSpeedIndex = 0;

    if (speedBtn) {
        speedBtn.addEventListener("click", () => {
            currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
            const chosen = speeds[currentSpeedIndex];
            engine.speedMultiplier = chosen.mult;
            speedBtn.textContent = chosen.label;
            if (chosen.mult > 1.0) {
                speedBtn.classList.add("active");
            } else {
                speedBtn.classList.remove("active");
            }
        });
    }

    // Live Klocka, Nedräknare & Realtidsrytm
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        liveClock.textContent = `${h}:${m}:${s}`;

        if (engine.isLive) {
            const events = engine.tickRealtime(1.0);
            if (events) {
                for (let ev of events) {
                    showRhythmToast(ev.type, `${h}:${m}:${s} — ${ev.text}`);
                    if (ev.type === 'birth') {
                        canvas.spawnDroppingBead('birth');
                        const currentVal = parseInt(popNumber.textContent.replace(/\s/g, ""), 10);
                        popNumber.textContent = formatNumber(currentVal + 1);
                    } else if (ev.type === 'immigrate') {
                        canvas.spawnDroppingBead('immigrate');
                        const currentVal = parseInt(popNumber.textContent.replace(/\s/g, ""), 10);
                        popNumber.textContent = formatNumber(currentVal + 1);
                    } else if (ev.type === 'death') {
                        canvas.spawnDepartingBead('death');
                        const currentVal = parseInt(popNumber.textContent.replace(/\s/g, ""), 10);
                        popNumber.textContent = formatNumber(currentVal - 1);
                    } else if (ev.type === 'emigrate') {
                        canvas.spawnDepartingBead('emigrate');
                        const currentVal = parseInt(popNumber.textContent.replace(/\s/g, ""), 10);
                        popNumber.textContent = formatNumber(currentVal - 1);
                    }
                }
            }

            // Uppdatera alla 4 organiska nedräkningar i kontrollpanelen
            const cd = engine.getNextEventCountdowns();
            if (cd) {
                const fmt = (sec) => {
                    const min = Math.floor(sec / 60);
                    const remS = String(sec % 60).padStart(2, "0");
                    return `om ${min}m ${remS}s`;
                };
                if (birthCountVal) birthCountVal.textContent = fmt(cd.nextBirthSec);
                if (deathCountVal) deathCountVal.textContent = fmt(cd.nextDeathSec);
                if (immigrateCountVal) immigrateCountVal.textContent = fmt(cd.nextImmigrantSec);
                if (emigrateCountVal) emigrateCountVal.textContent = fmt(cd.nextEmigrantSec);
            }
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Växla kontrollpanelen (fäll ihop till ett diskret kugghjul som i solpong)
    function setTimelineCollapsed(collapsed) {
        if (!timelinePanel) return;
        if (collapsed) {
            timelinePanel.classList.add("collapsed");
            if (toggleTimelineBtn) toggleTimelineBtn.classList.remove("active");
        } else {
            timelinePanel.classList.remove("collapsed");
            if (toggleTimelineBtn) toggleTimelineBtn.classList.add("active");
        }
    }

    if (toggleTimelineBtn && timelinePanel) {
        toggleTimelineBtn.addEventListener("click", () => {
            const isCollapsed = timelinePanel.classList.contains("collapsed");
            setTimelineCollapsed(!isCollapsed);
        });
    }

    if (closeTimelineBtn && timelinePanel) {
        closeTimelineBtn.addEventListener("click", () => {
            setTimelineCollapsed(true);
        });
    }

    // Fullskärm
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }
    fullscreenBtn.addEventListener("click", toggleFullscreen);
    window.addEventListener("keydown", (e) => {
        if (e.key === "f" || e.key === "F") {
            if (e.target.tagName !== "INPUT") {
                toggleFullscreen();
            }
        } else if ((e.key === "t" || e.key === "T") && e.target.tagName !== "INPUT") {
            if (timelinePanel) {
                const isCollapsed = timelinePanel.classList.contains("collapsed");
                setTimelineCollapsed(!isCollapsed);
            }
        } else if (e.key === "Escape") {
            cohortModal.classList.add("hidden");
            personCard.classList.add("hidden");
            canvas.setHighlightAge(-1);
        }
    });

    // Inaktivitets-timer för ambient visning
    let idleTimer = null;
    function resetIdleTimer() {
        document.body.classList.remove("mouse-idle");
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            document.body.classList.add("mouse-idle");
        }, 8000);
    }
    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("mousedown", resetIdleTimer);
    window.addEventListener("touchstart", resetIdleTimer);
    window.addEventListener("resize", () => {
        updateAgeRuler(canvas, engine.getDataForYear(engine.currentYear));
    });

    resetIdleTimer();
});
