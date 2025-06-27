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
        const str = this.get(row, column).replace(/\D/g,'')
        return Number(str)
    }

    getPercent(row, column) {
        return this.get(row, column).replace('%', '') / 100
    }

    size() {
        return this.rows.length
    }
}

