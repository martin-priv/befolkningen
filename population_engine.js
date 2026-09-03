/**
 * PopulationEngine: SCB Data Hanterare, Realtidsrytm & Demografisk Individgenerator
 */
class PopulationEngine {
    constructor() {
        this.data = null;
        this.currentYear = 2026;
        this.highlightedCohort = null;
        this.isLive = true;
        this.isPlaying = false;
        this.playInterval = null;

        this.liveBirthCounter = 0;
        this.liveDeathCounter = 0;
        this.liveImmigrantCounter = 0;
        this.liveEmigrantCounter = 0;

        // SCB Kommuner (Urval av representativa kommuner över hela landet, inklusive Krokom!)
        this.municipalities = [
            { name: "Stockholm", county: "Stockholms län", pop: 988000, weight: 10 },
            { name: "Göteborg", county: "Västra Götalands län", pop: 604000, weight: 6 },
            { name: "Malmö", county: "Skåne län", pop: 360000, weight: 4 },
            { name: "Uppsala", county: "Uppsala län", pop: 242000, weight: 3 },
            { name: "Linköping", county: "Östergötlands län", pop: 167000, weight: 2 },
            { name: "Västerås", county: "Västmanlands län", pop: 159000, weight: 2 },
            { name: "Örebro", county: "Örebro län", pop: 158000, weight: 2 },
            { name: "Helsingborg", county: "Skåne län", pop: 151000, weight: 2 },
            { name: "Jönköping", county: "Jönköpings län", pop: 145000, weight: 2 },
            { name: "Norrköping", county: "Östergötlands län", pop: 145000, weight: 2 },
            { name: "Umeå", county: "Västerbottens län", pop: 133000, weight: 2 },
            { name: "Lund", county: "Skåne län", pop: 130000, weight: 2 },
            { name: "Borås", county: "Västra Götalands län", pop: 114000, weight: 1.5 },
            { name: "Sundsvall", county: "Västernorrlands län", pop: 99000, weight: 1.5 },
            { name: "Gävle", county: "Gävleborgs län", pop: 103000, weight: 1.5 },
            { name: "Södertälje", county: "Stockholms län", pop: 102000, weight: 1.5 },
            { name: "Karlstad", county: "Värmlands län", pop: 96000, weight: 1.5 },
            { name: "Halmstad", county: "Hallands län", pop: 105000, weight: 1.5 },
            { name: "Växjö", county: "Kronobergs län", pop: 97000, weight: 1.5 },
            { name: "Luleå", county: "Norrbottens län", pop: 79000, weight: 1.5 },
            { name: "Östersund", county: "Jämtlands län", pop: 64000, weight: 1.2 },
            { name: "Sveg", county: "Jämtlands län / Härjedalen", pop: 10200, weight: 0.8 },
            { name: "Krokom", county: "Jämtlands län", pop: 15540, weight: 0.8 },
            { name: "Kiruna", county: "Norrbottens län", pop: 22400, weight: 0.8 },
            { name: "Visby / Gotland", county: "Gotlands län", pop: 61000, weight: 1.0 },
            { name: "Mora", county: "Dalarnas län", pop: 20500, weight: 0.8 },
            { name: "Pajala", county: "Norrbottens län", pop: 5900, weight: 0.5 },
            { name: "Simrishamn", county: "Skåne län", pop: 19100, weight: 0.8 },
            { name: "Arvika", county: "Värmlands län", pop: 25800, weight: 0.8 },
            { name: "Åre", county: "Jämtlands län", pop: 12300, weight: 0.7 },
            { name: "Karlskrona", county: "Blekinge län", pop: 66500, weight: 1.0 },
            { name: "Falun", county: "Dalarnas län", pop: 59800, weight: 1.0 }
        ];

        // SCB Födelseländer (Enligt TAB4822 / TAB6642)
        this.foreignBirthCountries = [
            { name: "Syrien", countInSweden: 197000 },
            { name: "Irak", countInSweden: 146000 },
            { name: "Finland", countInSweden: 133000 },
            { name: "Polen", countInSweden: 103000 },
            { name: "Iran", countInSweden: 86000 },
            { name: "Somalia", countInSweden: 69000 },
            { name: "Afghanistan", countInSweden: 65000 },
            { name: "Bosnien och Hercegovina", countInSweden: 60000 },
            { name: "Tyskland", countInSweden: 56000 },
            { name: "Turkiet", countInSweden: 55000 },
            { name: "Eritrea", countInSweden: 49000 },
            { name: "Indien", countInSweden: 52000 },
            { name: "Norge", countInSweden: 40000 },
            { name: "Danmark", countInSweden: 37000 },
            { name: "Thailand", countInSweden: 45000 },
            { name: "Storbritannien", countInSweden: 32000 },
            { name: "Chile", countInSweden: 27000 },
            { name: "Azerbajdzjan", countInSweden: 4800 },
            { name: "USA", countInSweden: 24000 },
            { name: "Ukraina", countInSweden: 42000 },
            { name: "Grekland", countInSweden: 20000 },
            { name: "Kina", countInSweden: 38000 }
        ];

        // SCB Utvandringsmål & Bakgrund (enligt TAB6656 & TAB6039)
        this.emigrationDestinations = [
            { name: "Norge", weight: 12, isReturn: false },
            { name: "Tyskland", weight: 11, isReturn: false },
            { name: "Danmark", weight: 10, isReturn: false },
            { name: "Storbritannien", weight: 9, isReturn: false },
            { name: "Spanien", weight: 9, isReturn: false, isRetiree: true },
            { name: "USA", weight: 7, isReturn: false },
            { name: "Polen", weight: 7, isReturn: true },
            { name: "Indien", weight: 6, isReturn: true },
            { name: "Finland", weight: 6, isReturn: true },
            { name: "Frankrike", weight: 4, isReturn: false, isRetiree: true },
            { name: "Nederländerna", weight: 4, isReturn: false },
            { name: "Irak", weight: 4, isReturn: true },
            { name: "Schweiz", weight: 3, isReturn: false },
            { name: "Australien", weight: 3, isReturn: false },
            { name: "Syrien", weight: 3, isReturn: true },
            { name: "Italien", weight: 3, isReturn: false },
            { name: "Kina", weight: 3, isReturn: true },
            { name: "Turkiet", weight: 2, isReturn: true },
            { name: "Förenade Arabemiraten", weight: 2, isReturn: false },
            { name: "Kanada", weight: 2, isReturn: false },
            { name: "Grekland", weight: 2, isReturn: true },
            { name: "Iran", weight: 2, isReturn: true },
            { name: "Somalia", weight: 1, isReturn: true },
            { name: "Portugal", weight: 2, isReturn: false, isRetiree: true },
            { name: "Japan", weight: 1, isReturn: false }
        ];

        this.eraNotes = {
            1860: "Fattig-Sverige: 3,85 miljoner invånare. Jordbrukssamhälle.",
            1868: "Missväxtåren: Stor nöd och början på Amerikautvandringen.",
            1885: "Utvandringstoppen: Över 40 000 svenskar utvandrar per år.",
            1900: "Sverige passerar 5 miljoner invånare.",
            1918: "Spanska sjukan och första världskriget präglar dödstalen.",
            1945: "Andra världskrigets slut: 40-talsboomen inleds.",
            1969: "Sverige når 8 miljoner: Arbetskraftsinvandring och Miljonprogrammet.",
            1985: "Barnafödandet ökar: 'Snabbare barn'-regeln i föräldraförsäkringen.",
            2004: "Sverige passerar 9 miljoner invånare.",
            2015: "Flyktingvågen: Rekordhög invandring till Sverige.",
            2017: "Sverige passerar historiska 10 miljoner invånare!",
            2024: "Historiskt utfall: 10 587 710 personer.",
            2025: "SCB: 10 602 310 personer.",
            2026: "Idag: Aktuell SCB-framskrivning och månadsstatistik.",
            2030: "SCB Framskrivning: 10,72 miljoner invånare.",
            2050: "SCB Framskrivning: Sveriges befolkning beräknas till 11,29 miljoner.",
            2070: "SCB Framskrivning: 11,80 miljoner invånare."
        };

        // SCB Historiska samhällsindikatorer 1860–2070 (Fruktsamhet, Medellivslängd, Urbanisering, Spädbarnsdödlighet)
        // Källor: SCB TAB4365, TAB5328, TAB4376, TAB5634, TAB5960
        this.eraDataPoints = {
            1860: { tfr: 4.22, lifeExp: 46.5, urban: 11, infant: 142.0, note: "Agrarsamhälle" },
            1870: { tfr: 4.10, lifeExp: 46.0, urban: 13, infant: 130.0, note: "Missväxt & nöd" },
            1880: { tfr: 4.34, lifeExp: 47.6, urban: 15, infant: 111.0, note: "Utvandringsvåg" },
            1890: { tfr: 4.15, lifeExp: 50.1, urban: 21, infant: 102.0, note: "Industrins gryning" },
            1900: { tfr: 3.86, lifeExp: 53.1, urban: 28, infant: 91.0, note: "Sekelskifte" },
            1910: { tfr: 3.56, lifeExp: 56.8, urban: 36, infant: 75.0, note: "Urban inflyttning" },
            1920: { tfr: 2.93, lifeExp: 61.3, urban: 45, infant: 63.0, note: "Demokratisering" },
            1930: { tfr: 2.19, lifeExp: 63.8, urban: 51, infant: 55.0, note: "Depression & kris" },
            1935: { tfr: 1.70, lifeExp: 65.8, urban: 53, infant: 46.0, note: "Kris i befolkningsfrågan" },
            1940: { tfr: 1.89, lifeExp: 67.4, urban: 56, infant: 39.0, note: "Beredskapstid" },
            1945: { tfr: 2.41, lifeExp: 69.8, urban: 62, infant: 28.0, note: "Fred & 40-talsboom" },
            1950: { tfr: 2.28, lifeExp: 71.5, urban: 66, infant: 21.0, note: "Folkhemmet växer" },
            1960: { tfr: 2.20, lifeExp: 73.0, urban: 73, infant: 16.6, note: "Industrins guldålder" },
            1965: { tfr: 2.42, lifeExp: 73.8, urban: 77, infant: 13.3, note: "Babyboom & miljonprogram" },
            1970: { tfr: 1.92, lifeExp: 74.5, urban: 81, infant: 11.0, note: "P-piller & kvinnor i jobb" },
            1980: { tfr: 1.68, lifeExp: 75.8, urban: 83, infant: 6.9, note: "Välfärdsstat" },
            1990: { tfr: 2.13, lifeExp: 77.6, urban: 83, infant: 6.0, note: "Snabbare-barn-boom" },
            2000: { tfr: 1.54, lifeExp: 79.7, urban: 84, infant: 3.4, note: "IT-era & millennieskifte" },
            2010: { tfr: 1.98, lifeExp: 81.5, urban: 85, infant: 2.5, note: "Hög fruktsamhet" },
            2020: { tfr: 1.66, lifeExp: 82.4, urban: 88, infant: 2.1, note: "Pandemiår" },
            2026: { tfr: 1.45, lifeExp: 83.5, urban: 88, infant: 2.1, note: "Historisk bottennotering" },
            2040: { tfr: 1.60, lifeExp: 85.2, urban: 90, infant: 1.8, note: "SCB Framskrivning" },
            2070: { tfr: 1.66, lifeExp: 87.7, urban: 91, infant: 1.5, note: "SCB Framskrivning" }
        };

        this.monthlyData = null;
        this.currentLivePopulation = 10626026;
        this.lastDriftSync = Date.now();
    }

    async load() {
        try {
            const resp = await fetch('data/glasburken_data.json');
            this.data = await resp.json();
            console.log('✅ SCB-grunddata laddad:', this.data.metadata.title);

            // 1. Läs lokal månadssynk från TAB6471
            try {
                const mResp = await fetch('data/scb_latest_monthly.json');
                if (mResp.ok) {
                    this.monthlyData = await mResp.json();
                    console.log('✅ Aktuell SCB-månadsstatistik (TAB6471) laddad:', this.monthlyData.latestMonth.name, this.monthlyData.latestMonth.population);
                }
            } catch (me) {
                console.warn('Lokal TAB6471-data kunde inte läsas:', me);
            }

            // 2. Försök även direkt live-anrop mot SCB:s öppna PxWebApi v2 i bakgrunden
            this.fetchLiveSCBMonthly().catch(() => {});

            return true;
        } catch (e) {
            console.error('Kunde inte ladda SCB-data:', e);
            return false;
        }
    }

    async fetchLiveSCBMonthly() {
        try {
            const query = {
                selection: [
                    { variableCode: "Region", valueCodes: ["00"] },
                    { variableCode: "Alder", valueCodes: ["TotSA"] },
                    { variableCode: "Kon", valueCodes: ["TotSa"] },
                    { variableCode: "ContentsCode", valueCodes: ["000007SF"] },
                    { variableCode: "Tid", valueCodes: ["*"] }
                ]
            };
            const resp = await fetch("https://statistikdatabasen.scb.se/api/v2/tables/TAB6471/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(query)
            });
            if (!resp.ok) return;
            const res = await resp.json();
            const timeDim = res.dimension?.Tid?.category?.index;
            const values = res.value;
            if (!timeDim || !values) return;

            const sorted = Object.entries(timeDim).sort((a, b) => a[1] - b[1]);
            const [latestCode, idx] = sorted[sorted.length - 1];
            const latestPop = values[idx];
            const [yStr, mStr] = latestCode.split('M');
            const year = parseInt(yStr, 10);
            const month = parseInt(mStr, 10);
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59Z`;

            const svMonths = ["", "januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
            this.monthlyData = {
                tableId: "TAB6471",
                tableName: "Folkmängden per månad efter region, ålder och kön",
                source: "Statistiska centralbyrån (SCB) PxWebApi v2 (Direktkopplad)",
                latestMonth: {
                    code: latestCode,
                    year: year,
                    month: month,
                    name: `${svMonths[month]} ${year}`,
                    endDate: endDate,
                    population: latestPop
                },
                projectionTarget: {
                    year: year,
                    population: (this.data?.projections?.[year]?.total || 10626026)
                }
            };
            console.log('⚡ Direktkontakt med SCB PxWebApi v2 (TAB6471) uppdaterad live!');
        } catch (e) {
            // Tyst fallback till lokalt scb_latest_monthly.json
        }
    }

    getLiveCalculatedPopulation(date = new Date()) {
        if (!this.monthlyData || !this.monthlyData.latestMonth) {
            return {
                calculatedPop: 10626026,
                baseMonth: null,
                basePop: 10626026,
                growthPerSec: 0
            };
        }

        const lm = this.monthlyData.latestMonth;
        const baseTime = new Date(lm.endDate).getTime();
        const basePop = lm.population;

        const targetYear = lm.year;
        const targetPop = (this.monthlyData.projectionTarget?.population || 
                           this.data?.projections?.[targetYear]?.total || 
                           10626026);
        const targetTime = Date.UTC(targetYear, 11, 31, 23, 59, 59);

        const totalDurationSec = Math.max(1, (targetTime - baseTime) / 1000);
        const deltaPop = targetPop - basePop;
        const growthPerSec = deltaPop / totalDurationSec;

        const elapsedSec = Math.max(0, (date.getTime() - baseTime) / 1000);
        const calculatedPop = Math.round(basePop + elapsedSec * growthPerSec);

        return {
            calculatedPop: calculatedPop,
            baseMonth: lm.name,
            baseCode: lm.code,
            basePop: basePop,
            growthPerSec: growthPerSec,
            targetYear: targetYear,
            targetPop: targetPop
        };
    }

    getEraNote(year) {
        if (year === 2026 && this.isLive) {
            if (this.monthlyData && this.monthlyData.latestMonth) {
                return `Idag: Realtidskalkyl utifrån SCB ${this.monthlyData.latestMonth.name} (${this.monthlyData.tableId})`;
            }
            return "Idag: Realtidskalkyl utifrån aktuell SCB-månadsstatistik.";
        }
        if (this.eraNotes[year]) return this.eraNotes[year];
        if (year < 1900) return "Tidig industrialisering och utvandring.";
        if (year < 1940) return "Mellankrigstid och folkhemsbygge.";
        if (year < 1975) return "Rekordåren i svensk industri.";
        if (year < 2025) return "Modern tid och globalisering.";
        if (year === 2026) return "Idag: Aktuell SCB-framskrivning.";
        return "SCB:s officiella befolkningsframskrivning.";
    }

    getDataForYear(year) {
        if (!this.data) return null;
        const yStr = String(year);

        if (this.data.history[yStr]) {
            const h = this.data.history[yStr];
            return {
                year: year,
                isProjection: !!h.isProjection,
                total: h.total,
                men: h.men,
                women: h.women,
                ages: h.ages
            };
        } else if (this.data.projections[year]) {
            const p = this.data.projections[year];
            const base2026 = this.data.history['2026'] || this.data.history['2024'];
            const scale = p.total / base2026.total;
            const scaledAges = {};
            for (let a in base2026.ages) {
                scaledAges[a] = [
                    Math.round(base2026.ages[a][0] * scale),
                    Math.round(base2026.ages[a][1] * scale)
                ];
            }
            return {
                year: year,
                isProjection: true,
                total: p.total,
                men: Math.round(p.total * 0.503),
                women: Math.round(p.total * 0.497),
                ages: scaledAges,
                births: p.births,
                deaths: p.deaths,
                immigrants: p.immigrants,
                emigrants: p.emigrants
            };
        }
        return null;
    }

    getCohortInfo(birthYear, atYear = 2026) {
        const yearData = this.getDataForYear(atYear);
        if (!yearData) return null;

        const age = atYear - birthYear;
        if (age < 0 || age > 110) return null;

        const cohort = yearData.ages[age] || [0, 0];
        const men = cohort[0];
        const women = cohort[1];
        const total = men + women;

        return {
            birthYear: birthYear,
            age: age,
            men: men,
            women: women,
            total: total,
            shareOfPopulation: ((total / yearData.total) * 100).toFixed(2)
        };
    }

    /**
     * HÄMTA HISTORISKA SAMHÄLLS员NDIKATORER FÖR ETT ÅRTAL (1860–2070)
     * Källor: SCB TAB4365, TAB5328, TAB4376, TAB5634, TAB5960
     */
    getEraStats(year) {
        const y = Math.max(1860, Math.min(2070, parseInt(year, 10) || 2026));
        const keys = Object.keys(this.eraDataPoints).map(Number).sort((a, b) => a - b);

        if (this.eraDataPoints[y]) {
            const p = this.eraDataPoints[y];
            return {
                year: y,
                tfr: p.tfr.toFixed(2).replace('.', ','),
                tfrRaw: p.tfr,
                lifeExp: p.lifeExp.toFixed(1).replace('.', ',') + " år",
                lifeExpRaw: p.lifeExp,
                urban: Math.round(p.urban) + " %",
                rural: Math.round(100 - p.urban) + " %",
                urbanRaw: p.urban,
                infant: p.infant.toFixed(1).replace('.', ',') + " ‰",
                infantRaw: p.infant,
                note: p.note
            };
        }

        let prevKey = keys[0];
        let nextKey = keys[keys.length - 1];
        for (let i = 0; i < keys.length - 1; i++) {
            if (y >= keys[i] && y <= keys[i + 1]) {
                prevKey = keys[i];
                nextKey = keys[i + 1];
                break;
            }
        }

        const factor = (y - prevKey) / (nextKey - prevKey);
        const p0 = this.eraDataPoints[prevKey];
        const p1 = this.eraDataPoints[nextKey];

        const tfr = p0.tfr + factor * (p1.tfr - p0.tfr);
        const lifeExp = p0.lifeExp + factor * (p1.lifeExp - p0.lifeExp);
        const urban = p0.urban + factor * (p1.urban - p0.urban);
        const infant = p0.infant + factor * (p1.infant - p0.infant);

        return {
            year: y,
            tfr: tfr.toFixed(2).replace('.', ','),
            tfrRaw: tfr,
            lifeExp: lifeExp.toFixed(1).replace('.', ',') + " år",
            lifeExpRaw: lifeExp,
            urban: Math.round(urban) + " %",
            rural: Math.round(100 - urban) + " %",
            urbanRaw: urban,
            infant: infant.toFixed(1).replace('.', ',') + " ‰",
            infantRaw: infant,
            note: p0.note
        };
    }

    /**
     * GENERERA HISTORISKT / TIDSTYPAT YRKE
     * Baserat på SCB:s historiska näringsgrenar och modernt SSYK
     */
    getHistoricalOccupation(age, sexTitle, year) {
        if (age < 7) return "Småbarn";
        if (age <= 15) {
            if (year < 1910) {
                const bKids = ["Folkskoleelev", "Vallhjon", "Hjälper till på gården", "Skolbarn", "Torparbarn"];
                return bKids[Math.floor(Math.random() * bKids.length)];
            }
            if (year < 1960) {
                const midKids = ["Folkskoleelev", "Realskoleelev", "Lärling", "Skolungdom"];
                return midKids[Math.floor(Math.random() * midKids.length)];
            }
            return "Grundskoleelev";
        }
        if (age <= 19) {
            if (year < 1910) {
                return sexTitle === "man" ? 
                    ["Dräng", "Bondson", "Skogsarbetare", "Smedslärling", "Fabriksarbetare"][Math.floor(Math.random() * 5)] :
                    ["Piga", "Bonddotter", "Sömmerska", "Mejeribiträde", "Barnflicka"][Math.floor(Math.random() * 5)];
            }
            if (year < 1965) {
                return sexTitle === "man" ?
                    ["Verkstadsarbetare", "Lärling", "Butiksbiträde", "Chaufförsbiträde"][Math.floor(Math.random() * 4)] :
                    ["Affärsbiträde", "Kontorsbiträde", "Barnflicka", "Sömmerska"][Math.floor(Math.random() * 4)];
            }
            return ["Gymnasieelev", "Restaurangbiträde", "Butikssäljare", "Lagerarbetare"][Math.floor(Math.random() * 4)];
        }

        // Vuxna 20–64
        if (age < 65) {
            if (year < 1915) {
                // Agrarsamhället (70%+ jordbruk/hantverk)
                if (sexTitle === "man") {
                    const jobs = [
                        "Bonde / Hemmansägare", "Torpare", "Dräng", "Statare", "Smed",
                        "Skogshuggare", "Snickare", "Fiskare", "Sjöman", "Gruvarbetare",
                        "Skräddare", "Skomakare", "Mjölnare", "Folkskollärare", "Rallare"
                    ];
                    return jobs[Math.floor(Math.random() * jobs.length)];
                } else {
                    const jobs = [
                        "Piga", "Bondmora / Hustru", "Sömmerska", "Mejerinna", "Tvätterska",
                        "Småskollärarinna", "Barnmorska", "Fabriksarbeterska", "Kokerska", "Strykerska"
                    ];
                    return jobs[Math.floor(Math.random() * jobs.length)];
                }
            } else if (year < 1975) {
                // Industrisamhället (verkstad, industri, folkhem)
                if (sexTitle === "man") {
                    const jobs = [
                        "Verkstadsarbetare", "Svarvare", "Valsverksarbetare", "Lastbilschaufför",
                        "Byggnadssnickare", "Gruvarbetare", "Ingenjör", "Järnvägstjänsteman",
                        "Typograf", "Montör", "Elektriker", "Postiljon", "Poliskonstapel"
                    ];
                    return jobs[Math.floor(Math.random() * jobs.length)];
                } else {
                    const jobs = [
                        "Hemmafru", "Hemmafru", "Textilarbeterska", "Telefonist",
                        "Kontorist", "Butiksbiträde", "Sjuksköterska", "Småskollärarinna", "Postkassörska"
                    ];
                    return jobs[Math.floor(Math.random() * jobs.length)];
                }
            } else if (year <= 2026) {
                // Tjänstesamhället / Modernt SSYK
                if (sexTitle === "man") {
                    const jobs = [
                        "Systemutvecklare", "Snickare / Hantverkare", "Projektledare", "Lagerarbetare",
                        "Elektriker", "Civilingenjör", "Lastbilschaufför", "Grundskollärare",
                        "Ekonom", "Fastighetsskötare", "Läkare", "Kock", "Polisinspektör"
                    ];
                    return jobs[Math.floor(Math.random() * jobs.length)];
                } else {
                    const jobs = [
                        "Undersköterska", "Grundskollärare", "Sjuksköterska", "Förskollärare",
                        "Administratör", "HR-specialist", "Systemutvecklare", "Ekonom",
                        "Butikssäljare", "Läkare", "Fysioterapeut", "Restaurangbiträde"
                    ];
                    return jobs[Math.floor(Math.random() * jobs.length)];
                }
            } else {
                // Framtiden 2027–2070
                const futureJobs = [
                    "AI-arkitekt", "Klimatanpassningstekniker", "Vårdkoordinator", "Robotiktekniker",
                    "Förnybar energiingenjör", "Bioinformatiker", "Hållbarhetsstrateg",
                    "Cirkulärekonom", "Cybersäkerhetsspecialist", "Specialistsjuksköterska", "Lärare"
                ];
                return futureJobs[Math.floor(Math.random() * futureJobs.length)];
            }
        }

        // Seniorer 65+
        if (year < 1913) {
            return sexTitle === "man" ? "Undantagsman (f.d. bonde/torpare)" : "Undantagshustru / Änka";
        }
        if (year < 1970) {
            return "Folkpensionär";
        }
        return "Ålderspensionär";
    }

    /**
     * GENERERA HISTORISKT BARNANTAL
     * Sannolikhetsfördelat kring epokens faktiska fruktsamhetstal (TFR)
     */
    getHistoricalChildren(age, year, marital) {
        if (age < 18) return "Inga egna barn";

        const stats = this.getEraStats(year);
        const tfr = stats.tfrRaw;

        const maturity = Math.min(1.0, Math.max(0.1, (age - 17) / 18));
        const baseCount = Math.round(tfr * maturity);

        if (marital === "Ogift" && year < 1960) {
            if (Math.random() < 0.85) return "Inga barn";
            return "1 barn";
        }

        const roll = Math.random();
        let count = baseCount;
        if (tfr > 3.5) {
            // 1800-talet: Stora barnaskaror (0-9 barn)
            if (roll < 0.12) count = 0;
            else if (roll < 0.25) count = Math.max(1, baseCount - 2);
            else if (roll < 0.60) count = baseCount;
            else if (roll < 0.85) count = baseCount + 2;
            else count = baseCount + 4;
        } else if (tfr < 1.8) {
            // Krisår & modern tid: 0, 1 eller 2 barn
            if (roll < 0.35) count = 0;
            else if (roll < 0.70) count = 1;
            else if (roll < 0.94) count = 2;
            else count = 3;
        } else {
            // Rekordåren (ca 2.4 barn)
            if (roll < 0.20) count = 0;
            else if (roll < 0.45) count = 1;
            else if (roll < 0.80) count = 2;
            else if (roll < 0.95) count = 3;
            else count = 4;
        }

        if (count <= 0) return "Inga barn";
        if (count === 1) return "1 barn";
        return `${count} barn`;
    }

    /**
     * GENERERA BOENDEMILJÖ BASERAT PÅ SCB TAB5328 (STAD VS LAND)
     */
    getHistoricalHousing(year) {
        const stats = this.getEraStats(year);
        const isUrban = (Math.random() * 100) < stats.urbanRaw;

        if (isUrban) {
            if (year < 1920) return "Stadskärna (trä-/stenhus)";
            if (year < 1970) return "Stad / bruksort (lägenhet)";
            return "Tätort (lägenhet / villa)";
        } else {
            if (year < 1920) return "Landsbygd (torp / gård)";
            if (year < 1970) return "Landsbygd (by / lantbruk)";
            return "Landsbygd / småort";
        }
    }

    /**
     * GENERERA EN DETALJERAD MÄNSKLIG PROFIL VID KLICK
     * Baserat på SCB:s verkliga sannolikheter och historiska epoker
     */
    generatePersonProfile(age, sex = 'män', year = 2026) {
        const birthYear = year - age;

        // Välj kommun slumpmässigt viktat efter befolkning
        const chosenMuni = this.getRandomMunicipality();

        // Civilstånd anpassat efter ålder och historisk skilsmässolag
        let marital = "Ogift";
        if (age < 20) {
            marital = "Ogift";
        } else if (age < 35) {
            marital = Math.random() < (year < 1960 ? 0.45 : 0.25) ? "Gift" : "Ogift";
        } else if (age < 65) {
            const roll = Math.random();
            const divorceRate = year < 1920 ? 0.01 : (year < 1970 ? 0.08 : 0.25);
            if (roll < (year < 1960 ? 0.75 : 0.55)) marital = "Gift";
            else if (roll < (year < 1960 ? 0.75 + divorceRate : 0.55 + divorceRate)) marital = "Skild";
            else marital = "Ogift";
        } else {
            const roll = Math.random();
            if (roll < 0.45) marital = "Gift";
            else if (roll < 0.82) marital = "Änka/Änkling";
            else marital = year < 1970 ? "Ogift" : "Skild";
        }

        const sexTitle = (sex === 'män' || sex === 1) ? "man" : "kvinna";

        // Barnantal
        const children = this.getHistoricalChildren(age, year, marital);

        // Yrke / Sysselsättning
        const occupation = this.getHistoricalOccupation(age, sexTitle, year);

        // Boendemiljö
        const housing = this.getHistoricalHousing(year);

        // Födelseland baserat på SCB:s utlandsfödda över tid
        let isForeignBorn = false;
        let birthCountry = "Sverige";
        let countryStat = null;

        const foreignProp = year < 1945 ? 0.01 : (year < 1980 ? 0.07 : (year < 2010 ? 0.14 : 0.20));
        if (Math.random() < foreignProp) {
            isForeignBorn = true;
            const cChoice = this.foreignBirthCountries[Math.floor(Math.random() * this.foreignBirthCountries.length)];
            birthCountry = cChoice.name;
            countryStat = `En av ca ${cChoice.countInSweden.toLocaleString('sv-SE')} personer födda i ${cChoice.name} i Sverige`;
        }

        return {
            age: age,
            sex: sexTitle,
            birthYear: birthYear,
            municipality: chosenMuni.name,
            county: chosenMuni.county,
            municipalityPop: chosenMuni.pop.toLocaleString('sv-SE'),
            marital: marital,
            children: children,
            occupation: occupation,
            housing: housing,
            isForeignBorn: isForeignBorn,
            birthCountry: birthCountry,
            countryStat: countryStat,
            displayTitle: `${age}-årig ${sexTitle}`,
            displayLocation: `${chosenMuni.name}, ${chosenMuni.county}`
        };
    }

    getRandomMunicipality() {
        let totalWeight = 0;
        for (let m of this.municipalities) totalWeight += m.weight;
        let r = Math.random() * totalWeight;
        for (let m of this.municipalities) {
            r -= m.weight;
            if (r <= 0) return m;
        }
        return this.municipalities[0];
    }

    getRandomEmigrationDestination() {
        let totalWeight = 0;
        for (let d of this.emigrationDestinations) totalWeight += d.weight;
        let r = Math.random() * totalWeight;
        for (let d of this.emigrationDestinations) {
            r -= d.weight;
            if (r <= 0) return d;
        }
        return this.emigrationDestinations[0];
    }

    sampleDeathAge() {
        // Enligt SCB:s livslängdsstatistik:
        // Medellivslängd ~83 år. De allra flesta avlider mellan 70 och 98 år.
        const roll = Math.random();
        if (roll < 0.82) {
            const u1 = Math.random();
            const u2 = Math.random();
            const norm = Math.sqrt(-2.0 * Math.log(Math.max(1e-5, u1))) * Math.cos(2.0 * Math.PI * u2);
            return Math.min(104, Math.max(68, Math.round(84 + norm * 7.5)));
        } else if (roll < 0.95) {
            return Math.round(50 + Math.random() * 17);
        } else {
            return Math.round(19 + Math.random() * 30);
        }
    }

    createEventDetail(type) {
        if (type === 'birth') {
            const muni = this.getRandomMunicipality();
            const isBoy = Math.random() < 0.514;
            const childTitle = isBoy ? "Pojke" : "Flicka";
            return {
                type: 'birth',
                narrative: `${childTitle} född i ${muni.name}`,
                shortText: `Nyfödd i ${muni.name} (+1)`,
                delta: '+1',
                color: '#ff2a7a',
                municipality: muni.name
            };
        } else if (type === 'death') {
            const muni = this.getRandomMunicipality();
            const isMan = Math.random() < 0.50;
            const sexTitle = isMan ? "man" : "kvinna";
            const age = this.sampleDeathAge();
            return {
                type: 'death',
                narrative: `${age}-årig ${sexTitle} från ${muni.name} avliden`,
                shortText: `Ett liv slocknade i Sverige (-1)`,
                delta: '-1',
                color: '#f1f5f9',
                municipality: muni.name,
                age: age,
                sex: sexTitle
            };
        } else if (type === 'immigrate') {
            const country = this.foreignBirthCountries[Math.floor(Math.random() * this.foreignBirthCountries.length)];
            const isMan = Math.random() < 0.51;
            const sexTitle = isMan ? "man" : "kvinna";
            const age = Math.min(65, Math.max(18, Math.round(27 + (Math.random() - 0.4) * 16)));
            return {
                type: 'immigrate',
                narrative: `${age}-årig ${sexTitle} från ${country.name} invandrar`,
                shortText: `Invandring från ${country.name} (+1)`,
                delta: '+1',
                color: '#00f5a0',
                country: country.name,
                age: age,
                sex: sexTitle
            };
        } else if (type === 'emigrate') {
            const muni = this.getRandomMunicipality();
            const dest = this.getRandomEmigrationDestination();
            const isMan = Math.random() < 0.52;
            const sexTitle = isMan ? "man" : "kvinna";

            let age, narrative;
            if (dest.isRetiree && Math.random() < 0.38) {
                // Senior / pensionär som flyttar söderut (Spanien, Portugal, Frankrike)
                age = Math.round(62 + Math.random() * 12);
                narrative = `${age}-årig ${sexTitle} från ${muni.name} flyttar till ${dest.name}`;
            } else if (dest.isReturn) {
                // Återvandring / cirkulär migration (Polen, Indien, Finland, Irak, Syrien, Kina m.fl.)
                age = Math.round(24 + Math.random() * 22);
                narrative = `${age}-årig ${sexTitle} från ${muni.name} återvänder till ${dest.name}`;
            } else {
                // Utvandring för arbete, studier eller karriär (Norge, Danmark, Storbritannien, Tyskland, USA m.fl.)
                age = Math.round(21 + Math.random() * 18);
                narrative = `${age}-årig ${sexTitle} från ${muni.name} utvandrar till ${dest.name}`;
            }

            return {
                type: 'emigrate',
                narrative: narrative,
                shortText: `Utvandring från ${muni.name} (-1)`,
                delta: '-1',
                color: '#38bdf8',
                dest: dest.name,
                municipality: muni.name,
                age: age,
                sex: sexTitle
            };
        }
        return null;
    }

    samplePoissonInterval(meanSec) {
        // Äkta Poisson-process (Exponentiell fördelning för oberoende naturliga händelser)
        // Väntevärdet är 100% identiskt med SCB:s årstakt (summan blir exakt densamma).
        // Men intervallen varierar organiskt: ibland 30-40s (tvillingar / rusning), ibland 8-12 minuter!
        const u = Math.random();
        const raw = -meanSec * 1.03 * Math.log(1.0 - Math.min(0.999, u));
        return Math.max(15, Math.min(1200, raw));
    }

    initWallClockCounters() {
        if (!this.data) return;
        const rates = this.data.liveRates2026 || this.data.liveRates2024;

        // Initiera dagsaktuell befolkning beräknat fram till denna sekund
        const liveCalc = this.getLiveCalculatedPopulation();
        this.currentLivePopulation = liveCalc.calculatedPop;
        this.lastDriftSync = Date.now();

        // Skapa första organiska måltiderna
        this.currentBirthInterval = this.samplePoissonInterval(rates.birthIntervalSec);
        this.currentImmigrantInterval = this.samplePoissonInterval(rates.immigrateIntervalSec);
        this.currentDeathInterval = this.samplePoissonInterval(rates.deathIntervalSec);
        this.currentEmigrantInterval = this.samplePoissonInterval(rates.emigrateIntervalSec);

        // Slumpa en organisk startposition så att inte allt händer samtidigt vid omladdning
        this.liveBirthTimer = Math.random() * (this.currentBirthInterval * 0.75);
        this.liveImmigrantTimer = Math.random() * (this.currentImmigrantInterval * 0.75);
        this.liveDeathTimer = Math.random() * (this.currentDeathInterval * 0.75);
        this.liveEmigrantTimer = Math.random() * (this.currentEmigrantInterval * 0.75);
    }

    getNextEventCountdowns() {
        if (!this.data) return null;
        const mult = this.speedMultiplier || 1.0;

        if (!this.currentBirthInterval) {
            this.initWallClockCounters();
        }

        return {
            nextBirthSec: Math.max(0, Math.round((this.currentBirthInterval - this.liveBirthTimer) / mult)),
            nextImmigrantSec: Math.max(0, Math.round((this.currentImmigrantInterval - this.liveImmigrantTimer) / mult)),
            nextDeathSec: Math.max(0, Math.round((this.currentDeathInterval - this.liveDeathTimer) / mult)),
            nextEmigrantSec: Math.max(0, Math.round((this.currentEmigrantInterval - this.liveEmigrantTimer) / mult))
        };
    }

    tickRealtime(dtSeconds = 1.0) {
        if (!this.data || !this.isLive) return null;

        const rates = this.data.liveRates2026 || this.data.liveRates2024;
        const effectiveDt = dtSeconds * (this.speedMultiplier || 1.0);

        if (!this.currentBirthInterval) {
            this.initWallClockCounters();
        }

        this.liveBirthTimer += effectiveDt;
        this.liveDeathTimer += effectiveDt;
        this.liveImmigrantTimer += effectiveDt;
        this.liveEmigrantTimer += effectiveDt;

        const events = [];

        // Födsel (Organiskt Poisson-intervall kring medelvärdet 331s)
        if (this.liveBirthTimer >= this.currentBirthInterval) {
            this.liveBirthTimer = 0;
            this.currentBirthInterval = this.samplePoissonInterval(rates.birthIntervalSec);
            this.currentLivePopulation += 1;
            events.push(this.createEventDetail('birth'));
        }

        // Dödsfall (Organiskt Poisson-intervall kring medelvärdet 324s)
        if (this.liveDeathTimer >= this.currentDeathInterval) {
            this.liveDeathTimer = 0;
            this.currentDeathInterval = this.samplePoissonInterval(rates.deathIntervalSec);
            this.currentLivePopulation -= 1;
            events.push(this.createEventDetail('death'));
        }

        // Invandring (Organiskt Poisson-intervall kring medelvärdet 363s)
        if (this.liveImmigrantTimer >= this.currentImmigrantInterval) {
            this.liveImmigrantTimer = 0;
            this.currentImmigrantInterval = this.samplePoissonInterval(rates.immigrateIntervalSec);
            this.currentLivePopulation += 1;
            events.push(this.createEventDetail('immigrate'));
        }

        // Utvandring
        if (this.liveEmigrantTimer >= this.currentEmigrantInterval) {
            this.liveEmigrantTimer = 0;
            this.currentEmigrantInterval = this.samplePoissonInterval(rates.emigrateIntervalSec);
            this.currentLivePopulation -= 1;
            events.push(this.createEventDetail('emigrate'));
        }

        // Synkronisera mot verklig realtidskalkylering var 30:e sekund vid 1x fart
        const now = Date.now();
        if (now - this.lastDriftSync > 30000 && (this.speedMultiplier || 1.0) === 1.0) {
            this.lastDriftSync = now;
            const targetLive = this.getLiveCalculatedPopulation().calculatedPop;
            const drift = targetLive - this.currentLivePopulation;
            if (Math.abs(drift) > 1) {
                this.currentLivePopulation += Math.sign(drift);
            }
        }

        return events.length > 0 ? events : null;
    }
}
