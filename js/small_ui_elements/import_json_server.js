d3.select("#json-button").on("click", function() {
    d3.select("#json-loader").node().click()
});

d3.select("#json-loader").on("change", async function() {
    const overlay = d3.select("body").append("div")
        .attr("id", "import-json-overlay");
    overlay.append("h1")
        .classed("import-json-label", true)
        .text("Loading JSON session");
    overlay.append("div")
        .classed("loading-circle", true)
        .classed("large", true);
    await dataObj.importDataFromJSON(this.files[0], false);
    updateAll(false);
    overlay.remove()
})