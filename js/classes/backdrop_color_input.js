const backdropColorInput = class {
    constructor(elementID) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };

        const self = this;
        this.element = d3.select("#" + elementID);
        this.label = this.element.append("label")
            .attr("for", "backdrop-color-input")
            .attr("id", "backdrop-color-label")
            .text("Backdrop color:");
        this.colorInput = this.element.append("input")
            .attr("type", "color")
            .attr("id", "backdrop-color-input")
            .on("change", function() {
                dataObj.globalSettings.backdropColor = this.value;
                plotObj.updatePlot()
            });

        this.update()
    }

    update() {
        this.colorInput.node().value = dataObj.globalSettings.backdropColor
    }
}