'use strict';

const mulberry32 = seed => {
    let t = seed + 0x6D2B79F5;
    return () => {
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
};

const generateTestFromModel = (dataModel, seed = Date.now()) => {
    const modules = dataModel.test || [];
    if (!modules.length) return '';
    
    const varNames = new Set();
    const collectVarNames = modules => {
        modules.forEach(mod => {
            if (mod.name) varNames.add(mod.name);
            if (mod.type === 'Repeat' && mod.modules) collectVarNames(mod.modules);
        });
    };
    collectVarNames(modules);
    
    const sanitizeName = name => name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/\s+/g, '_');
    
    const formatOutput = (value, mod) => {
        if (!mod.visible) return '';
        
        if (Array.isArray(value)) {
            if (value.length > 0 && Array.isArray(value[0])) {
                // For 2D arrays (matrices), always use space within rows and newlines between rows
                return value.map(row => {
                    if (Array.isArray(row)) {
                        return row.join(' ');
                    }
                    return String(row);
                }).join('\\n');
            }
            // For 1D arrays, always use space separation
            return value.join(' ');
        }
        return String(value);
    };
    
    let compileModule;
    
    const compileFunctions = {
        FixedVariable: mod => {
            const safeName = sanitizeName(mod.name);
            
            if (mod.dataType === 'char') {
                // For char type, accept single character or ASCII code
                const val = String(mod.value);
                if (val.length === 1) {
                    return `vars['${safeName}'] = ${JSON.stringify(val)};`;
                } else {
                    const validateInteger = val => /^-?\d+$/.test(String(val));
                    if (!validateInteger(mod.value)) {
                        throw new Error(`FixedVariable ${mod.name}: char type requires single character or ASCII code (integer)`);
                    }
                    const code = Number(mod.value);
                    if (code < 0 || code > 127) {
                        throw new Error(`FixedVariable ${mod.name}: ASCII code must be 0-127`);
                    }
                    return `vars['${safeName}'] = String.fromCharCode(${code});`;
                }
            } else if (mod.dataType === 'double') {
                // For double, accept any numeric value
                const num = Number(mod.value);
                if (isNaN(num)) {
                    throw new Error(`FixedVariable ${mod.name}: value must be a number for double type`);
                }
                return `vars['${safeName}'] = ${num};`;
            } else {
                // For int type, validate integer
                const validateInteger = val => /^-?\d+$/.test(String(val));
                if (!validateInteger(mod.value)) {
                    throw new Error(`FixedVariable ${mod.name}: value must be an integer (only digits and optional leading -)`);
                }
                return `vars['${safeName}'] = Math.floor(${JSON.stringify(mod.value)});`;
            }
        },
        
        RandomVariable: mod => {
            const safeName = sanitizeName(mod.name);
            
            if (mod.dataType === 'char') {
                // For char type, treat min/max as ASCII codes
                const validateInteger = val => /^-?\d+$/.test(String(val));
                if (!validateInteger(mod.min) || !validateInteger(mod.max)) {
                    throw new Error(`RandomVariable ${mod.name}: min and max must be ASCII codes (integers 0-127) for char type`);
                }
                const min = Number(mod.min) || 32;  // Default to space character
                const max = Number(mod.max) || 126; // Default to tilde
                if (min < 0 || max > 127 || min > max) {
                    throw new Error(`RandomVariable ${mod.name}: ASCII codes must be 0-127 and min <= max`);
                }
                return `vars['${safeName}'] = String.fromCharCode(Math.floor(rng() * (${max} - ${min} + 1)) + ${min});`;
            } else if (mod.dataType === 'double') {
                // For double type, generate floating point numbers
                const min = Number(mod.min) || 0;
                const max = Number(mod.max) || 0;
                if (isNaN(min) || isNaN(max)) {
                    throw new Error(`RandomVariable ${mod.name}: min and max must be numbers for double type`);
                }
                if (min > max) throw new Error(`RandomVariable ${mod.name}: min (${min}) > max (${max})`);
                return `vars['${safeName}'] = rng() * (${max} - ${min}) + ${min};`;
            } else {
                // For int, prime, and power of 2 types, validate as integers
                const validateInteger = val => /^-?\d+$/.test(String(val));
                if (!validateInteger(mod.min) || !validateInteger(mod.max)) {
                    throw new Error(`RandomVariable ${mod.name}: min and max must be integers for ${mod.dataType} type`);
                }
                const min = Number(mod.min) || 0;
                const max = Number(mod.max) || 0;
                if (min > max) throw new Error(`RandomVariable ${mod.name}: min (${min}) > max (${max})`);
                
                if (mod.dataType === 'prime') {
                    return `
                        const isPrime_${safeName} = n => {
                            if (n < 2) return false;
                            for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
                            return true;
                        };
                        const primes_${safeName} = [];
                        for (let i = ${min}; i <= ${max}; i++) if (isPrime_${safeName}(i)) primes_${safeName}.push(i);
                        if (!primes_${safeName}.length) throw new Error('No primes in range [${min}, ${max}]');
                        vars['${safeName}'] = primes_${safeName}[Math.floor(rng() * primes_${safeName}.length)];
                    `;
                } else if (mod.dataType === 'power of 2') {
                    return `
                        const powers_${safeName} = [];
                        for (let p = 1; p <= ${max}; p *= 2) if (p >= ${min}) powers_${safeName}.push(p);
                        if (!powers_${safeName}.length) throw new Error('No powers of 2 in range [${min}, ${max}]');
                        vars['${safeName}'] = powers_${safeName}[Math.floor(rng() * powers_${safeName}.length)];
                    `;
                } else {
                    // Regular int type
                    return `vars['${safeName}'] = Math.floor(rng() * (${max} - ${min} + 1) + ${min});`;
                }
            }
        },
        
        RandomArray: mod => {
            const length = sanitizeName(mod.lengthVar);
            const minVar = sanitizeName(mod.minVar);
            const maxVar = sanitizeName(mod.maxVar);
            const safeName = sanitizeName(mod.name);
            
            let code = `
                const len = vars['${length}'];
                const min = vars['${minVar}'];
                const max = vars['${maxVar}'];
                if (min > max) throw new Error('RandomArray: min > max');
                const arr = [];
            `;
            
            if (mod.dataType === 'char') {
                // Generate array of ASCII characters
                code += `
                    if (min < 0 || max > 127) throw new Error('RandomArray: ASCII codes must be 0-127 for char type');
                `;
                if (mod.multivalType === 'distinct') {
                    code += `
                        const range = max - min + 1;
                        if (range < len) throw new Error('RandomArray: not enough distinct ASCII characters');
                        const used = new Set();
                        while (arr.length < len) {
                            const code = Math.floor(rng() * range) + min;
                            if (!used.has(code)) {
                                used.add(code);
                                arr.push(String.fromCharCode(code));
                            }
                        }
                    `;
                } else {
                    code += `
                        for (let i = 0; i < len; i++) {
                            const code = Math.floor(rng() * (max - min + 1)) + min;
                            arr.push(String.fromCharCode(code));
                        }
                    `;
                }
            } else if (mod.dataType === 'double') {
                // Generate array of floating point numbers
                if (mod.multivalType === 'distinct') {
                    code += `
                        const used = new Set();
                        let attempts = 0;
                        while (arr.length < len && attempts < len * 100) {
                            const val = rng() * (max - min) + min;
                            const rounded = Math.round(val * 1000000) / 1000000; // 6 decimal precision
                            if (!used.has(rounded)) {
                                used.add(rounded);
                                arr.push(rounded);
                            }
                            attempts++;
                        }
                        if (arr.length < len) throw new Error('RandomArray: could not generate enough distinct double values');
                    `;
                } else {
                    code += `
                        for (let i = 0; i < len; i++) {
                            arr.push(rng() * (max - min) + min);
                        }
                    `;
                }
            } else if (mod.dataType === 'prime') {
                code += `
                    const isPrime_${safeName} = n => {
                        if (n < 2) return false;
                        for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
                        return true;
                    };
                    const primes_${safeName} = [];
                    for (let i = min; i <= max; i++) if (isPrime_${safeName}(i)) primes_${safeName}.push(i);
                    if (!primes_${safeName}.length) throw new Error('RandomArray: No primes in range [' + min + ', ' + max + ']');
                    
                    if (${JSON.stringify(mod.multivalType)} === 'distinct') {
                        if (primes_${safeName}.length < len) throw new Error('RandomArray: not enough distinct prime values');
                        const used = new Set();
                        while (arr.length < len) {
                            const val = primes_${safeName}[Math.floor(rng() * primes_${safeName}.length)];
                            if (!used.has(val)) {
                                used.add(val);
                                arr.push(val);
                            }
                        }
                    } else {
                        for (let i = 0; i < len; i++) {
                            arr.push(primes_${safeName}[Math.floor(rng() * primes_${safeName}.length)]);
                        }
                    }
                `;
            } else if (mod.dataType === 'power of 2') {
                code += `
                    const powers_${safeName} = [];
                    for (let p = 1; p <= max; p *= 2) if (p >= min) powers_${safeName}.push(p);
                    if (!powers_${safeName}.length) throw new Error('RandomArray: No powers of 2 in range [' + min + ', ' + max + ']');
                    
                    if (${JSON.stringify(mod.multivalType)} === 'distinct') {
                        if (powers_${safeName}.length < len) throw new Error('RandomArray: not enough distinct power of 2 values');
                        const used = new Set();
                        while (arr.length < len) {
                            const val = powers_${safeName}[Math.floor(rng() * powers_${safeName}.length)];
                            if (!used.has(val)) {
                                used.add(val);
                                arr.push(val);
                            }
                        }
                    } else {
                        for (let i = 0; i < len; i++) {
                            arr.push(powers_${safeName}[Math.floor(rng() * powers_${safeName}.length)]);
                        }
                    }
                `;
            } else {
                // Regular int type
                if (mod.multivalType === 'distinct') {
                    code += `
                        const range = max - min + 1;
                        if (range < len) throw new Error('RandomArray: not enough distinct values');
                        const used = new Set();
                        while (arr.length < len) {
                            const val = Math.floor(rng() * range) + min;
                            if (!used.has(val)) {
                                used.add(val);
                                arr.push(val);
                            }
                        }
                    `;
                } else {
                    code += `
                        for (let i = 0; i < len; i++) {
                            arr.push(Math.floor(rng() * (max - min + 1) + min));
                        }
                    `;
                }
            }
            
            if (mod.sortType === 'asc') {
                if (mod.dataType === 'char') {
                    code += 'arr.sort();';
                } else {
                    code += 'arr.sort((a, b) => a - b);';
                }
            } else if (mod.sortType === 'desc') {
                if (mod.dataType === 'char') {
                    code += 'arr.sort().reverse();';
                } else {
                    code += 'arr.sort((a, b) => b - a);';
                }
            }
            
            return code + `return arr;`;
        },
        
        Permutation: mod => {
            const length = sanitizeName(mod.lengthVar);
            const order = sanitizeName(mod.orderVar);
            
            return `
                const n = vars['${length}'];
                const k = BigInt(vars['${order}']);
                const factorial = n => { 
                    let f = 1n; 
                    for (let i = 2n; i <= BigInt(n); i++) f *= i; 
                    return f; 
                };
                const maxOrder = factorial(n);
                if (k < 0n || k >= maxOrder) throw new Error('Permutation: invalid order');
                
                const arr = Array.from({length: n}, (_, i) => i + 1);
                let order = k;
                const perm = [];
                
                for (let i = n; i > 0; i--) {
                    const fact = factorial(i - 1);
                    const idx = Number(order / fact);
                    perm.push(arr[idx]);
                    arr.splice(idx, 1);
                    order %= fact;
                }
                return perm;
            `;
        },
        
        MazeMatrix: mod => {
            const rows = sanitizeName(mod.rowsVar);
            const cols = sanitizeName(mod.colsVar);
            
            return `
                const rows = vars['${rows}'];
                const cols = vars['${cols}'];
                const maze = Array(rows).fill().map(() => Array(cols).fill(1));
                
                const stack = [[0, 0]];
                maze[0][0] = 0;
                const dirs = [[0,1], [1,0], [0,-1], [-1,0]];
                
                while (stack.length) {
                    const [r, c] = stack[stack.length - 1];
                    const validDirs = [];
                    
                    for (const [dr, dc] of dirs) {
                        const nr = r + dr * 2;
                        const nc = c + dc * 2;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc] === 1) {
                            validDirs.push([dr, dc, nr, nc]);
                        }
                    }
                    
                    if (validDirs.length) {
                        const [dr, dc, nr, nc] = validDirs[Math.floor(rng() * validDirs.length)];
                        maze[r + dr][c + dc] = 0;
                        maze[nr][nc] = 0;
                        stack.push([nr, nc]);
                    } else {
                        stack.pop();
                    }
                }
                
                const path = [[0, 0]];
                const visited = Array(rows).fill().map(() => Array(cols).fill(false));
                visited[0][0] = true;
                
                while (path.length && (path[path.length - 1][0] !== rows - 1 || path[path.length - 1][1] !== cols - 1)) {
                    const [r, c] = path[path.length - 1];
                    let found = false;
                    
                    for (const [dr, dc] of dirs) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && maze[nr][nc] === 0) {
                            visited[nr][nc] = true;
                            path.push([nr, nc]);
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found) path.pop();
                }
                
                if (!path.length) {
                    for (const [r, c] of [[0, 0], ...path, [rows - 1, cols - 1]]) {
                        maze[r][c] = 0;
                    }
                }
                
                return maze;
            `;
        },
        
        SparseMatrix: mod => {
            const rows = sanitizeName(mod.rowsVar);
            const cols = sanitizeName(mod.colsVar);
            const minVal = sanitizeName(mod.minValueVar);
            const maxVal = sanitizeName(mod.maxValueVar);
            const zeros = sanitizeName(mod.zeroValuesVar);
            
            return `
                const rows = vars['${rows}'];
                const cols = vars['${cols}'];
                const minVal = vars['${minVal}'];
                const maxVal = vars['${maxVal}'];
                const zeros = vars['${zeros}'];
                const total = rows * cols;
                
                if (zeros > total) throw new Error('SparseMatrix: too many zeros');
                if (minVal > maxVal) throw new Error('SparseMatrix: minValue > maxValue');
                
                const matrix = [];
                const positions = [];
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        positions.push([i, j]);
                    }
                }
                
                for (let i = positions.length - 1; i > 0; i--) {
                    const j = Math.floor(rng() * (i + 1));
                    [positions[i], positions[j]] = [positions[j], positions[i]];
                }
                
                for (let i = 0; i < rows; i++) {
                    matrix.push(Array(cols).fill(0));
                }
                
                for (let i = zeros; i < total; i++) {
                    const [r, c] = positions[i];
                    matrix[r][c] = Math.floor(rng() * (maxVal - minVal + 1)) + minVal;
                }
                
                return matrix;
            `;
        },
        
        RandomGraph: mod => {
            const nodes = sanitizeName(mod.nodesVar);
            const edges = sanitizeName(mod.edgesVar);
            const minVal = mod.weighted === 'w' ? sanitizeName(mod.minValueVar) : null;
            const maxVal = mod.weighted === 'w' ? sanitizeName(mod.maxValueVar) : null;
            
            let code = `
                const n = vars['${nodes}'];
                const m = vars['${edges}'];
                const maxEdges = ${mod.direction === 'undir' ? 'n * (n - 1) / 2' : 'n * (n - 1)'};
                if (m > maxEdges) throw new Error('RandomGraph: too many edges');
                
                const edges = [];
                const edgeSet = new Set();
            `;
            
            if (mod.connectivity === 'conn') {
                code += `
                    const parent = Array(n).fill(-1);
                    const find = x => parent[x] < 0 ? x : parent[x] = find(parent[x]);
                    const union = (x, y) => {
                        x = find(x); y = find(y);
                        if (x !== y) { parent[x] = y; return true; }
                        return false;
                    };
                    
                    let treeEdges = 0;
                    while (treeEdges < n - 1) {
                        const u = Math.floor(rng() * n);
                        const v = Math.floor(rng() * n);
                        if (u !== v && union(u, v)) {
                            const key = ${mod.direction === 'undir' ? 'u < v ? `${u},${v}` : `${v},${u}`' : '`${u},${v}`'};
                            edgeSet.add(key);
                            edges.push([u, v${mod.weighted === 'w' ? ', 0' : ''}]);
                            treeEdges++;
                        }
                    }
                `;
            }
            
            code += `
                while (edges.length < m) {
                    const u = Math.floor(rng() * n);
                    const v = Math.floor(rng() * n);
                    if (u !== v) {
                        const key = ${mod.direction === 'undir' ? 'u < v ? `${u},${v}` : `${v},${u}`' : '`${u},${v}`'};
                        if (!edgeSet.has(key)) {
                            edgeSet.add(key);
                            edges.push([u, v${mod.weighted === 'w' ? ', 0' : ''}]);
                        }
                    }
                }
            `;
            
            if (mod.weighted === 'w') {
                code += `
                    const minW = vars['${minVal}'];
                    const maxW = vars['${maxVal}'];
                    if (minW > maxW) throw new Error('RandomGraph: minValue > maxValue');
                    edges.forEach(e => e[2] = Math.floor(rng() * (maxW - minW + 1)) + minW);
                `;
            }
            
            if (mod.format === 'adj-mat') {
                code += `
                    const matrix = Array(n).fill().map(() => Array(n).fill(${mod.weighted === 'w' ? '0' : 'false'}));
                    edges.forEach(([u, v${mod.weighted === 'w' ? ', w' : ''}]) => {
                        matrix[u][v] = ${mod.weighted === 'w' ? 'w' : 'true'};
                        ${mod.direction === 'undir' ? `matrix[v][u] = ${mod.weighted === 'w' ? 'w' : 'true'};` : ''}
                    });
                    return matrix;
                `;
            } else {
                code += 'return edges;';
            }
            
            return code;
        },
        
        BipartiteGraph: mod => {
            const nodes = sanitizeName(mod.nodesVar);
            const minVal = mod.weighted === 'w' ? sanitizeName(mod.minValueVar) : null;
            const maxVal = mod.weighted === 'w' ? sanitizeName(mod.maxValueVar) : null;
            
            let code = `
                const n = vars['${nodes}'];
                const L = Math.ceil(n / 2);
                const R = n - L;
                const maxEdges = L * R;
                const m = Math.ceil(0.8 * maxEdges);
                
                const edges = [];
                const edgeSet = new Set();
            `;
            
            if (mod.connectivity === 'conn') {
                code += `
                    const leftUsed = new Set();
                    const rightUsed = new Set();
                    
                    for (let i = 0; i < Math.min(L, R); i++) {
                        const u = i;
                        const v = L + i;
                        edgeSet.add(\`\${u},\${v}\`);
                        edges.push([u, v${mod.weighted === 'w' ? ', 0' : ''}]);
                        leftUsed.add(u);
                        rightUsed.add(v);
                    }
                    
                    for (let u = 0; u < L; u++) {
                        if (!leftUsed.has(u)) {
                            const v = L + Math.floor(rng() * R);
                            edgeSet.add(\`\${u},\${v}\`);
                            edges.push([u, v${mod.weighted === 'w' ? ', 0' : ''}]);
                        }
                    }
                    
                    for (let v = L; v < n; v++) {
                        if (!rightUsed.has(v)) {
                            const u = Math.floor(rng() * L);
                            const key = \`\${u},\${v}\`;
                            if (!edgeSet.has(key)) {
                                edgeSet.add(key);
                                edges.push([u, v${mod.weighted === 'w' ? ', 0' : ''}]);
                            }
                        }
                    }
                `;
            }
            
            code += `
                while (edges.length < m) {
                    const u = Math.floor(rng() * L);
                    const v = L + Math.floor(rng() * R);
                    const key = \`\${u},\${v}\`;
                    if (!edgeSet.has(key)) {
                        edgeSet.add(key);
                        edges.push([u, v${mod.weighted === 'w' ? ', 0' : ''}]);
                    }
                }
            `;
            
            if (mod.weighted === 'w') {
                code += `
                    const minW = vars['${minVal}'];
                    const maxW = vars['${maxVal}'];
                    if (minW > maxW) throw new Error('BipartiteGraph: minValue > maxValue');
                    edges.forEach(e => e[2] = Math.floor(rng() * (maxW - minW + 1)) + minW);
                `;
            }
            
            if (mod.format === 'adj-mat') {
                code += `
                    const matrix = Array(n).fill().map(() => Array(n).fill(${mod.weighted === 'w' ? '0' : 'false'}));
                    edges.forEach(([u, v${mod.weighted === 'w' ? ', w' : ''}]) => {
                        matrix[u][v] = ${mod.weighted === 'w' ? 'w' : 'true'};
                        ${mod.direction === 'undir' ? `matrix[v][u] = ${mod.weighted === 'w' ? 'w' : 'true'};` : ''}
                    });
                    return matrix;
                `;
            } else {
                code += 'return edges;';
            }
            
            return code;
        },
        
        RandomTree: mod => {
            const nodes = sanitizeName(mod.nodesVar);
            const minVal = mod.weighted === 'w' ? sanitizeName(mod.minValueVar) : null;
            const maxVal = mod.weighted === 'w' ? sanitizeName(mod.maxValueVar) : null;
            
            let code = `
                const n = vars['${nodes}'];
                if (n < 1) throw new Error('RandomTree: need at least 1 node');
                if (n === 1) return ${mod.format === 'parent-arr' ? '[-1]' : '[]'};
                
                const prufer = [];
                for (let i = 0; i < n - 2; i++) {
                    prufer.push(Math.floor(rng() * n));
                }
                
                const degree = Array(n).fill(1);
                prufer.forEach(v => degree[v]++);
                
                const edges = [];
                for (const node of prufer) {
                    for (let i = 0; i < n; i++) {
                        if (degree[i] === 1) {
                            edges.push([i, node${mod.weighted === 'w' ? ', 0' : ''}]);
                            degree[i]--;
                            degree[node]--;
                            break;
                        }
                    }
                }
                
                const remaining = [];
                for (let i = 0; i < n; i++) {
                    if (degree[i] === 1) remaining.push(i);
                }
                edges.push([remaining[0], remaining[1]${mod.weighted === 'w' ? ', 0' : ''}]);
            `;
            
            if (mod.weighted === 'w') {
                code += `
                    const minW = vars['${minVal}'];
                    const maxW = vars['${maxVal}'];
                    if (minW > maxW) throw new Error('RandomTree: minValue > maxValue');
                    edges.forEach(e => e[2] = Math.floor(rng() * (maxW - minW + 1)) + minW);
                `;
            }
            
            if (mod.format === 'parent-arr') {
                code += `
                    const parent = Array(n).fill(-1);
                    const adj = Array(n).fill().map(() => []);
                    edges.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
                    
                    const visited = Array(n).fill(false);
                    const queue = [0];
                    visited[0] = true;
                    
                    while (queue.length) {
                        const u = queue.shift();
                        for (const v of adj[u]) {
                            if (!visited[v]) {
                                visited[v] = true;
                                parent[v] = u;
                                queue.push(v);
                            }
                        }
                    }
                    return parent;
                `;
            } else {
                code += 'return edges;';
            }
            
            return code;
        },
        
        DirectedAcyclicGraph: mod => {
            const nodes = sanitizeName(mod.nodesVar);
            const minVal = mod.weighted === 'w' ? sanitizeName(mod.minValueVar) : null;
            const maxVal = mod.weighted === 'w' ? sanitizeName(mod.maxValueVar) : null;
            
            let code = `
                const n = vars['${nodes}'];
                const edges = [];
                
                for (let i = 0; i < n; i++) {
                    for (let j = i + 1; j < n; j++) {
                        if (rng() < 0.2) {
                            edges.push([i, j${mod.weighted === 'w' ? ', 0' : ''}]);
                        }
                    }
                }
            `;
            
            if (mod.weighted === 'w') {
                code += `
                    const minW = vars['${minVal}'];
                    const maxW = vars['${maxVal}'];
                    if (minW > maxW) throw new Error('DirectedAcyclicGraph: minValue > maxValue');
                    edges.forEach(e => e[2] = Math.floor(rng() * (maxW - minW + 1)) + minW);
                `;
            }
            
            if (mod.format === 'parent-arr') {
                code += `
                    const parent = Array(n).fill(-1);
                    const adj = Array(n).fill().map(() => []);
                    edges.forEach(([u, v]) => adj[u].push(v));
                    
                    const visited = Array(n).fill(false);
                    const queue = [0];
                    visited[0] = true;
                    
                    while (queue.length) {
                        const u = queue.shift();
                        for (const v of adj[u]) {
                            if (!visited[v]) {
                                visited[v] = true;
                                parent[v] = u;
                                queue.push(v);
                            }
                        }
                    }
                    return parent;
                `;
            } else {
                code += 'return edges;';
            }
            
            return code;
        },
        
        Repeat: mod => {
            return '';
        }
    };
    
    compileModule = (mod, moduleIndex = 0, totalModules = 1) => {
        if (!mod.visible) return '';
        
        const safeName = sanitizeName(mod.name);
        const isLast = moduleIndex === totalModules - 1;
        const separator = isLast ? '' : (mod.separator === 'newline' ? '\\\\n' : 
                                         mod.separator === 'space' ? ' ' : 
                                         mod.separator === 'none' ? '' : '\\\\n');
        
        if (mod.type === 'Repeat') {
            const times = sanitizeName(mod.timesVar);
            const visibleModules = mod.modules.filter(m => m.visible);
            if (!visibleModules.length) return '';
            
            const moduleCode = visibleModules.map((m, idx) => {
                const modCode = compileModule(m, idx, visibleModules.length);
                if (!modCode) return '';
                
                if (m.type === 'FixedVariable' || m.type === 'RandomVariable') {
                    return modCode;
                } else {
                    return `
                        iterResults.push((()=> {
                            ${compileFunctions[m.type](m)}
                        })());
                    `;
                }
            }).filter(code => code).join('\n');
            
            return `
                {
                    const times = vars['${times}'];
                    const repeatResults = [];
                    for (let repeatIter = 0; repeatIter < times; repeatIter++) {
                        const iterResults = [];
                        ${moduleCode}
                        const formattedResults = [];
                        ${visibleModules.map((m, idx) => {
                            if (m.type !== 'FixedVariable' && m.type !== 'RandomVariable') {
                                return `formattedResults.push(formatOutput(iterResults.shift(), ${JSON.stringify(m)}));`;
                            } else {
                                return `formattedResults.push(String(vars['${sanitizeName(m.name)}']));`;
                            }
                        }).join('\n')}
                        repeatResults.push(formattedResults.join(' ')); // Always use space between items in a repeat iteration
                    }
                    const repeatSeparator = '${mod.separator === 'newline' ? '\\n' : mod.separator === 'space' ? ' ' : mod.separator === 'none' ? '' : '\\n'}';
                    if (repeatSeparator === '') {
                        outputs.push(repeatResults.join('') + '${separator}');
                    } else {
                        outputs.push(repeatResults.join(repeatSeparator) + '${separator}');
                    }
                }
            `;
        }
        
        if (mod.type === 'FixedVariable' || mod.type === 'RandomVariable') {
            return `
                ${compileFunctions[mod.type](mod)}
                outputs.push(String(vars['${safeName}']) + '${separator}');
            `;
        }
        
        return `
            outputs.push(formatOutput((()=> {
                ${compileFunctions[mod.type](mod)}
            })(), ${JSON.stringify(mod)}) + '${separator}');
        `;
    };
    
    const visibleModules = modules.filter(m => m.visible);
    if (!visibleModules.length) return '';
    
    const compiledModules = visibleModules.map((mod, index) => {
        return compileModule(mod, index, visibleModules.length);
    });
    
    const jsSource = `
        const rng = mulberry32(${seed});
        const vars = {};
        const outputs = [];
        
        const formatOutput = ${formatOutput.toString()};
        
        ${compiledModules.join('\n')}
        
        return outputs.join('').replace(/\\\\n/g, '\\n');
    `;
    
    console.log('Generated JS source:', jsSource);
    
    try {
        const buildFunction = new Function('mulberry32', jsSource);
        return buildFunction(mulberry32);
    } catch (error) {
        throw new Error(`Compilation/execution error: ${error.message}`);
    }
};

window.generateTestFromModel = generateTestFromModel;