import {h} from 'https://esm.sh/preact';
import {useState, useEffect, useRef} from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import {Hero} from './model.js';

const html = htm.bind(h);

function HeroClassSelector({heroClassesMap, onSelect, onCancel}) {
    return html`
        <div id="modal-backdrop">
            <div id="modal">
                <h2>Heldenklasse auswählen</h2>
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>ATK</th>
                        <th>DEF</th>
                        <th>HP</th>
                        <th>EVA</th>
                        <th>CRIT</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    ${Array.from(heroClassesMap.entries()).map(([id, heroClass]) => html`
                        <tr>
                            <td>${heroClass.name}</td>
                            <td>${heroClass.atk}</td>
                            <td>${heroClass.def}</td>
                            <td>${heroClass.hp}</td>
                            <td>${heroClass.eva}</td>
                            <td>${heroClass.critChance}</td>
                            <td>
                                <button onClick=${() => onSelect(id)}>Wählen</button>
                            </td>
                        </tr>
                    `)}
                    </tbody>
                </table>
                <button onClick=${onCancel}>Abbrechen</button>
            </div>
        </div>
    `;
}

export function HeroTable({heroes, heroClassesMap}) {
    const tabulatorRef = useRef(null);
    const [data, setData] = useState(heroes);
    const [showClassSelector, setShowClassSelector] = useState(false);

    useEffect(() => {
        const table = new Tabulator("#hero-table", {
            data,
            layout: 'fitColumns',
            reactiveData: true,
            columns: [
                {title: 'Class', field: 'heroClass.name', editor: false},
                {
                    title: 'Level',
                    field: 'level',
                    editor: 'number',
                    editorParams: {
                        min: 1,
                        max: 40
                    },
                    validator: ["min:1", "max:40"]
                },
                {
                    title: 'Attack',
                    field: 'atk',
                    formatter: (cell) => cell.getRow().getData().getAtk(),
                    editor: false
                },
                {
                    title: 'Defense',
                    field: 'def',
                    formatter: (cell) => cell.getRow().getData().getDef(),
                    editor: false
                },
                {
                    title: 'HP',
                    field: 'hp',
                    formatter: (cell) => cell.getRow().getData().getHp(),
                    editor: false
                },
                {
                    title: 'Evasion',
                    field: 'eva',
                    formatter: (cell) => cell.getRow().getData().getEva(),
                    editor: false
                },
                {
                    title: 'Crit',
                    field: 'crit',
                    formatter: (cell) => cell.getRow().getData().getCritChance(),
                    editor: false
                },
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
        table.on("tableBuilt", function () {
            tabulatorRef.current = table;
        })

        table.on("cellEdited", function(cell) {
            if (cell.getField() === "level") {
                const hero = cell.getRow().getData();
                hero.level = cell.getValue();
                // Trigger rerender der Zeile
                cell.getRow().reformat();
            }
        });

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
        setShowClassSelector(true);
    }

    function handleClassSelect(classId) {
        console.log("selected classId:", classId);
        if (classId) {
            const newHero = new Hero(heroClassesMap.get(classId), 1);
            setData(prev => [...prev, newHero]);
        }
        setShowClassSelector(false);
    }

    return html`
        <div>
            <h2>Heldentabelle</h2>
            <button onClick=${addHero}>+ Neuer Held</button>
            <div id="hero-table"></div>
            ${showClassSelector && html`
                <${HeroClassSelector}
                        heroClassesMap=${heroClassesMap}
                        onSelect=${handleClassSelect}
                        onCancel=${() => setShowClassSelector(false)}/>`}
        </div>
    `;
}

export function ItemSelector({itemsMap, defaultFilter, resolve}) {
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
                    <input type="number" value=${level} onChange=${e => setLevel(e.target.value)}/>
                </label>
                <label>
                    Type:
                    <select value=${type} onChange=${e => setType(e.target.value)}>
                        <option value="">(alle)</option>
                        ${allTypes.map(t => html`
                            <option value=${t}>${t}</option>`)}
                    </select>
                </label>
                <button onClick=${() => resetFilter()}>Reset</button>
                <button onClick=${() => resolve(null)}>Abort</button>

                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Level</th>
                        <th>ATK</th>
                        <th>DEF</th>
                        <th>HP</th>
                        <th>EVA</th>
                        <th>CRIT</th>
                        <th></th>
                    </tr>
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
                            <td>
                                <button onClick=${() => resolve(id)}>Wählen</button>
                            </td>
                        </tr>
                    `)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
