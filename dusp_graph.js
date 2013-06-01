// convenience functions
// Node class
// functions to build nodes and setup data
// functions for drawing and selection operations
// global variables declaration
// init function
// run function (runs initial animation, assigns event listeners)

/* CONVENIENCE FUNCTIONS ############################# */
function log(thing){
    console.log(thing);
}

function resizeSVG(){
    // ensure that the SVG is the right size
    svg.attr("width", docSize[0])
    .attr("height", docSize[1]);
}


function updateDocumentSize(){
    // update the global variable `docSize`
    // with the current size of the document
    var w = $(document).width();
    var h = $(document).height();
    if (maxHeight !== undefined){
        if (h > maxHeight){
            h = maxHeight;
        }
    }
    docSize = [w, h];
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function compare(a,b) {
    if (a.id < b.id){
        return -1;
    }
    if (a.id > b.id){
        return 1;
    }
    return 0;
}

function key(node) {
    return node.id;
}
/* END CONVENIENCE FUNCTIONS ############################# */


// Node class
// This is for tracking data on a per-node basis
// and for coordinating animations
var Node = function (elem){
    // set id
    this.id = elem.id;
    // set elem
    this.elem = elem;
    this.obj = $(this.elem);
    this.neighbors = [];
    this.lineSelections = [];
    // set the type 
    var glass = elem.className;
    if (glass.search("person") !== -1){
        this.type = "person";
    } else if (glass.search("topic") !== -1){
        this.type = "topic";
    }
    // set geom
    this.updateGeom();
    this.color = "#AAAAAA";
};

Node.prototype = {
    id: null,
    elem: null,
    obj: null,
    geom: null,
    color: null,
    // subs for get neighbors
    neighbors : null,
    boxes: null,
    point: null, // for storing movements
    lines: {
        "from":null,
        "to":null,
    },
    type: null,
    highlight: function(){
    },
    setNewLocation: function(top, left){
        // this should set new top, left, x, and y values to move to
        // it should just store this value
        this.point = {
            'top':top,
            'left':left,
        };
        this.vector = {
            // i need the new x y position, not the vector
            // first the vector from the current position to the xy
            // then the vector to the next position
            'x': this.geom.x - this.geom.left + left + 12,
            'y': this.geom.y - this.geom.top + top + 24,
        }
    },
    move: function(newPoint){
        
    },
    updateGeom: function(){
        // variables
        var x, y, w, h, offset, left, top, span;
        // get width and height
        w = this.obj.width();
        h = this.obj.height();
        if (this.obj.hasClass('expanded')){
            h = h - this.obj.find('.node-details').height();
        }
        // find the offset position
        offset = this.obj.offset();
        left = offset.left;
        top = offset.top;
        //  get and x and y center that is based on the title block
        span = this.obj.find('.node-title span');
        if (span.length > 0){
            x = span.offset().left + (span.width() / 2);
            y = span.offset().top + (span.height() / 2);
        }
        // store the geometric info for later access
        this.geom = {'x':x, 'y':y, 'w':w, 'h':h,
                'left':left, 'top':top};
    },
    addExpansionTrigger: function(){
        // first check if there is already a trigger
        var expandTrigger = this.obj.find('.expand-trigger');
        if (expandTrigger.length < 1){
            // add and show a switch for expanding nodes
            var div = $('#switch-template').clone();
            div.attr('id', '');
            div.find('g').attr('transform', 'rotate(180, 12, 5)');
            this.obj.append(div);
            div.show()
                .css('background-color', this.color);
        }
    },
    removeExpansionTrigger: function(){
        this.obj.find('.expansion-switch').remove();
    },
    expand: function(){
        var obj = this.obj;
        if (! obj.hasClass('expanded')){
            obj.css('z-index', '9');
            // first go wider, then go down
            // here is where I need to later determine to expand
            // right or left
            obj.animate(
                {'width': '384px'},
                100,
                function(){
                    var details = obj.find('.node-details');
                    details.slideDown(100);
                    // update the nodes class, so we know it has been expanded
                    obj.addClass('expanded');
                    // update the classes, for collapsing later
                    // flip the arrow up
                    obj.find('.expansion-switch')
                        .find('g').attr('transform', '');
                });
        } else {
            this.collapse();
        }
    },
    collapse: function(){
        var obj = this.obj;
        // for use with nested function
        var self = this;
        var details = obj.find('.node-details');
        var trigger = obj.find('.expansion-switch');
        details.slideUp(100, function(){
            trigger.find('g').attr('transform', 'rotate(180, 12, 5)');
            obj.animate(
                {'width': self.geom.w + 2},
                100);
            if (!obj.hasClass('selected')) {
                self.removeExpansionTrigger();
            }
            obj.css('width', 'auto')
                .removeClass('expanded')
                .css('z-index', 'auto');
        });
    },
    neighborQuery: function(){
        // get all the neighbors as a jQuery selection
        var all = [];
        for (var i=0; i < this.neighbors.length; i++ ){
            var neighbor = this.neighbors[i];
            all.push(neighbor.elem);
        }
        return $(all);
    },
    hover: function(){
        this.obj.addClass('hovered')
            .css('background-color', this.color);
        drawLinkGeometry(this, hoverLayer, 'highlighted');
    },
    unhover: function(){
        removeLines( this, hoverLayer, 'highlighted');
        this.obj.removeClass('hovered');
        if (!this.obj.hasClass('selected')){
            this.obj.css('background-color', '');
        }
    },
    select: function(){
        this.obj.addClass('selected')
            .css('background-color', this.color);
        var svgLayer = svg.insert("g", ":first-child").attr("class",
                "select " + this.id);
        drawLinkGeometry(this, svgLayer, 'highlight-stay');
        this.addExpansionTrigger();
    },
    deselect: function(){
        if (this.obj.hasClass('expanded')){
            this.collapse();
        }
        this.obj.removeClass('selected')
            .css('background-color', '');
        this.removeExpansionTrigger();
        $('.'+this.id).remove();
        this.neighborQuery().removeClass('highlight-stay');
    },
};
/* End Node Class */

/* Functions to build nodes and set up data */

function buildColorScales(){
    colors = {};
    var people0 = d3.hcl("#F87446");
    var people1 = d3.hcl("#2FF383");
    var topic0 = d3.hcl("#4E8FFD");
    var topic1 = d3.hcl("#B73384");
    colors['people'] = d3.scale.linear()
        .range([people0, people1])
        .interpolate(d3.interpolateHcl);
    colors['topics'] = d3.scale.linear()
        .range([topic0, topic1])
        .interpolate(d3.interpolateHcl);
}

function buildNodes(objs){
    nodes = {};
    nodeList = [];
    objs.each(function (i, elem){
        // make the node
        var node = new Node( elem );
        // set the node into the global variables
        nodes[node.id] = node;
        nodeList.push(node);
    });


    // colors and neighbors should be assigned after node creation

    // set the colors
    var peoples = $('.person');
    var numPeoples = peoples.length;
    peoples.each(function (i, elem) {
        // calculate the color
        var color = colors.people(i/numPeoples);
        // look up the node, set its color
        nodes[elem.id].color = color;
    });
    var topics = $('div[class*=topic]');
    var numTopics = topics.length;
    topics.each(function (i, elem) {
        var color = colors.topics(i/numTopics);
        nodes[elem.id].color = color;
    });

    // set the neighbor data
    objs.each(function (i, elem){
        // lookup the list of neighbor ids
        var neighborIds = graph[elem.id];
        var node = nodes[elem.id];
        for (var i=0; i < neighborIds.length; i++){
            // get the id
            var neighborId = neighborIds[i];
            // add the corresponding node to the neighbor list
            var neighbor = nodes[neighborId];
            node.neighbors.push(nodes[neighborId]);
        }
    });

}


/* End Functions to build nodes and set up data */





/* Functions for drawing and selection operations */

function drawLinkGeometry (node, g, neighborClass) {
    // draw svg lines and boxes for all the neighbors of a node
    var lines = g.selectAll("line")
        .data(node.neighbors, key).enter().append("line");

    node.lineSelections.push(lines);

    // this one seems expensive
    node.neighborQuery().addClass(neighborClass);

    // draw the boxes to highlight everything
    var boxes = g.selectAll("rect")
        .data(node.neighbors, key).enter().append("rect");

    // draw the boxes
    boxes.attr('x', function(d){return d.geom.left})
        .attr('y', function(d){return d.geom.top})
        .attr('width', function(d){return d.geom.w})
        .attr('height', function(d){return d.geom.h})
        .style('fill', node.color);

    // draw the lines
    lines.attr('x1', node.geom.x)
        .attr('y1', node.geom.y)
        .attr('x2', function(d){ return d.geom.x })
        .attr('y2', function(d){ return d.geom.y })
        .attr('stroke-dasharray', '6, 4')
        .style('stroke', node.color);

    // why must I dig to get the class name???
    // ... because this is svg
    var gclass = g[0][0].className.baseVal;
}

function removeLines (node, g, neighborclass) {
    // remove the svg lines that were drawn, using d3's 
    // exit and remove strategies
    node.neighborQuery().removeClass(neighborclass);
    var gElem = g[0][0];
    g.selectAll("line")
        .data([]).exit().remove();
    g.selectAll("rect")
        .data([]).exit().remove();
    var splicer = -1;
    for (var i = 0; i < node.lineSelections.length; i++){
        if (gElem == node.lineSelections[i][0].parentNode){
            splicer = i;
        }
    }
    if (splicer > -1){
        // remove the item from the line selections
        node.lineSelections.splice(splicer, 1);
    }
}


// animation functions
function moveRects(duration, ease){
        var rects = d3.selectAll('rect');
        rects.transition()
            .duration(duration)
            .attr('x', function(d){return d.point.left + 12 + 'px';})
            .attr('y', function(d){return d.point.top + 24 + 'px';})
            .ease(ease)
            .each('end', function(){
                updateDocumentSize();
                resizeSVG();
            });
}

function moveNodes(duration, ease){
    var nodeDivs = d3.selectAll('.node');
    nodeDivs.transition()
        .duration(duration)
        .style('left', function(d, i){ return nodes[this.id].point.left + 'px'; })
        .style('top', function(d, i){return nodes[this.id].point.top + 'px';})
        .ease(ease)
        .each(function (d, i) {
            var node = nodes[this.id];
            for (var i = 0; i < node.lineSelections.length; i++){
                var lines = node.lineSelections[i];
                lines.transition()
                    .duration(duration)
                    .ease(ease)
                    .attr('x1', function(d){return node.vector.x + 'px';})
                    .attr('y1', function(d){return node.vector.y + 'px';})
                    .attr('x2', function(d){return d.vector.x + 'px';})
                    .attr('y2', function(d){return d.vector.y + 'px';});
            }
        }).each('end', function (d, i) {
            var node = nodes[this.id];
            node.updateGeom();
        });
    moveRects(duration, ease);
}


function stackRandomly(){
    // this needs to ensure that the svg follows
    $('.categories').slideUp(function(){
        var nodeObjs = $('.node');
        nodeObjs = shuffle(nodeObjs);
        var offset = 24;
        var eachHeight = 48;
        var top = offset + eachHeight;
        var left = offset * 2;
        var maxwidth = $(document).width();
        nodeObjs.each(function(i, elem){
            var node = nodes[elem.id];
            var newLeft = left + offset + node.geom.w;
            if (newLeft > maxwidth){
                // it wont fit
                // go to the next line
                left = offset + node.geom.w + offset;
                top = top + eachHeight + offset;
                node.setNewLocation(top, offset + 2);
            } else {
                node.setNewLocation(top, left);
                left = left + offset + node.geom.w;
            }
        });
        moveNodes(500, 'linear');
    });
}

function stackOrderly(){
    // check out the 'g' list
    // sort and stack the items
    // this should ensure that motion happens for the svg as well
    $('.categories').slideDown(function(){
        $('.category').each(function(i, elem){
            // get the category header element
            var target = $(elem);
            var string = target.attr("string");
            // get everything for that category
            var friends = $('div[class*="'+string+'"]');
            // sort them based on the compare function
            // compare function is at the top of page
            friends.sort(compare);
            var offset = 24;
            var top = target.offset().top + offset;
            var left = target.offset().left - 12;

            // calculate and store the new points in each node
            friends.each(function(i, elem){
                var node = nodes[elem.id];
                node.setNewLocation(top, left);
                top = top + node.geom.h + offset;
            });
        });
        moveNodes(500, 'linear');
    });
}


// setup global variables
var svg,
    hoverLayer,
    lines,
    nodes,
    nodeList,
    maxHeight,
    docSize,
    switchTemplate,
    colors;

// setup all the nodes and data
function init(){
    buildColorScales();
    buildNodes($('.node'));
    $('.node-details').hide();
    updateDocumentSize();
    
    // set the svg object
    svg = d3.select("#geom_background").append("svg")
        .attr("width", docSize[0])
        .attr("height", docSize[1]);

    // set a layer for displaying hovered info
    hoverLayer = svg.append("g").attr("class", "hoverLayer");

    // get all the lines on the svg layer
    lines = svg.selectAll("line");
}

init();


function run(){
    // do initial animations
    stackOrderly();
    setTimeout(stackRandomly, 1300);
    // set all the listeners
    // listeners
    $('body').on('mouseenter','.node', function(e){
        nodes[this.id].hover();
    }).on('mouseleave', '.node', function(e){
        nodes[this.id].unhover();
    }).on('click', '.node-title', function(e){
        var target = $(this).parent();
        var node = nodes[target[0].id]

        if (target.hasClass('selected')) {
            node.deselect();
        } else {
            node.select();
        }
    }).on('click', '.align-trigger', function(e){
        var target = $(this);
        alignNeighbors(target);
    }).on('click', '.expansion-switch', function(e){
        // don't let it bubble up to the node
        e.stopPropagation();
        var target = $(this);
        var nodeId = target.parent()[0].id;
        nodes[nodeId].expand();
    }).on('click', '.expanded', function(e){
        nodes[this.id].collapse();
    }).on('click', '.randomize', function(e){
        stackRandomly();
    }).on('click', '.organize', function(e){
        stackOrderly();
    }).on('click', '.networkize', function(e){
        drawNetworkDiagram();
    });
    $(window).resize(resizeSVG());
}

run();
