import { h } from 'https://esm.sh/preact';
import { useState, useEffect, useRef } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

export function HeroTable( { heroes }) {
    const tabulatorRef = useRef(null);
    const [data, setData] = useState(heroes);

    useEffect(() => {
        const table = new Tabulator("#hero-table", {
            data,
            layout: 'fitColumns',
            reactiveData: true,
            columns: [
                { title: 'Class', field: 'class', editor: 'input' },
                { title: 'Level', field: 'level', editor: 'number' },
                { title: 'Attack', field: 'attack', editor: 'number' },
                {
                    title: 'Delete',
                    formatter: () => '🗑️',
                    cellClick: (e, cell) => {
                        const row = cell.getRow();
                        const id = row.getData().id;
                        setData(prev => prev.filter(h => h.id !== id));
                    }
                }
            ]
        });
        table.on("tableBuilt", function() {
            tabulatorRef.current = table;
        })


        // Cleanup bei Komponentenneustart oder -unmount
        return () => table.destroy();
    }, []);


    useEffect(() => {
        if (tabulatorRef.current) {
            tabulatorRef.current.replaceData(data);
        }
        }, [data]
    )

    function addHero() {
        setData(prev => [
            ...prev,
            { id: crypto.randomUUID(), class: 'New Hero', level: 1, attack: 1 }
        ]);
    }

    return html`
        <div>
          <h2>Heldentabelle</h2>
          <button onClick=${addHero}>+ Neuer Held</button>
          <div id="hero-table"></div>
        </div>
      `;
}

export function ItemSelector({ itemsMap, defaultFilter, resolve }) {
    const [level, setLevel] = useState("");
    const [type, setType] = useState("");
    const [filtered, setFiltered] = useState([]);

    const allTypes = [...new Set(Array.from(itemsMap.values()).map(item => item.type))].sort();

    useEffect(() => {
        applyFilter();
    }, [level, type]);

    function resetFilter() {
        setType(null);
        setLevel(null);
    }

    function applyFilter() {
        const results = Array.from(itemsMap.entries()).filter(([_, item]) => {
            if (level && item.level != Number(level)) return false;
            if (type && item.type !== type) return false;
            return defaultFilter(item);
        });
        setFiltered(results);
    }

    return html`
        <div id="modal-backdrop">
          <div id="modal">
            <h2>Item auswählen</h2>
            <label>
              Level:
              <input type="number" value=${level} onChange=${e => setLevel(e.target.value)} />
            </label>
            <label>
              Type:
              <select value=${type} onChange=${e => setType(e.target.value)}>
                <option value="">(alle)</option>
                ${allTypes.map(t => html`<option value=${t}>${t}</option>`)}
              </select>
            </label>
            <button onClick=${() => resetFilter()}>Reset</button>
            <button onClick=${() => resolve(null)}>Abort</button>

            <table>
              <thead>
                <tr><th>Name</th><th>Type</th><th>Level</th><th>ATK</th><th>DEF</th><th>HP</th><th>EVA</th><th>CRIT</th><th></th></tr>
              </thead>
              <tbody>
                ${filtered.map(([id, item]) => html`
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.type}</td>
                    <td>${item.level}</td>
                    <td>${item.atk}</td>
                    <td>${item.def}</td>
                    <td>${item.hp}</td>
                    <td>${item.eva}</td>
                    <td>${item.crit}</td>
                    <td><button onClick=${() => resolve(id)}>Wählen</button></td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      `;
}
