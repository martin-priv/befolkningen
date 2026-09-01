# 🇸🇪 Sveriges befolkning (1860–2070)

> **Ett levande digitalt monument över Sveriges befolkning.**  
> Ett taktilt hav av över 100 000 skimrande pärlor där varje pärla representerar 100 levande människor. Drivs i realtid av officiell befolkningsstatistik från Statistiska centralbyrån (SCB).

🌐 **Live demo:** [https://martin-priv.github.io/befolkningen/](https://martin-priv.github.io/befolkningen/)

---

## 🎨 Koncept & Estetik

Hela Sveriges befolkning framställd som en levande, taktil partikelmassa – från nyfödda barn i ytskiktet till de äldsta seniorerna i botten:

* **Skala (1:100):** Varje pärla motsvarar exakt 100 invånare. År 2026 rymmer installationen ca 106 260 individuella sfärer, renderade med anpassade GLSL-shaders i Three.js för att ge stabila 60 FPS med spegelreflexer, ljusbrytning och dynamiska ringvågor.
* **Åldrarnas palett & luminescens:**
  * **Nyfödda (0–12 år):** Klara, självlysande karamell- och neonfärger i ytskiktet.
  * **Unga & vuxna (13–59 år):** Djupa, klara ädelstenstoner (cyan, azurblått, smaragd).
  * **Seniorer (60–75 år):** Dämpade, mörkare skiffer- och grafitnyanser.
  * **Äldst (76–105+ år):** Polerade svarta Tahitiska pärlor och obsidian i bottenlagret – samma fysiska sfärstorlek som alla andra åldrar med subtilt kantskimmer.
* **Fysisk fyllnadshöjd:** Skärmens fyllnadsgrad speglar befolkningens faktiska volym. År 1860 (3,8 miljoner) vilar befolkningen i den nedre tredjedelen, år 1969 når den mitten, och år 2026/2070 fyller den tre fjärdedelar med luftig takhöjd för atmosfären.

---

## 💓 Organisk Demografisk Rytm (Live 2026)

Alla fyra demografiska krafter drivs av oberoende **Poisson-processer** (exponentialfördelning) baserade på SCB:s verkliga årstakter:

* 👶 **Födslar (~var 5,5 min):** Faller ner från himlen, plaskar i ytan och skapar expanderande ringvågor.
* 🛬 **Invandring (~var 6,1 min):** Faller ner från skyn, plaskar och glider ner i sitt vuxna skikt. Visar ursprungsland baserat på SCB:s data.
* 🕊️ **Dödsfall (~var 5,4 min):** En slumpvis vald seniorpärla i botten flammar upp i ett mjukt silverskimmer, ger ifrån sig en stillsam mikro-våg och tonar bort i mörkret.
* 🛫 **Utvandring (~var 8,6 min):** En vuxen pärla lyser upp i himmelsblått, svävar stilla uppåt mot atmosfären och löses upp när den lämnar landet.

---

## 🕹️ Funktioner & Interaktion

* **⚙️ Solpong-inspirerat kontrollgränssnitt:**
  * Kontrollpanelen startar **dold** för en ren och ostörd konstupplevelse.
  * Klicka på det lilla kugghjulet **`⚙️`** i nedre högra hörnet (eller tryck **`T`**) för att fälla upp tidslinjen.
  * Klicka på **`✕`** för att fälla ner panelen i golvet igen.
* **⏱️ Tidslinje (1860–2070):** Dra i reglaget för att se 210 års svensk historia, från emigrationen på 1800-talet till SCB:s framskrivning 2070.
* **▶ Spela:** Automatisk cinematisk tidsresa genom 210 år.
* **🔍 Hitta din årskull:** Skriv in ditt födelseår (1915–2026) så tänds hela din generation upp som en lysande skiva med SCB-statistik om antal och könsfördelning.
* **👆 Klicka på en pärla:** Klicka var som helst i myllret för att starta en ringvåg och öppna en kompakt personprofil (fiktiv representant ur SCB:s register med ålder, kön, civilstånd, kommun och härkomst).
* **⚡ Tempon:** Växla mellan `⚡ 1x Real` (realtid), `⚡ 10x Fart` och `⚡ 60x Demo`.
* **⛶ Fullskärm:** Tryck `F` eller klicka på `⛶` för ambient visningsläge.

---

## 📊 Datakällor

All data hämtad från **Statistiska centralbyrån (SCB)** via PxWebAPI 2.0:
1. **Historisk befolkning 1860–2024:** Tabell `TAB5890` (folkmängd per ettårsklass 0–110+ år och kön).
2. **Befolkningsframskrivning 2025–2070:** Tabell `TAB4161` (Sveriges framtida befolkning, födda, döda, invandring och utvandring).
3. **Kommunal & regional fördelning:** SCB:s officiella kommun- och utrikesfödda-statistik.

---

## 🚀 Köra lokalt

Projektet är helt fristående utan externa byggsteg eller paketberoenden:

```bash
python3 -m http.server 8085
```

Öppna sedan i din webbläsare:
👉 `http://localhost:8085`

---

## 📜 Licens

MIT © Martin
