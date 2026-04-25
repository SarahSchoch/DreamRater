# DreamRater

**DreamRater** is a browser-based application for human rating of dream reports on selected scales.

---

## Live Demo

Access the application via CodePen:  
[https://codepen.io/sarahschoch/pen/vYoegxy](https://codepen.io/sarahschoch/pen/vYoegxy)

---

## Required Input Files

DreamRater operates on two primary input files in `.xlsx` format:

### 1. Dream Reports File

An Excel file with at least the following columns:

| Column | Description |
|--------|-------------|
| `ID` | A unique identifier for each dream instance or participant |
| `Report` | The text of the dream report |
| `Source` | The original source field (used to classify and order reports) |
| `SurveyCompletedOn` | A timestamp or unique session indicator |

If dream reports are split into parts (such as last minute vs. earlier parts), the app uses `Source` and `SurveyCompletedOn` to order them and displays them side by side.

---

### 2. Rating Scales File

An Excel file defining the rating scales. Required columns:

| Column | Description |
|--------|-------------|
| `ScaleName` | The name/label of the scale |
| `ScaleType` | `Radio`, `Checkbox`, or `Numeric` (see below) |
| `Options` | Semicolon-separated value/label pairs (e.g., `0; Absent; 1; Present`) |
| `Explanation` | Brief explanation shown to raters on hover |
| `Group` | (Optional) Groups related scales under a shared header with a "Set all to zero" button |
| `RatingType` | Controls how the scale is rated across report parts (see below) |
| `DependsOn` | (Optional) Name of a parent scale — hides this scale unless the parent is rated > 0 |

#### Scale Types

- **Radio** — single-choice radio buttons; `Options` defines each value/label pair
- **Checkbox** — multi-select checkboxes; `Options` defines each value/label pair; saved as comma-separated values in the export
- **Numeric** — a numeric input field

#### Rating Types

| Value | Behavior |
|-------|----------|
| `mainOnly` | Rated for the main report only |
| `separate` | Rated separately for each report part |
| `combined` | Rated with a single combined selector covering both parts |
| `combinedBinary` | Rated for the main part with a binary indicator for the second part |
| `countToBinary` | Rated as a count for the main part; automatically converted to binary for the second part |

#### Embedded Domain and Type Scales

Scales whose `ScaleName` ends in `_Domain` or `_Type` are automatically embedded inside the card of their parent scale (matched by prefix). For example, `Bizarreness_Incongruity_Domain` is embedded within the `Bizarreness_Incongruity` card and appears only when the parent is rated > 0.

This convention allows domain coding (e.g., Character, Setting, Object) or type coding (e.g., Temporal, Social/role) to be displayed inline without taking up a separate card.

#### Conditional Display with DependsOn

Setting `DependsOn` to a parent scale name hides the scale entirely until the parent is rated > 0. Hidden scales are not required for a report to be marked as Rated.

---

## Features

- Upload and parse `.xlsx` files for dream reports and rating scales
- (Optional) Load a previously exported `.csv` to continue a rating session
- Automatically group and order reports into `Earlier` and `Last Minute` sections when applicable
- Display all relevant report text for contextual judgment
- Support for multiple scale types: radio buttons, multi-select checkboxes, numeric inputs
- Conditionally show scales based on a parent scale rating (`DependsOn`)
- Embed domain and type sub-scales within parent scale cards (`_Domain`, `_Type` suffix convention)
- Set all scales in a group to zero with a single button
- Record ratings locally in the browser as you navigate between reports
- Automatically track and display completion status (`Rated` / `Unrated`) for each report
- Export all ratings to `.csv` format with full metadata

---

## Export Format

The exported `.csv` contains one row per scale per report:

| Column | Description |
|--------|-------------|
| `User` | Rater's name (entered in the app) |
| `ReportID` | ID of the dream being rated |
| `ReportType` | `main`, `lastMinute`, or `binaryFlag` |
| `ScaleName` | Name of the scale |
| `Rating` | Selected rating value (checkbox selections are comma-separated) |

---

## Instructions for Use

1. Open the application in the browser.
2. Upload a properly formatted **dream reports file** and a **rating scales file**.
3. Optionally upload a previously exported **ratings CSV** to resume a session.
4. Enter your name to identify your rating session.
5. Review each dream report and apply ratings using the displayed interface.
6. Navigate between reports using the Previous/Next buttons or the dropdown selector.
7. Once finished, export your ratings as a `.csv`.

A report is marked **Rated** only when all required (visible) fields have been completed. Ratings are stored locally and can be revised before export.

### Walkthrough Video

Watch a brief demonstration of the app here:  
[View Video on Google Drive](https://drive.google.com/file/d/1FbnLocIqvcJMsKWHFEDzp5O1xSH563bZ/view?usp=sharing)

---

## Technologies Used

- Vue.js (dynamic rendering and state management)
- SheetJS (`.xlsx` and `.csv` parsing)
- FileSaver.js (CSV export)
- Pure browser-based logic (no backend or server required)

---

## License

This project is distributed under the MIT License. Free to use, modify, and redistribute with attribution.

---

## Acknowledgments

Developed by [Sarah Schoch](https://github.com/SarahSchoch).

This project was developed with assistance from **Claude** (Anthropic), used as a collaborative AI tool for prototyping and refinement.

For academic use, please cite or link back to the original repository.
