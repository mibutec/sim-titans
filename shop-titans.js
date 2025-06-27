class HeroClass {
    constructor(data, row, col, color, isPromoted) {
        this.color = color
        this.name = data.get(row, col).split(/\r?\n/)[0]
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
        const classes = new Array();

        for (let i = 0; i < 7; i++) {
            classes.push(new HeroClass(data, 20 * i, 1, "red", false))
            classes.push(new HeroClass(data, 20 * i, 9, "green", false))
            classes.push(new HeroClass(data, 20 * i, 17, "blue", false))
        }

        return classes
    }
}

class Item {
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
        this.crit = data.get(index, "CRIT") || ""
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

class Database {
    constructor(heroClasses, items) {
        this.heroClasses = heroClasses;
        this.items = items;
        this.qualityFactors = [1, 1.25, 1.5, 2, 7 / 3]
    }

    static async fromSpreadsheet() {
        const heroClassData = await Datasheet.load("Heroes")
        const heroClasses = HeroClass.createHeroClasses(heroClassData)
        const itemData = await Datasheet.load("Blueprints")
        const items = Item.createItems(itemData)

        return new Database(heroClasses, items);
    }
}

class Hero {
    constructor(heroClass) {
        this.heroClass = heroClass
        this.isPromoted = false
        this.level = 1
        this.items = new Array()
        for (let i = 0; i < 6; i++) {
            const item = {
                item: null,
                element : null,
                ghost: null
            }
            this.item.push(item)
        }
    }
}

function toCamelCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}
