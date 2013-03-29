// helper functions
function getNeighborNodes(node){
    var id = node.id;
    var neighbors = graph[id];
    var selector = '#' + neighbors.join(',#');
    return selector;
}

function getDocumentSize(){
    var w = $(document).width();
    var h = $(document).height();
    return [w, h];
}

function getCenterAndBox(obj){
    var w = obj.width();
    var h = obj.height();
    var offset = obj.offset();
    var left = offset.left;
    var top = offset.top;
    var x = left + (w / 2);
    var y = top + (h / 2);

    return {'x':x, 'y':y, 'w':w, 'h':h,
            'left':left, 'top':top};
}

function getCentersAndBoxes(neighbors){
    var geoms = [];
    neighbors.each(function(i, elem){
        obj = $(elem);
        var info = getCenterAndBox(obj);
        geoms.push(info);
    });
    return geoms;
}

function drawLinkGeometry (target, g, neighborclass) {
    
    // get all the geometry info
    var thisCenter = getCenterAndBox($(target));
    var neighbors = $.data(target, 'neighbors');
    neighbors.addClass(neighborclass);
    var geoms = getCentersAndBoxes(neighbors);
    var lines = g.selectAll("line")
        .data(geoms).enter().append("line");

    // draw the boxes to highlight everything
    var boxes = g.selectAll("rect")
        .data(geoms).enter().append("rect");

    // draw the boxes
    boxes.attr('x', function(d){return d.left});
    boxes.attr('y', function(d){return d.top});
    boxes.attr('width', function(d){return d.w});
    boxes.attr('height', function(d){return d.h});

    // draw the lines
    lines.attr('x1', thisCenter.x)
        .attr('y1', thisCenter.y)
        .attr('x2', function(d){ return d.x })
        .attr('y2', function(d){ return d.y });

    // why must I dig to get the class name???
    var gclass = g[0][0].className.baseVal;

    // I only need this here because decaring it in css
    // didn't work
    //if (gclass == "hoverLayer"){
        //lines.attr('stroke-dasharray', '8, 4');
    //}
}

function removeLines (target, g, neighborclass) {
    var neighbors = $.data(target, 'neighbors');
    neighbors.removeClass(neighborclass);
    g.selectAll("line")
        .data([]).exit().remove();
    g.selectAll("rect")
        .data([]).exit().remove();
}


function makeHovered(target){
    target.addClass('hovered');
    drawLinkGeometry(target[0], hoverLayer, 'highlighted');
}

function makeUnhovered(target){
    removeLines(target[0], hoverLayer, 'highlighted');
    target.removeClass('hovered');
}

function makeSelected(target){
    target.addClass('selected');
    var numNeighbors = $.data(target[0], 'neighbors').length;
    console.log( numNeighbors );
    // make an svg layer for its links
    var svgLayer = svg.insert("g", ":first-child").attr("class", 
        "select " + target[0].id);
    // draw the geometry
    drawLinkGeometry(target[0], svgLayer, 'highlight-stay');
}

function deselect(target){

    target.removeClass('selected');
    // remove the svg layer
    $('.'+target[0].id).remove();
    var neighbors = getNeighborNodes(target[0]);
    $(neighbors).removeClass('highlight-stay');
}

function expand(target){

}

function collapse(target){

}

function alignNeighbors(target){

}

function disperseNeighbors(target){

}

function resizeSVG(){
    svg.attr("width", getDocumentSize()[0])
    .attr("height", getDocumentSize()[1]);
}

function assignNeighborData(i, elem){
    var neighbors = $(getNeighborNodes(elem));
    $.data(elem, 'neighbors', neighbors);
}

$('.node').each(assignNeighborData);

var svg = d3.select("#geom_background").append("svg")
    .attr("width", getDocumentSize()[0])
    .attr("height", getDocumentSize()[1]);

var hoverLayer = svg.append("g").attr("class", "hoverLayer");

var lines = svg.selectAll("line");


// listeners
$('body').on('mouseover','.node', function(e){

    var target = $(this);
    makeHovered(target);

}).on('mouseout', '.node', function(e){

    var target = $(this);
    makeUnhovered(target);

}).on('click', '.node', function(e){

    var target = $(this);

    if (target.hasClass('selected')) {
        deselect(target);
    } else {
        makeSelected(target);
    }

}).on('click', '.align-trigger', function(e){

    var target = $(this);
    alignNeighbors(target);

}).on('click', '.expand-trigger', function(e){

    var target = $(this);
    expand(target);

}).on('click', '.collapse-trigger', function(e){

    var target = $(this);
    collapse(target);

});

$(window).resize(resizeSVG());

