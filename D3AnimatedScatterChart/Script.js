function D3AnimatedScatterChart_Init() {

    Qva.AddExtension("D3AnimatedScatterChart",
        function () {

            ConsoleClear();
            fixSelectBox();


            var _this = this;
            _this.ExtSettings = {};
            _this.ExtSettings.ExtensionName = 'D3AnimatedScatterChart';
            _this.ExtData = {};

            // Base Url for CSS Files
            _this.ExtSettings.LoadUrl = Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only' + '&name=';

            //Todo: Can be removed in final version
            _this.ExtSettings.DataFile = Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only' + '&name=Extensions/D3AnimatedScatterChart/lib/data/nations.json';
            _this.ExtSettings.DataFile_Full = Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only' + '&name=Extensions/D3AnimatedScatterChart/lib/data/nations_full.json';


            var cssFiles = [];
            cssFiles.push('Extensions/' + _this.ExtSettings.ExtensionName + '/lib/css/style.css');
            for (var i = 0; i < cssFiles.length; i++) {
                Qva.LoadCSS(_this.ExtSettings.LoadUrl + cssFiles[i]);
            }

            var jsFiles = [];
            //http://d3js.org/d3.v2.js?2.8.1
            jsFiles.push('Extensions/' + _this.ExtSettings.ExtensionName + '/lib/js/d3_v2.js');
            Qv.LoadExtensionScripts(jsFiles, function () {

                ConsoleInfo("Extension Loaded ...");

                InitSettings();
                InitData();

                Init();
                InitChart();


            });

            // ------------------------------------------------------------------
            // Data Related Code
            // ------------------------------------------------------------------
            function InitData() {

                
                var jsonData = [];

                var prevDimension = '';
                var counter = -1;
                for (var i = 0; i < _this.Data.Rows.length; i++)
                {
                    var dimension = _this.Data.Rows[i][0].text;
                    var colorCategory = _this.Data.Rows[i][1].text;
                    var year = parseInt(_this.Data.Rows[i][2].text);
                    var x = parseFloat(_this.Data.Rows[i][3].data);
                    var size = parseFloat(_this.Data.Rows[i][5].data);
                    var y = parseFloat(_this.Data.Rows[i][4].data);
                    
                    var xArray = [];
                    xArray.push(year);
                    xArray.push(x);

                    var sizeArray = [];
                    sizeArray.push(year);
                    sizeArray.push(size);

                    var yArray = [];
                    yArray.push(year);
                    yArray.push(y);

                    if (prevDimension != dimension) {
                        // Create a new node
                        counter++;
                        jsonData[counter] = { name: dimension, cat: colorCategory, years: [], x: [], y: [], size: [] };
                        jsonData[counter].years[0] = year;
                        jsonData[counter].x[0] = xArray;
                        jsonData[counter].size[0] = sizeArray;
                        jsonData[counter].y[0] = yArray;
                    }
                    else {
                        // Collect Measures and add to current node
                        jsonData[counter].years.push(year).text;
                        jsonData[counter].x.push(xArray);
                        jsonData[counter].size.push(sizeArray);
                        jsonData[counter].y.push(yArray);
                    }
                    prevDimension = dimension;
                }

                _this.ExtData = jsonData;

                ConsoleInfo("Result of InitData");
                //ConsoleLog(_this.ExtData);

            }

            


            // ------------------------------------------------------------------
            // Main Code
            // ------------------------------------------------------------------
            function Init() {

                ConsoleInfo("Init");

                $(_this.Element).empty();

                var $divContainer = $(document.createElement("div"));

                if (_this.ExtSettings.ShowReplayButton) {
                    var $replayButton = $(document.createElement("a"));
                    $replayButton.attr('id', 'ReplayButton_' + _this.ExtSettings.UniqueId);
                    $replayButton.text('Replay');
                    $replayButton.addClass('replayButton');
                    $divContainer.append($replayButton);
                }

                var $chart = $(document.createElement("div"));
                $chart.attr('id', 'Chart_' + _this.ExtSettings.UniqueId);
                $chart.addClass('chart');
                $divContainer.append($chart);

                $(_this.Element).append($divContainer);
                
            }
            function InitChart() {

                ConsoleInfo("Init Chart");
                if (nullOrEmpty(_this.ExtData)) {
                    return;
                }

                // Various accessors that specify the four dimensions of data to visualize.
                function x(d) { return d.x; }
                function y(d) { return d.y; }
                function radius(d) { return d.size; }
                function color(d) { return d.cat; }
                function key(d) { return d.name; }
                function years(d) { return d.years; }   //Added by SWR

                var data = _this.ExtData;

                var minYear = d3.min(data[0].years);
                var maxYear = d3.max(data[0].years);
                ConsoleLog("Years: " + minYear + ' - ' + maxYear);

                var xMin = 0, yMin;
                var xMax = 0, yMax;
                xMax = xMin = data[0].x[0][1]
                yMax = yMin = data[0].y[0][1]
                var sizeMin = 0, sizeMax = 0;
                
                if (data == 'undefined' || data[0] == 'undefined' || data[0].x == 'undefined')
                {
                    ConsoleLog("Return here ...");
                    return;
                }
                for (i = 0; i < data.length; i++) {
                    for (j = 0; j < data[i].x.length; j++) {
                        xMax = Math.max(xMax, data[i].x[j][1]);
                        xMin = Math.min(xMin, data[i].x[j][1]);
                    }
                    for (j = 0; j < data[i].y.length; j++) {
                        yMax = Math.max(yMax, data[i].y[j][1]);
                        yMin = Math.min(yMin, data[i].x[j][1]);
                    }
                    for (j = 0; j < data[i].size.length; j++) {
                        sizeMax = Math.max(sizeMax, data[i].size[j][1]);
                        sizeMin = Math.min(sizeMin, data[i].size[j][1]);
                    }
                }

                // Fixed settings
                if (_this.ExtSettings.XAxisMax != '0' && _this.ExtSettings.YAxisMax != '0') {
                    xMax = _this.ExtSettings.XAxisMax * 1.1;
                    yMax = _this.ExtSettings.YAxisMax * 1.1;
                }

                xMax = Math.round(xMax);
                yMax = Math.round(yMax);
                ConsoleLog("Max X: " + xMax);
                ConsoleLog("Max Y: " + yMax);

                // Chart dimensions.
                var spacer = { right: 20 };
                var margin = { top: 30, right: 50, bottom: 50, left: 30 };
                    //{ top: 19.5, right: 19.5, bottom: 19.5, left: 39.5 },
                var width = _this.GetWidth() - margin.right - spacer.right;
                var height = _this.GetHeight() - margin.top - margin.bottom;


                // Various scales. These domains make assumptions of data, naturally.
                var xScale, yScale;
                ConsoleLog("X Scale Type: " + _this.ExtSettings.ScaleTypeXAxis);
                switch (_this.ExtSettings.ScaleTypeXAxis)
                {
                    case "log":
                        xScale = d3.scale.log().domain([xMin, xMax]).range([0, width]);
                        break;
                    case "lin":
                    default:
                        xScale = d3.scale.linear().domain([xMin, xMax]).range([0, width]);
                        break;
                }

                ConsoleLog("Y Scale Type: " + _this.ExtSettings.ScaleTypeYAxis);
                switch (_this.ExtSettings.ScaleTypeYAxis)
                {
                    case "log":
                        yScale = d3.scale.log().domain([yMin, yMax]).range([height, 0]);;
                        break;
                    case "lin":
                    default:
                        yScale = d3.scale.linear().domain([yMin, yMax]).range([height, 0]);
                        break;
                }

                var radiusScale = d3.scale.sqrt().domain([sizeMin, sizeMax]).range([1,40]);
                var colorScale = d3.scale.category10();

                // The x & y axes.
                var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d"));
                var yAxis = d3.svg.axis().scale(yScale).orient("left");

                // Create the SVG container and set the origin.
                var svg = d3.select("#Chart_" + _this.ExtSettings.UniqueId).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                // Add the x-axis.
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                // Add the y-axis.
                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);

                // Add an x-axis label.
                svg.append("text")
                    .attr("class", "x label")
                    .attr("text-anchor", "end")
                    .attr("x", width)
                    .attr("y", height - 6)
                    .style('font-size', _this.ExtSettings.FontSizeXLabel + 'px')
                    .text(_this.ExtSettings.LabelXAxis)
                ;
                // Add a y-axis label.
                svg.append("text")
                    .attr("class", "y label")
                    .attr("text-anchor", "end")
                    .attr("y", 6)
                    .attr("dy", ".75em")
                    .attr("transform", "rotate(-90)")
                    .style('font-size', _this.ExtSettings.FontSizeYLabel + 'px')
                    .text(_this.ExtSettings.LabelYAxis)
                ;


                // Add the year label; the value is set on transition.
                var label = svg.append("text")
                    .attr("class", "year label")
                    .attr("text-anchor", "end")
                    .attr("y", height - 24)
                    .attr("x", width)
                    .style("font-size", _this.ExtSettings.FontSizeYear + 'px')
                    .text(minYear);


                    // A bisector since many nation's data is sparsely-defined.
                var bisect = d3.bisector(function (d) { return d[0]; });

                // Add a dot per dimension. Initialize the data at the minimum, and set the colors.
                var dot = svg.append("g")
                    .attr("class", "dots")
                    .selectAll(".dot")
                    .data(interpolateData(minYear))
                    .enter().append("circle")
                    .attr("class", "dot")
                    .style("fill", function (d) { return colorScale(color(d)); })
                    .call(position)
                    .sort(order);

                    // Add a title.
                    dot.append("title")
                        .text(function (d) {
                            return d.name;
                        });

                // Add an overlay for the year label.
                var box = label.node().getBBox();

                var overlay = svg.append("rect")
                        .attr("class", "overlay")
                        .attr("x", box.x)
                        .attr("y", box.y)
                        .attr("width", box.width)
                        .attr("height", box.height)
                        .on("mouseover", enableInteraction);

                // Start a transition that interpolates the data based on year.
                play();
                function play() {
                    svg.transition()
                        .duration(_this.ExtSettings.TransitionDuration)
                        .ease("linear")
                        .tween("year", tweenYear)
                        .each("end", enableInteraction);
                }

                $('#ReplayButton_' + _this.ExtSettings.UniqueId).click(function () {
                    play();
                });

                // Positions the dots based on data.
                function position(dot) {
                    dot.attr("cx", function (d) { return xScale(x(d)); })
                        .attr("cy", function (d) { return yScale(y(d)); })
                        .attr("r", function (d) { return radiusScale(radius(d)); });
                }

                // Defines a sort order so that the smallest dots are drawn on top.
                function order(a, b) {
                    return radius(b) - radius(a);
                }

                // After the transition finishes, you can mouseover to change the year.
                function enableInteraction() {
                    var yearScale = d3.scale.linear()
                        .domain([minYear, maxYear])
                        .range([box.x + 10, box.x + box.width - 10])
                        .clamp(true);

                    // Cancel the current transition, if any.
                    svg.transition().duration(0);

                    overlay
                        .on("mouseover", mouseover)
                        .on("mouseout", mouseout)
                        .on("mousemove", mousemove)
                        .on("touchmove", mousemove);

                    function mouseover() {
                        label.classed("active", true);
                    }

                    function mouseout() {
                        label.classed("active", false);
                    }

                    function mousemove() {
                        displayYear(yearScale.invert(d3.mouse(this)[0]));
                    }
                }

                // Tweens the entire chart by first tweening the year, and then the data.
                // For the interpolated data, the dots and label are redrawn.
                function tweenYear() {
                    var year = d3.interpolateNumber(minYear, maxYear);
                    return function (t) { displayYear(year(t)); };
                }

                // Updates the display to show the specified year.
                function displayYear(year) {
                    dot.data(interpolateData(year), key).call(position).sort(order);
                    label.text(Math.round(year));
                }

                // Interpolates the dataset for the given (fractional) year.
                function interpolateData(year) {
                    return data.map(function (d) {
                        return {
                            name: d.name,
                            cat: d.cat,
                            x: interpolateValues(d.x, year),
                            size: interpolateValues(d.size, year),
                            y: interpolateValues(d.y, year)
                        };
                    });
                }

                // Finds (and possibly interpolates) the value for the specified year.
                function interpolateValues(values, year) {
                    var i = bisect.left(values, year, 0, values.length - 1),
                        a = values[i];
                    if (i > 0) {
                        var b = values[i - 1],
                            t = (year - a[0]) / (b[0] - a[0]);
                        return a[1] * (1 - t) + b[1] * t;
                    }
                    return a[1];
                }

            } // Init

            // Bugfix for Property Select Box
            function fixSelectBox() {

                if (Qva.Mgr.mySelect == undefined) {
                    Qva.Mgr.mySelect = function (owner, elem, name, prefix) {
                        if (!Qva.MgrSplit(this, name, prefix)) return;
                        owner.AddManager(this);
                        this.Element = elem;
                        this.ByValue = true;

                        elem.binderid = owner.binderid;
                        elem.Name = this.Name;

                        elem.onchange = Qva.Mgr.mySelect.OnChange;
                        elem.onclick = Qva.CancelBubble;
                    }
                    Qva.Mgr.mySelect.OnChange = function () {
                        var binder = Qva.GetBinder(this.binderid);
                        if (!binder.Enabled) return;
                        if (this.selectedIndex < 0) return;
                        var opt = this.options[this.selectedIndex];
                        binder.Set(this.Name, 'text', opt.value, true);
                    }
                    Qva.Mgr.mySelect.prototype.Paint = function (mode, node) {
                        this.Touched = true;
                        var element = this.Element;
                        var currentValue = node.getAttribute("value");
                        if (currentValue == null) currentValue = "";
                        var optlen = element.options.length;
                        element.disabled = mode != 'e';
                        //element.value = currentValue;
                        for (var ix = 0; ix < optlen; ++ix) {
                            if (element.options[ix].value === currentValue) {
                                element.selectedIndex = ix;
                            }
                        }
                        element.style.display = Qva.MgrGetDisplayFromMode(this, mode);

                    }
                }


            }

            // ------------------------------------------------------------------
            // Settings
            // ------------------------------------------------------------------
            function InitSettings() {
                ConsoleInfo("Init Settings");
                //ConsoleLog(_this);

                // General Settings
                _this.ExtSettings.UniqueId = _this.Layout.ObjectId.replace("\\", "_");

                // Data Settings

                // X-Axis Settings
                _this.ExtSettings.LabelXAxis = _this.Layout.Text0.text;
                _this.ExtSettings.ScaleTypeXAxis = (_this.Layout.Text1.text != '') ? _this.Layout.Text1.text : 'lin';
                _this.ExtSettings.XAxisMax = (_this.Layout.Text7.text != '') ? parseInt(_this.Layout.Text7.text) : 0;
                ConsoleLog("ScaleTypeXAxis direct: " + _this.Layout.Text1.text);


                // Y-Axis Settings
                _this.ExtSettings.LabelYAxis = _this.Layout.Text2.text;
                _this.ExtSettings.ScaleTypeYAxis = (_this.Layout.Text3.text != '') ? _this.Layout.Text3.text : 'lin';
                _this.ExtSettings.YAxisMax = (_this.Layout.Text8.text != '') ? parseInt(_this.Layout.Text8.text) : 0;


                // Layout Settings
                _this.ExtSettings.FontSizeYear = (_this.Layout.Text4.text != '') ? parseInt(_this.Layout.Text4.text) : 80;
                //ConsoleLog("Font-Size direct: " + _this.Layout.Text4.text);
                //_this.ExtSettings.ColorSchema = 'category10';
                _this.ExtSettings.FontSizeXLabel = (_this.Layout.Text5 != 'undefined' && _this.Layout.Text5.text != '') ? parseInt(_this.Layout.Text5.text) : 10;
                _this.ExtSettings.FontSizeYLabel = (_this.Layout.Text6 != 'undefined' && _this.Layout.Text6.text != '') ? parseInt(_this.Layout.Text6.text) : 10;
                _this.ExtSettings.ShowReplayButton = (_this.Layout.Text10.text != '1') ? false : true;

                // Behaviour Settings
                _this.ExtSettings.TransitionDuration = (isNumber(_this.Layout.Text9.text)) ? parseInt(_this.Layout.Text9.text) : 10000; // in milliseconds


                ConsoleLog("\tX Axis:");
                ConsoleLog("\t\tLabel: " + _this.ExtSettings.LabelXAxis);
                ConsoleLog("\t\tScale Type: " + _this.ExtSettings.ScaleTypeXAxis);
                ConsoleLog("\t\tLabel Font Size: " + _this.ExtSettings.FontSizeXLabel);
                ConsoleLog("\t\tX-Max: " + _this.ExtSettings.XAxisMax);
                ConsoleLog("\tY Axis:");
                ConsoleLog("\t\tLabel: " + _this.ExtSettings.LabelYAxis);
                ConsoleLog("\t\tScale Type: " + _this.ExtSettings.ScaleTypeYAxis)
                ConsoleLog("\t\tLabel Font Size: " + _this.ExtSettings.FontSizeYLabel);
                ConsoleLog("\t\tY-Max: " + _this.ExtSettings.YAxisMax);


                ConsoleLog("\tLayout:");
                ConsoleLog("\t\tFontSizeYear: " + _this.ExtSettings.FontSizeYear);

                ConsoleLog("\tBehavior:");
                ConsoleLog("\t\tTransitionDuration: " + _this.ExtSettings.TransitionDuration);
                ConsoleLog("\t\tShowReplayButton: " + _this.ExtSettings.ShowReplayButton);

            }

            // ------------------------------------------------------------------
            // Extension helper functions
            // ------------------------------------------------------------------
            function ConsoleLog(msg) {
                if (typeof console != "undefined") {
                    console.log(msg);
                }
            }
            function ConsoleInfo(msg) {
                if (typeof console != "undefined") {
                    console.info(msg);
                }
            }
            function ConsoleClear() {
                if (typeof console != "undefined") {
                    console.clear();
                }
            }

            // ------------------------------------------------------------------
            // Basic Helper functions
            // ------------------------------------------------------------------
            function nullOrEmpty(obj) {
                if (obj == null || obj.length == 0 || obj == 'undefined') {
                    return true;
                }
                return false;
            }

            function isNumber(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }

            // ------------------------------------------------------------------
            // String extension
            // ------------------------------------------------------------------
            String.prototype.startsWith = function(s)
            {
                return(this.indexOf(s) == 0);
            };

        })
};

D3AnimatedScatterChart_Init();