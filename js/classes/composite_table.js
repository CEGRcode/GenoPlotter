const compositeTable = class {
    constructor(elementID, local=true) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };
        const self = this;

        this.container = d3.select("#" + elementID);
        this.container.append("h5").text("Composite settings:");
        const thb = this.container.append("table");
        this.headerRow = thb.append("thead").classed("tableFixHead", true);
        this.local = local;
        
        if (local) {
            this.addRowIcon = this.headerRow.append("th").append("i")
                .classed("add-row-icon fa-solid fa-2xl fa-circle-plus", true)
                .on("click", function() {
                    const compositeDataObj = dataObj.addCompositeData({idx: self.nRows});
                    self.addRow(compositeDataObj)
                });
            this.headerRow.append("th").classed("name-col", true).text("Name");
            this.headerRow.append("th").text("Color");
            this.headerRow.append("th").text("Scale");
            this.headerRow.append("th").text("Opacity");
            this.headerRow.append("th").text("Smooth");
            this.headerRow.append("th").text("Shift");
            this.headerRow.append("th").classed("actions-col", true).text("Actions");
            this.headerRow.append("th").classed("upload-col", true).text("Upload files");
            this.headerRow.append("th");
            this.headerRow.append("th")
        } else {
            this.headerRow.append("th");
            this.headerRow.append("th").classed("name-col", true).text("Name");
            this.headerRow.append("th").text("Color");
            this.headerRow.append("th").text("Scale")
                .append("div").attr("id", "normalization-select");
            this.headerRow.append("th").text("Opacity");
            this.headerRow.append("th").text("Smooth");
            this.headerRow.append("th").text("Shift");
            this.headerRow.append("th").classed("actions-col", true).text("Actions");

            this.normalizationSelectObj = new normalizationSelect("normalization-select")
        }

        this.table = thb.append("tbody");
        this.sortable = new Sortable(this.table.node(), {
            animation: 150,
            ghostClass: 'blue-background-class',
            onEnd: local ? function(ev) {
                self.updateRowOrder(ev.oldIndex - 1, ev.newIndex - 1);
                self.updateStickyRows();
                dataObj.moveCompositeData(ev.oldIndex - 1, ev.newIndex - 1);
                plotObj.updatePlot()
            } : function(ev) {
                self.updateRowOrder(ev.oldIndex - 1, ev.newIndex - 1);
                self.updateStickyRows();
                dataObj.moveCompositeData(ev.oldIndex - 1, ev.newIndex - 1);
                plotObj.updatePlot();
                targetSelectorObj.moveTarget(ev.oldIndex - 1, ev.newIndex - 1)
            }
        });

        this.rows = [];
        this.nRows = 0;

        this.placeholderRow = this.table.append("tr")
            .classed("placeholder-row", true)
            .on("mousedown", function() {self.sortable.option("disabled", true)})
            .on("mouseup", function() {self.sortable.option("disabled", false)})
            .on("mouseleave", function() {self.sortable.option("disabled", false)});
        if (local) {
            this.placeholderRow.append("td")
                .attr("colspan", 11)
                .text("Click the green \"+\" to create a composite")
        } else {
            this.placeholderRow.append("td")
                .attr("colspan", 8)
                .text("Select a target to create a composite")
        }
    }

    addRow(compositeDataObj) {
        if (this.nRows === 0) {
            if (this.local || dataObj.bedObj.reference_points.length > 0) {
                plotObj.togglePlaceholder(true)
            };
            this.placeholderRow.style("display", "none")
        };

        // Add the row
        this.rows.push(new compositeRow(
            this,
            this.table.append("tr").classed("composite-row", true),
            this.nRows,
            compositeDataObj,
            this.local
        ));
        this.nRows++
    }

    updateRowOrder(oldIdx, newIdx) {
        this.rows.splice(newIdx, 0, this.rows.splice(oldIdx, 1)[0]);
        for (const i in this.rows) {
            this.rows[i].updateIndex(i)
        }
    }

    removeRow(idx) {
        for (let i = idx + 1; i < this.rows.length; i++) {
            this.rows[i].updateIndex(i - 1)
        };

        this.rows[idx].remove();
        this.rows.splice(idx, 1);
        this.nRows--;

        if (this.nRows === 0) {
            plotObj.togglePlaceholder(false);
            this.placeholderRow.style("display", null)
        }
    }

    loadFromDataObject() {
        this.clear();
        for (const compositeDataObj of dataObj.compositeData) {
            this.addRow(compositeDataObj)
        }
    }

    clear() {
        this.rows = [];
        this.nRows = 0;
        this.table.selectAll(".composite-row").remove()
    }

    updateStickyRows() {
        let {height: y} = this.headerRow.node().getBoundingClientRect();
        this.table.selectAll("tr.composite-row.sticky")
            .each(function() {
                d3.select(this).style("top", y + "px");
                y += this.getBoundingClientRect().height
            })
    }
}