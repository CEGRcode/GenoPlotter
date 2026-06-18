d3.select("#download-as-svg").on("click", function() {
    const overlay = d3.select("body").append("div")
        .attr("id", "download-svg-overlay")
        .on("click", function() {overlay.remove()});
    const prompt = overlay.append("div")
        .attr("id", "download-svg-prompt")
        .on("click", function(ev) {ev.stopPropagation()});

    // Add close button
    prompt.append("i")
        .classed("remove-icon fa-solid fa-lg fa-times-circle", true)
        .attr("id", "download-svg-close")
        .on("click", function() {overlay.remove()});

    // Add header + question
    prompt.append("h5").text("Download as SVG");
    prompt.append("p").text("Include legend with text labels?");

    // Add button options for types of SVG download
    const buttonContainer = prompt.append("div")
            .attr("id", "download-svg-button-container"),
        includeTextButton = buttonContainer.append("button")
            .attr("id", "include-text")
            .classed("panel-action-button", true)
            .text("Include labels")
            .on("click", function() {
                plotObj.downloadAsSVG(true);
                overlay.remove()
            }),
        excludeTextButton = buttonContainer.append("button")
            .attr("id", "exclude-text")
            .classed("panel-action-button", true)
            .text("Plot only")
            .on("click", function() {
                plotObj.downloadAsSVG();
                overlay.remove()
            });
})
