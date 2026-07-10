## Multi-Composite Visualization

Multi-composite plots allow you to overlay or stack signal intensity matrices (normalized read counts per base pair relative to centered genomic windows) from multiple samples or replicates simultaneously within GenoPlotter.

### Input File Format (.out)

GenoPlotter reads tab-delimited text files (`.out`) containing pre-calculated composite average values. When you use ScriptManager's GUI to process multiple BAM files at the same time, it packages the quantitative signal profiles sequentially into this single file.

The file structure alternates between coordinate tracking lines and dataset intensity values:

* **Coordinate Header Rows:** Rows containing step-by-step genomic offset positions (e.g., `-124.0`, `-123.0` ... `0.0` ... `125.0`) relative to your centered reference loci.
* **Data Values Rows:** The line immediately following a header row containing the name of the source matrix file followed by the normalized average read intensities matching each base pair position.

A typical multi-composite `.out` file layout looks like this:

```text
-124.0  -123.0  ... 0.0 ... 124.0   125.0
A_12141_filtered_sense.cdt  0.405   0.412   ... 6.04    ... 0.271   0.153
-124.0  -123.0  ... 0.0 ... 124.0   125.0
A_masterNoTag_20180928_sense.cdt    0.585   0.579   ... 0.52    ... 0.581   0.574 
```


### Generating the multi-composite matrix
Use ScriptManager's GUI to run a parallel tag pileup for multiple datasets against a single reference coordinate file. A tutorial can be found [here](https://pughlab.mbg.cornell.edu/scriptmanager-docs/docs/Guides/Tutorials/chipexo-tutorial/#52-heatmap-generator-can-only-generate-one-color-at-a-time-so-sense-and-anti-files-should-be-processed-separately-the-chip-exo-standard-for-strand-colors-is-sense--blue-and-anti--red).

1. Navigate to **Sequence Read Analysis** ➡️ **Tag Pileup**.
2. Load your reference BED file and add multiple BAM files to the queue.
3. Under **Output Heatmap Matrix**, select **CDT** and **uncheck Output GZIP** (GenoPlotter requires uncompressed files).
4. Click **Pile Tags**.

![scriptmanager_gui_screenshot](/images/multi_plot_gui.png)

### Loading into GenoPlotter
1. Open `local.html` using any modern web browser.
2. Click the `Upload multi-composite` button on the top left as shown below.
3. Upload your `.out` file

![local_create_composite](/images/multi_upload.png)

The multi-composite data will render automatically, showing both tracks simultaneously:

![multi_composite_result](/images/multi_composite.png)
