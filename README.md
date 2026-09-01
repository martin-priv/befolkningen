# 🏺 Glasburken — Sveriges befolkning i 1:1

> **Ett levande slow art-monument över Sveriges befolkning.**  
> En 3D-glasburk fylld med över 10,5 miljoner pärlor. Varje pärla är en levande människa i Sverige – styrd i realtid av officiell statistik från Statistiska centralbyrån (SCB).

---

## 🎨 Koncept & Metafor

Tänk dig en vacker apotekarburk i optiskt glas som vilar på en mörk utställningssockel. Inuti glaset vilar hela Sveriges befolkning i form av miljontals skimrande gelépärlor:

* **1:1 Representation:** Varje enskild individ som lever i Sverige idag ($10\,587\,710$ personer) har sin egen unika pärla i burken.
* **Pärlornas Livscykel:**
  * **Nyfödda (0–12 år):** Klara, självlysande karamellfärger (neonrosa, cyan, solgult, violett, limegrönt).
  * **Unga vuxna (13–29 år):** Friska, spänstiga ädelstenstoner (safir, smaragd, rubin).
  * **Medelålder (30–59 år):** Mättade, djupa juveltoner.
  * **Seniorer (60–84 år):** Mörknar gradvis mot rökig kvarts och grafitgrått.
  * **Äldst (85–100+ år):** Djup obsidian-svart med subtilt skimmer i botten av burken.
* **Födslar & Invandring:** Nya klara pärlor faller mjukt ner i burken från ovan och studsar till rätta på ytan.
* **Dödsfall:** De mörknade pärlorna djupt nere i burken löses stilla upp, varpå massan ovanför sjunker en mikroskopisk fraktion neråt.
* **Utvandring:** Pärlor försvinner i den färg de hade utan att först ha mörknat.

---

## 📊 SCB Datakällor (Officiell Statistik)

Hämtat via **SCB MCP** (PxWebAPI 2.0):
1. **Historik 1860–2024:** Tabell `TAB5890` (*"Folkmängden efter ålder och kön. År 1860-2024"*). Samtliga 112 ettårsklasser ($0\text{–}110+$ år) för alla 165 år!
2. **Framskrivning 2025–2070:** Tabell `TAB4161` (*"Översikt över antal födda, döda, invandrare, utvandrare samt folkmängd"*).
3. **Realtidstakt 2024:**
   * ~99 000 födslar/år $\to$ **1 födsel var 5,3 minut**
   * ~89 500 dödsfall/år $\to$ **1 dödsfall var 5,9 minut**
   * ~94 000 invandrare/år $\to$ **1 invandrare var 5,6 minut**
   * ~45 000 utvandrare/år $\to$ **1 utvandrare var 11,7 minut**

---

## 🚀 Kom igång lokalt

Projektet är helt fristående och kräver inga externa byggsteg:

```bash
cd glasburken
python3 -m http.server 8085
```
Öppna sedan i din webbläsare:
👉 `http://localhost:8085`

---

## 🕹️ Interaktiva Funktioner

* **🔴 Live Nu:** Klockan tickar sekund för sekund. När ett barn föds eller en invandrare anländer ploppar en ny pärla ner i burken och befolkningstalet räknas upp i realtid!
* **⏱️ Tidslinje (1860–2070):** Dra i reglaget för att se burken fyllas från 1860 (3,8 miljoner), svälla genom babyboomen, passera 10 miljoner år 2017, och gå mot 11,8 miljoner år 2070.
* **▶ Spela:** Luta dig tillbaka och se 210 års svensk befolkningshistoria spelas upp i en mjuk cinematisk resa.
* **🔍 Hitta min årskull:** Skriv in ditt födelseår (t.ex. 1990) så tänds hela din generation upp som en lysande skiva i burken medan övriga generationer dämpas!
* **⛶ Fullskärm:** Tryck `F` eller klicka på `⛶` för ambient kiosk-läge. Kontrollerna tonar automatiskt bort vid inaktivitet.

---

## 📜 Licens
MIT © Martin
