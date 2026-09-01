/**
 * App: Huvudkontroll för Glasburken
 */
document.addEventListener("DOMContentLoaded", async () => {
    const engine = new PopulationEngine();
    const jar = new Jar3D("canvasContainer");

    // UI Referenser
    const popNumber = document.getElementById("popNumber");
    const currentYearBadge = document.getElementById("currentYearBadge");
    const eraNote = document.getElementById("eraNote");
    const liveClock = document.getElementById("liveClock");
    const tickerText = document.getElementById("tickerText");
    const yearSlider = document.getElementById("yearSlider");
    const selectedYearDisplay = document.getElementById("selectedYearDisplay");
    const liveModeBtn = document.getElementById("liveModeBtn");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const findCohortBtn = document.getElementById("findCohortBtn");
    const cohortModal = document.getElementById("cohortModal");
    const closeCohortBtn = document.getElementById("closeCohortBtn");
    const birthYearInput = document.getElementById("birthYearInput");
    const highlightCohortBtn = document.getElementById("highlightCohortBtn");
    const cohortStat = document.getElementById("cohortStat");
    const fullscreenBtn = document.getElementById("fullscreenBtn");

    // Ladda SCB-data
    const loaded = await engine.load();
    if (!loaded) {
        popNumber.textContent = "Kunde ej ladda SCB-data";
        return;
    }

    // Formatera siffror med svenska mellanrum (t.ex. 10 587 710)
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    // Visa data för ett visst år
    function showYear(year) {
        engine.currentYear = year;
        const popData = engine.getDataForYear(year);
        if (!popData) return;

        popNumber.textContent = formatNumber(popData.total);
        currentYearBadge.textContent = year;
        selectedYearDisplay.textContent = year;
        yearSlider.value = year;
        eraNote.textContent = `(${engine.getEraNote(year)})`;

        jar.updateFromPopulation(popData);
    }

    // Initialisera till 2024
    showYear(2024);

    // Slider Ändring
    yearSlider.addEventListener("input", (e) => {
        engine.isLive = false;
        liveModeBtn.classList.remove("active");
        const yr = parseInt(e.target.value, 10);
        showYear(yr);
    });

    // Live Mode Knapp
    liveModeBtn.addEventListener("click", () => {
        engine.isLive = true;
        liveModeBtn.classList.add("active");
        showYear(2024);
        tickerText.textContent = "Realtidsläge aktivt: Räknar födslar, dödsfall och migration";
    });

    // Play / Pause Knapp för historisk tidsresa
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
                let nextYear = engine.currentYear + 1;
                if (nextYear > 2070) nextYear = 1860;
                showYear(nextYear);
            }, 350); // 1 år var 350:e millisekund för mjuk visuell resa!
        }
    });

    // Kohort Modal (Hitta min årskull)
    findCohortBtn.addEventListener("click", () => {
        cohortModal.classList.remove("hidden");
    });

    closeCohortBtn.addEventListener("click", () => {
        cohortModal.classList.add("hidden");
        jar.setHighlightAge(-1); // Återställ belysning
    });

    highlightCohortBtn.addEventListener("click", () => {
        const birthYear = parseInt(birthYearInput.value, 10);
        if (isNaN(birthYear) || birthYear < 1915 || birthYear > 2024) {
            cohortStat.textContent = "Ange ett giltigt födelseår mellan 1915 och 2024.";
            return;
        }

        const info = engine.getCohortInfo(birthYear, engine.currentYear);
        if (info) {
            cohortStat.innerHTML = `Födda ${info.birthYear} (${info.age} år): <strong>${formatNumber(info.total)} personer</strong> i Sverige (${formatNumber(info.men)} män, ${formatNumber(info.women)} kvinnor). Utgör ${info.shareOfPopulation}% av befolkningen.`;
            jar.setHighlightAge(info.age);
        }
    });

    // Live Klocka & Realtidsrytm
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        liveClock.textContent = `${h}:${m}:${s}`;

        // Om i live-läge: kör Poisson-tick
        if (engine.isLive) {
            const events = engine.tickRealtime(1.0);
            if (events) {
                for (let ev of events) {
                    tickerText.textContent = `${h}:${m}:${s} — ${ev.text}`;
                    if (ev.type === 'birth') {
                        jar.spawnDroppingBead('birth');
                        // Öka räknaren subtilt
                        const currentVal = parseInt(popNumber.textContent.replace(/\s/g, ""), 10);
                        popNumber.textContent = formatNumber(currentVal + 1);
                    } else if (ev.type === 'immigrate') {
                        jar.spawnDroppingBead('immigrate');
                        const currentVal = parseInt(popNumber.textContent.replace(/\s/g, ""), 10);
                        popNumber.textContent = formatNumber(currentVal + 1);
                    } else if (ev.type === 'death') {
                        const currentVal = parseInt(popNumber.textContent.replace(/\s/g, ""), 10);
                        popNumber.textContent = formatNumber(currentVal - 1);
                    }
                }
            }
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

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
        } else if (e.key === "Escape") {
            cohortModal.classList.add("hidden");
            jar.setHighlightAge(-1);
        }
    });

    // Kiosk Idle Fade (tonar bort kontroller efter 5 sekunders inaktivitet)
    let idleTimer = null;
    function resetIdleTimer() {
        document.body.classList.remove("mouse-idle");
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            if (cohortModal.classList.contains("hidden")) {
                document.body.classList.add("mouse-idle");
            }
        }, 5000);
    }
    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("touchstart", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    resetIdleTimer();
});
