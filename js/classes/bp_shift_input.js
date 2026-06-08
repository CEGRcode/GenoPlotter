const bpShiftInput = class {
    constructor(elementID) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };

        const self = this;
        this.element = d3.select("#" + elementID);
        this.label = this.element.append("td").append("label")
            .attr("id", "bp-shift-input-label")
            .classed("setting-label", true)
            .text("Shift:");
        this.textInput = this.element.append("td").append("input")
            .attr("type", "text")
            .attr("id", "bp-shift-text")
            .classed("setting-text", true)
            .on("change", function() {
                const bpShift = parseInt(this.value);
                if (isNaN(bpShift)) {
                    this.value = dataObj.globalSettings.bpShift;
                    return
                };
                dataObj.globalSettings.bpShift = bpShift;
                self.update();
                plotObj.updatePlot()
            });
        this.sliderInput = this.element.append("td")
            .classed("slider-container", true)
            .append("input")
                .attr("type", "range")
                .attr("id", "bp-shift-slider")
                .classed("global-slider", true)
                .attr("min", -50)
                .attr("max", 50)
                .on("input", function() {
                    dataObj.globalSettings.bpShift = parseInt(this.value);
                    self.textInput.node().value = dataObj.globalSettings.bpShift;
                    plotObj.updatePlot()
                });
        
        this.update()
    }

    update() {
        this.textInput.node().value = dataObj.globalSettings.bpShift;
        this.sliderInput.node().value = dataObj.globalSettings.bpShift
    }
}