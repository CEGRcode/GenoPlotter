d3.select("#download-as-svg").on("click", function() {
    // Create a prompt to ask if the user wants to include the legend and text labels in the downloaded SVG
    const prompt = d3.select("body").append("div")
        .attr("id", "download-svg-prompt")
    prompt.append("p").text("Include legend and text labels?");
    const buttonContainer = prompt.append("div")
            .attr("id", "download-svg-button-container"),
        includeTextButton = buttonContainer.append("button")
            .attr("id", "include-text")
            .text("Include labels"),
        excludeTextButton = buttonContainer.append("button")
            .attr("id", "exclude-text")
            .text("Plot only"),
        cancelDownloadButton = buttonContainer.append("button")
            .attr("id", "cancel-download")
            .text("Cancel");

    includeTextButton.on("click", function() {
        plotObj.downloadAsSVG();
        prompt.remove()
    });

    excludeTextButton.on("click", function() {
        plotObj.downloadAsSVG(true);
        prompt.remove()
    });

    cancelDownloadButton.on("click", function() {
        prompt.remove()
    })
})