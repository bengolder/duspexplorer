var stateManager = {};
var gWidth = 960,
    gHeight = 500;
    selectedCountry = null;
var linkedCountries = [];
var title;



// load the globe
// add the projects to the globe
// increment the color of each country based on the number of projects
// spin it slowly
// rgb(78, 143, 253)
// list projects by region on the left.
// when a region is clicked or a project is clicked
// turn the globe to that location and then highlight it
// I need to be able to:
//   highlight any number of countries, based on id or all
//   turn the globe to a particular country
//      get the center of one or more countries
//      turn the globe to view that lat long location

function installGlobe(){
    stateManager.globe = true;
    // set a status somewhere
    var container = d3.select("#node_container");
    var nodes = container.selectAll("div")
        .style("display", "none");


    var globe_div = container.append("div").attr("id", "globe");


    var projection = d3.geo.orthographic()
        .scale(248)
        .clipAngle(90);

    var canvas = globe_div.append("canvas")
        .attr("width", gWidth)
        .attr("height", gHeight);


    canvas.on("mousemove", function() {
        var p = d3.mouse(this);
        projection.rotate([circumScale(p[0]), pitchScale(p[1])]);
        drawGlobe();
    });

    var c = canvas.node().getContext("2d");

    var circumScale = d3.scale.linear()
        .domain([0, gWidth])
        .range([-210, 210]);

     var pitchScale = d3.scale.linear()
         .domain([0, gHeight])
         .range([60, -60]);

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
      n = projects.length;

    function getCountries(idList){
        var c = [];
        countries.forEach(function(country, i){

            idList.forEach(function(id, i){
                if (country.id == id){
                    c.push(country);
                }
            });
        });
        return c;
    }

    function addToCountrySet(country){
        var isInList = false;
        for (var i = 0; i < linkedCountries.length; i++){
            if (linkedCountries[i].id == country.id){
                isInList = true;
            }
        }
        if (!isInList){
            linkedCountries.push(country);
        }
    }

    function linkProjectsToCountries(){
        var max = 0;
        projects.forEach(function(project, i){
            countries.forEach(function(country, j){
                if (country.projects == undefined){
                    country.projects = [];
                }
                project.country_codes.forEach(function (id, k){
                    if (country.id == id){
                        country.projects.push(project);
                        country.fullName = project.countries[k];
                        addToCountrySet(country);
                    }
                    if (country.projects.length > max){
                        max = country.projects.length;
                    }
                });
            });
        });
        console.log('max links =',max);
    }

    function getCountryPoint(country){
            return d3.geo.centroid(country);

    }

    projects.forEach(function(project, i){
        var countries = getCountries(project.countries);
    });

    function drawFill( color, pathItems){
        c.fillStyle = color;
        c.beginPath();
        path(pathItems);
        c.fill();
    }

    function drawStroke( color, strokeWidth, pathItems ){
        c.strokeStyle = color;
        c.lineWidth = strokeWidth;
        c.beginPath();
        path(pathItems);
        c.stroke();
    }

    function ramp(n){
        var colors = [
            "#F93937",
            "#D91754",
            "#AB1A64",
            "#762666",
            ];
        var shades = [
            "#57A5F5",
            "#5B8AD2",
            "#5971B0",
            "#51598F",
            ]
        return shades[n-1];
    }

    function drawGlobe(){
        // this is meant to be called initially, and by tweens
        // clear the canvas context
        c.clearRect(0, 0, gWidth, gHeight);
        // fill for all the unselected countries
        drawFill("#aaa", land);
        // fill for the selected country
        // This next line will break
        countries.forEach(function(country, i){
            if (country.projects.length > 0){
                drawFill(ramp(country.projects.length), country);
            }
        });
        drawFill("#FF7E04", selectedCountry);
        // outlines for the countries
        drawStroke("fff", 0.5, borders);
        // outline for the globe itself
        drawStroke("#000", 2, globe);
    }

    function tweenToPoint(point){
        return function(){
            // This function returns a tweening function for rotating the globe
            rotator = d3.interpolate(projection.rotate(), 
                    [-point[0], -point[1]]
                    );

            return function( t) {
                projection.rotate(rotator(t));
                drawGlobe();
            };
        };
    }

    function transitionToCountry(country){
        var p = getCountryPoint(country);
        d3.transition()
            .duration(1000)
            .tween("rotate", tweenToPoint(p));
    }

    linkProjectsToCountries();
    drawGlobe();

    var countryLinks = globe_div.insert("ul", "canvas")
        .attr("class", "countries").selectAll("li")
        .data(linkedCountries).enter().append("li")
        .attr("class", "country")
        .html(function(d){ return d.fullName;});

    countryLinks.on("mousedown", function (c, i){
        d3.select("#globe").select(".projects").remove();
        console.log(c.fullName);
        selectedCountry = c;
        var p = getCountryPoint(c);
        var movement = d3.transition()
            .duration(1000)
            .tween("rotate", tweenToPoint(p));
        movement.transition();
        console.log(c.projects);
        var projects = d3.select("#globe").append("ul")
            .attr("class", "projects")
            .selectAll("li")
            .data(c.projects).enter()
            .append("li").attr("class", "project");
        projects.append("div").attr("class", "title")
            .html(function (d, i){
                console.log(d);
                return d.title;
            });
        projects.append("div").attr("class", "faculty")
            .html(function (d,i){
                return d.faculty.join(", ");
            });
        projects.append("div").attr("class", "description")
            .html(function (d,i){
                return d.description|| "";
            });


    });
}




// thigs I could use offline:
//  an html and css reference
//

function removeGlobe(){
    d3.select("#globe").remove();
    d3.select("#node_container").selectAll("div")
        .style("display", "default");
    stateManager.globe = false;
}

d3.select(".locate").on("mousedown", function(d, i){
    if (!stateManager.globe){
        installGlobe();
    } else {
        removeGlobe();
    }
});





