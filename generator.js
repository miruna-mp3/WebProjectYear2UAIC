
// Global state
let moduleIdCounter = 1;
let moduleCounters = {
    FixedVariable: 0,
    RandomVariable: 0,
    RandomArray: 0,
    Repeat: 0
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
        min: 1,
        max: 100,
        multivalType: 'distinct',
        sortType: 'none',
        visible: true,
        separator: 'space'
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

function handleDragStart(e) {
    if (e.target.classList.contains('palette-item')) {
        draggedType = e.target.dataset.type;
        draggedElement = null;
        e.dataTransfer.effectAllowed = 'copy';
    } else if (e.target.classList.contains('module-card')) {
        draggedElement = e.target;
        draggedType = null;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }
}

function handleDragOver(e) {
    e.preventDefault();
    
    const scope = e.target.closest('.scope, .repeat-scope');
    if (!scope) return;

    clearDropIndicators();
    scope.classList.add('drag-over');
    
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
        const moduleData = createNewModule(draggedType);
        const moduleElement = createModuleElement(moduleData);
        scope.insertBefore(moduleElement, placeholder);
        
        // Add to data model immediately
        addModuleToDataModel(moduleData, scope);
    } else if (draggedElement) {
        // Moving existing module
        scope.insertBefore(draggedElement, placeholder);
        updateDataModel();
    }

    cleanup();
}

function handleDragEnd(e) {
    cleanup();
}

function handleGlobalClick(e) {
    // Close floating panel if clicking outside
    if (!e.target.closest('.floating-panel') && !e.target.classList.contains('name-btn')) {
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
        'Repeat': 'repeat'
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
                <button class="type-btn" onclick="showTimesVariable('${moduleData.id}')">${moduleData.timesVar || 'no variable'}</button>
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
                <div class="scope-label">repeat scope</div>
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

    // Position panel below the module controls (not the entire module)
    const controlsElement = moduleElement.querySelector('.module-controls');
    const rect = controlsElement.getBoundingClientRect();
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.bottom + 5}px`;
    
    // Update panel content
    document.getElementById('panel-title').textContent = `${moduleData.name} parameters`;
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
    const integerVars = getAllIntegerVariables();
    
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
            
            return `
                <div class="param-group">
                    <label class="param-label">length variable:</label>
                    <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'lengthVar', this.value)">
                        <option value="">select variable...</option>
                        ${lengthOptions}
                    </select>
                </div>
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
        
        case 'Repeat':
            const timesOptions = integerVars.map(v => 
                `<option value="${v}" ${v === moduleData.timesVar ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            return `
                <div class="param-group">
                    <label class="param-label">times variable:</label>
                    <select class="select-input" onchange="updateModuleParameter('${moduleData.id}', 'timesVar', this.value)">
                        <option value="">select variable...</option>
                        ${timesOptions}
                    </select>
                </div>
            `;
        
        default:
            return '';
    }
}

function updateModuleParameter(moduleId, param, value) {
    const moduleData = findModuleById(moduleId);
    if (moduleData) {
        moduleData[param] = value;
        
        // Update button display for times variable
        if (param === 'timesVar' && moduleData.type === 'Repeat') {
            const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
            const typeBtn = moduleElement.querySelector('.type-btn');
            typeBtn.textContent = value || 'no variable';
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

function showTimesVariable(moduleId) {
    // This function is called when clicking the times variable button
    // It doesn't cycle, just opens the parameter panel to show/edit the times variable
    toggleParameterPanel(moduleId);
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
    
    function collectVariables(modules) {
        modules.forEach(module => {
            if ((module.type === 'FixedVariable' || module.type === 'RandomVariable') && 
                module.dataType === 'int') {
                variables.push(module.name);
            }
            if (module.type === 'Repeat' && module.modules) {
                collectVariables(module.modules);
            }
        });
    }
    
    collectVariables(dataModel.test);
    return variables;
}

function findModuleById(moduleId) {
    function searchModules(modules) {
        for (let module of modules) {
            if (module.id == moduleId) return module;
            if (module.type === 'Repeat' && module.modules) {
                const found = searchModules(module.modules);
                if (found) return found;
            }
        }
        return null;
    }
    return searchModules(dataModel.test);
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
            dataType: moduleData.dataType,
            visible: moduleData.visible,
            separator: moduleData.separator
        };
        
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
                cleanData.min = moduleData.min;
                cleanData.max = moduleData.max;
                cleanData.multivalType = moduleData.multivalType;
                cleanData.sortType = moduleData.sortType;
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

function clearAll() {
    document.getElementById('root-scope').innerHTML = '<div class="scope-label">test scope</div>';
    dataModel.test = [];
    moduleCounters = { FixedVariable: 0, RandomVariable: 0, RandomArray: 0, Repeat: 0 };
    moduleIdCounter = 1;
    closeParameterPanel();
    document.getElementById('json-output').style.display = 'none';
}
