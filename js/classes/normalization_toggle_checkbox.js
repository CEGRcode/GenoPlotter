const normalizationToggle = class {
    constructor(elementID) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };

        const self = this;
        this.element = d3.select("#" + elementID);
        this.checkbox = this.element.append("input")
            .attr("type", "checkbox")
            .attr("id", "normalization-toggle-checkbox")
            .on("change", async function() {
                dataObj.changeNormalization(this.checked);
                d3.selectAll(".normalization-factor-display").classed("greyed", !this.checked);
                await dataObj.autoscaleAxisLimits(false, true);
                xAxisInputObj.update();
                yAxisInputObj.update();
                plotObj.updatePlot()
            });
        this.label = this.element.append("label")
            .attr("for", "normalization-toggle-checkbox")
            .attr("id", "normalization-toggle-label")
            .classed("checkbox-label", true)
            .text("Toggle normalization");
        
        this.update()
    }

    update() {
        this.checkbox.property("checked", dataObj.globalSettings.normalization)
    }
}