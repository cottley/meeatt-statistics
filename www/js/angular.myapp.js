/*jslint nomen: true, sloppy: true */
/*global angular, _, console, numeral, $ */

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
        return this.lastIndexOf(str, 0) === 0;
    };
}

if (typeof Array.prototype.compare !== 'function') {

    // attach the .compare method to Array's prototype to call it on any array
    Array.prototype.compare = function (array) {
        var i, l;
        
        // if the other array is a falsy value, return
        if (!array) { return false; }

        // compare lengths - can save a lot of time
        if (this.length !== array.length) { return false; }

        for (i = 0, l = this.length; i < l; i += 1) {
            // Check if we have nested arrays
            if (this[i] instanceof Array && array[i] instanceof Array) {
                // recurse into the nested arrays
                if (!this[i].compare(array[i])) { return false; }
            } else if (this[i] !== array[i]) {
                // Warning - two different object instances will never be equal: {x:20} != {x:20}
                return false;
            }
        }
        return true;
    };

}

var myApp = angular.module('myApp', []);
    
var controllers = {};
      
controllers.myAppController = function ($scope, $http) {

    $scope._legacydata = [];
  
    $scope._currentdata = [];
    
    $scope._abbreviations = [];
    
    $scope._codeDescriptions = [];
    
    $scope._tabledata = [];
    
    $scope.filter_availableYears = [];
    
    $scope.filter_availableMonths = [];
    
    $scope.filter_availableOperators = [];
    
    $scope.filter_allAvailableOperators = [];
    
    $scope.filter_includeAllOperators = true;
    
    $scope.calculated_reportData = [];
    
    $scope.calculated_reportDataByOperator = [];
    
    $scope._defaultOperatorFilter = ["LAND", "MARINE"];
  
    $scope.setAvailableYears = function () {
        var result = [], data = $scope._tabledata, years = [], i;
        for (i = 0; i < data.length; i += 1) {
            if (data[i].year) {
                years.push(data[i].year);
            }
        }
        result = _.sortBy(_.uniq(years), function (year) { return -year; });
        $scope.filter_availableYears = result;
    };
    
    $scope.setAvailableMonths = function () {
        var result = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        $scope.filter_availableMonths = result;
    };
  
    $scope.setAvailableOperators = function () {
        var result = [], data = $scope._tabledata, operators = [], i;
        for (i = 0; i < data.length; i += 1) {
            if (data[i].codecat === "operator") {
                if ((data[i].code !== "LAND") &&  (data[i].code !== "MARINE")) {
                    operators.push(data[i].code);
                }
            }
        }
        result = _.sortBy(_.uniq(operators), function (operator) { return operator; });
        $scope.filter_allAvailableOperators = result;
        $scope.filter_availableOperators = result;
    };

  
    $scope.reportSections = [
        { id: '1A', title: 'Crude Oil and Condensate Production' },
        { id: '1B', title: 'Condensate Production (only)' }/*,
        { id: '2A', title: 'Drilling Rigs In use' },
        { id: '2B', title: 'Rig Days' },
        { id: '2C', title: 'Depth Drilled' },
        { id: '2D', title: 'Wells Started' },
        { id: '2E', title: 'Well Completions' },
        { id: '2F', title: 'MEEA Approved Workovers Completed and Winch Hours' },
        { id: '3A', title: 'Natural Gas Production By Company' },
        { id: '3B', title: 'Natural Gas Utilization By Sector' },
        { id: '4A', title: 'Crude Oil Imports' },
        { id: '4B', title: 'Crude Oil Exports' },
        { id: '4C', title: 'Petrotrin PAP Refinery Sales' },
        { id: '4D', title: 'Petrotrin PAP Refinery Output' },
        { id: '4E', title: 'Petrotrin PAP Refinery Throughput' },
        { id: '5A', title: 'Production and Export of NGLs from PPGPL' },
        { id: '5B', title: 'Production and Export of Ammonia and Urea' },
        { id: '5C', title: 'Production and Export of Methanol' },
        { id: '5D', title: 'Production of LNG from ALNG' },
        { id: '5E', title: 'LNG and NGL Sales, Deliveries and Re-deliveries from ALNG' }*/
    ];

    $scope.reportSectionBySegment = function (sectionSegment) {
        var result = [], i;
        for (i = 0; i < $scope.reportSections.length; i += 1) {
            if ($scope.reportSections[i].id.startsWith(sectionSegment)) {
                result.push($scope.reportSections[i]);
            }
        }
        return result;
    };
    
    $scope.abbreviationDescription = function (abbreviation) {
        var result = "";
        if ($scope._codeDescriptions.hasOwnProperty(abbreviation)) {
            result = " - " + $scope._codeDescriptions[abbreviation];
        }
        return result;
    };
  
    $scope.afterRefreshData = function () {
        $scope._tabledata = $scope._legacydata.concat($scope._currentdata);
        $scope.setAvailableOperators();
        $scope.setAvailableYears();
        $scope.setAvailableMonths();
        $scope.calculate_reportData();
        $scope.calculate_reportDataByOperator();
    };
  
    $scope.refreshData = function () {
        // http://localhost/meea/legacy.json
        $http.get('http://mobileapps.referencelogic.com/meea-statistics/legacy.json')
            .success(function (data) {
                $scope._legacydata = data;
                $scope.afterRefreshData();
            });

        // http://localhost/meea/current.json
        $http.get('http://mobileapps.referencelogic.com/meea-statistics/current.json')
            .success(function (data) {
                $scope._currentdata = data;
                $scope.afterRefreshData();
            });

        $http.get('http://mobileapps.referencelogic.com/meea-statistics/abbreviations.json')
            .success(function (data) {
                var i;
                $scope._abbreviations = data;
                for (i = 0; i < $scope._abbreviations.length; i += 1) {
                    $scope._codeDescriptions[$scope._abbreviations[i].code] = $scope._abbreviations[i].description;
                }
            });
    };

    $scope.getFilterDescription = function () {
        var result = "for ", i;
        if ($scope.filterYear === "All") {
            if ($scope.filterMonth !== "All") {
                result += $scope.filterMonth + " of ";
            }
            result += "all available years ";
        } else {
            if ($scope.filterMonth !== "All") {
                result += $scope.filterMonth + ", ";
            }
            result += $scope.filterYear + " ";
        }
        
        if ($scope.filter_includeAllOperators) {
            result += "and all available operators ";
        } else {
            result += "and operator";
            if ($scope.filter_availableOperators.length > 1) {
                result += "s";
            }
            if ($scope.filter_availableOperators.length === 1) {
                result += " " + $scope.filter_availableOperators[0];
            } else if ($scope.filter_availableOperators.length > 1) {
                result += " " + $scope.filter_availableOperators[0];
                for (i = 1; i < $scope.filter_availableOperators.length - 1; i += 1) {
                    result += ", " + $scope.filter_availableOperators[i];
                }
                result += " and " + $scope.filter_availableOperators[$scope.filter_availableOperators.length - 1];
            }
        }

        return result;
    };
    
    $scope._inArray = function (item, array) {
        return array.indexOf(item);
    };

    $scope._getTotalForReport = function (reportId, filterYear, filterMonth) {
        var result = 0, i, data;
        data = $scope._tabledata;
        
        if ((filterYear === "All") && (filterMonth === "All")) {
            for (i = 0; i < data.length; i += 1) {
            // console.log(data[i].table + " " + reportId);
                if ((data[i]) && (data[i].hasOwnProperty("table")) && (data[i].table === reportId)) {
                    result += _.reduce(data[i].data, function (memo, num) { return memo + num; }, 0);
                }
            }
        } else if ((filterYear !== "All") && (filterMonth === "All")) {
            for (i = 0; i < data.length; i += 1) {
                if ((data[i]) && (data[i].hasOwnProperty("table")) && (data[i].hasOwnProperty("year")) && (data[i].table === reportId) && (data[i].year === filterYear) && (data[i].codecat === "operator")) {
                    if ($scope._inArray(data[i].code, $scope.filter_availableOperators) !== -1) {
                        result += _.reduce(data[i].data, function (memo, num) { return memo + num; }, 0);
                    }
                }
            }
        } else if ((filterYear !== "All") && (filterMonth !== "All")) {
            for (i = 0; i < data.length; i += 1) {
                if ((data[i]) && (data[i].hasOwnProperty("table")) && (data[i].hasOwnProperty("year")) && (data[i].table === reportId) && (data[i].year === filterYear) && (data[i].codecat === "operator")) {
              //console.log("_getTotalForReport calculating total ");
                    if (($scope._inArray(data[i].code, $scope.filter_availableOperators) !== -1) || (data[i].operator === $scope.filter_availableOperators)) {
                        result += data[i].data[filterMonth];
                    }
                }
            }
        } else if ((filterYear === "All") && (filterMonth !== "All")) {
            for (i = 0; i < data.length; i += 1) {
                if ((data[i]) && (data[i].hasOwnProperty("table")) && (data[i].hasOwnProperty("year")) && (data[i].table === reportId) && (data[i].codecat === "operator")) {
                    console.log("_getTotalForReport calculating total for all filterMonth");
                    if ($scope._inArray(data[i].code, $scope.filter_availableOperators) !== -1) {
                        result += data[i].data[filterMonth];
                    }
                }
            }
        }
        //console.log("_getTotalForReport " + reportId + " data length is " + data.length + " with result: " + result);
        return result;
    };
    
    $scope._getTotalByOperatorForReport = function (reportId, filterYear, filterMonth, operator) {
        var result = 0, i, data;
        data = $scope._tabledata;
        
        if ((filterYear === "All") && (filterMonth === "All")) {
            for (i = 0; i < data.length; i += 1) {
            // console.log(data[i].table + " " + reportId);
                if ((data[i]) && (data[i].hasOwnProperty("table")) && (data[i].table === reportId) && (data[i].codecat === "operator") && (data[i].code === operator)) {
                    result += _.reduce(data[i].data, function (memo, num) { return memo + num; }, 0);
                }
            }
        } else if ((filterYear !== "All") && (filterMonth === "All")) {
            for (i = 0; i < data.length; i += 1) {
                if ((data[i]) && (data[i].hasOwnProperty("table")) && (data[i].hasOwnProperty("year")) && (data[i].table === reportId) && (data[i].year === filterYear) && (data[i].codecat === "operator") && (data[i].code === operator)) {
                    if ($scope._inArray(data[i].code, $scope._defaultOperatorFilter) === -1) {
                        result += _.reduce(data[i].data, function (memo, num) { return memo + num; }, 0);
                    }
                }
            }
        } else if ((filterYear !== "All") && (filterMonth !== "All")) {
            for (i = 0; i < data.length; i += 1) {
                if ((data[i]) && (data[i].hasOwnProperty("table")) && (data[i].hasOwnProperty("year")) && (data[i].table === reportId) && (data[i].year === filterYear) && (data[i].codecat === "operator") && (data[i].code === operator)) {
                //console.log("_getTotalForReport calculating total ");
                    if ($scope._inArray(data[i].code, $scope._defaultOperatorFilter) === -1) {
                        result += data[i].data[filterMonth];
                    }
                }
            }
        } else if ((filterYear === "All") && (filterMonth !== "All")) {
            for (i = 0; i < data.length; i += 1) {
                if ((data[i]) && (data[i].hasOwnProperty("table")) && (data[i].hasOwnProperty("year")) && (data[i].table === reportId) && (data[i].codecat === "operator") && (data[i].code === operator)) {
                    console.log("_getTotalForReport calculating total for all filterMonth");
                    if ($scope._inArray(data[i].code, $scope._defaultOperatorFilter) === -1) {
                        result += data[i].data[filterMonth];
                    }
                }
            }
        }
        //console.log("_getTotalForReport " + reportId + " data length is " + data.length + " with result: " + result);
        return result;
    };
    
    $scope.calculate_reportData = function () {
        
        _.each($scope.reportSections, function (reportSection) {
          // Calculate for each section 
          //console.log("Calculating for " + reportSection.id);
            var result = [], availableYears, availableMonths, i, j, temp;
          
            if (($scope.filterYear === "All") && ($scope.filterMonth === "All")) {
                availableYears = $scope.filter_availableYears;
                for (i = 0; i < availableYears.length; i += 1) {
                    temp = {};
                    temp.col1 = availableYears[i];
                    temp.col2 = $scope._getTotalForReport(reportSection.id, availableYears[i], $scope.filterMonth);
                    result[result.length] = temp;
                }
                $scope.calculated_reportData[reportSection.id] = result;
            } else if (($scope.filterYear !== "All") && ($scope.filterMonth === "All")) {
                availableMonths = $scope.filter_availableMonths;
                for (i = 0; i < availableMonths.length; i += 1) {
                    temp = {};
                    temp.col1 = availableMonths[i];
                    temp.col2 = $scope._getTotalForReport(reportSection.id, $scope.filterYear, i);
                    result[result.length] = temp;
                }
                $scope.calculated_reportData[reportSection.id] = result;
            } else if (($scope.filterYear === "All") && ($scope.filterMonth !== "All")) {

                availableYears = $scope.filter_availableYears;
                          
                for (i = 0; i < availableYears.length; i += 1) {
                    temp = {};
                    temp.col1 = availableYears[i];
                    temp.col2 = $scope._getTotalForReport(reportSection.id, availableYears[i], $scope.filter_availableMonths.indexOf($scope.filterMonth));
                    result[result.length] = temp;
                }
                $scope.calculated_reportData[reportSection.id] = result;
            } else if (($scope.filterYear !== "All") && ($scope.filterMonth !== "All")) {
                console.log("calculate_reportData " + $scope.filterYear + " " + $scope.filterMonth);
                temp = {};
                temp.col1 = $scope.filterYear;
                temp.col2 = $scope._getTotalForReport(reportSection.id, $scope.filterYear, $scope.filter_availableMonths.indexOf($scope.filterMonth));
                result[result.length] = temp;
                $scope.calculated_reportData[reportSection.id] = result;
            }
        });
    };
    
    $scope.calculate_reportDataByOperator = function () {
        
        _.each($scope.reportSections, function (reportSection) {
          // Calculate for each section 
            var result = [], i, monthtouse, temp;
          
            monthtouse = $scope.filterMonth;
            if (monthtouse !== "All") {
                monthtouse = $scope.filter_availableMonths.indexOf($scope.filterMonth);
            }
            
            for (i = 0; i < $scope.filter_availableOperators.length; i += 1) {
                temp = {};
                temp.col1 = $scope.filter_availableOperators[i];
                temp.col2 = $scope._getTotalByOperatorForReport(reportSection.id, $scope.filterYear, monthtouse, $scope.filter_availableOperators[i]);
                result[result.length] = temp;
            }
            $scope.calculated_reportDataByOperator[reportSection.id] = result;

        });
    };
    
    $scope.getReportDataTotal = function (reportId) {
        var result = 0, i;
        
        if ($scope.calculated_reportData[reportId]) {
            for (i = 0; i < $scope.calculated_reportData[reportId].length; i += 1) {
                result += $scope.calculated_reportData[reportId][i].col2;
            }
        }
        
        return numeral(result).format("0,0.00");
    };

    $scope.getReportDataByOperatorTotal = function (reportId) {
        var result = 0, i;
        
        if ($scope.calculated_reportDataByOperator[reportId]) {
            for (i = 0; i < $scope.calculated_reportDataByOperator[reportId].length; i += 1) {
                result += $scope.calculated_reportDataByOperator[reportId][i].col2;
            }
        }
        
        return numeral(result).format("0,0.00");
    };
    
    $scope.reportDataFormat = function (value) {
        return numeral(value).format("0,0.00");
    };
    
    $scope.drillDown = function (limitingFilter) {
        if ($scope.filterYear === "All") {
            $scope.filterYear = limitingFilter;
            $scope.onFilterYearChanged();
        } else if ($scope.filterMonth === "All") {
            $scope.filterMonth = limitingFilter;
            $scope.onFilterMonthChanged();
        }
        $.ui.scrollToTop($.ui.activeDiv.id);
    };
    
    $scope.drillDownByOperator = function (operator) {
        if ($scope.filter_includeAllOperators  === true) {
            $scope.filter_includeAllOperators = false;
            $scope.filter_availableOperators = [];
            $scope.filter_availableOperators.push(operator);
            $scope.onAllOperatorsChanged();
            $scope._synchronizeOperators();
            $.ui.scrollToTop($.ui.activeDiv.id);
        }
    };

    $scope.drillUp = function () {
        if ($scope.filterMonth !== "All") {
            $scope.filterMonth = "All";
            $scope.onFilterMonthChanged();
        } else if ($scope.filterYear !== "All") {
            $scope.filterYear = "All";
            $scope.onFilterYearChanged();
        } else if ($scope.filter_includeAllOperators  !== true) {
            $scope.filter_includeAllOperators = true;
            $scope.onAllOperatorsChanged();
        }
        $.ui.scrollToTop($.ui.activeDiv.id);
    };
    
    $scope.canDrillUp = function () {
        var result = false;
        if (($scope.filterMonth !== "All") || ($scope.filterYear !== "All") || !$scope.filter_includeAllOperators) {
            result = true;
        }
        return result;
    };
    
    $scope.initController = function () {
        $scope.refreshData();
        $scope.filterYear = "All";
        $scope.filterMonth = "All";
        $scope.filterType = "All";
        $scope.currentReport = "default";
    };
  
    $scope.initController();

    $scope.onFilterYearChanged = function () {
        $scope.calculate_reportData();
        $scope.calculate_reportDataByOperator();
    };

    $scope.onFilterMonthChanged = function () {
        $scope.calculate_reportData();
        $scope.calculate_reportDataByOperator();
    };
    
    $scope._synchronizeOperators = function () {
        //console.log("_synchronizeOperators " + $scope.filter_availableOperators);
        $(".operatorlist").each(function (i, obj) {
            var operatorname = obj.name.substring(0, obj.name.length - "-flipswitch".length);
            // console.log("Operator: '" + operatorname + "' " + (operatorname == $scope.filter_availableOperators) + " '" + $scope.filter_availableOperators + "'");
            if ((operatorname in $scope.filter_availableOperators) || (operatorname === $scope.filter_availableOperators)) {
                obj.checked = true;
             //    console.log(operatorname + " checked");
            }
        });
    };
    
    $scope.onFilterOperatorChanged = function () {
        
    };
    
    $scope.onAllOperatorsChanged = function () {
        if ($scope.filter_includeAllOperators) {
            $scope.filter_availableOperators = $scope.filter_allAvailableOperators;
            $(".operatorlist").each(function (i, obj) {
                obj.checked = false;
            });
        } else {
                    
        }
        $scope.calculate_reportData();
        $scope.calculate_reportDataByOperator();
    };
};
      
myApp.controller(controllers);