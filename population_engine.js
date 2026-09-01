/**
 * PopulationEngine: SCB Data Hanterare och Realtidsrytm
 */
class PopulationEngine {
    constructor() {
        this.data = null;
        this.currentYear = 2024;
        this.highlightedCohort = null; // Födelseår att belysa (t.ex. 1990)
        this.isLive = true;
        this.isPlaying = false;
        this.playInterval = null;
        this.listeners = [];

        // Räknare för realtids-tick
        this.liveBirthCounter = 0;
        this.liveDeathCounter = 0;
        this.liveImmigrantCounter = 0;
        this.liveEmigrantCounter = 0;

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
            2024: "Dagens befolkning: 10 587 710 personer.",
            2050: "SCB Framskrivning: Sveriges befolkning beräknas till 11,3 miljoner.",
            2070: "SCB Framskrivning: 11,8 miljoner invånare."
        };
    }

    async load() {
        try {
            const resp = await fetch('data/glasburken_data.json');
            this.data = await resp.json();
            console.log('✅ SCB-data laddad:', this.data.metadata.title);
            return true;
        } catch (e) {
            console.error('Kunde inte ladda SCB-data:', e);
            return false;
        }
    }

    getEraNote(year) {
        if (this.eraNotes[year]) return this.eraNotes[year];
        if (year < 1900) return "Tidig industrialisering och utvandring.";
        if (year < 1940) return "Mellankrigstid och folkhemsbygge.";
        if (year < 1975) return "Rekordåren i svensk industri.";
        if (year <= 2024) return "Modern tid och globalisering.";
        return "SCB:s officiella befolkningsframskrivning.";
    }

    // Hämta kohortdata för ett specifikt år
    getDataForYear(year) {
        if (!this.data) return null;
        const yStr = String(year);

        if (this.data.history[yStr]) {
            const h = this.data.history[yStr];
            return {
                year: year,
                isProjection: false,
                total: h.total,
                men: h.men,
                women: h.women,
                ages: h.ages // { 0: [men, women], ... }
            };
        } else if (this.data.projections[year]) {
            const p = this.data.projections[year];
            // För framskrivningar: interpolera åldersfördelningen från 2024 med SCB:s total
            const base2024 = this.data.history['2024'];
            const scale = p.total / base2024.total;
            const scaledAges = {};
            for (let a in base2024.ages) {
                scaledAges[a] = [
                    Math.round(base2024.ages[a][0] * scale),
                    Math.round(base2024.ages[a][1] * scale)
                ];
            }
            return {
                year: year,
                isProjection: true,
                total: p.total,
                men: Math.round(p.total * 0.502),
                women: Math.round(p.total * 0.498),
                ages: scaledAges,
                births: p.births,
                deaths: p.deaths,
                immigrants: p.immigrants,
                emigrants: p.emigrants
            };
        }
        return null;
    }

    // Hämta info om en specifik årskull (t.ex. född 1990)
    getCohortInfo(birthYear, atYear = 2024) {
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

    // Uppdatera realtidsräknare (kallas varje sekund i Live-läge)
    tickRealtime(dtSeconds = 1.0) {
        if (!this.data || !this.isLive) return null;

        const rates = this.data.liveRates2024;
        this.liveBirthCounter += dtSeconds;
        this.liveDeathCounter += dtSeconds;
        this.liveImmigrantCounter += dtSeconds;
        this.liveEmigrantCounter += dtSeconds;

        const events = [];

        // Födsel (~var 318:e sekund = 5.3 min)
        if (this.liveBirthCounter >= rates.birthIntervalSec) {
            this.liveBirthCounter -= rates.birthIntervalSec;
            events.push({ type: 'birth', text: 'Nyfödd i Sverige (+1)', color: '#ff2a7a' });
        }

        // Dödsfall (~var 352:a sekund = 5.9 min)
        if (this.liveDeathCounter >= rates.deathIntervalSec) {
            this.liveDeathCounter -= rates.deathIntervalSec;
            events.push({ type: 'death', text: 'Dödsfall i Sverige (-1)', color: '#52525b' });
        }

        // Invandring (~var 335:e sekund = 5.6 min)
        if (this.liveImmigrantCounter >= rates.immigrateIntervalSec) {
            this.liveImmigrantCounter -= rates.immigrateIntervalSec;
            events.push({ type: 'immigrate', text: 'Invandring till Sverige (+1)', color: '#00f5d4' });
        }

        // Utvandring (~var 700:e sekund = 11.7 min)
        if (this.liveEmigrantCounter >= rates.emigrateIntervalSec) {
            this.liveEmigrantCounter -= rates.emigrateIntervalSec;
            events.push({ type: 'emigrate', text: 'Utvandring från Sverige (-1)', color: '#94a3b8' });
        }

        return events.length > 0 ? events : null;
    }
}
