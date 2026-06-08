const smoothingInput = class {
    constructor(elementID) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };

        const self = this;
        this.element = d3.select("#" + elementID);
        this.label = this.element.append("td").append("label")
            .attr("id", "smoothing-input-label")
            .classed("setting-label", true)
            .text("Smoothing:");
        this.textInput = this.element.append("td").append("input")
            .attr("type", "text")
            .attr("id", "smoothing-text")
            .classed("setting-text", true)
            .on("change", function() {
                const smoothing = Math.floor(parseInt(this.value) / 2) * 2 + 1;
                if (isNaN(smoothing)) {
                    this.value = dataObj.globalSettings.smoothing;
                    return
                };
                dataObj.globalSettings.smoothing = Math.max(smoothing, 1);
                self.update();
                plotObj.updatePlot()
            });
        this.sliderInput = this.element.append("td")
            .classed("slider-container", true)
            .append("input")
                .attr("type", "range")
                .attr("id", "smoothing-slider")
                .classed("global-slider", true)
                .attr("min", 1)
                .attr("max", 31)
                .attr("step", 2)
                .on("input", function() {
                    dataObj.globalSettings.smoothing = parseInt(this.value);
                    self.textInput.node().value = dataObj.globalSettings.smoothing;
                    plotObj.updatePlot()
                });
        
        this.update()
    }

    update() {
        this.textInput.node().value = dataObj.globalSettings.smoothing;
        this.sliderInput.node().value = dataObj.globalSettings.smoothing
    }
}