import * as d3 from 'd3'

class ParallelCoordinatesD3 {
    margin = {top: 80, right: 50, bottom: 50, left: 50};
    size;
    height;
    width;
    matSvg;
    // add specific class properties used for the vis render/updates
    transitionDuration = 500;
    
    // Scales for each dimension
    yScales = {};
    xScale;
    
    // Dimensions to display (numeric attributes)
    dimensions = [];
    
    constructor(el){
        this.el = el;
    }

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};

        // get the effective size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;
        
        console.log("create Parallel Coordinates SVG width=" + (this.width + this.margin.left + this.margin.right) + 
                    " height=" + (this.height + this.margin.top + this.margin.bottom));
        
        // initialize the svg and keep it in a class property
        this.matSvg = d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class", "parallelCoordinatesG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        
        // Create groups for foreground and background lines
        this.matSvg.append("g")
            .attr("class", "background");
        
        this.matSvg.append("g")
            .attr("class", "foreground");
        
        // Create group for axes
        this.matSvg.append("g")
            .attr("class", "axes");
    }

    // Function to extract numeric dimensions from data
    extractDimensions = function(data) {
        if (data.length === 0) return [];
        
        const firstItem = data[0];
        const numericDimensions = Object.keys(firstItem).filter(key => {
            return typeof firstItem[key] === 'number' && key !== 'index';
        });
        
        return numericDimensions;
    }

    // Update scales for each dimension
    updateScales = function(data, dimensions) {
        this.dimensions = dimensions;
        
        // Create x scale for dimension positioning
        this.xScale = d3.scalePoint()
            .domain(dimensions)
            .range([0, this.width]);
        
        // Create y scale for each dimension
        dimensions.forEach(dim => {
            this.yScales[dim] = d3.scaleLinear()
                .domain(d3.extent(data, d => d[dim]))
                .range([this.height, 0]);
        });
    }

    // Path generator for parallel coordinates lines
    path = function(d) {
        return d3.line()(this.dimensions.map(dim => {
            return [this.xScale(dim), this.yScales[dim](d[dim])];
        }));
    }

    // Update axes
    updateAxes = function() {
        const axisGroup = this.matSvg.select(".axes");
        
        // Remove old axes
        axisGroup.selectAll(".dimension").remove();
        
        // Create new axes for each dimension
        const dimensionGroups = axisGroup.selectAll(".dimension")
            .data(this.dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", d => `translate(${this.xScale(d)}, 0)`);
        
        // Add axis for each dimension
        dimensionGroups.append("g")
            .attr("class", "axis")
            .each(function(d, i, nodes) {
                const axis = d3.axisLeft(this.yScales[d]);
                d3.select(nodes[i]).call(axis);
            }.bind(this));
        
        // Add dimension labels
        dimensionGroups.append("text")
            .attr("class", "dimension-label")
            .attr("text-anchor", "middle")
            .attr("y", -20)
            .text(d => d);
    }

    highlightSelectedItems = function(selectedItems) {
        // Create a set of selected indices for fast lookup
        const selectedIndices = new Set(selectedItems.map(item => item.index));

        // Update all lines by adding/removing 'selected' class
        this.matSvg.select(".foreground").selectAll(".data-line")
            .classed("selected", d => selectedIndices.has(d.index))
            .each(function(d) {
                if (selectedIndices.has(d.index)) {
                    d3.select(this).raise();
                }
            });
    }

    renderParallelCoordinates = function(visData, controllerMethods) {
        console.log("render parallel coordinates with new data list...");
        
        if (visData.length === 0) return;
        
        // Extract numeric dimensions
        const dimensions = this.extractDimensions(visData);
        if (dimensions.length === 0) return;
        
        // Update scales
        this.updateScales(visData, dimensions);
        
        // Update axes
        this.updateAxes();
        
        // Render lines in foreground
        const foreground = this.matSvg.select(".foreground");
        
        foreground.selectAll(".data-line")
            .data(visData, d => d.index)
            .join(
                enter => {
                    const lines = enter.append("path")
                        .attr("class", "data-line")
                        .attr("d", d => this.path(d))
                        .on("click", (event, itemData) => {
                            controllerMethods.handleOnClick(itemData);
                        })
                        .on("mouseenter", (event, itemData) => {
                            // Hover is handled by CSS :hover
                            d3.select(event.currentTarget).raise();
                        })
                        .on("mouseleave", (event, itemData) => {
                            // Return to appropriate state based on selection
                            const selectedIndices = new Set(
                                controllerMethods.getSelectedItems ? 
                                controllerMethods.getSelectedItems().map(item => item.index) : 
                                []
                            );
                            const isSelected = selectedIndices.has(itemData.index);
                            
                            // If selected, keep it raised
                            if (!isSelected) {
                                // Let other selected items stay on top
                                this.matSvg.select(".foreground").selectAll(".data-line.selected")
                                    .raise();
                            }
                        });
                    return lines;
                },
                update => {
                    update
                        .transition().duration(this.transitionDuration)
                        .attr("d", d => this.path(d));
                    return update;
                },
                exit => {
                    exit.remove();
                }
            );
    }

    clear = function() {
        d3.select(this.el).selectAll("*").remove();
    }
}

export default ParallelCoordinatesD3;
