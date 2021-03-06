/* global _ angular $ CMS_REPORT_FILTER */
(function () {
    'use strict';

    angular.module('bizflow.app').component('incentiveReportFilter', {
        templateUrl: function ($element, $attrs, bizflowContext) {
            var template = 'incentives/reportFilter/report-filter.html';
            return template;
        },
        controller: Ctrl
    });

    function Ctrl($scope, blockUI, bizflowContext, $log, $window, $filter, $location) {
        var vm = this;

        // Attributes
        vm.report = {'name': '', 'description': ''};
        vm.group = {};

        // Primitive Options - Not for Selectize
        vm._components = ['By Request Number', 'By Admin Code', 'Office of the Administrator (OA) Only'];
        vm._includeSubOrgs = ['Yes', 'No'];
        vm._requestStatus = ["Completed", "Active", "Both"];
        vm._requestTypes = ['All', 'Appointment', 'Classification Only', 'Recruitment'];
        vm._appointmentTypes = ['All', '30% or more disabled veterans', 'Expert/Consultant', 'Schedule A', 'Veteran Recruitment Appointment (VRA)', 'Volunteer'];
        vm._scheduleATypes = ['All', 'CMS Fellows-Paid (R)', 'Digital Services', 'Disability (U)', 'Innovator-In-Residence', 'Interpreters (LL)', 'WRP (Summer Hire)'];
        vm._volunteerTypes = ['All', 'CMS Fellows-Unpaid', 'Student Volunteer', 'Wounded Warriors', 'Youth Works'];

        vm.reportMap = [{
            'name': 'CMS HR Incentives Workload Summary Report',
            'description': 'Incentives Workload Summary',
            'dateLabel': 'Date Request Entered'
        }];

        // Default Values
        vm.orgSelected = {
            component: '',
            adminCode: '',
            includeSubOrg: 'Yes',
            requestType: 'All',
            classificationType: 'All',
            appointmentType: 'All',
            scheduleAType: 'All',
            volunteerType: 'All',
            fromDate: null,
            toDate: null,
            selectingOfficial: 'All',
            executiveOfficer: 'All',
            hrLiaison: 'All',
            staffSpecialist: 'All',
            classSpecialist: 'All'
        };
        // Selected Values
        vm.selected = {};

        // Date From - To
        vm.dateLabel = "Date Request Completed";

        vm.fromDateOpened = false;
        vm.toDateOpened = false;
        vm.dateOptionFrom = {showWeeks: false, maxDate: new Date()};
        vm.dateOptionTo = {showWeeks: false, maxDate: new Date()};

        // Selectize configuration for members in User Group
        vm.membersInGroupConfig = {
            maxItems: 1,
            create: false,
            valueField: 'memberid',
            labelField: 'name',
            searchField: ['name']
        };
        // Selectize configuration for simple list
        vm.simpleConfig = {
            maxItems: 1,
            create: false,
            valueField: 'value',
            labelField: 'key'
        };

        vm.getSelectizeOptions = function (items) {
            return items.map(function (item) {
                return {key: item, value: item};
            })
        }
        vm.copyItems = function (targets, sources) {
            if (targets) {
                if (targets.length > 0) {
                    targets.length = 0;
                }

                for (var i = 0; i < sources.length; i++) {
                    targets.push(sources[i]);
                }
            }
        }

        vm.classTypesForClass = [];
        vm.classTypesForRecruitment = [];
        vm.classTypesForAppointment = [];
        vm.classTypesForOther = [];

        vm.allClassificationTypes = ['All', 'Audit Position', 'Create New Position Description', 'Reorganization Pen & Ink',
            'Reorganization for New Position', 'Review Existing Position Description', 'Update Coversheet', 'Update Major Duties'];
        vm.recruitmentClassificationTypes = ['All', 'Create New Position Description', 'Reorganization Pen & Ink',
            'Reorganization for New Position', 'Review Existing Position Description', 'Update Coversheet', 'Update Major Duties'];

        // Functions
        vm.getClassificationTypes = function () {
            if (vm.selected.requestType === 'All' || vm.selected.requestType === 'Classification Only') {
                if (vm.classTypesForClass.length == 0) {
                    vm.classTypesForClass = vm.classTypesForClass.concat(vm.allClassificationTypes);
                    vm.classTypesForClass.sort();
                    vm.classTypesForClass = vm.getSelectizeOptions(vm.classTypesForClass);
                }
                return vm.classTypesForClass;
            } else if (vm.selected.requestType === 'Recruitment') {
                if (vm.classTypesForRecruitment.length == 0) {
                    vm.classTypesForRecruitment = vm.classTypesForRecruitment.concat(vm.recruitmentClassificationTypes);
                    vm.classTypesForRecruitment.sort();
                    vm.classTypesForRecruitment = vm.getSelectizeOptions(vm.classTypesForRecruitment);
                }
                return vm.classTypesForRecruitment;
            } else if (vm.selected.requestType === 'Appointment') {
                if (vm.classTypesForAppointment.length == 0) {
                    vm.classTypesForAppointment = vm.classTypesForAppointment.concat(vm.recruitmentClassificationTypes);
                    vm.classTypesForAppointment.sort();
                    vm.classTypesForAppointment = vm.getSelectizeOptions(vm.classTypesForAppointment);
                }
                return vm.classTypesForAppointment;
            } else {
                return vm.classTypesForOther;
            }
        };

        vm.adjustBizCoveUI = function () {
            try {
                $('#mainWrapper table.tableTab', window.parent.document).remove(); // Remove BizCove Header
                $('#mainWrapper table.list td', window.parent.document).css({'padding': '0px 0px 0px 0px'}); // Adjust padding
                $('#modalPopupMax0Title', window.parent.parent.document).text(vm.report.name); // Set report name
            } catch (e) {
                $log.error(e);
            }
        };

        vm.initUserGroups = function () {
            var groups = JSON.parse(CMS_REPORT_FILTER.GROUPS).groups;
            CMS_REPORT_FILTER.GROUPS = null;
            vm.group = _.groupBy(groups, 'grpname');
            for (var prop in vm.group) {
                if (vm.group.hasOwnProperty(prop)) {
                    vm.group[prop].unshift({grpname: '', grpid: '', memberid: 'All', name: 'All'});
                }
            }
            var amIDCOManagerLeads = _.filter(vm.group['DCO Managers and Leads'], function (item) {
                return item.memberid === CMS_REPORT_FILTER.CURUSERID;
            });
            var amIAdminTeam = _.filter(vm.group['Admin Team'], function (item) {
                return item.memberid === CMS_REPORT_FILTER.CURUSERID;
            });
            if (amIDCOManagerLeads.length > 0 || amIAdminTeam.length > 0) {
                vm._components = ['By Request Number', 'By Admin Code', 'CMS-wide', 'Office of the Administrator (OA) Only'];
            }
        };

        // Calendar functions & configuration
        vm.changeFromOption = function () {
            vm.dateOptionTo.minDate = vm.selected.fromDate ? vm.selected.fromDate : null;
        };
        vm.changeToOption = function () {
            vm.dateOptionFrom.maxDate = vm.selected.toDate ? vm.selected.toDate : new Date();
        };
        vm.openFromDate = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            vm.toDateOpened = false;
            vm.fromDateOpened = true;
        }
        vm.openToDate = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            vm.toDateOpened = true;
            vm.fromDateOpened = false;
        }

        vm.getDateString = function (when) {
            var month = when.getMonth() + 1;
            month = month < 10 ? ('0' + month) : month;
            var day = when.getDate();
            day = day < 10 ? ('0' + day) : day;
            var year = when.getFullYear();
            var dateString = year + '-' + month + '-' + day;
            return dateString;
        };

        vm.getTargetReportURL = function () {
            var url = '/bizflowadvreport/flow.html?_flowId=viewReportFlow&decorate=no';
            url = url + '&j_memberid=' + CMS_REPORT_FILTER.CURUSERID; // j_memberid
            url = url + '&j_username=' + CMS_REPORT_FILTER.CURLOGINID; // j_username
            url = url + '&reportUnit=' + CMS_REPORT_FILTER.REPORTPATH; // reportUnit

            if (vm.selected.component === "By Request Number") {
                url += '&REPORT_MODE=' + encodeURIComponent("By Request Num");
                url += '&REQ_NUM=' + vm.selected.requestNumber;
            } else {
                url = url + '&REPORT_MODE=' + encodeURIComponent("By Component");

                if (vm.selected.component.length > 0) { // Component
                    url = url + '&COMPONENT=' + vm.selected.component;
                }
                if (vm.selected.adminCode.length > 0) { // Admin Code
                    url = url + '&ADMIN_CD=' + vm.selected.adminCode.toUpperCase();
                } else {
                    url = url + '&ADMIN_CD=~NULL~';
                }
            }

            if (vm.selected.fromDate != null) {
                var from = vm.getDateString(vm.selected.fromDate);
                url = url + '&DATE_FROM=' + from;
            } else {
                url = url + '&DATE_FROM=2000-01-01';
            }
            if (vm.selected.toDate != null) {
                var to = vm.getDateString(vm.selected.toDate);
                url = url + '&DATE_TO=' + to;
            } else {
                url = url + '&DATE_TO=2050-12-31';
            }

            if (vm.selected.requestStatus) {
                url = url + '&REQ_STATUS=' + vm.selected.requestStatus;
            }
            // url = url + '&REQ_TYPE=' + vm.selected.requestType; // Request Type
            // url = url + '&CLSF_TYPE=' + vm.selected.classificationType; // Classification Type
            // url = url + '&APPT_TYPE=' + vm.selected.appointmentType; // Appointment Type
            // url = url + '&SCHDA_TYPE=' + vm.selected.scheduleAType; // Schedula A Type
            // url = url + '&VOL_TYPE=' + vm.selected.volunteerType; // Volunteer Type
            // url = url + '&SO_ID=' + vm.selected.selectingOfficial; // Selecting Official
            // url = url + '&XO_ID=' + vm.selected.executiveOfficer; // Executive Officer
            // url = url + '&HRL_ID=' + vm.selected.hrLiaison; // HR Liaison
            // url = url + '&SS_ID=' + vm.selected.staffSpecialist; // Staff specialist
            // url = url + '&CS_ID=' + vm.selected.classSpecialist; // Class specialist
            //$log.debug('Report URL [' + url + ']');
            return url;
        };

        vm.submit = function () {
            if (vm.selected.component !== 'By Request Number') {
                vm.selected.requestNumber = '';
            }
            if (vm.selected.component !== 'By Admin Code') {
                vm.selected.adminCode = '';
                vm.selected.includeSubOrg = '';
            }
            if (vm.selected.appointmentType === 'Expert/Consultant' || vm.selected.appointmentType === 'Volunteer') {
                vm.selected.classificationType = 'All';
            }
            if (vm.selected.requestType !== 'Appointment') {
                vm.selected.appointmentType = 'All';
            }
            if (vm.selected.appointmentType !== 'Schedule A') {
                vm.selected.scheduleAType = 'All';
            }
            if (vm.selected.appointmentType !== 'Volunteer') {
                vm.selected.volunteerType = 'All';
            }
            var url = vm.getTargetReportURL();

            window.open(url, '_blank');
            setTimeout(function () {
                vm.close();
            }, 0);
        };

        vm.reset = function () {
            vm.selected = _.assign({}, vm.orgSelected);
        };

        vm.close = function () {
            try {
                $('#modalPopupMax0CloseButton', window.parent.parent.document).click();
            } catch (e) {
                $log.info('Cancel button is clicked but failed to dismiss BizCove. ' + e);
            }
        }

        vm.initReportMap = function () {
            if (CMS_REPORT_FILTER.REPORTNAME && CMS_REPORT_FILTER.REPORTNAME.length > 0) {
                var foundReportMap = _.find(vm.reportMap, function (item) {
                    if (item.name === CMS_REPORT_FILTER.REPORTNAME) {
                        return true;
                    } else {
                        return false;
                    }
                });

                if (foundReportMap) {
                    vm.report = foundReportMap;
                    if (foundReportMap.requestType && foundReportMap.requestType.length > 0) {
                        vm.copyItems(vm._requestTypes, foundReportMap.requestType);
                        if (vm._requestTypes.length == 1) {
                            vm.orgSelected.requestType = vm._requestTypes[0]
                        }
                    }

                    if (foundReportMap.requestActivity && foundReportMap.requestActivity.length > 0) {
                        vm.copyItems(vm._requestActivities, foundReportMap.requestActivity);
                        if (vm._requestActivities.length == 1) {
                            vm.orgSelected.requestActivity = vm._requestActivities[0]
                        }
                    }

                    if (foundReportMap.dateLabel && foundReportMap.dateLabel.length > 0) {
                        vm.dateLabel = foundReportMap.dateLabel
                    }
                } else {
                    $log.info('No report found from report map. [' + CMS_REPORT_FILTER.REPORTNAME + ']');
                }
            }
        };

        vm.$onInit = function () {
            $log.info('reportFilter $onInit');
            // This should be called first.
            vm.initReportMap();
            vm.initUserGroups();

            vm.adjustBizCoveUI();
            vm.selected = _.assign({}, vm.orgSelected);

            $('#reportFilter').attr('aria-busy', 'false');

            vm.requestTypes = vm.getSelectizeOptions(vm._requestTypes);
            vm.requestStatus = vm.getSelectizeOptions(vm._requestStatus);
            vm.appointmentTypes = vm.getSelectizeOptions(vm._appointmentTypes);
            vm.scheduleATypes = vm.getSelectizeOptions(vm._scheduleATypes);
            vm.volunteerTypes = vm.getSelectizeOptions(vm._volunteerTypes);
            vm.components = vm.getSelectizeOptions(vm._components);
            vm.includeSubOrgs = vm.getSelectizeOptions(vm._includeSubOrgs);
        };

        vm.$onDestroy = function () {
            $log.info('reportFilter $onDestroy');
        };
    }
})();
