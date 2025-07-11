class Datasheet {
    constructor(json) {
        const rows = json?.table?.rows;
        const cols = json?.table?.cols;

        if (!rows || rows.length < 1 || !cols) {
            throw new Error("Ungültige oder unvollständige Daten");
        }

        this.rows = rows;
        this.headers = cols.map(col => {
            const value = col?.label;
            return typeof value === "string"
                ? value.trim()
                : String(value ?? "").trim();
        });
    }

    static async load(sheetName) {
        const isLocal = true
        const spreadsheetId = "1WLa7X8h3O0-aGKxeAlCL7bnN8-FhGd3t7pz2RCzSg8c";

        const url = isLocal ? sheetName + '.json' : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        console.log(url)
        const response = await fetch(url);
        const text = await response.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));

        return new Datasheet(json)
    }

    get(row, column) {
        const colIndex = typeof column === "string" ? this.headers.findIndex(h => h.toLowerCase() === column.toLowerCase()) : column
        return this.rows[row].c[colIndex]?.v
    }

    getNumber(row, column) {
        const cellval = this.get(row, column)
        if (typeof cellval === 'number') return cellval;

        const str = cellval.replace(/\D/g,'')
        return Number(str)
    }

    getPercent(row, column) {
        return this.get(row, column).replace('%', '') / 100
    }

    size() {
        return this.rows.length
    }
}

export class HeroClass {
    constructor(data, row, col, color, isPromoted) {
        const rawName = data.get(row, col).split(/\r?\n/)[0]
        this.id = toCamelCase(rawName);
        this.name = rawName
        this.color = color
        this.critChance = data.getPercent(row + 1, col + 3)
        this.critMultiplier = data.getNumber(row + 2, col + 3)
        this.threat = data.getNumber(row + 3, col + 3)
        this.hp = data.getNumber(row, col + 5)
        this.atk = data.getNumber(row + 1, col + 5)
        this.def = data.getNumber(row + 2, col + 5)
        this.eva = data.getPercent(row + 3, col + 5)
        this.element = data.get(row + 2, col + 6)
        this.eqSlots = new Array();
        this.isPromoted = isPromoted

        for (let i = 0; i < 6; i++){
            const eqSlot = new Array()
            for (let j = 0; j < 5; j++){
                const eqVal = data.get(row + 5 + j, col + i)
                if (eqVal != "---") {
                    eqSlot.push(eqVal)
                }
            }
            this.eqSlots.push(eqSlot)
        }

        if (!isPromoted) {
            this.promotion = new HeroClass(data, row + 10, col, color, true)
        }
    }

    static createHeroClasses(data) {
        const classes = new Map();

        for (let i = 0; i < 7; i++) {
            const redClass = new HeroClass(data, 20 * i, 1, "red", false);
            const greenClass = new HeroClass(data, 20 * i, 9, "green", false);
            const blueClass = new HeroClass(data, 20 * i, 17, "blue", false);

            classes.set(redClass.id, redClass);
            classes.set(greenClass.id, greenClass);
            classes.set(blueClass.id, blueClass);
        }

        return classes;
    }
}

export class Skill {
    constructor(data, index, isUpgrade = false) {
        this.rarity = data.get(index, "Rarity") || "Normal";
        this.classes = data.get(index, "Classes") || "";
        this.name = data.get(index, "Name");
        this.id = toCamelCase(this.name);
        console.log(this.id)
        this.effect = data.get(index, "Skill Effect(s)") // || throw new Error ("Skill effect missing in " + this.name);
        this.requiredElement = data.getNumber(index, 4)
        this.tiers = new Array()
        if (!isUpgrade) {
            for (let i = 1; i <= 3; i++) {
                const tier = new Skill(data, index + i, true)
                this.tiers.push(tier);
            }
        }
    }

    static createSkills(data) {
        const skills = new Map();

        for (let i = 0; i < data.size(); i++) {
            if (data.getNumber(i, "Tier") == 1) {
                const skill = new Skill(data, i)
                skills.set(skill.id, skill);
            }
        }

        return skills;
    }
}

export class Item {
    constructor(data, index) {
        const nameRaw = data.get(index, "Name")
        this.id = toCamelCase(nameRaw);
        this.name = nameRaw
        this.type = data.get(index, "Type") || ""
        this.level = data.get(index, "Tier") || ""
        this.atk = data.get(index, "ATK") || ""
        this.def = data.get(index, "DEF") || ""
        this.hp = data.get(index, "HP") || ""
        this.eva = data.get(index, "EVA") || ""
        this.critChance = data.get(index, "CRIT") || ""
    }

    static createItems(data) {
        const itemsMap = new Map();

        for (let i = 0; i < data.size(); i++) {
            const item = new Item(data, i)
            itemsMap.set(item.id, item);
        }

        return itemsMap;
    }
}

export class Database {
    constructor(heroClasses, items) {
        this.heroClasses = heroClasses;
        this.items = items;
    }

    static async fromSpreadsheet() {
        const heroClassData = await Datasheet.load("Heroes")
        const heroClasses = HeroClass.createHeroClasses(heroClassData)
        const itemData = await Datasheet.load("Blueprints")
        const items = Item.createItems(itemData)
        const skillData = await Datasheet.load("Skills")
        const skills = Skill.createSkills(skillData)

        console.log(skills)
        return new Database(heroClasses, items);
    }
}

export const Quality = Object.freeze({
    NORMAL: { name: 'normal', factor: 1 },
    UNCOMMON: { name: 'uncommon', factor: 1.25 },
    RARE: { name: 'rare', factor: 1.5 },
    EPIC: { name: 'epic', factor: 2 },
    LEGENDARY: { name: 'legendary', factor: 7 / 3 }
});

class Equipment {
    constructor(item, element, ghost, quality) {
        this.item = item;
        this.element = element;
        this.ghost = ghost;
        this.quality = quality;
    }

    getAtk() {
        return this.item.atk * this.quality.factor;
    }

    getDef() {
        return this.item.def * this.quality.factor;
    }

    getHp() {
        return this.item.hp * this.quality.factor;
    }

    getEva() {
        return this.item.eva;
    }

    getCritChance() {
        return this.item.crit * this.getAtk();
    }
}

export class Hero {
    constructor(heroClass) {
        this.heroClass = heroClass
        this.isPromoted = false
        this.name = "My Hero"
        this.level = 1
        this.equipments = new Array()
        for (let i = 0; i < 6; i++) {
            const item = {
                item: null,
                element : null,
                ghost: null
            }
            this.equipments.push(item)
        }
    }

    getStat(statName, includeLevel = true) {
        let value = includeLevel ? this.heroClass[statName] * this.level : this.heroClass[statName];

        for (const equipment of this.equipments) {
            if (equipment && equipment.item) {
                const methodName = `get${statName.charAt(0).toUpperCase() + statName.slice(1)}`;
                if (typeof equipment[methodName] === 'function') {
                    value += equipment[methodName]();
                }
            }
        }
        return value;
    }

    getAtk() {
        return this.getStat('atk');
    }

    getDef() {
        return this.getStat('def');
    }

    getHp() {
        return this.getStat('hp');
    }

    getEva() {
        return this.getStat('eva', false);
    }

    getCritChance() {
        return this.getStat('critChance', false);
    }

    getCritDmg() {
        return this.heroClass.critMultiplier * this.getAtk();
    }
}

function toCamelCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}
