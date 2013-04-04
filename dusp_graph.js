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
    var x, y;
    var w = obj.width();
    var h = obj.height();
    var offset = obj.offset();
    var left = offset.left;
    var top = offset.top;
    var span = obj.find('.node-title span');
    if (span.length > 0){
        x = span.offset().left + (span.width() / 2);
        y = span.offset().top + (span.height() / 2);
    }

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
    console.log(thisCenter);
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

function addExpansionTrigger(target){
    var div = $('#switch-template').clone();
    div.attr('id', '');
    div.find('g').attr('transform', 'rotate(180, 12, 5)');
    target.append(div);
    div.addClass('expand-trigger').show();
}

function removeExpansionTrigger(target){
    target.find('.expand-trigger').remove();
}



function makeHovered(target){
    target.addClass('hovered');
    // it gets messy to add the expansion trigger here
    // addExpansionTrigger(target);
    drawLinkGeometry(target[0], hoverLayer, 'highlighted');
}

function makeUnhovered(target){
    removeLines(target[0], hoverLayer, 'highlighted');
    target.removeClass('hovered');
}

function makeSelected(target){
    target.addClass('selected');
    // make an svg layer for its links
    var svgLayer = svg.insert("g", ":first-child").attr("class", 
        "select " + target[0].id);
    // draw the geometry
    drawLinkGeometry(target[0], svgLayer, 'highlight-stay');
    var expandTrigger = target.find('.expand-trigger');
    if (expandTrigger.length < 1){
        addExpansionTrigger(target);
    }
}

function deselect(target){
    if (target.hasClass('expanded')){
        collapse(target);
    }
    target.removeClass('selected');
    removeExpansionTrigger(target);
    // remove the svg layer
    $('.'+target[0].id).remove();
    var neighbors = getNeighborNodes(target[0]);
    $(neighbors).removeClass('highlight-stay');
}

function expand(target) {
    // the target is the expand trigger!
    var node = target.parent();
    node.css('z-index', '9');
    node.animate(
        {'width': '384px'},
        100,
        function(){
            var details = node.find('.node-details');
            details.slideDown(100);
            node.addClass('expanded');
            target.removeClass('expand-trigger');
            target.addClass('collapse-trigger');
            node.find('.node-title').addClass('collapse-trigger');
            target.find('g').attr('transform', '');
        });

}

function collapse(target){
    // the target is the expand trigger!
    var node = target.parent();
    var trigger = node.find('.expansion-switch');
    node.removeClass('expanded');
    var originalWidth = $.data(node[0], 'position').w;
    var details = node.find('.node-details');
    details.slideUp(100, function(){
        trigger.find('g').attr('transform', 'rotate(180, 12, 5)');
        node.animate(
                {'width': originalWidth + 2},
                100);
        node.css('width', 'auto');
        if (!node.hasClass('selected')) {
            removeExpansionTrigger(node);
        }
        trigger.removeClass('collapse-trigger');
        node.find('.node-title').removeClass('collapse-trigger');
        trigger.addClass('expand-trigger');
        node.css('z-index', 'auto');
    });
}

function alignNeighbors(target){

}

function disperseNeighbors(target){

}

function resizeSVG(){
    svg.attr("width", getDocumentSize()[0])
    .attr("height", getDocumentSize()[1]);
}

function fixNodes(){
    var positions = [];
    // get all the positions
    $('.node').each(function(i, elem){
        $.data(elem, 'position', 
            function (){
         return getCenterAndBox($(elem));
            });
    });
    // set all the positions
    $('.node').each(function(i, elem){
        var p = $.data(elem, 'position')();
        $(elem).css('top', p.top);
        $(elem).css('left', p.left);
    });
    $('.node').css('position', 'absolute')
        .css('float', 'none');
}

function assignNeighborData(i, elem){
    var neighbors = $(getNeighborNodes(elem));
    $.data(elem, 'neighbors', neighbors);
}

$('.node').each(assignNeighborData);
$('.node-details').hide();

fixNodes();

var svg = d3.select("#geom_background").append("svg")
    .attr("width", getDocumentSize()[0])
    .attr("height", getDocumentSize()[1]);

var hoverLayer = svg.append("g").attr("class", "hoverLayer");

var lines = svg.selectAll("line");


// listeners
$('body').on('mouseenter','.node', function(e){

    var target = $(this);
    makeHovered(target);

}).on('mouseleave', '.node', function(e){

    var target = $(this);
    makeUnhovered(target);

}).on('click', '.node-title', function(e){

    var target = $(this).parent();

    if (target.hasClass('selected')) {
        deselect(target);
    } else {
        makeSelected(target);
    }

}).on('click', '.align-trigger', function(e){

    var target = $(this);
    alignNeighbors(target);

}).on('click', '.expand-trigger', function(e){

    // don't let it bubble up to the node
    e.stopPropagation();
    var target = $(this);
    expand(target);

}).on('click', '.collapse-trigger', function(e){

    // don't let it bubble up to the node
    e.stopPropagation();
    var target = $(this);
    collapse(target);

}).on('click', '.category', function(e){
    // get all the things of that category
    var target = $(this);
    var string = target.attr("string");
    console.log(string);
    var friends = $('div[class*="'+string+'"]');
    console.log(friends);
    var heights = [];
    var thisBox = getCenterAndBox(target);
    var offset = 24;
    var top = thisBox.top + thisBox.h + offset;
    var left = thisBox.left;
    // get all their heights
    friends.each(function(i, elem){
        obj = $(elem);
        // calculate their new positions
        var geom = getCenterAndBox(obj);
        console.log(geom);
        var h = geom['h'];
        console.log('height',h);
        // animate them from their starting position to new position
        obj.animate({
            'top':top,
            'left':left,
        }, 1000);
        top = top + h + offset;
        console.log(top);
    });
    resizeSVG();
});

$(window).resize(resizeSVG());

