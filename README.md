# 🇸🇪 Sveriges befolkning (1860–2070)

> **Ett levande digitalt monument över Sveriges befolkning.**  
> Ett taktilt hav av över 100 000 skimrande pärlor där varje pärla representerar 100 levande människor. Drivs i realtid av officiell befolkningsstatistik från Statistiska centralbyrån (SCB).

🌐 **Live demo:** [https://martin-priv.github.io/befolkningen/](https://martin-priv.github.io/befolkningen/)

---

## 🎨 Koncept & Estetik

Hela Sveriges befolkning framställd som en levande, taktil partikelmassa – från nyfödda barn i ytskiktet till de äldsta seniorerna i botten:

* **Skala (1:100):** Varje pärla motsvarar exakt 100 invånare. År 2026 rymmer installationen ca 106 260 individuella sfärer, renderade med anpassade GLSL-shaders i Three.js för att ge stabila 60 FPS med spegelreflexer, ljusbrytning och dynamiska ringvågor.
* **Upplösningsoberoende pärlstorlek:** Pärlstorleken beräknas i Three.js världskoordinater (`beadWorldDiameter = 0.170`) med automatisk kompensation för Retina/HiDPI och fönsterflytt mellan externa skärmar.
* **Åldrarnas palett & luminescens:**
  * **Nyfödda (0–12 år):** Klara, självlysande karamell- och neonfärger i ytskiktet.
  * **Unga & vuxna (13–59 år):** Djupa, klara ädelstenstoner (cyan, azurblått, smaragd).
  * **Seniorer (60–75 år):** Dämpade, mörkare skiffer- och grafitnyanser.
  * **Äldst (76–105+ år):** Polerade svarta Tahitiska pärlor och obsidian i bottenlagret – samma fysiska sfärstorlek som alla andra åldrar med subtilt kantskimmer.
* **Fysisk fyllnadshöjd:** Skärmens fyllnadsgrad speglar befolkningens faktiska volym. År 1860 (3,8 miljoner) vilar befolkningen i den nedre tredjedelen, år 1969 når den mitten, och år 2026/2070 fyller den tre fjärdedelar med ren takhöjd för atmosfären.

---

## 🏛️ Formationer: Morfande Partikelsvärm (Beeswarm Morphing)

I kontrollpanelen kan du när som helst omvandla burken till specialdesignade datavisualiseringsvyer. Alla 106 200 pärlor lossnar då från sin plats och svärmar mjukt över skärmen till den nya formationen:

1. **🌊 Havet (Standardvyn):**  
   Befolkningen samlad som ett tätt hav från botten till ytan, med ålderslinjalen aktiv på vänsterkanten.
2. **🏛️ Pyramiden (Den klassiska befolkningspyramiden):**  
   Män till vänster, kvinnor till höger, ålder 0–100 vertikalt.  
   * *1880:* Bred triangelbas (många barn, hög spädbarnsdödlighet).  
   * *1935:* Tydlig midjeinsnörning under depressionen.  
   * *1965:* Rekordårens babyboom buktar ut i mitten.  
   * *2026:* En ”lök” eller ”urna” (topptung med smal botten).  
   * *2070:* Rak pelare (åldrande befolkning).  
   *(Ålderslinjalen släcks automatiskt i denna vy för att ge diagrammet full rymd).*
3. **🏙️ Stad vs Landsbygd (SCB TAB5328):**  
   Två vertikala pelare: **Landsbygd** och **Tätort**.  
   När tidsreglaget dras från 1860 (11 % i tätort) till 2026 (88 % i tätort) ser man bokstavligen tiotusentals kulor migrera från landsbygdsstapeln in till tätortspelaren.
4. **🌍 Härkomst (SCB TAB4822 & TAB5240):**  
   Två vertikala pelare: **Inrikes födda** (vänster) och **Utrikes födda** (höger).  
   * **Verklig åldersfördelning:** Följer SCB:s ålderskurva där spädbarn (0 år) till 99,2 % är inrikes födda (endast 0,8 % har hunnit invandra), medan andelen utrikes födda toppar vid 25–45 år (~32 %) och avtar i äldre åldrar.
   * **Garanterad stapelprecision:** Klick i vänster stapel identifierar alltid en inrikes född svensk; klick i höger stapel identifierar alltid en invandrad person.
   * **Dynamisk scenarioframtid:** Andelen utrikes födda anpassas automatiskt fram till 2070 beroende på valt scenario (t.ex. ~13,5 % vid stram migration upp till 28,5 % vid hög invandring).

*När en formation är aktiv visas flytande, glasartade informationsskyltar i skärmens topp med exakta invånarantal och procent i realtid.*

---

## 🔮 Framtidsscenarier: SCB vs Egen modell (2025–2070)

Från och med år 2025 fälls en framtidspanel ut i kontrollgränssnittet där användaren kan växla mellan officiella prognoser och en egen demografisk framskrivningsmotor:

### 1. SCB:s 7 officiella framskrivningsscenarier
Direkt integration med SCB:s alternativa beräkningar (TAB4161/TAB5240):
* **HU (Huvudalternativ):** SCB:s baslinje där fruktsamheten stiger mot 1,66 och befolkningen når ~11,8 miljoner år 2070.
* **LI / HI (Lägre / Högre invandring):** Utforskar hur olika migrationsströmmar påverkar folkmängd och åldersstruktur (10,4 till 13,3 miljoner år 2070).
* **LF / HF (Lägre / Högre fruktsamhet):** TFR varierar mellan 1,45 och 1,85 barn per kvinna.
* **LD / HD (Lägre / Högre dödlighet):** Effekter av livslängdsökningens takt.

### 2. Egen demografisk kohort-komponentmodell
SCB:s officiella prognoser har ofta antagit att dagens låga barnafödande (TFR ~1,43) automatiskt studsar upp mot 1,66–1,70, samt att dödsfallsöverskottet vänder till plus. Den egna modellen låter dig testa vad som faktiskt händer om dagens trender består eller politiken ändras:
* **Snabbval / Presets:**
  * **🧊 Dagens trend (Frozen 2024):** Fryser TFR på 1,426 och bibehåller dagens migrations- och dödlighetstakter. Visar hur det födelseunderskott som inleddes 2024 ackumuleras.
  * **🛡️ Stram migration:** Halverad invandring (`immigScale = 0.5`) med oförändrad utvandring.
  * **⚖️ Nettomigration noll:** Invandringen anpassas exakt till utvandringens volym (netto = 0).
  * **👶 Babyboom:** Fruktsamheten stiger till 1,85 barn per kvinna (motsvarande 1990 års topp).
* **Interaktiva reglage:** Fintrimma **TFR (1,10–2,20)**, **Invandring (20–200 %)** och **Utvandring (50–150 %)** individuellt och se resultatet i realtid.
* **Metodtransparens:** Information om modellens avgränsningar och skillnader mot SCB:s makroekonomiska antaganden nås direkt via infopanelen.

---

## 🌊 Fysik & Organisk Rörelse

* **Kritiskt dämpad fysik (Zero bounce):**  
  Partiklarnas fjäderrörelse är inställd med viskös dämpning (`k=0.08, d=0.50`), vilket helt eliminerar oönskad fjäder-rekyl eller studs. Pärlorna glider silkeslent till sina målpositioner och bromsar in mjukt.
* **GPU-mikroandning (GLSL Vertex Shader):**  
  Direkt i grafikhårdvaran appliceras en mjuk mikrodrivning (`t * 0.75, amp 0.046`). Detta ger hela myllret en subtil, mesmeriserande puls och andning med 0 % CPU-kostnad.
* **Lugna grann-platsbyten:**  
  Var ~1,8 sekund väljs ett enstaka par av **fysiskt intilliggande pärlor** (1–2 pärldiametrar från varandra) som stilla rullar förbi varandra och intar varandras plats, ackompanjerat av ett pyttelitet lokalt mikroripple (radie 1,4 enheter) så att närmaste omgivning mjukt viker undan.
* **Subtila mikrokrusningar:**  
  Var ~4:e sekund vandrar en mycket svag mikrovåg genom en del av folkmassan, som en stilla vindpust på ett torg.

---

## 👤 Möt en människa (Klick-inspektorn)

Klicka på valfri pärla i myllret (oavsett formation) för att inspektera den människa pärlan representerar:

* **Titel & Ålder:** Barn under 18 år benämns naturligt som **`Nyfödd pojke/flicka`**, **`7-årig pojke`**, **`14-årig flicka`** osv., och vuxna som **`18-årig man`**, **`42-årig kvinna`**.
* **Barnantal:** Sannolikhetsberäknat utifrån personens ålder, civilstånd och epokens fruktsamhetstal (TFR).
* **Boendemiljö:** Följer SCB:s definitioner (*Tätort* vs *Landsbygd*). Klick i Landsbygds- eller Tätortspelarna respekterar 100 % pelarens kontext.
* **Härkomst & Födelseland:** Klick i *Födda i Sverige*-pelaren ger alltid svenskfödd profil; klick i *Utrikes födda* ger alltid invandrad profil och härkomstland. I fria vyer (Havet/Pyramiden) används SCB:s åldersspecifika sannolikhet.
* **Sysselsättning / Yrke:**  
  * *Historisk tid (1860–1970):* Dåtida yrken och näringsgrenar (*Dräng, Piga, Statare, Sömmerska, Mejeribiträde, Verkstadsarbetare*).  
  * *Nutid och framtid (1975–2070):* Strikt förankrat i **SCB SSYK 2012** (*Undersköterska, Mjukvaruutvecklare, Civilingenjör, Grundskollärare, Sjuksköterska, Elektriker*) utan fiktiva eller spekulativa sci-fi-titlar.  
  * *Pensionsålder:* Följer SCB:s och Pensionsmyndighetens officiella riktåldersformel (67 år före 1976, 65 år 1976–2022, 66 år 2023–2026, 67–69 år framåt mot 2070).
* **Kommun & Viktning:** Geografiskt viktat efter SCB:s kommunstorlekar (inklusive landsortskommuner som Krokom).

---

## 💓 Organisk Demografisk Rytm (Live 2026)

Alla fyra demografiska krafter drivs av oberoende **Poisson-processer** (exponentialfördelning) baserade på SCB:s verkliga årstakter:

* 👶 **Födslar (~var 5,5 min)**
* 🛬 **Invandring (~var 6,1 min)**
* 🕊️ **Dödsfall (~var 5,4 min)**
* 🛫 **Utvandring (~var 8,6 min)**

### Två visuella uttrycksformer:
1. **I Havet (Vätskefysik & Vågor):**
   * *Födslar & Invandring:* Faller ner från himlen som skimrande 3D-kulor, bryter vattenytan med ett plask och dyker ner till sin generation medan ringvågor sprider sig.
   * *Dödsfall & Utvandring:* Flammar upp respektive stiger mot rymden och lämnar stilla kölvattensvågor.
2. **I Pyramiden och Pelarna (Diagram-pulser):**
   * För att inte störa eller skaka om de exakta statistiska staplarna pausas regnande kulor och ringvågor.
   * Istället tänds **subtila demografiska ljusauror** på exakt rätt plats:
     * **Födelse:** Tänds vid pyramidens bas (pojke till vänster, flicka till höger) eller toppen av *Födda i Sverige*-pelaren.
     * **Dödsfall:** En stilla champagne-vit gnista tänds i pyramidens spets bland de äldsta (75–98 år) och tonas sakta bort.
     * **Invandring:** Tänds i vuxen ålder (20–40 år) och i utrikes-pelaren.
     * **Utvandring:** Lyfter mjukt från vuxen ålder.
   * Diagrammens fasta geometri och pärlantal förblir 100 % rena och intakta.

*Genvägar för demo/test:* Tryck tangenterna **`B`** (födelse), **`I`** (invandring), **`D`** (dödsfall) eller **`E`** (utvandring) för att omedelbart trigga händelser i den aktiva vyn.

---

## ⏱️ Samhälls- & Tidsanda-HUD (SCB 1860–2070)

I kontrollpanelen finns en dedikerad indikatorrad som interpolerar 4 officiella nyckeltal för varje enskilt årtal:
* 👶 **Fruktsamhet:** Summerat fruktsamhetstal (TFR, barn/kvinna). Från 4,34 barn 1880 till 1,45 barn 2026.
* ⏳ **Medellivslängd:** Förväntad livslängd vid födseln. Från 46,5 år 1860 till 83,5 år 2026 och 87,7 år 2070.
* 🏙️ **Boende:** Andel bosatta i tätort vs landsbygd (SCB TAB5328). Från 11 % tätort 1860 till 88 % tätort 2026.
* 🩺 **Barnadödlighet:** Spädbarnsdödlighet per 1 000 levande födda (SCB TAB4376). Från 142 ‰ 1860 till 2,1 ‰ 2026.

---

## 🕹️ Funktioner & Interaktion

* **⚙️ Kontrollgränssnitt:** Startar i minimerat läge för en ren konstupplevelse. Klicka på **`⚙️`** i nedre högra hörnet (eller tryck **`T`**) för att öppna panelen.
* **⏱️ Tidslinje (1860–2070):** Dra i reglaget för att resa genom 210 års svensk historia.
* **▶ Spela:** Automatisk cinematisk tidsresa genom 210 år.
* **🔍 Hitta din årskull:** Skriv in ditt födelseår så tänds din generation upp som en lysande skiva med statistik om antal och könsfördelning.
* **⚡ Tempon:** Växla mellan `⚡ 1x Real` (realtid), `⚡ 10x Fart` och `⚡ 60x Demo`.
* **⛶ Fullskärm:** Tryck `F` eller klicka på `⛶`.
* **⌨️ Snabbkommandon:**
  * `T`: Öppna/stäng kontrollpanelen
  * `Space`: Starta/pausa tidsresan
  * `F`: Fullskärm
  * `B`, `I`, `D`, `E`: Utlös födelse, invandring, dödsfall eller utvandring i realtid

---

## 📊 Datakällor

All data hämtad från **Statistiska centralbyrån (SCB)** via PxWebAPI 2.0 och officiella tabellverk:
1. **Historisk befolkning 1860–2024:** Tabell `TAB5890` (folkmängd per ettårsklass 0–110+ år och kön).
2. **Befolkningsframskrivning 2025–2070:** Tabell `TAB4161` (Sveriges framtida befolkning, födda, döda, invandring och utvandring).
3. **Framskrivning härkomst 2025–2070:** Tabell `TAB5240` (inrikes och utrikes födda efter ålder och kön).
4. **Urbanisering & boende 1800–2023:** Tabell `TAB5328` (befolkning i tätort vs utanför tätort).
5. **Spädbarnsdödlighet 1749–2025:** Tabell `TAB4376` (döda under första levnadsåret per 1 000 födda).
6. **Utrikes födda 1900–2024:** Tabell `TAB4822` (utrikes och inrikes födda per födelseland).
7. **Yrkesklassificering:** SCB **SSYK 2012** samt rapporten *Trender och prognoser om utbildning och arbetsmarknad*.
8. **Pensionsålder:** Officiell pensionsålder och riktålder enligt SCB och Pensionsmyndigheten.

---

## 🚀 Köra lokalt

Projektet är helt fristående vanilla JavaScript och Three.js utan externa byggsteg:

```bash
python3 -m http.server 8085
```

Öppna sedan:
👉 `http://localhost:8085`

---

## 📜 Licens

MIT © Martin
