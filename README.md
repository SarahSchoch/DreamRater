# DreamRater

**DreamRater** is a browser-based application for human rating of dream reports on selected scales.

---

## Live Demo

Access the application via CodePen:  
[https://codepen.io/sarahschoch/pen/vYoegxy](https://codepen.io/sarahschoch/pen/vYoegxy)

---

## Required Input Files

DreamRater operates on two primary input files in `.xlsx` format:

### 1. **Dream Reports File**
An Excel file with at least the following columns:

- `ID`: A unique identifier for each dream instance or participant
- `Report`: The text of the dream report
- `Source`: The original source field (used to classify and order reports)
- `SurveyCompletedOn`: A timestamp or unique session indicator

If dream reports are split into parts (such as last minute vs earlier parts) the app will use the `Source` and `SurveyCompletedOn` fields to order them and they will be displayed side by side.

### 2. **Rating Scales File**
An Excel file defining the rating scales. Required columns include:

- `ScaleName`: The name/label of the scale
- `ScaleType`: Either `Radio` (Radio buttons) or `Numeric` (selection of a value)
- `Options`: A semicolon-separated list to indicate options for Radio buttons (e.g., `0;Absent;1;Present`)
- `Explanation`: A brief explanation for raters which they will see when they hover over the scale name
- `Group`: (optional) Used to visually group related scales (leave empty if not used)
- `RatingType`: Specifies how the scale is used:
  - `mainOnly` Will only be rated for the main dream report
  - `separate` Will be rated separately for different parts of the dream
  - `combined` Will be rated together for the different parts
  - `combinedBinary` Will be rated for main part with binary measure for second part
  - `countToBinary` Will be rated for main part with binary measure for second part

---

## Features

- Upload and parse `.xlsx` files for dream reports and rating scales
- Automatically group and order reports into `Earlier` and `Last Minute` sections (if not applicable every dream will be displayed on a separate page)
- Display all relevant report text for contextual judgment
- Apply multiple rating types:
  - **Numeric counts**
  - **Binary checkboxes**
- Record ratings locally in the browser
- Automatically track completion status for each report
- Export all ratings to `.csv` format, including metadata (user name, report ID, scale name, etc.)

---

## Export Format

The exported `.csv` will contain:

| Column        | Description                              |
|---------------|------------------------------------------|
| `User`        | Rater's name (entered in the app)        |
| `ReportID`    | ID of the dream being rated              |
| `ReportType`  | `main`, `lastMinute`, `combined`, or `binaryFlag` |
| `ScaleName`   | Name of the scale                        |
| `Rating`      | Selected rating value                    |

---

## Instructions for Use

1. Open the application in the browser.
2. Upload a properly formatted **dream reports file** and a **rating scale file**.
3. Enter your name to identify your rating session.
4. Review each dream report and apply ratings using the displayed interface.
5. Progress through the list using the Next/Previous buttons.
6. Once completed, export your ratings as a `.csv`.

A report is considered “Rated” only if all required fields have been completed. Ratings are stored locally and can be reviewed or revised before export.

### Walkthrough Video

Watch a brief demonstration of the app here:  
[View Video on Google Drive](https://drive.google.com/file/d/1FbnLocIqvcJMsKWHFEDzp5O1xSH563bZ/view?usp=sharing)

---

## Technologies Used

- Vue.js (for dynamic rendering and state management)
- SheetJS (XLSX parsing)
- FileSaver.js (for CSV export)
- Pure browser-based logic (no backend or server)

---

## License

This project is distributed under the MIT License. Free to use, modify, and redistribute with attribution.

---

## Acknowledgments

Developed by [Sarah Schoch](https://github.com/SarahSchoch).

This project was developed with assistance from **ChatGPT** and **Claude**, used as collaborative AI tools for prototyping and refinement.

For academic use, please cite or link back to the original repository.
