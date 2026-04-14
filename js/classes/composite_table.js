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
            this.headerRow.append("th");
            this.headerRow.append("th");
            this.headerRow.append("th");
            this.headerRow.append("th").classed("upload-col", true).text("Upload files");
            this.headerRow.append("th");
            this.headerRow.append("th")
        } else {
            this.headerRow.append("th");
            this.headerRow.append("th").classed("name-col", true).text("Name");
            this.headerRow.append("th").text("Color");
            this.headerRow.append("th").text("Scale")
                .append("div").attr("id", "normalization-toggle");
            this.headerRow.append("th").text("Opacity");
            this.headerRow.append("th").text("Smooth");
            this.headerRow.append("th").text("Shift");
            this.headerRow.append("th");
            this.headerRow.append("th");
            this.headerRow.append("th");

            this.normalizationToggle = new normalizationToggle("normalization-toggle")
        }

        this.table = thb.append("tbody");

        this.rows = [];
        this.nRows = 0;

        if (local) {
            this.addRow(dataObj.addCompositeData({idx: this.nRows}))
        }
    }

    addRow(compositeDataObj) {
        // Add the row
        this.rows.push(new compositeRow(
            this.table.append("tr").classed("composite-row", true),
            this.nRows,
            compositeDataObj,
            this.local
        ));
        this.nRows++
    }

    insertRowBefore(dragIdx, dropIdx) {
        // Move row elements
        const dragRow = this.rows[dragIdx],
            dropRow = this.rows[dropIdx];
        $(dragRow.row.node()).insertBefore(dropRow.row.node());

        // Update row array
        this.rows.splice(dropIdx - (dropIdx > dragIdx), 0, this.rows.splice(dragIdx, 1)[0]);

        // Update row indices
        for (const i in this.rows) {
            this.rows[i].updateIndex(i)
        };

        this.updateStickyRows()
    }

    insertRowAfter(dragIdx, dropIdx) {
        // Move row elements
        const dragRow = this.rows[dragIdx],
            dropRow = this.rows[dropIdx];
        $(dragRow.row.node()).insertAfter(dropRow.row.node());

        // Update row array
        this.rows.splice(dropIdx - (dropIdx >= dragIdx) + 1, 0, this.rows.splice(dragIdx, 1)[0]);

        // Update row indices
        for (const i in this.rows) {
            this.rows[i].updateIndex(parseInt(i))
        };

        this.updateStickyRows()
    }

    removeRow(idx) {
        for (let i = idx + 1; i < this.rows.length; i++) {
            this.rows[i].updateIndex(i - 1)
        };

        this.rows[idx].remove();
        this.rows.splice(idx, 1);
        this.nRows--
    }

    loadFromDataObject() {
        this.clear();
        if (typeof normalizationToggleObj !== "undefined") {
            normalizationToggleObj.update()
        };
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