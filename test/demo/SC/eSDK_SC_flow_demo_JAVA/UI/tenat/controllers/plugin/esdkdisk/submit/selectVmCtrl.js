/**
 * 文件名：selectVmCtrl.js
 * 版权：Huawei Technologies Co., Ltd. Copyright 2013-2014,  All rights reserved
 * 描述：ssp-applyDisk--选择虚拟机的control
 * 修改时间：14-7-19
 */
/* global define */
define(['tiny-lib/jquery',
    'tiny-lib/angular',
    'sprintf',
    'tiny-lib/angular-sanitize.min',
    'language/keyID',
    'tiny-lib/underscore',
    'app/services/httpService',
    "app/services/exceptionService",
    "app/business/ecs/services/vm/queryVmService",
    "app/business/ecs/services/vm/vmCommonService",
    'tiny-directives/Radio',
    'tiny-directives/RadioGroup',
    'tiny-directives/Select'
], function ($, angular,sprintf, ngSanitize, keyIDI18n, _, http, exception, queryVmService, vmCommonService) {
    "use strict";

    var selectVmCtrl = ["$scope", "$compile", "$q", "camel", "exception",
        function ($scope, $compile, $q, camel, exception) {
            // 父窗口传递的参数
            var winParam = $("#sspApplyDiskSelectVmWinId").widget().option("winParam") || {};
            var user = $("html").scope().user;
            var queryVmServiceIns = new queryVmService(exception, $q, camel);
            var vmCommonServiceIns = new vmCommonService();
            var isICT = user.cloudType === "ICT";

            keyIDI18n.sprintf = sprintf.sprintf;
            $scope.i18n = keyIDI18n;
            var i18n = $scope.i18n;

            var searchString = "";
            var page = {
                "currentPage": 1,
                "displayLength": 10,
                "getStart": function () {
                    return page.currentPage === 0 ? 0 : (page.currentPage - 1) * page.displayLength;
                }
            };

            $scope.searchBox = {
                "id": "sspApplyDiskSelectVmSearch",
                "placeholder": i18n.common_term_findCondition_prom,
                "width": "250",
                "maxLength": 64,
                "search": function (content) {
                    searchString = content;
                    page.currentPage = 1;
                    getVmData();
                }
            };

            $scope.vms = {
                "id": "sspApplyDiskSelectVmVms",
                "paginationStyle": "full_numbers",
                "lengthMenu": [10, 20, 30],
                "displayLength": 10,
                "totalRecords": 0,
                "columns": [{
                    "sTitle": "",
                    "mData": "",
                    "bSearchable": false,
                    "bSortable": false,
                    "sWidth": "60px"
                }, {
                    "sTitle": i18n.common_term_name_label,
                    "mData": function (data) {
                        return $.encoder.encodeForHTML(data.name);
                    }
                }, {
                    "sTitle": i18n.common_term_ID_label,
                    "mData": function (data) {
                        return $.encoder.encodeForHTML(data.id);
                    }
                }, {
                    "sTitle": "IP",
                    "mData": function (data) {
                        return $.encoder.encodeForHTML(data.allIp);
                    }
                }, {
                    "sTitle": i18n.common_term_status_label,
                    "mData": "statusView"
                }],
                "data": [],
                "callback": function (evtObj) {
                    page.currentPage = evtObj.currentPage;
                    page.displayLength = evtObj.displayLength;
                    getVmData();
                },
                "changeSelect": function (evtObj) {
                    page.currentPage = evtObj.currentPage;
                    page.displayLength = evtObj.displayLength;
                    getVmData();
                },
                "renderRow": function (nRow, aData, iDataIndex) {
                    //tips提示
                    $("td:eq(1)", nRow).addTitle();
                    $("td:eq(2)", nRow).addTitle();
                    $("td:eq(3)", nRow).addTitle();

                    // 单选框
                    var selBox = "<div><tiny-radio id='id' value='value' name='name' change='change()'></tiny-radio></div>";
                    var selBoxLink = $compile(selBox);
                    var selBoxScope = $scope.$new();
                    selBoxScope.value = aData.id;
                    selBoxScope.name = "sspApplyDiskSelectVmVmsRadio";
                    selBoxScope.id = "sspApplyDiskSelectVmVmsRadioId" + iDataIndex;
                    selBoxScope.change = function () {
                        $scope.okBtn.disable = false;
                    };
                    var selBoxNode = selBoxLink(selBoxScope);
                    $("td:eq(0)", nRow).html(selBoxNode);
                }
            };

            $scope.okBtn = {
                "id": "ecsStorageDiskMountDiskOK",
                "text": i18n.common_term_ok_button,
                "disable": true,
                "click": function () {
                    var vmId =  $("#sspApplyDiskSelectVmVmsRadioId0").widget().opChecked();
                    var selectVm = _.find($scope.vms.data, function(item){
                        return item.id === vmId;
                    });

                    if(selectVm) {
                        winParam.vmId = vmId;
                        winParam.vmName = selectVm.name;
                        winParam.needRefresh = true;
                    }

                    $("#sspApplyDiskSelectVmWinId").widget().destroy();
                }
            };

            $scope.cancelBtn = {
                "id": "ecsStorageDiskMountDiskCancel",
                "text": i18n.common_term_cancle_button,
                "click": function () {
                    $("#sspApplyDiskSelectVmWinId").widget().destroy();
                }
            };

            // 查询虚拟机列表信息
            function getVmData() {
                if (!winParam.cloudInfraId || !winParam.azId || (isICT && !winParam.vpcId)) {
                    return;
                }
                var options = {
                    "user": user,
                    "cloudInfraId": winParam.cloudInfraId,
                    "condition": searchString,
                    "start": page.getStart(),
                    "limit": page.displayLength,
                    "azId": winParam.azId,
                    "vpcId": winParam.vpcId,
                    "creatorId": user.id
                };
                var deferred = queryVmServiceIns.queryVmList(options);
                deferred.then(function (data) {
                    _.each(data.list.vms, function (item) {
                        _.extend(item, {
                            "allIp": getIp(item),
                            "statusView": vmCommonServiceIns.getStatusStr(item.status)
                        });
                    });

                    $scope.vms.data = data.list.vms;
                    $scope.vms.displayLength = page.displayLength;
                    $scope.vms.totalRecords = data.list.total;
                    $("#" + $scope.vms.id).widget().option("cur-page", {
                        "pageIndex": page.currentPage
                    });

                    $scope.okBtn.disable = true;
                });
            }

            //从查询得到的VM信息中获取IP
            function getIp(vm) {
                var ip = "";
                if (vm && vm.vmSpecInfo) {
                    var nics = vm.vmSpecInfo.nics;
                    if (nics && nics.length) {
                        _.each(nics, function (item) {
                            ip += vmCommonServiceIns.packIp(item.ip, item.ipv6s);
                        });
                        var index = ip.lastIndexOf(";");
                        if (index > 0 && index === ip.length - 1) {
                            ip = ip.slice(0, index);
                        }
                    }
                }
                return ip;
            }

            // 查询初始信息
            getVmData();
        }
    ];

    var selectVmModule = angular.module("ssp.plugin.applyDisk.selectVm", ['ng',"wcc","ngSanitize"]);
    selectVmModule.controller("ssp.plugin.applyDisk.selectVm.ctrl", selectVmCtrl);
    selectVmModule.service("camel", http);
    selectVmModule.service("exception", exception);

    return selectVmModule;
});
