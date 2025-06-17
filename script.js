// used to order the reports that belong together. the "higher up" (earlier in the array) of the pair is "Earlier", the other one the "Last Minute"
const desiredOrder = [
  "Home_dream_recall_remark_4",
  "Home_dream_recall_remark",
  "Home_dream_recall_remark_4_1",
  "Home_dream_recall_remark_1",
  "Home_dream_recall_remark_4_1_1",
  "Home_dream_recall_remark_1_1",
  "Home_dream_recall_remark_4_1_1_1",
  "Home_dream_recall_remark_1_1_1"
];

const orderReports = (reports) => {
  // only 1 report --> no ordering needed
  if (reports.length === 1) {
    return reports;
  }
  
  // if Source is "Dream_Report", we have to check SurveyCompletedOn (experimental nights)
  if (reports[0].Source === 'Dream_Report') {
    
    reports.sort((a, b) => {
      const suffixA = a.SurveyCompletedOn.split("_").pop().toLowerCase();
      const suffixB = b.SurveyCompletedOn.split("_").pop().toLowerCase();

      const priorityA = suffixA === "longer" ? -1 : suffixA === "lastmin" ? 1 : 0;
      const priorityB = suffixB === "longer" ? -1 : suffixB === "lastmin" ? 1 : 0;

      return priorityA - priorityB;
    });
  } else {
    // dreams from non-experimental nights can be ordered by their Source (see desiredOrder)
    reports.sort((a, b) => {
      const indexA = desiredOrder.indexOf(a.Source);
      const indexB = desiredOrder.indexOf(b.Source);
      return indexA - indexB;
    });
  }
  
  return reports;
}

new Vue({
  el: '#app',
  data: {
    ratingScales: [],
    renderedScales: [],
    dreamReports: [],
    currentReportIndex: 0,
    currentReport: null,
    ratingsData: {},
    username: '',
    existingRatings: [],
    scaleFileLoaded: false,
    reportFileLoaded: false,
    saveMessage: '',
    scaleInputs: {
      main: {},      
      lastMinute: {}, 
      combined: {},   
      binaryFlags: {} // New property for binary flags
    },
    completedReports: []
  },

  computed: {
    ratingStatus() {
      return this.completedReports.includes(this.currentReport?.ID) ? 'Rated' : 'Unrated';
    },
  reversedReports() {
      if (!this.currentReport || !this.currentReport.reports) {
        return [];
      }
      return orderReports([...this.currentReport.reports]);
      //return [...this.currentReport.reports].reverse();
    },
    hasLastMinutePortion() {
      if (!this.currentReport) return false;
      return this.currentReport.reports && this.currentReport.reports.length > 1;
    }
  },

  watch: {
    scaleInputs: {
      handler() {
        this.saveCurrentRatings();
        this.updateCompletedReportsForCurrent();
      },
      deep: true
    }
  },

  methods: {
    getReportLabel(index) {
      const totalReports = this.reversedReports.length;
      if (totalReports === 1) return '';
      return index === 0 ? 'Earlier' : 'Last Minute';
    },

    getCombinedOptions() {
      return [
        { value: 'none', label: 'Not present in either part' },
        { value: 'main', label: 'Present in Earlier part only' },
        { value: 'both', label: 'Present in Both or last minute only' }
      ];
    },

    handleBinaryCheckboxChange(scaleName) {
      const isChecked = this.scaleInputs.binaryFlags?.[scaleName] || false;
      this.$set(this.scaleInputs.binaryFlags, scaleName, !isChecked);
    },

    handleLastMinuteCheckboxChange(scaleName, event) {
      this.$set(this.scaleInputs.lastMinute, scaleName, event.target.checked ? '1' : '0');
    },

    handleCombinedRatingChange(scaleName) {
      const value = this.scaleInputs.combined[scaleName];
      switch(value) {
        case 'none':
          this.$set(this.scaleInputs.main, scaleName, '0');
          this.$set(this.scaleInputs.lastMinute, scaleName, '0');
          break;
        case 'main':
          this.$set(this.scaleInputs.main, scaleName, '1');
          this.$set(this.scaleInputs.lastMinute, scaleName, '0');
          break;
        case 'both':
          this.$set(this.scaleInputs.main, scaleName, '1');
          this.$set(this.scaleInputs.lastMinute, scaleName, '1');
          break;
      }
      this.updateCompletedReportsForCurrent();
    },
    handleCountToBinaryChange(scaleName) {
      const value = this.scaleInputs.main[scaleName];
      this.$set(this.scaleInputs.lastMinute, scaleName, value > 0 ? '1' : '0');
      this.updateCompletedReportsForCurrent();
    },

    parseExcelFile(file, callback) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          console.log('Parsed data:', jsonData);
          callback(jsonData);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          alert('There was an error reading the Excel file. Please ensure it is properly formatted.');
        }
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('There was an error reading the file.');
      };
      reader.readAsBinaryString(file);
    },

    handleScaleFile(event) {
      const file = event.target.files[0];
      if (file) {
        this.parseExcelFile(file, (data) => {
          this.ratingScales = data.map((row) => ({
            ScaleName: row['ScaleName'] || '',
            ScaleType: row['ScaleType'] || '',
            Options: row['Options'] || '',
            Explanation: row['Explanation'] || '',
            Group: row['Group'] || null,
            RatingType: row['RatingType'] || 'separate' // Default to separate if not specified
          }));
          this.processRenderedScales();
          this.scaleFileLoaded = true;
        });
      }
    },

    handleReportFile(event) {
      const file = event.target.files[0];
      if (file) {
        this.parseExcelFile(file, (data) => {
          const groupedReports = {};
          data.forEach((row) => {
            const ID = row['ID'];
            if (!groupedReports[ID]) {
              groupedReports[ID] = { ID, reports: [] };
            }
            groupedReports[ID].reports.push({
              Report: row['Report'],
              Source: row['Source'],
              SurveyCompletedOn: row['SurveyCompletedOn']
                                            
            });
          });
          this.dreamReports = Object.values(groupedReports);
          this.currentReportIndex = 0;
          this.currentReport = this.dreamReports[0];
          this.reportFileLoaded = true;
          this.loadCurrentRatings();
        });
      }
    },

    parseCSVFile(file, callback) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvData = e.target.result;
          const workbook = XLSX.read(csvData, { type: 'binary', raw: true });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
          callback(jsonData);
        } catch (error) {
          console.error('Error parsing CSV file:', error);
          alert('There was an error reading the CSV file. Please ensure it is properly formatted.');
        }
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('There was an error reading the file.');
      };
      reader.readAsBinaryString(file);
    },

    handleRatingFile(event) {
      const file = event.target.files[0];
      if (file) {
        this.parseCSVFile(file, (data) => {
          this.existingRatings = data;
          for (const row of data) {
            if (row.User === this.username) {
              if (!this.ratingsData[row.ReportID]) {
                this.ratingsData[row.ReportID] = {
                  main: {},
                  lastMinute: {},
                  binaryFlags: {}  // Add this
                };
              }
              if (row.ReportType === 'binaryFlag') {
                this.ratingsData[row.ReportID].binaryFlags[row.ScaleName] = row.Rating === '1';
              } else {
                const reportType = row.ReportType || 'main';
                this.ratingsData[row.ReportID][reportType][row.ScaleName] = row.Rating;
              }
            }
          }
          this.loadCurrentRatings();
          this.updateCompletedReports();
        });
      }
    },
    parseOptions(optionsString) {
      const optionsArray = optionsString.split(';');
      const options = [];
      for (let i = 0; i < optionsArray.length; i += 2) {
        options.push({
          value: optionsArray[i],
          label: optionsArray[i + 1]
        });
      }
      return options;
    },

    processRenderedScales() {
      this.renderedScales = [];
      const groups = {};
      this.ratingScales.forEach(scale => {
        if (scale.Group) {
          if (!groups[scale.Group]) {
            groups[scale.Group] = {
              isGroup: true,
              groupName: scale.Group,
              scales: []
            };
            this.renderedScales.push(groups[scale.Group]);
          }
          groups[scale.Group].scales.push(scale);
        } else {
          this.renderedScales.push(scale);
        }
      });
    },

    setGroupToZero(groupName) {
      const groupScales = this.ratingScales.filter(scale => scale.Group === groupName);
      groupScales.forEach(scale => {
        if (scale.ScaleType === 'Radio') {
          this.$set(this.scaleInputs.main, scale.ScaleName, '0');
          if (this.hasLastMinutePortion) {
            this.$set(this.scaleInputs.lastMinute, scale.ScaleName, '0');
          }
          if (this.hasLastMinutePortion && 
              (scale.RatingType === 'combined' || scale.RatingType === 'combinedBinary')) {
            this.$set(this.scaleInputs.combined, scale.ScaleName, 'none');
            if (scale.RatingType === 'combinedBinary') {
              this.$set(this.scaleInputs.binaryFlags, scale.ScaleName, false);
            }
          }
        } else if (scale.ScaleType === 'Numeric') {
          this.$set(this.scaleInputs.main, scale.ScaleName, 0);
          if (this.hasLastMinutePortion && scale.RatingType !== 'mainOnly') {
            this.$set(this.scaleInputs.lastMinute, scale.ScaleName, 0);
          }
        }
      });
      this.updateCompletedReportsForCurrent();
    },

    loadCurrentRatings() {
      if (!this.currentReport) return;
      
      const ratings = this.ratingsData[this.currentReport.ID] || 
        { main: {}, lastMinute: {}, combined: {}, binaryFlags: {} };
      
      // Reset scale inputs
      this.scaleInputs = {
        main: {},
        lastMinute: {},
        combined: {},
        binaryFlags: {}
      };

      // Load ratings for each scale based on its type
      for (const scale of this.ratingScales) {
        if (this.hasLastMinutePortion && 
            (scale.RatingType === 'combined' || scale.RatingType === 'combinedBinary')) {
          // Set combined value based on main and last minute ratings
          const mainValue = ratings.main[scale.ScaleName];
          const lastMinValue = ratings.lastMinute[scale.ScaleName];
          
          if (mainValue === '0' && lastMinValue === '0') {
            this.$set(this.scaleInputs.combined, scale.ScaleName, 'none');
          } else if (mainValue === '1' && lastMinValue === '0') {
            this.$set(this.scaleInputs.combined, scale.ScaleName, 'main');
          } else if (mainValue === '1' && lastMinValue === '1') {
            this.$set(this.scaleInputs.combined, scale.ScaleName, 'both');
          }

          if (scale.RatingType === 'combinedBinary') {
            this.$set(this.scaleInputs.binaryFlags, scale.ScaleName, 
              ratings.binaryFlags[scale.ScaleName] || false);
          }
        }
        
        this.$set(this.scaleInputs.main, scale.ScaleName, 
          ratings.main[scale.ScaleName] !== undefined ? ratings.main[scale.ScaleName] : '');
        
        if (this.hasLastMinutePortion && scale.RatingType !== 'mainOnly') {
          this.$set(this.scaleInputs.lastMinute, scale.ScaleName,
            ratings.lastMinute[scale.ScaleName] !== undefined ? ratings.lastMinute[scale.ScaleName] : '');
        }
      }

      this.updateCompletedReportsForCurrent();
    },

    updateCompletedReports() {
      this.completedReports = [];
      for (const report of this.dreamReports) {
        const reportID = report.ID;
        let allRated = this.checkReportCompletion(reportID);
        if (allRated) {
          this.completedReports.push(reportID);
        }
      }
    },

    checkReportCompletion(reportID) {
      const ratings = this.ratingsData[reportID] || { main: {}, lastMinute: {}, binaryFlags: {} };
      const report = this.dreamReports.find(r => r.ID === reportID);
      
      return this.ratingScales.every(scale => {
        const mainValue = ratings.main[scale.ScaleName];
        const isMainRated = mainValue !== undefined && mainValue !== '' && mainValue !== null;
        
        if (report.reports && report.reports.length > 1 && scale.RatingType !== 'mainOnly') {
          const lastMinValue = ratings.lastMinute[scale.ScaleName];
          const isLastMinRated = lastMinValue !== undefined && lastMinValue !== '' && lastMinValue !== null;

          if (scale.RatingType === 'combinedBinary') {
            const binaryFlagValue = ratings.binaryFlags[scale.ScaleName];
            return isMainRated && isLastMinRated && binaryFlagValue !== undefined;
          }
          
          return isMainRated && isLastMinRated;
        }
        
        return isMainRated;
      });
    },

    updateCompletedReportsForCurrent() {
      if (!this.currentReport) return;
      
      const reportID = this.currentReport.ID;
      let allRated = this.checkReportCompletion(reportID);

      if (allRated && !this.completedReports.includes(reportID)) {
        this.completedReports.push(reportID);
      } else if (!allRated && this.completedReports.includes(reportID)) {
        this.completedReports = this.completedReports.filter(id => id !== reportID);
      }
    },
    nextReport() {
      this.saveCurrentRatings();
      if (this.currentReportIndex < this.dreamReports.length - 1) {
        this.currentReportIndex += 1;
        this.currentReport = this.dreamReports[this.currentReportIndex];
        this.loadCurrentRatings();
      } else {
        this.saveMessage = 'This is the last report.';
      }
    },

    previousReport() {
      this.saveCurrentRatings();
      if (this.currentReportIndex > 0) {
        this.currentReportIndex -= 1;
        this.currentReport = this.dreamReports[this.currentReportIndex];
        this.loadCurrentRatings();
      } else {
        this.saveMessage = 'This is the first report.';
      }
    },

    onReportSelect() {
      this.saveCurrentRatings();
      this.currentReport = this.dreamReports[this.currentReportIndex];
      this.loadCurrentRatings();
    },

    saveCurrentRatings() {
      if (!this.currentReport) return;

      if (!this.ratingsData[this.currentReport.ID]) {
        this.ratingsData[this.currentReport.ID] = {
          main: {},
          lastMinute: {},
          binaryFlags: {}
        };
      }

      // Save ratings for each scale based on type
      for (const scale of this.ratingScales) {
        if (this.hasLastMinutePortion && 
            (scale.RatingType === 'combined' || scale.RatingType === 'combinedBinary')) {
          // Handle combined ratings
          const combinedValue = this.scaleInputs.combined[scale.ScaleName];
          switch(combinedValue) {
            case 'none':
              this.ratingsData[this.currentReport.ID].main[scale.ScaleName] = '0';
              this.ratingsData[this.currentReport.ID].lastMinute[scale.ScaleName] = '0';
              break;
            case 'main':
              this.ratingsData[this.currentReport.ID].main[scale.ScaleName] = '1';
              this.ratingsData[this.currentReport.ID].lastMinute[scale.ScaleName] = '0';
              break;
            case 'both':
              this.ratingsData[this.currentReport.ID].main[scale.ScaleName] = '1';
              this.ratingsData[this.currentReport.ID].lastMinute[scale.ScaleName] = '1';
              break;
          }
          
          if (scale.RatingType === 'combinedBinary') {
            this.ratingsData[this.currentReport.ID].binaryFlags[scale.ScaleName] = 
              this.scaleInputs.binaryFlags[scale.ScaleName] || false;
          }
        } else {
          // Save main rating
          this.ratingsData[this.currentReport.ID].main[scale.ScaleName] = 
            this.scaleInputs.main[scale.ScaleName];
          
          // Save last minute rating if applicable
          if (this.hasLastMinutePortion && scale.RatingType !== 'mainOnly') {
            if (scale.RatingType === 'countToBinary') {
              const mainValue = this.scaleInputs.main[scale.ScaleName];
              this.ratingsData[this.currentReport.ID].lastMinute[scale.ScaleName] = 
                mainValue > 0 ? '1' : '0';
            } else {
              this.ratingsData[this.currentReport.ID].lastMinute[scale.ScaleName] = 
                this.scaleInputs.lastMinute[scale.ScaleName];
            }
          }
        }
      }

      this.saveMessage = `Ratings for report ${this.currentReport.ID} saved locally.`;
      this.updateCompletedReportsForCurrent();
    },

    saveAllRatingsToCSV() {
      if (!this.username) {
        this.saveMessage = 'Please enter your name before saving.';
        return;
      }
      
      this.saveCurrentRatings();
      const csvData = [];
      
      for (const reportID in this.ratingsData) {
        // Add main report ratings
        for (const scaleName in this.ratingsData[reportID].main) {
          csvData.push({
            User: this.username,
            ReportID: reportID,
            ReportType: 'main',
            ScaleName: scaleName,
            Rating: this.ratingsData[reportID].main[scaleName]
          });
        }
        
        // Add last minute ratings
        if (Object.keys(this.ratingsData[reportID].lastMinute).length > 0) {
          for (const scaleName in this.ratingsData[reportID].lastMinute) {
            csvData.push({
              User: this.username,
              ReportID: reportID,
              ReportType: 'lastMinute',
              ScaleName: scaleName,
              Rating: this.ratingsData[reportID].lastMinute[scaleName]
            });
          }
        }

        // Add binary flags
        for (const scaleName in this.ratingsData[reportID].binaryFlags) {
          csvData.push({
            User: this.username,
            ReportID: reportID,
            ReportType: 'binaryFlag',
            ScaleName: scaleName,
            Rating: this.ratingsData[reportID].binaryFlags[scaleName] ? '1' : '0'
          });
        }
      }

      const worksheet = XLSX.utils.json_to_sheet(csvData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ratings');
      const wbout = XLSX.write(workbook, { bookType: 'csv', type: 'array' });
      const blob = new Blob([wbout], { type: 'text/csv;charset=utf-8;' });
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
      saveAs(blob, `ratings_${this.username}_${timestamp}.csv`);
      this.saveMessage = 'All ratings saved and downloaded as CSV file.';
    },

    getRatingStatus(reportID) {
      return this.completedReports.includes(reportID) ? 'Rated' : 'Unrated';
    }
  }
});