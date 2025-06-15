<?php
    $scriptSource = '<script src="../js/pig.js"></script>';
    $additionalCss = '<link rel="alternative stylesheet" href="../css/index.css">';
    include '../includes/header.php';
?>

<div class="container">
        <div class="main">
            <div class="palette">
                <h3>Module Palette</h3>
                
                <div class="palette-item" draggable="true" data-type="FixedVar">
                    <div class="type">FixedVar</div>
                    <div class="desc">Single literal value</div>
                </div>
                
                <div class="palette-item" draggable="true" data-type="RandomVar">
                    <div class="type">RandomVar</div>
                    <div class="desc">Random value in range</div>
                </div>
                
                <div class="palette-item" draggable="true" data-type="Array">
                    <div class="type">Array</div>
                    <div class="desc">Array of random values</div>
                </div>
                
                <div class="palette-item" draggable="true" data-type="Matrix">
                    <div class="type">Matrix</div>
                    <div class="desc">2D array of values</div>
                </div>
                
                <div class="palette-item" draggable="true" data-type="Repeat">
                    <div class="type">Repeat</div>
                    <div class="desc">Loop container</div>
                </div>
            </div>
            
            <div class="workspace">
                <div class="controls">
                    <button class="btn" onclick="generateJSON()">Generate JSON</button>
                    <button class="btn" onclick="clearScope()">Clear</button>
                    <?php if(isset($_COOKIE['jwt'])): ?>
                        <button class="btn" onclick="saveQuery()">Save Query In Profile</button>
                        <div id="response"></div>
                    <?php endif;?>
                </div>
                
                <div class="scope" id="root-scope" data-scope="root">
                    <div class="scope-label">Test Scope</div>
                    <div class="drop-placeholder"></div>
                </div>
                
                <div class="json-output" id="json-output"></div>
            </div>
        </div>
</div>
<?php
    include '../includes/footer.php';
?>


