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
    
    // Store dimension types
    dimensionTypes = {}; // 'linear', 'point', or 'categorical'
    
    // Dimensions to display (numeric attributes)
    dimensions = [];
    
    // All available dimensions
    allDimensions = [];
    
    // Brushes for each dimension
    brushes = {};
    brushRanges = {};
    
    // Store data reference for filtering
    visData = [];
    
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
        
        this.matSvg.append("g")
            .attr("class", "foreground");
        
        // Create group for axes
        this.matSvg.append("g")
            .attr("class", "axes");
    }

    // Function to extract all dimensions (numeric and categorical) from data
    extractDimensions = function(data) {
        if (data.length === 0) return [];
        
        const firstItem = data[0];
        // Get all dimensions except 'index'
        const allDimensions = Object.keys(firstItem).filter(key => key !== 'index');
        
        return allDimensions;
    }

    // Function to determine dimension type
    categorizeDimension = function(data, dimension) {
        if(dimension === "price" || dimension === "area")
            return 'linear';
        
        // Safely check the first value of the dimension in the data array
        if (typeof data[0][dimension] === 'number')
            return 'point';
        return 'categorical';
    }

    // Update scales for each dimension
    updateScales = function(data, dimensions) {
        this.dimensions = dimensions;
        
        // Create x scale for dimension positioning (using indices instead of dimension names)
        // Add padding on both sides to prevent choiceboxes from being cut off
        const axisPadding = 80; // Padding in pixels on each side
        this.xScale = d3.scalePoint()
            .domain(d3.range(dimensions.length))
            .range([axisPadding, this.width - axisPadding]);
        
        // Create y scale for each dimension based on its type
        dimensions.forEach(dim => {
            const dimType = this.categorizeDimension(data, dim);
            this.dimensionTypes[dim] = dimType;
            
            const values = data.map(d => d[dim]);
            
            if (dimType === 'linear') {
                // Continuous numeric scale
                this.yScales[dim] = d3.scaleLinear()
                    .domain(d3.extent(data, d => d[dim]))
                    .range([this.height, 0]);
            } else if (dimType === 'point') {
                // Discrete numeric scale
                const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
                this.yScales[dim] = d3.scalePoint()
                    .domain(uniqueValues)
                    .range([this.height, 0])
                    .padding(0.5);
            } else {
                // Categorical scale
                const uniqueValues = [...new Set(values)].sort();
                this.yScales[dim] = d3.scalePoint()
                    .domain(uniqueValues)
                    .range([this.height, 0])
                    .padding(0.5);
            }
        });
    }

    // Path generator for parallel coordinates lines
    path = function(d) {
        return d3.line()(this.dimensions.map((dim, i) => {
            return [this.xScale(i), this.yScales[dim](d[dim])];
        }));
    }

    // Update axes
    updateAxes = function(controllerMethods) {
        const axisGroup = this.matSvg.select(".axes");
        const self = this;
        
        console.log("updateAxes - allDimensions:", self.allDimensions);
        console.log("updateAxes - dimensions to display:", self.dimensions);
        
        // Remove old axes
        axisGroup.selectAll(".dimension").remove();
        
        // Create new axes for each dimension (using indices)
        const dimensionGroups = axisGroup.selectAll(".dimension")
            .data(this.dimensions.map((dim, i) => ({dim, index: i})))
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", d => `translate(${this.xScale(d.index)}, 0)`);
        
        // Add axis for each dimension (with appropriate formatting based on type)
        dimensionGroups.append("g")
            .attr("class", d => `axis axis-${self.dimensionTypes[d.dim]}`)
            .each(function(d, i, nodes) {
                const dimType = self.dimensionTypes[d.dim];
                let axis = d3.axisLeft(self.yScales[d.dim]);
                
                if (dimType === 'categorical' || dimType === 'point') {
                    // For categorical and point scales, show all tick labels
                    axis.tickValues(self.yScales[d.dim].domain());
                } else {
                    // For linear scales, use default ticks
                    axis.ticks(8);
                }
                
                d3.select(nodes[i]).call(axis);
            });
        
        // Add drag handle (icon) above dropdown
        const dragHandles = dimensionGroups.append("text")
            .attr("class", "drag-handle")
            .attr("x", 0)
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .style("cursor", "grab")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("user-select", "none")
            .text("::");
        
        // Add foreignObject for dropdown
        const dropdowns = dimensionGroups.append("foreignObject")
            .attr("class", "dimension-dropdown-container")
            .attr("x", -60)
            .attr("y", -50)
            .attr("width", 120)
            .attr("height", 30);
        
        // Add select element
        dropdowns.append("xhtml:select")
            .attr("class", "dimension-select")
            .on("change", function(event, d) {
                const newDimension = event.target.value;
                self.changeDimension(d.index, newDimension, controllerMethods);
            })
            .selectAll("option")
            .data(self.allDimensions)
            .enter().append("xhtml:option")
            .attr("value", dim => dim)
            .property("selected", (dim, i, nodes) => {
                const parentData = d3.select(nodes[i].parentNode).datum();
                return dim === parentData.dim;
            })
            .text(dim => dim);
        
        // Add drag behavior
        this.addDragBehavior(dimensionGroups, controllerMethods);
        
        // Add brush for each dimension
        this.addBrushes(dimensionGroups, controllerMethods);
    }
    
    // Add drag behavior to reorder axes
    addDragBehavior = function(dimensionGroups, controllerMethods) {
        const self = this;
        
        const drag = d3.drag()
            .on("start", function(event, d) {
                d3.select(this).style("cursor", "grabbing");
                d3.select(this).raise();
            })
            .on("drag", function(event, d) {
                // Update the position during drag
                const x = event.x;
                d3.select(this).attr("transform", `translate(${x}, 0)`);
            })
            .on("end", function(event, d) {
                d3.select(this).style("cursor", "grab");
                
                // Find the nearest axis position
                const x = event.x;
                const positions = self.dimensions.map((dim, i) => self.xScale(i));
                
                // Find closest position
                let closestIndex = 0;
                let minDist = Math.abs(x - positions[0]);
                
                for (let i = 1; i < positions.length; i++) {
                    const dist = Math.abs(x - positions[i]);
                    if (dist < minDist) {
                        minDist = dist;
                        closestIndex = i;
                    }
                }
                
                // Swap dimensions if moved to a different position
                if (closestIndex !== d.index) {
                    // Reorder the dimensions array
                    const temp = [...self.dimensions];
                    const movedDim = temp[d.index];
                    temp.splice(d.index, 1);
                    temp.splice(closestIndex, 0, movedDim);
                    self.dimensions = temp;
                    
                    // Re-render the parallel coordinates
                    self.renderParallelCoordinates(self.visData, controllerMethods);
                } else {
                    // Snap back to original position
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("transform", `translate(${self.xScale(d.index)}, 0)`);
                }
            });
        
        // Apply drag to the drag handle
        dimensionGroups.select(".drag-handle").call(drag);
    }
    
    // Method to change dimension at a specific axis position
    changeDimension = function(axisIndex, newDimension, controllerMethods) {
        // Update the dimension at this index
        this.dimensions[axisIndex] = newDimension;
        
        // Update the y scale for the new dimension if not already present
        if (!this.yScales[newDimension]) {
            const dimType = this.categorizeDimension(this.visData, newDimension);
            this.dimensionTypes[newDimension] = dimType;
            
            const values = this.visData.map(d => d[newDimension]);
            
            if (dimType === 'linear') {
                this.yScales[newDimension] = d3.scaleLinear()
                    .domain(d3.extent(this.visData, d => d[newDimension]))
                    .range([this.height, 0]);
            } else if (dimType === 'point') {
                const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
                this.yScales[newDimension] = d3.scalePoint()
                    .domain(uniqueValues)
                    .range([this.height, 0])
                    .padding(0.5);
            } else {
                const uniqueValues = [...new Set(values)].sort();
                this.yScales[newDimension] = d3.scalePoint()
                    .domain(uniqueValues)
                    .range([this.height, 0])
                    .padding(0.5);
            }
        }
        
        // Clear brush for this axis
        const oldBrushKey = Object.keys(this.brushRanges).find(key => 
            this.dimensions.indexOf(key) === axisIndex || key.endsWith(`_${axisIndex}`)
        );
        if (oldBrushKey) {
            delete this.brushRanges[oldBrushKey];
        }
        
        // Re-render
        this.renderParallelCoordinates(this.visData, controllerMethods);
    }
    
    // Add brushes to each axis
    addBrushes = function(dimensionGroups, controllerMethods) {
        const self = this;
        
        dimensionGroups.each(function(d) {
            const dimensionGroup = d3.select(this);
            const dimension = d.dim;
            const axisIndex = d.index;
            
            // Create a brush for this dimension
            const brush = d3.brushY()
                .extent([[-10, 0], [10, self.height]])
                .on("start brush end", function(event) {
                    self.handleBrush(event, dimension, axisIndex, controllerMethods);
                });
            
            // Store the brush with a unique key
            const brushKey = `${dimension}_${axisIndex}`;
            self.brushes[brushKey] = brush;
            
            // Add brush group
            dimensionGroup.append("g")
                .attr("class", "brush")
                .call(brush);
        });
    }
    
    // Handle brush events
    handleBrush = function(event, dimension, axisIndex, controllerMethods) {
        const selection = event.selection;
        const brushKey = `${dimension}_${axisIndex}`;
        
        // On brush start, clear scatterplot 2D brush
        if (event.type === "start" && selection) {
            if (controllerMethods.clearOtherBrushes) {
                controllerMethods.clearOtherBrushes();
            }
        }
        
        if (selection === null) {
            // Brush cleared on this dimension
            delete this.brushRanges[brushKey];
        } else {
            // Store the brush range for this dimension
            const [y0, y1] = selection;
            const scale = this.yScales[dimension];
            const dimType = this.dimensionTypes[dimension];
            
            if (dimType === 'linear') {
                // For linear scales, use invert
                const range = [scale.invert(y1), scale.invert(y0)];
                this.brushRanges[brushKey] = {type: 'linear', range};
            } else {
                // For point and categorical scales, find selected values
                const domain = scale.domain();
                const selectedValues = domain.filter(d => {
                    const pos = scale(d);
                    return pos >= y0 && pos <= y1;
                });
                this.brushRanges[brushKey] = {type: 'categorical', values: selectedValues};
            }
        }
        
        // Filter data based on all active brushes
        this.filterByBrushes(controllerMethods);
    }
    
    // Filter data based on brush selections
    filterByBrushes = function(controllerMethods) {
        if (!this.visData || this.visData.length === 0) return;
        
        // If no brushes are active, clear selection
        if (Object.keys(this.brushRanges).length === 0) {
            if (controllerMethods.handleBrushSelection) {
                controllerMethods.handleBrushSelection([]);
            }
            return;
        }
        
        // Filter data based on all brush ranges
        const selectedItems = this.visData.filter(item => {
            // Item must be within ALL brush ranges
            return Object.keys(this.brushRanges).every(brushKey => {
                const brushData = this.brushRanges[brushKey];
                // Extract dimension name from brush key (format: "dimension_axisIndex")
                const dimension = brushKey.substring(0, brushKey.lastIndexOf('_'));
                const value = item[dimension];
                
                if (brushData.type === 'linear') {
                    const [min, max] = brushData.range;
                    return value >= min && value <= max;
                } else {
                    // For categorical/point, check if value is in selected values
                    return brushData.values.includes(value);
                }
            });
        });
        
        // Update selection
        if (controllerMethods.handleBrushSelection) {
            controllerMethods.handleBrushSelection(selectedItems);
        }
    }
    
    // Clear all brushes programmatically
    clearAllBrushes = function() {
        // Clear all brush ranges
        this.brushRanges = {};
        
        // Clear visual brushes on all axes
        this.matSvg.selectAll(".brush").each(function() {
            d3.select(this).call(d3.brushY().move, null);
        });
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
        
        // Store data reference for brush filtering
        this.visData = visData;
        
        // Extract numeric dimensions
        const allDimensions = this.extractDimensions(visData);
        if (allDimensions.length === 0) return;
        
        // Store all available dimensions
        this.allDimensions = allDimensions;
        
        console.log("All available dimensions:", allDimensions);
        
        // Initialize dimensions if not set
        if (this.dimensions.length === 0) {
            // Use first 6 dimensions for display (but all are available in dropdowns)
            this.dimensions = allDimensions.slice(0, Math.min(6, allDimensions.length));
        } else {
            // Validate current dimensions still exist in the data
            this.dimensions = this.dimensions.filter(dim => allDimensions.includes(dim));
            // If some were removed, add new ones up to 6
            if (this.dimensions.length < Math.min(6, allDimensions.length)) {
                const needed = Math.min(6, allDimensions.length) - this.dimensions.length;
                const toAdd = allDimensions.filter(dim => !this.dimensions.includes(dim)).slice(0, needed);
                this.dimensions = [...this.dimensions, ...toAdd];
            }
        }
        
        console.log("Dimensions to display:", this.dimensions);
        
        // Update scales
        this.updateScales(visData, this.dimensions);
        
        // Update axes (with brushes)
        this.updateAxes(controllerMethods);
        
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
