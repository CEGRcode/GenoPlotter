const backdropOpacityInput = class {
    constructor(elementID) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };

        const self = this;
        this.element = d3.select("#" + elementID);
        this.label = this.element.append("label")
            .attr("for", "backdrop-opacity-input")
            .attr("id", "backdrop-opacity-label")
            .text("Backdrop opacity:");
        this.opacityInput = this.element.append("input")
            .attr("type", "number")
            .attr("id", "backdrop-opacity-input")
            .attr("min", 0)
            .attr("max", 1)
            .attr("step", .1)
            .on("change", function() {
                dataObj.globalSettings.backdropOpacity = this.value;
                plotObj.updatePlot()
            });

        this.update()
    }

    update() {
        this.opacityInput.node().value = dataObj.globalSettings.backdropOpacity
    }
}