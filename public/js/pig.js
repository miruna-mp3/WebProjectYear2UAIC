let moduleIdCounter = 0;
let draggedElement = null;
let draggedType = null;
let dropTarget = null;

// Data model
const dataModel = {
    scope: 'root',
    modules: []
};

// Module templates
const moduleTemplates = {
    FixedVar: {
        type: 'FixedVar',
        value: '',
        visible: true,
        separator: 'newline'
    },
    RandomVar: {
        type: 'RandomVar',
        min: 1,
        max: 100,
        visible: true,
        separator: 'newline'
    },
    Array: {
        type: 'Array',
        length: 5,
        min: 1,
        max: 100,
        visible: true,
        separator: 'space'
    },
    Matrix: {
        type: 'Matrix',
        rows: 3,
        cols: 3,
        min: 1,
        max: 100,
        visible: true,
        separator: 'newline'
    },
    Repeat: {
        type: 'Repeat',
        times: 1,
        visible: true,
        separator: 'newline',
        modules: []
    }
};

// Drag and drop handlers
document.addEventListener('dragstart', handleDragStart);
document.addEventListener('dragover', handleDragOver);
document.addEventListener('drop', handleDrop);
document.addEventListener('dragend', handleDragEnd);

function handleDragStart(e) {
    if (e.target.classList.contains('palette-item')) {
        draggedType = e.target.dataset.type;
        draggedElement = null;
    } else if (e.target.classList.contains('module-card')) {
        draggedElement = e.target;
        draggedType = null;
        e.target.classList.add('dragging');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    
    const scope = e.target.closest('.scope, .repeat-scope');
    if (!scope) return;

    // Clear previous drop indicators
    document.querySelectorAll('.drop-placeholder').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.scope, .repeat-scope').forEach(s => s.classList.remove('drag-over'));

    scope.classList.add('drag-over');
    
    // Find insertion point
    const afterElement = getDragAfterElement(scope, e.clientY);
    let placeholder = scope.querySelector('.drop-placeholder');
    
    if (!placeholder) {
        placeholder = createDropPlaceholder(scope);
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
    
    const scope = e.target.closest('.scope, .repeat-scope');
    if (!scope) return;

    const placeholder = scope.querySelector('.drop-placeholder.active');
    if (!placeholder) return;

    if (draggedType) {
        // Creating new module from palette
        const moduleData = { ...moduleTemplates[draggedType], id: ++moduleIdCounter };
        const moduleElement = createModuleElement(moduleData);
        scope.insertBefore(moduleElement, placeholder);
        updateDataModel();
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

function cleanup() {
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    document.querySelectorAll('.drop-placeholder.active').forEach(p => {
        p.classList.remove('active');
    });
    draggedElement = null;
    draggedType = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.module-card:not(.dragging)')];
    
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

function createDropPlaceholder(scope) {
    const placeholder = document.createElement('div');
    placeholder.className = 'drop-placeholder';
    return placeholder;
}

function createModuleElement(moduleData) {
    const element = document.createElement('div');
    element.className = 'module-card';
    element.draggable = true;
    element.dataset.moduleId = moduleData.id;
    
    element.innerHTML = generateModuleHTML(moduleData);
    
    // Add event listeners
    element.addEventListener('input', handleModuleUpdate);
    element.addEventListener('change', handleModuleUpdate);
    
    return element;
}

function generateModuleHTML(moduleData) {
    let paramsHTML = '';
    
    switch (moduleData.type) {
        case 'FixedVar':
            paramsHTML = `
                <div class="param-group">
                    <span class="param-label">Value:</span>
                    <input type="text" class="param-input wide" name="value" value="${moduleData.value}">
                </div>
            `;
            break;
        case 'RandomVar':
            paramsHTML = `
                <div class="param-group">
                    <span class="param-label">Min:</span>
                    <input type="number" class="param-input" name="min" value="${moduleData.min}">
                </div>
                <div class="param-group">
                    <span class="param-label">Max:</span>
                    <input type="number" class="param-input" name="max" value="${moduleData.max}">
                </div>
            `;
            break;
        case 'Array':
            paramsHTML = `
                <div class="param-group">
                    <span class="param-label">Length:</span>
                    <input type="number" class="param-input" name="length" value="${moduleData.length}">
                </div>
                <div class="param-group">
                    <span class="param-label">Min:</span>
                    <input type="number" class="param-input" name="min" value="${moduleData.min}">
                </div>
                <div class="param-group">
                    <span class="param-label">Max:</span>
                    <input type="number" class="param-input" name="max" value="${moduleData.max}">
                </div>
            `;
            break;
        case 'Matrix':
            paramsHTML = `
                <div class="param-group">
                    <span class="param-label">Rows:</span>
                    <input type="number" class="param-input" name="rows" value="${moduleData.rows}">
                </div>
                <div class="param-group">
                    <span class="param-label">Cols:</span>
                    <input type="number" class="param-input" name="cols" value="${moduleData.cols}">
                </div>
                <div class="param-group">
                    <span class="param-label">Min:</span>
                    <input type="number" class="param-input" name="min" value="${moduleData.min}">
                </div>
                <div class="param-group">
                    <span class="param-label">Max:</span>
                    <input type="number" class="param-input" name="max" value="${moduleData.max}">
                </div>
            `;
            break;
        case 'Repeat':
            paramsHTML = `
                <div class="param-group">
                    <span class="param-label">Times:</span>
                    <input type="number" class="param-input" name="times" value="${moduleData.times}">
                </div>
            `;
            break;
    }

    const commonControls = `
        <div class="param-group">
            <div class="toggle">
                <input type="checkbox" name="visible" ${moduleData.visible ? 'checked' : ''}>
                <span class="param-label">Visible</span>
            </div>
        </div>
        <div class="param-group">
            <span class="param-label">Sep:</span>
            <select class="separator-select" name="separator">
                <option value="newline" ${moduleData.separator === 'newline' ? 'selected' : ''}>Newline</option>
                <option value="space" ${moduleData.separator === 'space' ? 'selected' : ''}>Space</option>
                <option value="none" ${moduleData.separator === 'none' ? 'selected' : ''}>None</option>
            </select>
        </div>
    `;

    let repeatScope = '';
    if (moduleData.type === 'Repeat') {
        repeatScope = `
            <div class="repeat-scope" data-scope="repeat-${moduleData.id}">
            </div>
        `;
            
        setTimeout(() => {
            if (moduleData.modules && moduleData.modules.length > 0) {
                const repeatScopeEl = document.querySelector(`[data-scope="repeat-${moduleData.id}"]`);
                if (repeatScopeEl) {
                    moduleData.modules.forEach(subModule => {
                        const subElement = createModuleElement(subModule);
                        repeatScopeEl.appendChild(subElement);
                    });
                }
            }
        }, 0);
    }

    return `
        <div class="module-header">
            <span class="module-type">${moduleData.type}</span>
            <div class="module-actions">
                <button class="delete-btn" onclick="deleteModule(${moduleData.id})">×</button>
            </div>
        </div>
        <div class="module-params">
            ${paramsHTML}
            ${commonControls}
        </div>
        ${repeatScope}
    `;
}

function handleModuleUpdate(e) {
    updateDataModel();
}

function deleteModule(moduleId) {
    const element = document.querySelector(`[data-module-id="${moduleId}"]`);
    if (element) {
        element.remove();
        updateDataModel();
    }
}

function updateDataModel() {
    dataModel.modules = extractModulesFromScope(document.getElementById('root-scope'));
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
    const moduleId = parseInt(element.dataset.moduleId);
    const type = element.querySelector('.module-type').textContent;
    
    const data = { id: moduleId, type: type };
    
    // Extract parameters
    element.querySelectorAll('input, select').forEach(input => {
        const name = input.name;
        if (!name) return;
        
        if (input.type === 'checkbox') {
            data[name] = input.checked;
        } else if (input.type === 'number') {
            data[name] = parseInt(input.value) || 0;
        } else {
            data[name] = input.value;
        }
    });
    
    return data;
}

function generateJSON() {
    updateDataModel();
    const output = document.getElementById('json-output');
    output.textContent = JSON.stringify(dataModel, null, 2);
    output.style.display = 'block';
}

// function saveQuery(){
//     const messageDiv = document.getElementById('response');
//     updateDataModel();
//     const formData = new FormData();
//     formData.append('jsonData', JSON.stringify(dataModel, null, 2));
//     fetch('../database/queriesAndResults.php', {
//         method: 'POST',
//         body: formData
//     })
//     .then(r => r.json())
//     .then(data => {
//         messageDiv.textContent = data.message;
//         messageDiv.style.color = data.success ? "green" : "red";
//     })
//     .catch(error => {
//         messageDiv.textContent = "Error: " + error;
//         messageDiv.style.color = "red";
//     });

// }

function clearScope(){
    document.getElementById('root-scope').innerHTML = '<div class=\"scope-label\">Test Scope</div><div class=\"drop-placeholder\"></div>';
    document.getElementById('json-output').innerHTML = '';
    document.getElementById('json-output').style.display = 'none';
}

// document.getElementById('root-scope').innerHTML += '<div class="drop-placeholder"></div>'; //nu stiu ce e asta

// Unchanged except update AJAX URL if you move to MVC endpoint:
function saveQuery(){
    const messageDiv = document.getElementById('response');
    updateDataModel();
    const formData = new FormData();
    formData.append('jsonData', JSON.stringify(dataModel, null, 2));
    fetch('/index.php?page=query&action=save', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        messageDiv.textContent = data.message;
        messageDiv.style.color = data.success ? "green" : "red";
    })
    .catch(error => {
        messageDiv.textContent = "Error: " + error;
        messageDiv.style.color = "red";
    });
}