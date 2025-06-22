
// Global state
let moduleIdCounter = 1;
let moduleCounters = {
    FixedVariable: 0,
    RandomVariable: 0,
    RandomArray: 0,
    Repeat: 0,
    Permutation: 0,
    MazeMatrix: 0,
    SparseMatrix: 0,
    RandomGraph: 0,
    BipartiteGraph: 0,
    RandomTree: 0,
    DirectedAcyclicGraph: 0
};

let draggedElement = null;
let draggedType = null;
let activePanel = null;

// Data model
const dataModel = {
    test: []
};

// Module templates
const moduleTemplates = {
    FixedVariable: {
        type: 'FixedVariable',
        dataType: 'int',
        value: '',
        visible: true,
        separator: 'newline'
    },
    RandomVariable: {
        type: 'RandomVariable',
        dataType: 'int',
        min: '',
        max: '',
        visible: true,
        separator: 'newline'
    },
    RandomArray: {
        type: 'RandomArray',
        dataType: 'int',
        lengthVar: '',
        minVar: '',
        maxVar: '',
        multivalType: 'distinct',
        sortType: 'none',
        visible: true,
        separator: 'space'
    },
    Permutation: {
        type: 'Permutation',
        lengthVar: '',
        orderVar: '',
        visible: true,
        separator: 'space'
    },
    MazeMatrix: {
        type: 'MazeMatrix',
        rowsVar: '',
        colsVar: '',
        visible: true,
        separator: 'newline'
    },
    SparseMatrix: {
        type: 'SparseMatrix',
        rowsVar: '',
        colsVar: '',
        minValueVar: '',
        maxValueVar: '',
        zeroValuesVar: '',
        visible: true,
        separator: 'newline'
    },
    RandomGraph: {
        type: 'RandomGraph',
        nodesVar: '',
        edgesVar: '',
        format: 'list',
        direction: 'undir',
        weighted: 'no-w',
        connectivity: 'conn',
        minValueVar: '',
        maxValueVar: '',
        visible: true,
        separator: 'newline'
    },
    BipartiteGraph: {
        type: 'BipartiteGraph',
        nodesVar: '',
        format: 'list',
        direction: 'undir',
        weighted: 'no-w',
        connectivity: 'conn',
        minValueVar: '',
        maxValueVar: '',
        visible: true,
        separator: 'newline'
    },
    RandomTree: {
        type: 'RandomTree',
        nodesVar: '',
        format: 'list',
        weighted: 'no-w',
        minValueVar: '',
        maxValueVar: '',
        visible: true,
        separator: 'newline'
    },
    DirectedAcyclicGraph: {
        type: 'DirectedAcyclicGraph',
        nodesVar: '',
        format: 'list',
        weighted: 'no-w',
        minValueVar: '',
        maxValueVar: '',
        visible: true,
        separator: 'newline'
    },
    Repeat: {
        type: 'Repeat',
        timesVar: '',
        visible: true,
        separator: 'newline',
        modules: []
    }
};

// Event listeners
document.addEventListener('dragstart', handleDragStart);
document.addEventListener('dragover', handleDragOver);
document.addEventListener('drop', handleDrop);
document.addEventListener('dragend', handleDragEnd);
document.addEventListener('click', handleGlobalClick);

// Double-click support for adding modules
document.addEventListener('dblclick', handleDoubleClick);

function handleDoubleClick(e) {
    const paletteItem = e.target.closest('.palette-item');
    if (paletteItem) {
        // Skip if touch was already handled
        if (touchHandled) {
            console.log('Skipping double-click - already handled by touch');
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const moduleType = paletteItem.dataset.type;
        console.log('Double-click adding:', moduleType);
        
        // Check nesting limit for repeat modules
        if (moduleType === 'Repeat') {
            const rootScope = document.getElementById('root-scope');
            const nestingLevel = getNestingLevel(rootScope);
            if (nestingLevel >= 3) {
                alert('Maximum nesting level (3) reached for repeat modules');
                return;
            }
        }
        
        // Create and add module
        const moduleData = createNewModule(moduleType);
        const moduleElement = createModuleElement(moduleData);
        const rootScope = document.getElementById('root-scope');
        
        // Add to beginning of workspace
        if (rootScope.firstChild) {
            rootScope.insertBefore(moduleElement, rootScope.firstChild);
        } else {
            rootScope.appendChild(moduleElement);
        }
        
        // Update data model
        dataModel.test.unshift(moduleData);
        
        // Visual feedback
        moduleElement.style.animation = 'slideIn 0.3s ease-out';
        paletteItem.style.animation = 'flash 0.3s ease-out';
        
        // Reset animations
        setTimeout(() => {
            moduleElement.style.animation = '';
            paletteItem.style.animation = '';
        }, 300);
        
        // Scroll to show new module
        rootScope.scrollTop = 0;
        
        console.log('Module added successfully:', moduleType);
    }
}

// Mobile double-click support
let lastTouchTime = 0;
let touchHandled = false;
document.addEventListener('touchstart', handleTouchStart);

function handleDragStart(e) {
    if (e.target.classList.contains('palette-item')) {
        draggedType = e.target.dataset.type;
        draggedElement = null;
        e.dataTransfer.effectAllowed = 'copy';
        // Disable palette scrolling during drag
        document.querySelector('.palette-scroll').classList.add('no-scroll');
    } else if (e.target.classList.contains('module-card')) {
        draggedElement = e.target;
        draggedType = null;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }
}

let dragScrollInterval = null;

function handleDragOver(e) {
    e.preventDefault();
    
    const scope = e.target.closest('.scope, .repeat-scope');
    if (!scope) return;

    clearDropIndicators();
    scope.classList.add('drag-over');
    
    // Auto-scroll for mobile drag and drop
    if (scope.id === 'root-scope') {
        const rect = scope.getBoundingClientRect();
        const scrollThreshold = 50;
        const scrollSpeed = 10;
        
        if (dragScrollInterval) {
            clearInterval(dragScrollInterval);
            dragScrollInterval = null;
        }
        
        if (e.clientY < rect.top + scrollThreshold) {
            // Scroll up
            dragScrollInterval = setInterval(() => {
                scope.scrollTop -= scrollSpeed;
            }, 50);
        } else if (e.clientY > rect.bottom - scrollThreshold) {
            // Scroll down
            dragScrollInterval = setInterval(() => {
                scope.scrollTop += scrollSpeed;
            }, 50);
        }
    }
    
    const afterElement = getDragAfterElement(scope, e.clientY);
    let placeholder = scope.querySelector('.drop-placeholder');
    
    if (!placeholder) {
        placeholder = createDropPlaceholder();
    }
    
    if (afterElement == null) {
        scope.appendChild(placeholder);
    } else {
        scope.insertBefore(placeholder, afterElement);
    }
    
    placeholder.classList.add('active');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const scope = e.target.closest('.scope, .repeat-scope');
    if (!scope) {
        cleanup();
        return;
    }

    const placeholder = scope.querySelector('.drop-placeholder.active');
    if (!placeholder) {
        cleanup();
        return;
    }

    if (draggedType) {
        // Creating new module from palette
        // Check nesting limit for Repeat modules
        if (draggedType === 'Repeat') {
            const nestingLevel = getNestingLevel(scope);
            if (nestingLevel >= 3) {
                alert('Maximum nesting level (3) reached for repeat modules');
                cleanup();
                return;
            }
        }
        
        const moduleData = createNewModule(draggedType);
        const moduleElement = createModuleElement(moduleData);
        scope.insertBefore(moduleElement, placeholder);
        
        // Add to data model immediately
        addModuleToDataModel(moduleData, scope);
    } else if (draggedElement) {
        // Moving existing module
        // Check if we're trying to drop into itself or a descendant
        if (scope.contains(draggedElement) && (scope === draggedElement || draggedElement.contains(scope))) {
            cleanup();
            return;
        }
        
        // Check nesting limit when moving Repeat modules
        const moduleData = findModuleById(draggedElement.dataset.moduleId);
        if (moduleData && moduleData.type === 'Repeat') {
            const nestingLevel = getNestingLevel(scope);
            if (nestingLevel >= 3) {
                alert('Maximum nesting level (3) reached for repeat modules');
                cleanup();
                return;
            }
        }
        
        scope.insertBefore(draggedElement, placeholder);
        updateDataModel();
    }

    cleanup();
}

function handleDragEnd(e) {
    cleanup();
}

function handleGlobalClick(e) {
    if (!e.target.closest('.floating-panel') && 
        !e.target.classList.contains('name-btn') && 
        !e.target.closest('.name-btn')) {
        closeParameterPanel();
    }
}

function createNewModule(type) {
    moduleCounters[type]++;
    const displayName = getDisplayName(type, moduleCounters[type]);
    const moduleData = { 
        ...moduleTemplates[type], 
        id: moduleIdCounter++,
        name: displayName
    };
    return moduleData;
}

function getDisplayName(type, number) {
    const typeMap = {
        'FixedVariable': 'fixed variable',
        'RandomVariable': 'random variable', 
        'RandomArray': 'random array',
        'Repeat': 'repeat',
        'Permutation': 'permutation',
        'MazeMatrix': 'maze matrix',
        'SparseMatrix': 'sparse matrix',
        'RandomGraph': 'random graph',
        'BipartiteGraph': 'bipartite graph',
        'RandomTree': 'random tree',
        'DirectedAcyclicGraph': 'directed acyclic graph'
    };
    return `${typeMap[type]} ${number}`;
}

function createModuleElement(moduleData) {
    const element = document.createElement('div');
    element.className = 'module-card';
    element.draggable = true;
    element.dataset.moduleId = moduleData.id;
    element.dataset.moduleName = moduleData.name;
    
    element.innerHTML = generateModuleHTML(moduleData);
    
    // Add event listeners for parameter updates
    element.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    return element;
}

function generateModuleHTML(moduleData) {
    const visibilityClass = moduleData.visible ? 'visible' : 'hidden';
    const separatorDisplay = moduleData.visible ? 'inline-block' : 'none';
    
    let controlsHTML;
    if (moduleData.type === 'Repeat') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn" onclick="toggleParameterPanel('${moduleData.id}')">${moduleData.name}</button>
                <span class="type-btn repeat-times-display">${moduleData.timesVar || 'no variable'}</span>
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    } else if (moduleData.type === 'RandomArray') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn" onclick="toggleParameterPanel('${moduleData.id}')">${moduleData.name}</button>
                <button class="type-btn" onclick="cycleDataType('${moduleData.id}')">${moduleData.dataType}</button>
                <button class="multival-btn" onclick="cycleMultivalType('${moduleData.id}')">${moduleData.multivalType || 'distinct'}</button>
                <button class="sort-btn" onclick="cycleSortType('${moduleData.id}')">${moduleData.sortType || 'none'}</button>
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    } else if (moduleData.type === 'Permutation') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn" onclick="toggleParameterPanel('${moduleData.id}')">${moduleData.name}</button>
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    } else if (moduleData.type === 'MazeMatrix') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn" onclick="toggleParameterPanel('${moduleData.id}')">${moduleData.name}</button>
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    } else if (moduleData.type === 'SparseMatrix') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn" onclick="toggleParameterPanel('${moduleData.id}')">${moduleData.name}</button>
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    } else if (moduleData.type === 'RandomGraph') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn" onclick="toggleParameterPanel('${moduleData.id}')">${moduleData.name}</button>
                <button class="format-btn" onclick="cycleGraphFormat('${moduleData.id}')">${moduleData.format}</button>
                <button class="direction-btn" onclick="cycleGraphDirection('${moduleData.id}')">${moduleData.direction}</button>
                <button class="weight-btn" onclick="cycleGraphWeight('${moduleData.id}')">${moduleData.weighted}</button>
                <button class="connectivity-btn" onclick="cycleGraphConnectivity('${moduleData.id}')">${moduleData.connectivity}</button>
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    } else if (moduleData.type === 'BipartiteGraph') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn" onclick="toggleParameterPanel('${moduleData.id}')">${moduleData.name}</button>
                <button class="format-btn" onclick="cycleBipartiteFormat('${moduleData.id}')">${moduleData.format}</button>
                <button class="direction-btn" onclick="cycleBipartiteDirection('${moduleData.id}')">${moduleData.direction}</button>
                <button class="weight-btn" onclick="cycleBipartiteWeight('${moduleData.id}')">${moduleData.weighted}</button> 
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    } else if (moduleData.type === 'RandomTree') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn" onclick="toggleParameterPanel('${moduleData.id}')">${moduleData.name}</button>
                <button class="format-btn" onclick="cycleTreeFormat('${moduleData.id}')">${moduleData.format}</button>
                <button class="weight-btn" onclick="cycleTreeWeight('${moduleData.id}')">${moduleData.weighted}</button>
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    } else if (moduleData.type === 'DirectedAcyclicGraph') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn" onclick="toggleParameterPanel('${moduleData.id}')">${moduleData.name}</button>
                <button class="format-btn" onclick="cycleDagFormat('${moduleData.id}')">${moduleData.format}</button>
                <button class="weight-btn" onclick="cycleDagWeight('${moduleData.id}')">${moduleData.weighted}</button>
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    } else if (moduleData.type === 'FixedVariable') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn name-btn-static">${moduleData.name}</button>
                <input type="text" class="inline-input" value="${moduleData.value}" 
                       placeholder="value" onchange="updateModuleParameter('${moduleData.id}', 'value', this.value)">
                <button class="type-btn" onclick="cycleDataType('${moduleData.id}')">${moduleData.dataType}</button>
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    } else if (moduleData.type === 'RandomVariable') {
        controlsHTML = `
            <div class="module-controls">
                <button class="name-btn name-btn-static">${moduleData.name}</button>
                <input type="text" class="inline-input inline-input-small" value="${moduleData.min || ''}" 
                       placeholder="min" onchange="updateModuleParameter('${moduleData.id}', 'min', parseInt(this.value) || 0)">
                <input type="text" class="inline-input inline-input-small" value="${moduleData.max || ''}" 
                       placeholder="max" onchange="updateModuleParameter('${moduleData.id}', 'max', parseInt(this.value) || 0)">
                <button class="type-btn" onclick="cycleDataType('${moduleData.id}')">${moduleData.dataType}</button>
                <button class="visibility-btn ${visibilityClass}" onclick="toggleVisibility('${moduleData.id}')"></button>
                <button class="separator-btn" style="display: ${separatorDisplay}" onclick="cycleSeparator('${moduleData.id}')">${moduleData.separator}</button>
                <button class="delete-btn" onclick="deleteModule('${moduleData.id}')">×</button>
            </div>
        `;
    }

    let scopeHTML = '';
    if (moduleData.type === 'Repeat') {
        scopeHTML = `
            <div class="repeat-scope" data-scope="repeat-${moduleData.id}"> 
            </div>
        `;
    }

    return controlsHTML + scopeHTML;
}

function toggleParameterPanel(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData) return;

    const panel = document.getElementById('param-panel');
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    
    if (activePanel === moduleId) {
        closeParameterPanel();
        return;
    }

    const nameBtn = moduleElement.querySelector('.name-btn');
    const rect = nameBtn.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    panel.style.left = `${rect.left + scrollLeft}px`;
    panel.style.top = `${rect.bottom + scrollTop + 4}px`;
    
    // Update panel content
    document.getElementById('panel-title').textContent = `${moduleData.name}`;
    document.getElementById('panel-content').innerHTML = generateParameterHTML(moduleData);
    
    // Show panel
    panel.classList.add('active');
    activePanel = moduleId;
    
    // Update name button state
    document.querySelectorAll('.name-btn').forEach(btn => btn.classList.remove('active'));
    moduleElement.querySelector('.name-btn').classList.add('active');
}

function closeParameterPanel() {
    document.getElementById('param-panel').classList.remove('active');
    activePanel = null;
    document.querySelectorAll('.name-btn').forEach(btn => btn.classList.remove('active'));
}

function generateParameterHTML(moduleData) {
    const integerVars = getAvailableIntegerVariables(moduleData.id);
    
    switch (moduleData.type) {
        case 'FixedVariable':
            return `
                <div class="param-group">
                    <label class="param-label">value:</label>
                    <input type="text" class="param-input" value="${moduleData.value}" 
                            onchange="updateModuleParameter('${moduleData.id}', 'value', this.value)">
                </div>
            `;
        
        case 'RandomVariable':
            return `
                <div class="param-row">
                    <div class="param-group">
                        <label class="param-label">min:</label>
                        <input type="number" class="param-input" value="${moduleData.min}" 
                                onchange="updateModuleParameter('${moduleData.id}', 'min', parseInt(this.value))">
                    </div>
                    <div class="param-group">
                        <label class="param-label">max:</label>
                        <input type="number" class="param-input" value="${moduleData.max}" 
                                onchange="updateModuleParameter('${moduleData.id}', 'max', parseInt(this.value))">
                    </div>
                </div>
            `;
        
        case 'RandomArray':
            const lengthOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.lengthVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            const minOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.minVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            const maxOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.maxVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            return `
                <div class="param-group">
                    <label class="param-label">length:</label>
                    <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'lengthVar', this.value)">
                        <option value="">select variable...</option>
                        ${lengthOptions}
                    </select>
                </div>
                <div class="param-row">
                    <div class="param-group">
                        <label class="param-label">min:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'minVar', this.value)">
                            <option value="">select variable...</option>
                            ${minOptions}
                        </select>
                    </div>
                    <div class="param-group">
                        <label class="param-label">max:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'maxVar', this.value)">
                            <option value="">select variable...</option>
                            ${maxOptions}
                        </select>
                    </div>
                </div>
            `;
        
        case 'Repeat':
            const timesOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.timesVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            return `
                <div class="param-group">
                    <label class="param-label">times:</label>
                    <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'timesVar', this.value)">
                        <option value="">select variable...</option>
                        ${timesOptions}
                    </select>
                </div>
            `;
        
        case 'Permutation':
            const permLengthOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.lengthVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            const orderOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.orderVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            return `
                <div class="param-row">
                    <div class="param-group">
                        <label class="param-label">length:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'lengthVar', this.value)">
                            <option value="">select variable...</option>
                            ${permLengthOptions}
                        </select>
                    </div>
                    <div class="param-group">
                        <label class="param-label">order:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'orderVar', this.value)">
                            <option value="">select variable...</option>
                            ${orderOptions}
                        </select>
                    </div>
                </div>
            `;
        
        case 'MazeMatrix':
            const mazeRowsOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.rowsVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            const mazeColsOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.colsVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            return `
                <div class="param-row">
                    <div class="param-group">
                        <label class="param-label">rows:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'rowsVar', this.value)">
                            <option value="">select variable...</option>
                            ${mazeRowsOptions}
                        </select>
                    </div>
                    <div class="param-group">
                        <label class="param-label">cols:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'colsVar', this.value)">
                            <option value="">select variable...</option>
                            ${mazeColsOptions}
                        </select>
                    </div>
                </div>
            `;
        
        case 'SparseMatrix':
            const sparseRowsOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.rowsVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            const sparseColsOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.colsVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            const sparseMinOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.minValueVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            const sparseMaxOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.maxValueVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            const sparseZeroOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.zeroValuesVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            return `
                <div class="param-row">
                    <div class="param-group">
                        <label class="param-label">rows:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'rowsVar', this.value)">
                            <option value="">select variable...</option>
                            ${sparseRowsOptions}
                        </select>
                    </div>
                    <div class="param-group">
                        <label class="param-label">cols:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'colsVar', this.value)">
                            <option value="">select variable...</option>
                            ${sparseColsOptions}
                        </select>
                    </div>
                </div>
                <div class="param-row">
                    <div class="param-group">
                        <label class="param-label">min value:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'minValueVar', this.value)">
                            <option value="">select variable...</option>
                            ${sparseMinOptions}
                        </select>
                    </div>
                    <div class="param-group">
                        <label class="param-label">max value:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'maxValueVar', this.value)">
                            <option value="">select variable...</option>
                            ${sparseMaxOptions}
                        </select>
                    </div>
                </div>
                <div class="param-group">
                    <label class="param-label">zero values:</label>
                    <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'zeroValuesVar', this.value)">
                        <option value="">select variable...</option>
                        ${sparseZeroOptions}
                    </select>
                </div>
            `;
        
        case 'RandomGraph':
            const graphNodesOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.nodesVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            const graphEdgesOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.edgesVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            let weightedOptions = '';
            if (moduleData.weighted === 'w') {
                const graphMinOptions = integerVars.map(v => 
                    `<option value="${v}" ${v === moduleData.minValueVar ? 'selected' : ''}>${v}</option>`
                ).join('');
                const graphMaxOptions = integerVars.map(v => 
                    `<option value="${v}" ${v === moduleData.maxValueVar ? 'selected' : ''}>${v}</option>`
                ).join('');
                
                weightedOptions = `
                    <div class="param-row">
                        <div class="param-group">
                            <label class="param-label">min value:</label>
                            <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'minValueVar', this.value)">
                                <option value="">select variable...</option>
                                ${graphMinOptions}
                            </select>
                        </div>
                        <div class="param-group">
                            <label class="param-label">max value:</label>
                            <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'maxValueVar', this.value)">
                                <option value="">select variable...</option>
                                ${graphMaxOptions}
                            </select>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="param-row">
                    <div class="param-group">
                        <label class="param-label">nodes:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'nodesVar', this.value)">
                            <option value="">select variable...</option>
                            ${graphNodesOptions}
                        </select>
                    </div>
                    <div class="param-group">
                        <label class="param-label">edges:</label>
                        <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'edgesVar', this.value)">
                            <option value="">select variable...</option>
                            ${graphEdgesOptions}
                        </select>
                    </div>
                </div>
                ${weightedOptions}
            `;
        
        case 'BipartiteGraph':
            const bipartiteNodesOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.nodesVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            let bipartiteWeightedOptions = '';
            if (moduleData.weighted === 'w') {
                const bipartiteMinOptions = integerVars.map(v => 
                    `<option value="${v}" ${v === moduleData.minValueVar ? 'selected' : ''}>${v}</option>`
                ).join('');
                const bipartiteMaxOptions = integerVars.map(v => 
                    `<option value="${v}" ${v === moduleData.maxValueVar ? 'selected' : ''}>${v}</option>`
                ).join('');
                
                bipartiteWeightedOptions = `
                    <div class="param-row">
                        <div class="param-group">
                            <label class="param-label">min value:</label>
                            <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'minValueVar', this.value)">
                                <option value="">select variable...</option>
                                ${bipartiteMinOptions}
                            </select>
                        </div>
                        <div class="param-group">
                            <label class="param-label">max value:</label>
                            <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'maxValueVar', this.value)">
                                <option value="">select variable...</option>
                                ${bipartiteMaxOptions}
                            </select>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="param-group">
                    <label class="param-label">nodes:</label>
                    <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'nodesVar', this.value)">
                        <option value="">select variable...</option>
                        ${bipartiteNodesOptions}
                    </select>
                </div>
                ${bipartiteWeightedOptions}
            `;
        
        case 'RandomTree':
            const treeNodesOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.nodesVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            let treeWeightedOptions = '';
            if (moduleData.weighted === 'w') {
                const treeMinOptions = integerVars.map(v => 
                    `<option value="${v}" ${v === moduleData.minValueVar ? 'selected' : ''}>${v}</option>`
                ).join('');
                const treeMaxOptions = integerVars.map(v => 
                    `<option value="${v}" ${v === moduleData.maxValueVar ? 'selected' : ''}>${v}</option>`
                ).join('');
                
                treeWeightedOptions = `
                    <div class="param-row">
                        <div class="param-group">
                            <label class="param-label">min value:</label>
                            <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'minValueVar', this.value)">
                                <option value="">select variable...</option>
                                ${treeMinOptions}
                            </select>
                        </div>
                        <div class="param-group">
                            <label class="param-label">max value:</label>
                            <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'maxValueVar', this.value)">
                                <option value="">select variable...</option>
                                ${treeMaxOptions}
                            </select>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="param-group">
                    <label class="param-label">nodes:</label>
                    <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'nodesVar', this.value)">
                        <option value="">select variable...</option>
                        ${treeNodesOptions}
                    </select>
                </div>
                ${treeWeightedOptions}
            `;
        
        case 'DirectedAcyclicGraph':
            const dagNodesOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.nodesVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            let dagWeightedOptions = '';
            if (moduleData.weighted === 'w') {
                const dagMinOptions = integerVars.map(v => 
                    `<option value="${v}" ${v === moduleData.minValueVar ? 'selected' : ''}>${v}</option>`
                ).join('');
                const dagMaxOptions = integerVars.map(v => 
                    `<option value="${v}" ${v === moduleData.maxValueVar ? 'selected' : ''}>${v}</option>`
                ).join('');
                
                dagWeightedOptions = `
                    <div class="param-row">
                        <div class="param-group">
                            <label class="param-label">min value:</label>
                            <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'minValueVar', this.value)">
                                <option value="">select variable...</option>
                                ${dagMinOptions}
                            </select>
                        </div>
                        <div class="param-group">
                            <label class="param-label">max value:</label>
                            <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'maxValueVar', this.value)">
                                <option value="">select variable...</option>
                                ${dagMaxOptions}
                            </select>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="param-group">
                    <label class="param-label">nodes:</label>
                    <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'nodesVar', this.value)">
                        <option value="">select variable...</option>
                        ${dagNodesOptions}
                    </select>
                </div>
                ${dagWeightedOptions}
            `;
        
        default:
            return '';
    }
}

function updateModuleParameter(moduleId, param, value) {
    const moduleData = findModuleById(moduleId);
    if (moduleData) {
        moduleData[param] = value;
        
        // Update display for times variable
        if (param === 'timesVar' && moduleData.type === 'Repeat') {
            const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
            const timesDisplay = moduleElement.querySelector('.repeat-times-display');
            timesDisplay.textContent = value || 'no variable';
        }
        
        updateDataModel();
    }
}

function cycleDataType(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type === 'Repeat') return;

    let types;
    if (moduleData.type === 'RandomVariable' || moduleData.type === 'RandomArray') {
        types = ['int', 'double', 'char', 'prime', 'power of 2'];
    } else {
        types = ['int', 'double', 'char'];
    }
    
    const currentIndex = types.indexOf(moduleData.dataType);
    const nextIndex = (currentIndex + 1) % types.length;
    moduleData.dataType = types[nextIndex];
    
    // Update button display
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.type-btn').textContent = moduleData.dataType;
    
    updateDataModel();
}


function toggleVisibility(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData) return;

    moduleData.visible = !moduleData.visible;
    
    // Update button display
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    const visBtn = moduleElement.querySelector('.visibility-btn');
    const sepBtn = moduleElement.querySelector('.separator-btn');
    
    if (moduleData.visible) {
        visBtn.className = 'visibility-btn visible';
        sepBtn.style.display = 'inline-block';
    } else {
        visBtn.className = 'visibility-btn hidden';
        sepBtn.style.display = 'none';
    }
    
    updateDataModel();
}

function cycleSeparator(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData) return;

    const separators = ['newline', 'space', 'none'];
    const currentIndex = separators.indexOf(moduleData.separator);
    const nextIndex = (currentIndex + 1) % separators.length;
    moduleData.separator = separators[nextIndex];
    
    // Update button display
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.separator-btn').textContent = moduleData.separator;
    
    updateDataModel();
}

function cycleMultivalType(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'RandomArray') return;

    const multivalTypes = ['distinct', 'duplicate'];
    const currentIndex = multivalTypes.indexOf(moduleData.multivalType);
    const nextIndex = (currentIndex + 1) % multivalTypes.length;
    moduleData.multivalType = multivalTypes[nextIndex];
    
    // Update button display
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.multival-btn').textContent = moduleData.multivalType;
    
    updateDataModel();
}

function cycleSortType(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'RandomArray') return;

    const sortTypes = ['none', 'asc', 'desc'];
    const currentIndex = sortTypes.indexOf(moduleData.sortType);
    const nextIndex = (currentIndex + 1) % sortTypes.length;
    moduleData.sortType = sortTypes[nextIndex];
    
    // Update button display
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.sort-btn').textContent = moduleData.sortType;
    
    updateDataModel();
}

function cycleGraphFormat(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'RandomGraph') return;

    const formats = ['list', 'adj-mat'];
    const currentIndex = formats.indexOf(moduleData.format);
    const nextIndex = (currentIndex + 1) % formats.length;
    moduleData.format = formats[nextIndex];
    
    // Update button display
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.format-btn').textContent = moduleData.format;
    
    updateDataModel();
}

function cycleGraphDirection(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'RandomGraph') return;

    const directions = ['dir', 'undir'];
    const currentIndex = directions.indexOf(moduleData.direction);
    const nextIndex = (currentIndex + 1) % directions.length;
    moduleData.direction = directions[nextIndex];
    
    // Update button display
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.direction-btn').textContent = moduleData.direction;
    
    updateDataModel();
}

function cycleGraphWeight(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'RandomGraph') return;

    const weights = ['w', 'no-w'];
    const currentIndex = weights.indexOf(moduleData.weighted);
    const nextIndex = (currentIndex + 1) % weights.length;
    moduleData.weighted = weights[nextIndex];
    
    // Update button display
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.weight-btn').textContent = moduleData.weighted;
    
    updateDataModel();
}

function cycleGraphConnectivity(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'RandomGraph') return;

    const connectivities = ['conn', 'disconn'];
    const currentIndex = connectivities.indexOf(moduleData.connectivity);
    const nextIndex = (currentIndex + 1) % connectivities.length;
    moduleData.connectivity = connectivities[nextIndex];
    
    // Update button display
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.connectivity-btn').textContent = moduleData.connectivity;
    
    updateDataModel();
}

function cycleBipartiteFormat(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'BipartiteGraph') return;

    const formats = ['list', 'adj-mat'];
    const currentIndex = formats.indexOf(moduleData.format);
    const nextIndex = (currentIndex + 1) % formats.length;
    moduleData.format = formats[nextIndex];
    
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.format-btn').textContent = moduleData.format;
    
    updateDataModel();
}

function cycleBipartiteDirection(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'BipartiteGraph') return;

    const directions = ['dir', 'undir'];
    const currentIndex = directions.indexOf(moduleData.direction);
    const nextIndex = (currentIndex + 1) % directions.length;
    moduleData.direction = directions[nextIndex];
    
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.direction-btn').textContent = moduleData.direction;
    
    updateDataModel();
}

function cycleBipartiteWeight(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'BipartiteGraph') return;

    const weights = ['w', 'no-w'];
    const currentIndex = weights.indexOf(moduleData.weighted);
    const nextIndex = (currentIndex + 1) % weights.length;
    moduleData.weighted = weights[nextIndex];
    
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.weight-btn').textContent = moduleData.weighted;
    
    updateDataModel();
}

function cycleBipartiteConnectivity(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'BipartiteGraph') return;

    const connectivities = ['conn', 'disconn'];
    const currentIndex = connectivities.indexOf(moduleData.connectivity);
    const nextIndex = (currentIndex + 1) % connectivities.length;
    moduleData.connectivity = connectivities[nextIndex];
    
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.connectivity-btn').textContent = moduleData.connectivity;
    
    updateDataModel();
}

function cycleTreeFormat(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'RandomTree') return;

    const formats = ['list', 'parent-arr'];
    const currentIndex = formats.indexOf(moduleData.format);
    const nextIndex = (currentIndex + 1) % formats.length;
    moduleData.format = formats[nextIndex];
    
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.format-btn').textContent = moduleData.format;
    
    updateDataModel();
}

function cycleTreeWeight(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'RandomTree') return;

    const weights = ['w', 'no-w'];
    const currentIndex = weights.indexOf(moduleData.weighted);
    const nextIndex = (currentIndex + 1) % weights.length;
    moduleData.weighted = weights[nextIndex];
    
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.weight-btn').textContent = moduleData.weighted;
    
    updateDataModel();
}

function cycleDagFormat(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'DirectedAcyclicGraph') return;

    const formats = ['list', 'parent-arr'];
    const currentIndex = formats.indexOf(moduleData.format);
    const nextIndex = (currentIndex + 1) % formats.length;
    moduleData.format = formats[nextIndex];
    
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.format-btn').textContent = moduleData.format;
    
    updateDataModel();
}

function cycleDagWeight(moduleId) {
    const moduleData = findModuleById(moduleId);
    if (!moduleData || moduleData.type !== 'DirectedAcyclicGraph') return;

    const weights = ['w', 'no-w'];
    const currentIndex = weights.indexOf(moduleData.weighted);
    const nextIndex = (currentIndex + 1) % weights.length;
    moduleData.weighted = weights[nextIndex];
    
    const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
    moduleElement.querySelector('.weight-btn').textContent = moduleData.weighted;
    
    updateDataModel();
}

function deleteModule(moduleId) {
    const element = document.querySelector(`[data-module-id="${moduleId}"]`);
    if (element) {
        element.remove();
        updateDataModel();
    }
    
    if (activePanel === moduleId) {
        closeParameterPanel();
    }
}

function getAllIntegerVariables() {
    const variables = [];
    
    function collectVariables(modules, visited = new Set()) {
        modules.forEach(module => {
            // Prevent infinite recursion by tracking visited modules
            if (visited.has(module.id)) {
                return;
            }
            visited.add(module.id);
            
            if ((module.type === 'FixedVariable' || module.type === 'RandomVariable') && 
                module.dataType === 'int') {
                variables.push(module.name);
            }
            if (module.type === 'Repeat' && module.modules && Array.isArray(module.modules) && module.modules.length > 0) {
                collectVariables(module.modules, visited);
            }
        });
    }
    
    collectVariables(dataModel.test);
    return variables;
}

function getAvailableIntegerVariables(moduleId) {
    const availableVars = [];
    let found = false;
    let depth = 0;
    const MAX_DEPTH = 10; // Prevent infinite recursion
    
    // we collect vars until we find target
    function traverse(modules, scopeVars = []) {
        if (found || !modules || depth > MAX_DEPTH) return;
        
        depth++;
        const currentScopeVars = [];
        
        for (let i = 0; i < modules.length; i++) {
            if (found) break;
            
            const module = modules[i];
            if (!module) continue;
            
            // target?
            if (module.id == moduleId) {
                // Add all vars from parent scopes
                scopeVars.forEach(v => availableVars.push(v));
                // Add vars from current scope up to this point
                currentScopeVars.forEach(v => availableVars.push(v));
                found = true;
                break;
            }
            
            // track?
            if ((module.type === 'FixedVariable' || module.type === 'RandomVariable') && 
                module.dataType === 'int') {
                currentScopeVars.push(module.name);
            }
            
            // traverse if needed
            if (module.type === 'Repeat' && module.modules && Array.isArray(module.modules) && module.modules.length > 0) {
                const combinedVars = scopeVars.concat(currentScopeVars);
                traverse(module.modules, combinedVars);
            }
        }
        
        depth--;
    }
    
    traverse(dataModel.test || []);
    return availableVars;
}

function findModuleById(moduleId) {
    function searchModules(modules, visited = new Set()) {
        for (let module of modules) {
            if (visited.has(module.id)) {
                continue;
            }
            visited.add(module.id);
            
            if (module.id == moduleId) return module;
            if (module.type === 'Repeat' && module.modules && Array.isArray(module.modules) && module.modules.length > 0) {
                const found = searchModules(module.modules, visited);
                if (found) return found;
            }
        }
        return null;
    }
    return searchModules(dataModel.test);
}

function getNestingLevel(scope) {
    let level = 0;
    let current = scope;
    
    while (current && current.id !== 'root-scope') {
        if (current.classList.contains('repeat-scope')) {
            level++;
        }
        current = current.parentElement;
        
        // Find the next scope ancestor
        while (current && !current.classList.contains('scope') && !current.classList.contains('repeat-scope')) {
            current = current.parentElement;
        }
    }
    
    return level;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(':scope > .module-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function createDropPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'drop-placeholder';
    return placeholder;
}

function clearDropIndicators() {
    document.querySelectorAll('.drop-placeholder').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.scope, .repeat-scope').forEach(s => s.classList.remove('drag-over'));
}

function addModuleToDataModel(moduleData, scope) {
    if (scope.id === 'root-scope') {
        dataModel.test.push(moduleData);
    } else {
        // Find the parent repeat module
        const repeatId = scope.dataset.scope.replace('repeat-', '');
        const parentModule = findModuleById(repeatId);
        if (parentModule && parentModule.type === 'Repeat') {
            if (!parentModule.modules) {
                parentModule.modules = [];
            }
            parentModule.modules.push(moduleData);
        }
    }
}

function cleanup() {
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    clearDropIndicators();
    
    // Remove any orphaned placeholders
    document.querySelectorAll('.drop-placeholder').forEach(p => {
        if (!p.classList.contains('active')) {
            p.remove();
        }
    });
    
    // Re-enable palette scrolling
    document.querySelector('.palette-scroll').classList.remove('no-scroll');
    
    if (dragScrollInterval) {
        clearInterval(dragScrollInterval);
        dragScrollInterval = null;
    }
    
    draggedElement = null;
    draggedType = null;
}

function updateDataModel() {
    dataModel.test = extractModulesFromScope(document.getElementById('root-scope'));
}

function extractModulesFromScope(scopeElement) {
    const modules = [];
    const moduleElements = scopeElement.querySelectorAll(':scope > .module-card');
    
    moduleElements.forEach(element => {
        const moduleData = extractModuleData(element);
        
        if (moduleData.type === 'Repeat') {
            const repeatScope = element.querySelector('.repeat-scope');
            if (repeatScope) {
                moduleData.modules = extractModulesFromScope(repeatScope);
            }
        }
        
        modules.push(moduleData);
    });
    
    return modules;
}

function extractModuleData(element) {
    const moduleId = element.dataset.moduleId;
    const moduleName = element.dataset.moduleName;
    
    // Find the module in our data model
    const moduleData = findModuleById(moduleId);
    
    if (moduleData) {
        // Create a clean copy without circular references
        const cleanData = {
            id: moduleData.id,
            name: moduleData.name,
            type: moduleData.type,
            visible: moduleData.visible,
            separator: moduleData.separator
        };
        
        // Add dataType for modules that have it
        if (moduleData.dataType !== undefined) {
            cleanData.dataType = moduleData.dataType;
        }
        
        // Add type-specific properties
        switch (moduleData.type) {
            case 'FixedVariable':
                cleanData.value = moduleData.value;
                break;
            case 'RandomVariable':
                cleanData.min = moduleData.min;
                cleanData.max = moduleData.max;
                break;
            case 'RandomArray':
                cleanData.lengthVar = moduleData.lengthVar;
                cleanData.minVar = moduleData.minVar;
                cleanData.maxVar = moduleData.maxVar;
                cleanData.multivalType = moduleData.multivalType;
                cleanData.sortType = moduleData.sortType;
                break;
            case 'Permutation':
                cleanData.lengthVar = moduleData.lengthVar;
                cleanData.orderVar = moduleData.orderVar;
                break;
            case 'MazeMatrix':
                cleanData.rowsVar = moduleData.rowsVar;
                cleanData.colsVar = moduleData.colsVar;
                break;
            case 'SparseMatrix':
                cleanData.rowsVar = moduleData.rowsVar;
                cleanData.colsVar = moduleData.colsVar;
                cleanData.minValueVar = moduleData.minValueVar;
                cleanData.maxValueVar = moduleData.maxValueVar;
                cleanData.zeroValuesVar = moduleData.zeroValuesVar;
                break;
            case 'RandomGraph':
                cleanData.nodesVar = moduleData.nodesVar;
                cleanData.edgesVar = moduleData.edgesVar;
                cleanData.format = moduleData.format;
                cleanData.direction = moduleData.direction;
                cleanData.weighted = moduleData.weighted;
                cleanData.connectivity = moduleData.connectivity;
                cleanData.minValueVar = moduleData.minValueVar;
                cleanData.maxValueVar = moduleData.maxValueVar;
                break;
            case 'BipartiteGraph':
                cleanData.nodesVar = moduleData.nodesVar;
                cleanData.format = moduleData.format;
                cleanData.direction = moduleData.direction;
                cleanData.weighted = moduleData.weighted;
                cleanData.connectivity = moduleData.connectivity;
                cleanData.minValueVar = moduleData.minValueVar;
                cleanData.maxValueVar = moduleData.maxValueVar;
                break;
            case 'RandomTree':
                cleanData.nodesVar = moduleData.nodesVar;
                cleanData.format = moduleData.format;
                cleanData.weighted = moduleData.weighted;
                cleanData.minValueVar = moduleData.minValueVar;
                cleanData.maxValueVar = moduleData.maxValueVar;
                break;
            case 'DirectedAcyclicGraph':
                cleanData.nodesVar = moduleData.nodesVar;
                cleanData.format = moduleData.format;
                cleanData.weighted = moduleData.weighted;
                cleanData.minValueVar = moduleData.minValueVar;
                cleanData.maxValueVar = moduleData.maxValueVar;
                break;
            case 'Repeat':
                cleanData.timesVar = moduleData.timesVar;
                cleanData.modules = moduleData.modules || [];
                break;
        }
        
        return cleanData;
    }
    
    // Fallback... you never know :P
    return { 
        id: moduleId, 
        name: moduleName, 
        type: 'FixedVariable',
        dataType: 'int',
        visible: true,
        separator: 'newline'
    };
}

function generateJSON() {
    updateDataModel();
    const output = document.getElementById('json-output');
    output.textContent = JSON.stringify(dataModel, null, 2);
    output.style.display = 'block';
}

function storeJSON() {
    updateDataModel(); 
}

function generateTest() {
    updateDataModel();
    
    if (!window.generateTestFromModel) {
        const script = document.createElement('script');
        script.src = 'test-generator.js?t=' + Date.now(); // Add timestamp to prevent caching
        script.onload = () => {
            console.log('test-generator.js loaded successfully');
            executeTestGeneration();
        };
        script.onerror = () => {
            alert('Failed to load test-generator.js');
        };
        document.head.appendChild(script);
    } else {
        executeTestGeneration();
    }
}

function executeTestGeneration() {
    try {
        if (!window.generateTestFromModel) {
            throw new Error('Test generator not loaded');
        }
        const seed = Date.now();
        const result = window.generateTestFromModel(dataModel, seed);
        const output = document.getElementById('json-output');
        output.textContent = result;
        output.style.display = 'block';
        
        // Visualize graphs if any were captured
        if (window.lastGeneratedGraphs && window.lastGeneratedGraphs.length > 0) {
            visualizeGraphs(window.lastGeneratedGraphs);
        }
    } catch (error) {
        alert(`Test generation failed:\n${error.message}`);
        console.error('Test generation error:', error);
        console.log('window.generateTestFromModel:', window.generateTestFromModel);
    }
}

function downloadTest() {
    const output = document.getElementById('json-output');
    const content = output.textContent || '';
    
    if (!content) {
        alert('No test output to download. Please generate a test first.');
        return;
    }
    
    const dataBlob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function handleTouchStart(e) {
    if (e.target.closest('.palette-item')) {
        const currentTime = new Date().getTime();
        const tapInterval = currentTime - lastTouchTime;
        
        if (tapInterval < 300 && tapInterval > 0) {
            // Double tap detected
            e.preventDefault();
            
            // Mark that touch was handled to prevent double-click from also firing
            touchHandled = true;
            setTimeout(() => { touchHandled = false; }, 500);
            
            const paletteItem = e.target.closest('.palette-item');
            const moduleType = paletteItem.dataset.type;
            
            // Check nesting limit for repeat modules
            if (moduleType === 'Repeat') {
                const rootScope = document.getElementById('root-scope');
                const nestingLevel = getNestingLevel(rootScope);
                if (nestingLevel >= 3) {
                    alert('Maximum nesting level (3) reached for repeat modules');
                    return;
                }
            }
            
            // Create module and add to beginning of root scope
            const moduleData = createNewModule(moduleType);
            const moduleElement = createModuleElement(moduleData);
            const rootScope = document.getElementById('root-scope');
            
            // Add as first child
            if (rootScope.firstChild) {
                rootScope.insertBefore(moduleElement, rootScope.firstChild);
            } else {
                rootScope.appendChild(moduleElement);
            }
            
            // Add to data model at the beginning
            dataModel.test.unshift(moduleData);
            
            // Scroll to top to show the new module
            rootScope.scrollTop = 0;
        }
        
        lastTouchTime = currentTime;
    }
}
function generateCode() {
    return null;
}

function uploadTest() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const data = JSON.parse(content);
                    
                    // Load the uploaded data into the data model
                    if (data.test && Array.isArray(data.test)) {
                        dataModel.test = data.test;
                        
                        // Clear current workspace
                        const rootScope = document.getElementById('root-scope');
                        const moduleCards = rootScope.querySelectorAll('.module-card');
                        moduleCards.forEach(card => card.remove());
                        
                        // Rebuild workspace from loaded data
                        rebuildWorkspaceFromData();
                        
                        alert('Test data uploaded successfully!');
                    } else {
                        throw new Error('Invalid file format');
                    }
                } catch (error) {
                    alert(`Upload failed: ${error.message}`);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function rebuildWorkspaceFromData() {
    const rootScope = document.getElementById('root-scope');
    
    function buildModulesInScope(modules, scope) {
        modules.forEach(moduleData => {
            const moduleElement = createModuleElement(moduleData);
            scope.appendChild(moduleElement);
            
            if (moduleData.type === 'Repeat' && moduleData.modules) {
                const repeatScope = moduleElement.querySelector('.repeat-scope');
                if (repeatScope) {
                    buildModulesInScope(moduleData.modules, repeatScope);
                }
            }
        });
    }
    
    buildModulesInScope(dataModel.test, rootScope);
    
    // Update module counters
    const typeCount = {};
    function countModules(modules) {
        modules.forEach(mod => {
            typeCount[mod.type] = (typeCount[mod.type] || 0) + 1;
            if (mod.type === 'Repeat' && mod.modules) {
                countModules(mod.modules);
            }
        });
    }
    countModules(dataModel.test);
    
    // Update global counters
    Object.keys(moduleCounters).forEach(type => {
        moduleCounters[type] = typeCount[type] || 0;
    });
}

function visualizeGraphs(graphs) {
    // Filter out non-graph data
    const validGraphs = graphs.filter(g => g && g.type && g.nodes <= 10);
    
    if (validGraphs.length === 0) {
        return;
    }
    
    // Open new window for visualization
    const vizWindow = window.open('', 'Graph Visualization', 'width=1200,height=800');
    
    // Create HTML content
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Graph Visualization</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background: #f5f5f5;
                }
                .container {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #333;
                    margin-bottom: 20px;
                }
                .graph-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .graph {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 10px;
                    background: #fafafa;
                }
                .graph-title {
                    font-weight: bold;
                    color: #555;
                    margin-bottom: 10px;
                    text-align: center;
                }
                .download-btn {
                    background: linear-gradient(45deg, #4299e1, #3182ce);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-top: 20px;
                }
                .download-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>graphs</h1>
                <div id="graphs" class="graph-container"></div>
                <button class="download-btn" onclick="downloadSVG()">Download SVG</button>
            </div>
            <script>${generateVisualizationScript(validGraphs)}</script>
        </body>
        </html>
    `;
    
    vizWindow.document.write(html);
    vizWindow.document.close();
}

function generateVisualizationScript(graphs) {
    return `
        const graphs = ${JSON.stringify(graphs)};
        const svgGraphs = [];
        
        function createGraphSVG(graph, index) {
            const width = 300;
            const height = 300;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = 100;
            
            // Create SVG
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', width);
            svg.setAttribute('height', height);
            svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
            
            // Calculate node positions (circular layout)
            const nodePositions = [];
            for (let i = 0; i < graph.nodes; i++) {
                const angle = (2 * Math.PI * i) / graph.nodes;
                nodePositions.push({
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle)
                });
            }
            
            // Draw edges
            const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            graph.edges.forEach(edge => {
                const [from, to, weight] = edge;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', nodePositions[from].x);
                line.setAttribute('y1', nodePositions[from].y);
                line.setAttribute('x2', nodePositions[to].x);
                line.setAttribute('y2', nodePositions[to].y);
                line.setAttribute('stroke', graph.directed ? '#ff6b6b' : '#4ecdc4');
                line.setAttribute('stroke-width', '2');
                
                if (graph.directed) {
                    line.setAttribute('marker-end', 'url(#arrowhead-' + index + ')');
                }
                
                edgeGroup.appendChild(line);
                
                // Add weight label if weighted
                if (graph.weighted && weight !== undefined) {
                    const midX = (nodePositions[from].x + nodePositions[to].x) / 2;
                    const midY = (nodePositions[from].y + nodePositions[to].y) / 2;
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', midX);
                    text.setAttribute('y', midY);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('fill', '#666');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('font-weight', 'bold');
                    text.setAttribute('dy', '-5');
                    text.textContent = weight;
                    
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', midX - 10);
                    rect.setAttribute('y', midY - 15);
                    rect.setAttribute('width', '20');
                    rect.setAttribute('height', '15');
                    rect.setAttribute('fill', 'white');
                    rect.setAttribute('stroke', 'none');
                    
                    edgeGroup.appendChild(rect);
                    edgeGroup.appendChild(text);
                }
            });
            
            svg.appendChild(edgeGroup);
            
            // Add arrow marker for directed graphs
            if (graph.directed) {
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                marker.setAttribute('id', 'arrowhead-' + index);
                marker.setAttribute('markerWidth', '10');
                marker.setAttribute('markerHeight', '10');
                marker.setAttribute('refX', '25');
                marker.setAttribute('refY', '3');
                marker.setAttribute('orient', 'auto');
                
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', '0 0, 6 3, 0 6');
                polygon.setAttribute('fill', '#ff6b6b');
                
                marker.appendChild(polygon);
                defs.appendChild(marker);
                svg.appendChild(defs);
            }
            
            // Draw nodes
            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodePositions.forEach((pos, i) => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', pos.x);
                circle.setAttribute('cy', pos.y);
                circle.setAttribute('r', '20');
                circle.setAttribute('fill', '#667eea');
                circle.setAttribute('stroke', '#5a67d8');
                circle.setAttribute('stroke-width', '2');
                
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', pos.x);
                text.setAttribute('y', pos.y);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dy', '5');
                text.setAttribute('fill', 'white');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('font-size', '14');
                text.textContent = i;
                
                nodeGroup.appendChild(circle);
                nodeGroup.appendChild(text);
            });
            
            svg.appendChild(nodeGroup);
            svgGraphs.push(svg);
            return svg;
        }
        
        // Create and display all graphs
        const container = document.getElementById('graphs');
        graphs.forEach((graph, index) => {
            const graphDiv = document.createElement('div');
            graphDiv.className = 'graph';
            
            const title = document.createElement('div');
            title.className = 'graph-title';
            title.textContent = graph.name + ' (' + graph.type + ')';
            graphDiv.appendChild(title);
            
            const svg = createGraphSVG(graph, index);
            graphDiv.appendChild(svg);
            
            container.appendChild(graphDiv);
        });
        
        function downloadSVG() {
            // Create combined SVG
            const combinedWidth = Math.min(graphs.length * 320, 1200);
            const rows = Math.ceil((graphs.length * 320) / 1200);
            const combinedHeight = rows * 350;
            
            let svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="' + combinedWidth + '" height="' + combinedHeight + '">';
            
            svgGraphs.forEach((svg, index) => {
                const x = (index * 320) % 1200;
                const y = Math.floor((index * 320) / 1200) * 350;
                svgContent += '<g transform="translate(' + x + ',' + y + ')">';
                svgContent += svg.innerHTML;
                svgContent += '</g>';
            });
            
            svgContent += '</svg>';
            
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'graphs.svg';
            a.click();
            URL.revokeObjectURL(url);
        }
    `;
}

function clearAll() { 
    dataModel.test = [];
    moduleCounters = { FixedVariable: 0, RandomVariable: 0, RandomArray: 0, Repeat: 0, Permutation: 0, MazeMatrix: 0, SparseMatrix: 0, RandomGraph: 0, BipartiteGraph: 0, RandomTree: 0, DirectedAcyclicGraph: 0 };
    moduleIdCounter = 1;
    closeParameterPanel();
    
    // Clear the visual elements from root-scope
    const rootScope = document.getElementById('root-scope');
    const moduleCards = rootScope.querySelectorAll('.module-card');
    moduleCards.forEach(card => card.remove());
    
    // Hide JSON output
    document.getElementById('json-output').style.display = 'none';
}
