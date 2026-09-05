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
    const infoPanel = document.getElementById("infoPanel");
    const toggleInfoBtn = document.getElementById("toggleInfoBtn");
    const closeInfoBtn = document.getElementById("closeInfoBtn");
    const liveModeBtn = document.getElementById("liveModeBtn");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const findCohortBtn = document.getElementById("findCohortBtn");
    const cohortModal = document.getElementById("cohortModal");
    const closeCohortBtn = document.getElementById("closeCohortBtn");
    const birthYearInput = document.getElementById("birthYearInput");
    const highlightCohortBtn = document.getElementById("highlightCohortBtn");
    const cohortStat = document.getElementById("cohortStat");
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    
    // Subtil levande händelsenotis i rymden ovanför pärlytan
    const narrativePill = document.getElementById("narrativePill");
    const narrativeDot = document.getElementById("narrativeDot");
    const narrativeTime = document.getElementById("narrativeTime");
    const narrativeText = document.getElementById("narrativeText");
    const narrativeDelta = document.getElementById("narrativeDelta");

    // Person Card Inspector UI
    const personCard = document.getElementById("personCard");
    const closePersonBtn = document.getElementById("closePersonBtn");
    const personBadge = document.getElementById("personBadge");
    const personTitle = document.getElementById("personTitle");
    const personLocation = document.getElementById("personLocation");
    const personBirthYear = document.getElementById("personBirthYear");
    const personMarital = document.getElementById("personMarital");
    const personChildren = document.getElementById("personChildren");
    const personHousing = document.getElementById("personHousing");
    const personOccupation = document.getElementById("personOccupation");
    const personMunicipality = document.getElementById("personMunicipality");
    const personCountry = document.getElementById("personCountry");

    const eraStatFertility = document.getElementById("eraStatFertility");
    const eraStatLifeExp = document.getElementById("eraStatLifeExp");
    const eraStatUrban = document.getElementById("eraStatUrban");
    const eraStatInfant = document.getElementById("eraStatInfant");
    const eraStatFk = document.getElementById("eraStatFk");
    const eraStatFkItem = document.getElementById("eraStatFkItem");

    // Framtidsmodeller UI Referenser (SCB vs Egen modell)
    const futureScenarioPanel = document.getElementById("futureScenarioPanel");
    const modelScbBtn = document.getElementById("modelScbBtn");
    const modelTrendBtn = document.getElementById("modelTrendBtn");
    const scenarioInfoBtn = document.getElementById("scenarioInfoBtn");
    const scbScenarioStrip = document.getElementById("scbScenarioStrip");
    const trendScenarioStrip = document.getElementById("trendScenarioStrip");
    const scbScenarioDesc = document.getElementById("scbScenarioDesc");
    const trendScenarioDesc = document.getElementById("trendScenarioDesc");
    const trendTfrSlider = document.getElementById("trendTfrSlider");
    const trendTfrVal = document.getElementById("trendTfrVal");
    const trendImmigSlider = document.getElementById("trendImmigSlider");
    const trendImmigVal = document.getElementById("trendImmigVal");
    const trendEmigSlider = document.getElementById("trendEmigSlider");
    const trendEmigVal = document.getElementById("trendEmigVal");
    const trendNettoBadge = document.getElementById("trendNettoBadge");


    // Formation & Vyväljare (Morfande partikelsvärm)
    const viewButtons = document.querySelectorAll(".view-btn");
    const formationOverlay = document.getElementById("formationOverlay");
    const formColLeftTitle = document.getElementById("formColLeftTitle");
    const formColLeftStat = document.getElementById("formColLeftStat");
    const formColRightTitle = document.getElementById("formColRightTitle");
    const formColRightStat = document.getElementById("formColRightStat");

    // Callback när användaren klickar på en specifik pärla i myllret!
    const onPersonClick = (nearestBead, clientX, clientY) => {
        const profile = engine.generatePersonProfile(nearestBead.age, nearestBead.sex, engine.currentYear);

        personTitle.textContent = profile.displayTitle;
        personLocation.textContent = `📍 ${profile.displayLocation}`;
        personBirthYear.textContent = profile.birthYear;
        personMarital.textContent = profile.marital;
        if (personChildren) personChildren.textContent = profile.children;
        if (personHousing) personHousing.textContent = profile.housing;
        if (personOccupation) personOccupation.textContent = profile.occupation;
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
    canvas.getYearStats = () => engine.getEraStats(engine.currentYear);

    // Stäng person-kort
    if (closePersonBtn) {
        closePersonBtn.addEventListener("click", () => {
            personCard.classList.add("hidden");
            canvas.setSelectedBead(-1);
        });
    }

    // Formation & Vyväljare för pärlorna (Morfande partikelsvärm)
    function updateFormationOverlay(year, popData) {
        if (!formationOverlay) return;
        const mode = canvas.currentViewMode;
        if (mode === 'sea') {
            formationOverlay.classList.add('hidden');
            return;
        }

        formationOverlay.classList.remove('hidden');
        const total = popData.total;

        if (mode === 'pyramid') {
            const menPct = ((popData.men / total) * 100).toFixed(1).replace('.', ',');
            const womenPct = ((popData.women / total) * 100).toFixed(1).replace('.', ',');
            formColLeftTitle.textContent = "♂ MÄN";
            formColLeftStat.textContent = `${formatNumber(popData.men)} (${menPct} %)`;
            formColRightTitle.textContent = "♀ KVINNOR";
            formColRightStat.textContent = `${formatNumber(popData.women)} (${womenPct} %)`;
        } else if (mode === 'urban_rural') {
            const stats = engine.getEraStats(year);
            const urbanRatio = stats.urbanRaw / 100.0;
            const urbanPop = Math.round(total * urbanRatio);
            const ruralPop = total - urbanPop;
            const urbanPct = Math.round(urbanRatio * 100);
            const ruralPct = 100 - urbanPct;

            formColLeftTitle.textContent = "🌾 LANDSBYGD";
            formColLeftStat.textContent = `${formatNumber(ruralPop)} (${ruralPct} %)`;
            formColRightTitle.textContent = "🏙️ TÄTORT";
            formColRightStat.textContent = `${formatNumber(urbanPop)} (${urbanPct} %)`;
        } else if (mode === 'origin') {
            let foreignRatio = 0.20;
            if (year < 1945) foreignRatio = 0.01;
            else if (year < 1970) foreignRatio = 0.01 + ((year - 1945) / 25.0) * 0.057;
            else if (year < 2000) foreignRatio = 0.067 + ((year - 1970) / 30.0) * 0.046;
            else if (year < 2026) foreignRatio = 0.113 + ((year - 2000) / 26.0) * 0.087;
            else foreignRatio = 0.20 + ((year - 2026) / 44.0) * 0.025;

            const foreignPop = Math.round(total * foreignRatio);
            const nativePop = total - foreignPop;
            const foreignPct = Math.round(foreignRatio * 100);
            const nativePct = 100 - foreignPct;

            formColLeftTitle.textContent = "🇸🇪 FÖDDA I SVERIGE";
            formColLeftStat.textContent = `${formatNumber(nativePop)} (${nativePct} %)`;
            formColRightTitle.textContent = "🌍 UTRIKES FÖDDA";
            formColRightStat.textContent = `${formatNumber(foreignPop)} (${foreignPct} %)`;
        }
    }

    viewButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const view = btn.dataset.view;
            viewButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            canvas.setViewMode(view);
            const popData = engine.getDataForYear(engine.currentYear);
            if (popData) {
                updateFormationOverlay(engine.currentYear, popData);
                updateAgeRuler(canvas, popData);
            }
        });
    });

    // Ladda SCB-data
    const loaded = await engine.load();
    if (!loaded) {
        popNumber.textContent = "Kunde ej ladda SCB-data";
        return;
    }
    engine.initWallClockCounters();

    function formatNumber(num) {
        if (num === undefined || num === null || isNaN(num)) return "0";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    function showYear(year) {
        engine.currentYear = year;
        const popData = engine.getDataForYear(year);
        if (!popData) return;

        if (year === 2026 && engine.isLive) {
            const liveVal = engine.currentLivePopulation || 
                            (typeof engine.getLiveCalculatedPopulation === 'function' ? engine.getLiveCalculatedPopulation().calculatedPop : null) || 
                            popData.total || 
                            10626026;
            popNumber.textContent = formatNumber(liveVal);

            const liveInfo = typeof engine.getLiveCalculatedPopulation === 'function' ? engine.getLiveCalculatedPopulation() : null;
            if (popSub) {
                if (liveInfo && liveInfo.baseMonth) {
                    popSub.innerHTML = `<span class="live-dot-pulse">●</span> Framräknat i realtid från SCB ${liveInfo.baseMonth} (${formatNumber(liveInfo.basePop)})`;
                } else {
                    popSub.innerHTML = `<span class="live-dot-pulse">●</span> Realtidsberäkning (SCB)`;
                }
            }
        } else {
            popNumber.textContent = formatNumber(popData.total);
            if (popSub) {
                popSub.textContent = "Skala: 1 pärla = 100 invånare";
            }
        }

        currentYearBadge.textContent = year;
        selectedYearDisplay.textContent = year;
        yearSlider.value = year;
        eraNote.textContent = `(${engine.getEraNote(year)})`;

        // Uppdatera samhällsindikatorer & tidsanda (SCB 1860-2070)
        const eraStats = engine.getEraStats(year);
        if (eraStatFertility) eraStatFertility.textContent = eraStats.tfr;
        if (eraStatLifeExp) eraStatLifeExp.textContent = eraStats.lifeExp;
        if (eraStatUrban) eraStatUrban.textContent = `${eraStats.urban} tätort`;
        if (eraStatInfant) eraStatInfant.textContent = eraStats.infant;
        if (eraStatFk && eraStatFkItem) {
            if (popData.fk !== null && popData.fk !== undefined) {
                eraStatFk.textContent = (typeof popData.fk === 'number' ? popData.fk.toFixed(1) : popData.fk).replace('.', ',');
                eraStatFkItem.style.display = "flex";
            } else {
                eraStatFkItem.style.display = "none";
            }
        }

        // Uppdatera årets faktiska befolkningsrörelser (SCB TAB4365)
        const eraBirthsDeaths = document.getElementById("eraBirthsDeaths");
        const eraMigrationFlow = document.getElementById("eraMigrationFlow");
        if (eraBirthsDeaths && eraMigrationFlow) {
            if (popData.births !== undefined && popData.deaths !== undefined) {
                const natGrowth = popData.births - popData.deaths;
                const sign = natGrowth >= 0 ? "+" : "";
                const tagClass = natGrowth >= 0 ? "plus" : "minus";
                eraBirthsDeaths.innerHTML = `👶 ${popData.births.toLocaleString('sv-SE')} &nbsp;•&nbsp; 🕊️ ${popData.deaths.toLocaleString('sv-SE')} &nbsp;<span class="delta-tag ${tagClass}">(${sign}${natGrowth.toLocaleString('sv-SE')})</span>`;
            } else {
                eraBirthsDeaths.textContent = "Data ej tillgänglig";
            }

            if (popData.immigrants !== undefined && popData.emigrants !== undefined) {
                const net = popData.immigrants - popData.emigrants;
                const sign = net >= 0 ? "+" : "";
                const tagClass = net >= 0 ? "plus" : "minus";
                eraMigrationFlow.innerHTML = `🛬 ${popData.immigrants.toLocaleString('sv-SE')} &nbsp;•&nbsp; 🛫 ${popData.emigrants.toLocaleString('sv-SE')} &nbsp;<span class="delta-tag ${tagClass}">(Netto ${sign}${net.toLocaleString('sv-SE')})</span>`;
            } else {
                eraMigrationFlow.textContent = "Data ej tillgänglig";
            }
        }

        // Hantera framtidsmodell-panel (visas 2025–2070)
        if (futureScenarioPanel) {
            if (year >= 2025) {
                futureScenarioPanel.classList.remove("hidden");
                updateScenarioPanelUI(year, popData);
            } else {
                futureScenarioPanel.classList.add("hidden");
            }
        }

        canvas.updateFromPopulation(popData);
        updateAgeRuler(canvas, popData);
        updateFormationOverlay(year, popData);

        if (liveRhythmBar) {
            liveRhythmBar.style.opacity = (year === 2026 && engine.isLive) ? "1.0" : "0.30";
            liveRhythmBar.style.filter = (year === 2026 && engine.isLive) ? "none" : "grayscale(0.6)";
        }
    }

    // Uppdatera framtidsmodell-panelens kontroller, värden och texter
    function updateScenarioPanelUI(year, popData) {
        if (!futureScenarioPanel) return;

        if (engine.projectionModel === 'scb') {
            modelScbBtn?.classList.add("active");
            modelTrendBtn?.classList.remove("active");
            scbScenarioStrip?.classList.remove("hidden");
            trendScenarioStrip?.classList.add("hidden");

            document.querySelectorAll(".scen-pill").forEach(btn => {
                btn.classList.toggle("active", btn.dataset.scen === engine.scbScenario);
            });

            if (scbScenarioDesc) {
                const meta = engine.scbScenarioMeta[engine.scbScenario];
                const popM = (popData.total / 1e6).toFixed(2).replace('.', ',');
                const natInc = (popData.births !== undefined && popData.deaths !== undefined) ? 
                    (popData.births - popData.deaths) : 0;
                const sign = natInc >= 0 ? "+" : "";
                scbScenarioDesc.innerHTML = `<strong>${meta ? meta.name : engine.scbScenario}:</strong> ${meta ? meta.desc : ''} <span style="color: #00f5d4;">(${year}: ${popM} milj, netto födda/döda ${sign}${natInc.toLocaleString('sv-SE')})</span>`;
            }
        } else {
            modelTrendBtn?.classList.add("active");
            modelScbBtn?.classList.remove("active");
            trendScenarioStrip?.classList.remove("hidden");
            scbScenarioStrip?.classList.add("hidden");

            document.querySelectorAll(".trend-preset-btn").forEach(btn => {
                btn.classList.toggle("active", btn.dataset.preset === engine.trendPreset);
            });

            if (trendTfrSlider) {
                trendTfrSlider.value = engine.trendParams.tfr || 1.43;
                if (trendTfrVal) trendTfrVal.textContent = `${Number(engine.trendParams.tfr || 1.43).toFixed(2).replace('.', ',')} barn/kvinna`;
            }
            if (trendImmigSlider) {
                trendImmigSlider.value = engine.trendParams.immigScale ?? 1.0;
                const cnt = Math.round(116197 * (engine.trendParams.immigScale ?? 1.0));
                if (trendImmigVal) trendImmigVal.textContent = `${cnt.toLocaleString('sv-SE')} / år (${Math.round((engine.trendParams.immigScale ?? 1.0) * 100)} %)`;
            }
            if (trendEmigSlider) {
                trendEmigSlider.value = engine.trendParams.emigScale ?? 1.0;
                const cnt = Math.round(86449 * (engine.trendParams.emigScale ?? 1.0));
                if (trendEmigVal) trendEmigVal.textContent = `${cnt.toLocaleString('sv-SE')} / år (${Math.round((engine.trendParams.emigScale ?? 1.0) * 100)} %)`;
            }

            if (trendNettoBadge) {
                const curNet = (popData.immigrants !== undefined && popData.emigrants !== undefined) ?
                    (popData.immigrants - popData.emigrants) : 
                    Math.round(116197 * (engine.trendParams.immigScale ?? 1.0) - 86449 * (engine.trendParams.emigScale ?? 1.0));
                const sign = curNet >= 0 ? "+" : "−";
                trendNettoBadge.innerHTML = `Nettomigration: <strong>${sign}${Math.abs(curNet).toLocaleString('sv-SE')} / år</strong>`;
                trendNettoBadge.classList.toggle("negative", curNet < 0);
            }

            if (trendScenarioDesc) {
                const popM = (popData.total / 1e6).toFixed(2).replace('.', ',');
                const fkStr = popData.fk ? `${popData.fk.toFixed(1).replace('.', ',')}` : '—';
                trendScenarioDesc.innerHTML = `<strong>${engine.getEraNote(year)}:</strong> Kohort-beräknad befolkning år ${year}: <strong>${popM} miljoner</strong> • Försörjningskvot: <strong>${fkStr}</strong> (0–19 + 65+ per 100 i arbete).`;
            }
        }
    }

    // Dynamisk Ålderslinjal som anpassar höjd och markörer efter folkmängd och demografi
    function updateAgeRuler(canvas, popData) {
        const ageRuler = document.getElementById("ageRuler");
        if (!ageRuler || !canvas || !popData) return;

        if (canvas.currentViewMode !== 'sea') {
            ageRuler.style.opacity = '0';
            ageRuler.style.pointerEvents = 'none';
            return;
        }
        ageRuler.style.opacity = '1';
        ageRuler.style.pointerEvents = 'auto';

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

    // Framtidsmodell: Växla SCB vs Egen modell
    if (modelScbBtn) {
        modelScbBtn.addEventListener("click", () => {
            engine.projectionModel = 'scb';
            showYear(engine.currentYear);
        });
    }
    if (modelTrendBtn) {
        modelTrendBtn.addEventListener("click", () => {
            engine.projectionModel = 'trend';
            showYear(engine.currentYear);
        });
    }

    // SCB: Alternativa scenarier (HU, LF, HF, LI, HI, LD, HD)
    document.querySelectorAll(".scen-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            const scen = pill.dataset.scen;
            if (scen) {
                engine.scbScenario = scen;
                showYear(engine.currentYear);
            }
        });
    });

    // Egen modell: Snabbval / Presets
    document.querySelectorAll(".trend-preset-btn").forEach(presetBtn => {
        presetBtn.addEventListener("click", () => {
            const preset = presetBtn.dataset.preset;
            if (!preset) return;
            engine.trendPreset = preset;
            if (preset === 'frozen') {
                engine.setTrendParams({ immigScale: 1.0, emigScale: 1.0, tfr: 1.426, mortScale: 1.0 });
            } else if (preset === 'stram') {
                engine.setTrendParams({ immigScale: 0.5, emigScale: 1.0, tfr: 1.426, mortScale: 1.0 });
            } else if (preset === 'noll') {
                engine.setTrendParams({ immigScale: 0.744, emigScale: 1.0, tfr: 1.426, mortScale: 1.0 });
            } else if (preset === 'babyboom') {
                engine.setTrendParams({ immigScale: 1.0, emigScale: 1.0, tfr: 1.85, mortScale: 1.0 });
            }
            showYear(engine.currentYear);
        });
    });

    // Egen modell: Reglage för TFR, Invandring och Utvandring
    if (trendTfrSlider) {
        trendTfrSlider.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            engine.trendPreset = 'custom';
            engine.setTrendParams({ tfr: val });
            showYear(engine.currentYear);
        });
    }
    if (trendImmigSlider) {
        trendImmigSlider.addEventListener("input", (e) => {
            const scale = parseFloat(e.target.value);
            engine.trendPreset = 'custom';
            engine.setTrendParams({ immigScale: scale });
            showYear(engine.currentYear);
        });
    }
    if (trendEmigSlider) {
        trendEmigSlider.addEventListener("input", (e) => {
            const scale = parseFloat(e.target.value);
            engine.trendPreset = 'custom';
            engine.setTrendParams({ emigScale: scale });
            showYear(engine.currentYear);
        });
    }

    // Länk till metod & begränsningar (öppnar info-modalen och scrollar till Card 5)
    if (scenarioInfoBtn) {
        scenarioInfoBtn.addEventListener("click", () => {
            if (infoPanel) {
                infoPanel.classList.remove("collapsed");
                const card5 = document.getElementById("infoCardFramtid");
                if (card5) {
                    setTimeout(() => {
                        card5.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        card5.style.outline = "2px solid #00f5d4";
                        card5.style.boxShadow = "0 0 20px rgba(0, 245, 212, 0.4)";
                        setTimeout(() => {
                            card5.style.outline = "none";
                            card5.style.boxShadow = "none";
                        }, 2500);
                    }, 200);
                }
            }
        });
    }


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

    // Subtil levande berättelse-rad i himlen ovanför pärlytan
    let narrativeTimer = null;
    function showSurfaceNarrative(ev) {
        if (!narrativePill || !ev) return;

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        if (narrativeTime) narrativeTime.textContent = timeStr;
        if (narrativeText) narrativeText.textContent = ev.narrative || ev.text;

        const delta = ev.delta || (ev.type === 'birth' || ev.type === 'immigrate' ? '+1' : '-1');
        if (narrativeDelta) {
            narrativeDelta.textContent = delta;
            narrativeDelta.className = `narrative-delta ${delta === '+1' ? 'plus' : 'minus'}`;
        }

        if (narrativeDot) {
            narrativeDot.style.color = ev.color || '#f8fafc';
        }
        narrativePill.style.setProperty('--event-glow', ev.color || 'rgba(255, 255, 255, 0.25)');

        narrativePill.classList.remove("hidden");
        narrativePill.classList.remove("event-pulse");
        void narrativePill.offsetWidth; // Force CSS reflow
        narrativePill.classList.add("event-pulse");

        clearTimeout(narrativeTimer);
        narrativeTimer = setTimeout(() => {
            narrativePill.classList.add("hidden");
        }, 5000);
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

    // Manuella klick på rytm-fälten samt tangentbordsgenvägar (B, I, D, E) för direkt demo
    function triggerDemoEvent(type) {
        const ev = engine.createEventDetail(type);
        if (!ev) return;

        if (type === 'birth') {
            canvas.spawnDroppingBead('birth');
            engine.currentLivePopulation += 1;
        } else if (type === 'immigrate') {
            canvas.spawnDroppingBead('immigrate');
            engine.currentLivePopulation += 1;
        } else if (type === 'death') {
            canvas.spawnDepartingBead('death');
            engine.currentLivePopulation -= 1;
        } else if (type === 'emigrate') {
            canvas.spawnDepartingBead('emigrate');
            engine.currentLivePopulation -= 1;
        }
        popNumber.textContent = formatNumber(engine.currentLivePopulation);

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        showRhythmToast(type, `${timeStr} — ${ev.shortText || ev.text}`);
        showSurfaceNarrative(ev);
    }

    if (rhythmBirth) rhythmBirth.addEventListener("click", () => triggerDemoEvent('birth'));
    if (rhythmDeath) rhythmDeath.addEventListener("click", () => triggerDemoEvent('death'));
    if (rhythmImmigrant) rhythmImmigrant.addEventListener("click", () => triggerDemoEvent('immigrate'));
    if (rhythmEmigrant) rhythmEmigrant.addEventListener("click", () => triggerDemoEvent('emigrate'));

    window.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT") return;
        const k = e.key.toLowerCase();
        if (k === 'b') triggerDemoEvent('birth');
        else if (k === 'i') triggerDemoEvent('immigrate');
        else if (k === 'd') triggerDemoEvent('death');
        else if (k === 'e') triggerDemoEvent('emigrate');
    });

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
                    showRhythmToast(ev.type, `${h}:${m}:${s} — ${ev.shortText || ev.text}`);
                    showSurfaceNarrative(ev);
                    if (ev.type === 'birth') {
                        canvas.spawnDroppingBead('birth');
                    } else if (ev.type === 'immigrate') {
                        canvas.spawnDroppingBead('immigrate');
                    } else if (ev.type === 'death') {
                        canvas.spawnDepartingBead('death');
                    } else if (ev.type === 'emigrate') {
                        canvas.spawnDepartingBead('emigrate');
                    }
                }
            }

            if (engine.currentYear === 2026) {
                popNumber.textContent = formatNumber(engine.currentLivePopulation);
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

                if (rhythmBirth && cd.birthSeasonFactor) {
                    const pct = Math.round((cd.birthSeasonFactor - 1) * 100);
                    const sign = pct >= 0 ? `+${pct}%` : `${pct}%`;
                    rhythmBirth.title = `Organisk takt: ~1 födsel var 5,5 min (Månadssäsong enligt SCB: ${sign})`;
                }
                if (rhythmDeath && cd.deathSeasonFactor) {
                    const pct = Math.round((cd.deathSeasonFactor - 1) * 100);
                    const sign = pct >= 0 ? `+${pct}%` : `${pct}%`;
                    rhythmDeath.title = `Organisk takt: ~1 dödsfall var 5,4 min (Månadssäsong enligt SCB: ${sign})`;
                }
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
            setInfoCollapsed(true);
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

    // Växla infopanelen (Källor, data & metodik)
    function setInfoCollapsed(collapsed) {
        if (!infoPanel) return;
        if (collapsed) {
            infoPanel.classList.add("collapsed");
            if (toggleInfoBtn) toggleInfoBtn.classList.remove("active");
        } else {
            infoPanel.classList.remove("collapsed");
            if (toggleInfoBtn) toggleInfoBtn.classList.add("active");
            setTimelineCollapsed(true);
        }
    }

    if (toggleInfoBtn && infoPanel) {
        toggleInfoBtn.addEventListener("click", () => {
            const isCollapsed = infoPanel.classList.contains("collapsed");
            setInfoCollapsed(!isCollapsed);
        });
    }

    if (closeInfoBtn && infoPanel) {
        closeInfoBtn.addEventListener("click", () => {
            setInfoCollapsed(true);
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
    document.addEventListener("fullscreenchange", () => {
        const isFs = !!document.fullscreenElement;
        fullscreenBtn.textContent = isFs ? "✕" : "⛶";
        fullscreenBtn.title = isFs ? "Lämna fullskärm (Esc eller F)" : "Fullskärm (F)";
    });
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
            setInfoCollapsed(true);
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

    // Lyssna på direktsynkning från SCB om nyare månad upptäckts i bakgrunden
    window.addEventListener("scb-live-sync", (e) => {
        if (engine.currentYear === 2026) {
            updateTimelineYear(2026);
            popNumber.textContent = formatNumber(engine.currentLivePopulation);
        }
    });

    resetIdleTimer();
});
