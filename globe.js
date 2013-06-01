var stateManager = {};
var gWidth = 960,
    gHeight = 500;
var title;

function installGlobe(){
    stateManager.globe = true;
    // set a status somewhere
    var container = d3.select("#node_container");
    var nodes = container.selectAll("div")
        .style("display", "none");


    var globe_div = container.append("div").attr("id", "globe");

    title = container.append("h1");

    var projection = d3.geo.orthographic()
        .scale(248)
        .clipAngle(90);

    var canvas = globe_div.append("canvas")
        .attr("width", gWidth)
        .attr("height", gHeight);

    console.log(canvas);

    var c = canvas.node().getContext("2d");

    var path = d3.geo.path()
        .projection(projection)
        .context(c);

    // when the data is ready, do this.
    var globe = {type: "Sphere"},
      land = topojson.object(world, world.objects.land),
      countries = topojson.object(world, world.objects.countries).geometries,
      borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a.id !== b.id; }),
      i = -1,
      project = null,
      n = internationalProjects.length;

    function getCountry(id){
        var c = null;
        countries.forEach(function(d, i){
            if (d.id == id){
                c = d;
            }
        });
        return c;
    }



    (function transition() {
    d3.transition()
        .duration(1250)
        .each("start", function() {
            project = internationalProjects[i = (i + 1) % n];
            title.text(project.title);
            console.log(project.title);
        })
        .tween("rotate", function() {
            var country = getCountry(project.country_codes[0]);
            console.log(country);
            var p = d3.geo.centroid(country),
                r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
            return function(t) {
              projection.rotate(r(t));
              c.clearRect(0, 0, gWidth, gHeight);
              c.fillStyle = "#bbb", c.beginPath(), path(land), c.fill();
              c.fillStyle = "#f00", c.beginPath(), path(countries[i]), c.fill();
              c.strokeStyle = "#fff", c.lineWidth = .5, c.beginPath(), path(borders), c.stroke();
              c.strokeStyle = "#000", c.lineWidth = 2, c.beginPath(), path(globe), c.stroke();
            };
        })
      .transition()
        .each("end", transition);
    })();




}

function removeGlobe(){
    d3.select("#globe").remove();
    d3.select("#node_container").selectAll("div")
        .style("display", "inherited");
    stateManager.globe = false;
}

d3.select(".locate").on("mousedown", function(d, i){
    console.log("clicked");
    if (!stateManager.globe){
        console.log("installing");
        installGlobe();
    } else {
        console.log("uninstalling");
        removeGlobe();
    }
});






