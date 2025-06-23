<?php
    $scriptSource = '<script src="js/generator.js"></script>';
    $additionalCss = '<link rel="alternative stylesheet" href="css/index.css">'; 
?>
<?php include '../includes/markup.php'; ?>
<div class="container">
    <?php include '../includes/header.php'; ?>
    <div class="main">
        <div class="top-container">
            <div class="palette">
                <div class="palette-scroll">
                    <div class="palette-item" draggable="true" data-type="Repeat">
                        <span class="type">repeat</span>
                        <span class="desc">- loop container</span>
                    </div>
                    <div class="palette-item" draggable="true" data-type="FixedVariable">
                        <span class="type">fixed variable</span>
                        <span class="desc">- single literal value</span>
                    </div>
                    
                    <div class="palette-item" draggable="true" data-type="RandomVariable">
                        <span class="type">random variable</span>
                        <span class="desc">- random scalar [min, max]</span>
                    </div>
                    
                    <div class="palette-item" draggable="true" data-type="RandomArray">
                        <span class="type">random array</span>
                        <span class="desc">- array of random scalars</span>
                    </div>
                    
                    <div class="palette-item" draggable="true" data-type="Permutation">
                        <span class="type">permutation</span>
                        <span class="desc">- k-th order permutation of [1, n]</span>
                    </div>
                    
                    <div class="palette-item" draggable="true" data-type="MazeMatrix">
                        <span class="type">maze matrix</span>
                        <span class="desc">- [0,1] values, at least one path</span>
                    </div>
                    
                    <div class="palette-item" draggable="true" data-type="SparseMatrix">
                        <span class="type">sparse matrix</span>
                        <span class="desc">- specify amount of 0 values</span>
                    </div>
                    
                    <div class="palette-item" draggable="true" data-type="RandomGraph">
                        <span class="type">random graph</span> 
                    </div>
                    
                    <div class="palette-item" draggable="true" data-type="BipartiteGraph">
                        <span class="type">bipartite graph</span> 
                    </div>
                    
                    <div class="palette-item" draggable="true" data-type="RandomTree">
                        <span class="type">random tree</span> 
                    </div>
                    
                    <div class="palette-item" draggable="true" data-type="DirectedAcyclicGraph">
                        <span class="type">directed acyclic graph</span>
                    </div>
                </div>
            </div>
            
            <div class="controls">
                <button class="btn" onclick="generateTest()">generate test</button>
                <button class="btn" onclick="generateCode()">generate code</button>
                <button class="btn" onclick="generateJSON()">generate json</button>
                <button class="btn" onclick="saveQuery()">store2profile</button>
                <button class="btn" onclick="uploadTest()">upload json</button>
                <button class="btn" onclick="downloadTest()">download</button>
                <button class="btn btn-clear" onclick="clearAll()">×</button>
            </div>
        </div>
        
        <div class="bottom-container">
            <div class="scope" id="root-scope" data-scope="root"> 
            </div>
            
            <div class="json-output" id="json-output"></div>
        </div>
    </div>
</div>
 
<div class="floating-panel" id="param-panel">
    <button class="close-panel" onclick="closeParameterPanel()">×</button>
    <h4 id="panel-title">parameters</h4>
    <div id="panel-content"></div>
</div>


