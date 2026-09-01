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
            2026: "Idag: 10 626 026 personer (aktuell SCB-framskrivning).",
            2030: "SCB Framskrivning: 10,72 miljoner invånare.",
            2050: "SCB Framskrivning: Sveriges befolkning beräknas till 11,29 miljoner.",
            2070: "SCB Framskrivning: 11,80 miljoner invånare."
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
     * GENERERA EN DETALJERAD MÄNSKLIG PROFIL VID KLICK
     * Baserat på SCB:s verkliga sannolikheter (TAB638, TAB4822, TAB6642)
     */
    generatePersonProfile(age, sex = 'män', year = 2026) {
        const birthYear = year - age;

        // Välj kommun slumpmässigt viktat efter befolkning
        let totalWeight = 0;
        for (let m of this.municipalities) totalWeight += m.weight;
        let r = Math.random() * totalWeight;
        let chosenMuni = this.municipalities[0];
        for (let m of this.municipalities) {
            r -= m.weight;
            if (r <= 0) {
                chosenMuni = m;
                break;
            }
        }

        // Civilstånd baserat på ålder (SCB TAB638 logik)
        let marital = "Ogift";
        if (age < 20) {
            marital = "Ogift";
        } else if (age < 35) {
            marital = Math.random() < 0.25 ? "Gift" : "Ogift";
        } else if (age < 65) {
            const roll = Math.random();
            if (roll < 0.55) marital = "Gift";
            else if (roll < 0.75) marital = "Skild";
            else marital = "Ogift";
        } else {
            const roll = Math.random();
            if (roll < 0.48) marital = "Gift";
            else if (roll < 0.78) marital = "Änka/Änkling";
            else marital = "Skild";
        }

        // Födelseland baserat på SCB utrikes/inrikes statistik (TAB4822)
        // I dagens Sverige är ~20% utrikes födda.
        let isForeignBorn = false;
        let birthCountry = "Sverige";
        let countryStat = null;

        if (year >= 1990 && Math.random() < 0.20) {
            isForeignBorn = true;
            // Välj bland utrikes länder
            const cChoice = this.foreignBirthCountries[Math.floor(Math.random() * this.foreignBirthCountries.length)];
            birthCountry = cChoice.name;
            countryStat = `En av ca ${cChoice.countInSweden.toLocaleString('sv-SE')} personer födda i ${cChoice.name} i Sverige`;
        }

        const sexTitle = (sex === 'män' || sex === 1) ? "man" : "kvinna";

        return {
            age: age,
            sex: sexTitle,
            birthYear: birthYear,
            municipality: chosenMuni.name,
            county: chosenMuni.county,
            municipalityPop: chosenMuni.pop.toLocaleString('sv-SE'),
            marital: marital,
            isForeignBorn: isForeignBorn,
            birthCountry: birthCountry,
            countryStat: countryStat,
            displayTitle: `${age}-årig ${sexTitle}`,
            displayLocation: `${chosenMuni.name}, ${chosenMuni.county}`
        };
    }

    tickRealtime(dtSeconds = 1.0) {
        if (!this.data || !this.isLive) return null;

        const rates = this.data.liveRates2026 || this.data.liveRates2024;
        this.liveBirthCounter += dtSeconds;
        this.liveDeathCounter += dtSeconds;
        this.liveImmigrantCounter += dtSeconds;
        this.liveEmigrantCounter += dtSeconds;

        const events = [];

        // Födsel (~var 331:e sekund = 5.5 min)
        if (this.liveBirthCounter >= rates.birthIntervalSec) {
            this.liveBirthCounter -= rates.birthIntervalSec;
            events.push({ type: 'birth', text: 'Nyfödd i Sverige (+1)', color: '#ff2a7a' });
        }

        // Dödsfall (~var 324:e sekund = 5.4 min)
        if (this.liveDeathCounter >= rates.deathIntervalSec) {
            this.liveDeathCounter -= rates.deathIntervalSec;
            events.push({ type: 'death', text: 'Dödsfall i Sverige (-1)', color: '#52525b' });
        }

        // Invandring (~var 363:e sekund = 6.1 min)
        if (this.liveImmigrantCounter >= rates.immigrateIntervalSec) {
            this.liveImmigrantCounter -= rates.immigrateIntervalSec;
            events.push({ type: 'immigrate', text: 'Invandring till Sverige (+1)', color: '#00f5a0' });
        }

        // Utvandring (~var 516:e sekund = 8.6 min)
        if (this.liveEmigrantCounter >= rates.emigrateIntervalSec) {
            this.liveEmigrantCounter -= rates.emigrateIntervalSec;
            events.push({ type: 'emigrate', text: 'Utvandring från Sverige (-1)', color: '#94a3b8' });
        }

        return events.length > 0 ? events : null;
    }
}
