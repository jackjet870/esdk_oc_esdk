/**
 * 文件名：changeDiskCtrl.js
 * 版权：Huawei Technologies Co., Ltd. Copyright 2013-2014,  All rights reserved
 * 描述：变更磁盘的control
 * 修改时间：14-7-23
 */
/* global define */
define(['tiny-lib/jquery',
        'tiny-lib/angular',
        'tiny-lib/underscore',
        'tiny-common/UnifyValid',
        'app/services/httpService',
        "app/services/tipMessageService",
        'app/services/validatorService',
        'app/services/exceptionService',
        "app/business/ssp/services/order/orderService",
        'app/business/ssp/services/plugin/disk/diskService'
], function ($, angular, _, UnifyValid, http,tipMessageService, validator, exception, orderService, diskService) {
    "use strict";

    // 自定义磁盘大小框
    $.fn.userDefSizeChangeDisk = function (size) {
        var dom = this;
        this.bind("click", function (evt) {
            evt.stopPropagation();
            if (dom.find("input").length > 0) {
                return;
            }

            var oldValue = size.userDef ? size.value : "";
            var input = $("<input type='text' value='" + oldValue + "'>");
            input.css({
                "width": dom.css("width"),
                "height": dom.css("height")
            });

            var confirmInput = function () {
                var value = input.val();
                var reg = /^(([1-9]\d{0,3})|([1-5]\d{4})|(6[0-4]\d{3})|(65[0-4]\d{2})|(655[0-2]\d)|(6553[0-6]))$/;
                if (!reg.test(value)) {
                    $(".createvm-cpu .input-tip").css("display", "inline-block");
                    return;
                }
                $(".createvm-cpu .input-tip").css("display", "none");

                dom.html(value + "G");
                size.value = value;
                size.userDef = true;
            };

            input.bind("keypress", function (evt) {
                if (evt.keyCode === 13) {
                    confirmInput();
                }
            });
            input.bind("blur", function () {
                confirmInput();
            });
            dom.html(input);
            input.focus();
        });
        return this;
    };

    var sspChangDiskCtrl = ["$scope", "$stateParams", "$state", "$q", "camel", "exception", function ($scope, $stateParams, $state, $q, camel, exception) {
        // 公共参数和服务
        var user = $scope.user;
        var i18n = $scope.i18n;
        var action = $stateParams.action;
        var cloudInfraId = $stateParams.cloudInfraId;
        var vpcId = $stateParams.vpcId || "-1";
        var diskId = $stateParams.resourceId;
        var serviceInstanceId = $stateParams.instanceId;
         var diskServiceIns = new diskService(exception, $q, camel);
        var orderServiceIns = new orderService(exception, $q, camel);
        var validate = new validator();
        var tipMessage = new tipMessageService();

        $scope.diskDetail = {};
        $scope.orderDetail = {};

        $scope.label = {
            "name": i18n.common_term_diskName_label + ":",
            "id": i18n.common_term_diskID_label + ":",
            "type": i18n.common_term_diskType_label + ":",
            "oldSize": i18n.common_term_currentCapacity_label + ":"
        };

        $scope.size = {
            "label": i18n.common_term_changeCapacity_label + ":",
            "value": "20",
            "userDef": false
        };

        // 备注
        $scope.remark = {
            "label": i18n.common_term_remark_label + ":",
            "id": "sspChangeDiskRemark",
            "value": "",
            "type": "multi",
            "width": "270",
            "height": "70",
            "validate": "regularCheck(" + validate.descriptionReg + "):" + i18n.sprintf(i18n.common_term_maxLength_valid, 1024)
        };

        // 当前不支持变更操作
        $scope.unSupportChange = {
            "text": "",
            "show": false
        };

        $scope.okBtn = {
            "id": "sspChangeDiskOK",
            "text": i18n.common_term_ok_button,
            "disable": false,
            "click": function () {
                // 校验
                if (!$scope.okBtn.valid()) {
                    return;
                }

                var params = {
                    "cloudInfraId": cloudInfraId,
                    "vpcId": vpcId,
                    "availableZoneId": $scope.diskDetail.azId,
                    "volumeId": diskId,
                    "size": $scope.size.value,
                    "oldSize": $scope.diskDetail.capacityGB
                };

                var options;
                var deferred;
                var comments = $("#" + $scope.remark.id).widget().getValue();

                if (action === "edit") { // 修改订单
                    options = {
                        "user": user,
                        "id": $stateParams.orderId,
                        "params": {
                            "params": JSON.stringify(params),
                            "comments": comments
                        }
                    };
                    deferred = orderServiceIns.modifyOrder(options);
                } else { // 申请订单
                    options = {
                        "user": user,
                        "params": {
                            "modify": {
                                "resourceId": $stateParams.id,
                                "params": JSON.stringify(params)
                            },
                            "comments": comments
                        }
                    };
                    deferred = orderServiceIns.createOrder(options);
                }

                deferred.then(function (data) {
                    if (data && data.orderId) {
                        tipMessage.sspAlert(data.orderId, function(){
                            $state.go("ssp.approvalDiskChange", {
                                "orderId" : data.orderId,
                                "action" : "view"
                            });
                        });
                    }
                    $state.go("ssp.order.apply");
                });
            },
            "valid": function(){
                // 如果虚拟机已经不存在，就不能再变更了
                if (!$scope.diskDetail.id) {
                    tipMessage.alert("error", i18n.service_service_changeDisk_info_failByQuery_msg);
                    return false;
                }

                if (!UnifyValid.FormValid($("#" + $scope.remark.id))) {
                    return false;
                }
                if ($(".createvm-cpu .cpu-options[self-defined] input").length > 0) {
                    return false;
                }
                // 只支持将磁盘规格调大
                if ($scope.diskDetail.capacityGB - $scope.size.value > 0) {
                    tipMessage.alert("error", i18n.service_service_changeDisk_info_failByReduce_msg);
                    return false;
                }
                return true;
            }
        };

        $scope.cancelBtn = {
            "id": "sspChangeDiskCancel",
            "text": i18n.common_term_cancle_button,
            "click": function () {
                setTimeout(function () {
                    window.history.back();
                }, 0);
            }
        };

        $scope.operate = {
            // 查询订单详情
            "queryOrderDetail": function () {
                if (action !== "edit") {
                    return {};
                }
                if (!$stateParams.orderId) {
                    return;
                }
                var retDefer = $.Deferred();
                var options = {
                    "user": user,
                    "orderId": $stateParams.orderId
                };
                var deferred = orderServiceIns.queryOrder(options);
                deferred.then(function (data) {
                    if (!data) {
                        retDefer.reject();
                        return;
                    }
                    $scope.orderDetail = data;
                    var param = JSON.parse(data.params);
                    $scope.orderDetail.param = param;

                    // 修改订单时这几个参数从订单详情中取
                    $scope.size.value = param.size;
                    $scope.remark.value = $scope.orderDetail.comments;
                    cloudInfraId = param.cloudInfraId;
                    vpcId = param.vpcId;
                    diskId = param.volumeId;

                    retDefer.resolve();
                });
                return retDefer.promise();
            },

            // 查询磁盘详情
            "queryDiskDetail": function () {
                var retDefer = $.Deferred();
                var options = {
                    "user": user,
                    "condition": {
                        "VOLUMEID": diskId
                    },
                    "cloudInfraId": cloudInfraId,
                    "vpcId": vpcId,
                    "limit": 1
                };
                var defer = diskServiceIns.queryDiskDetail(options);
                defer.then(function (data) {
                    if (!data || !data.list) {
                        return;
                    }

                    var volumes = data.list.volumes;
                    if (volumes && volumes.length > 0) {
                        $scope.diskDetail = volumes[0];
                        processUnSupportTips();
                    }
                    retDefer.resolve();
                });
                return retDefer.promise();
            }
        };

        // 处理当前是否支持操作的提示
        function processUnSupportTips(){
            var text;

            if ($scope.diskDetail.type !== "normal") {
                text = i18n.service_service_changeDisk_info_failByDiskType_msg;
            } else {
                var volVms = $scope.diskDetail.volVmInfos;
                if (!volVms || volVms.length < 1) {
                    text = i18n.service_service_changeDisk_info_failByUnbondVM_msg;
                } else {
                    var vmStatus = volVms[0].vmStatus;
                    if (vmStatus !== "stopped") {
                        text = i18n.service_service_changeDisk_info_failByVMstatus_msg;
                    }
                }
            }

            if (text) {
                $scope.unSupportChange.text = text;
                $scope.unSupportChange.show = true;
                $scope.okBtn.disable = true;
            }
        }

        // 初始化磁盘颜色块事件
        function initDiskAnimal() {
            $(".createvm-cpu div.cpu-options").bind("click", function (evt) {
                if (typeof ($(evt.currentTarget).attr("self-defined")) === "undefined") {
                    $(".createvm-cpu .cpu-options[self-defined]").html(i18n.common_term_custom_label);
                    $(".createvm-cpu .input-tip").css("display", "none");
                    $scope.size.value = $(evt.currentTarget).data("value");
                    $scope.size.userDef = false;
                }

                $(".createvm-cpu div.cpu-options").removeClass("selected");
                $(evt.currentTarget).addClass("selected");
            });
        }

        // 修改订单时，根据订单详情，初始化磁盘大小
        function initDiskSizeByOrderDetail() {
            var orderParam = $scope.orderDetail.param || {};
            if (action === "edit") {
                var size = orderParam.size;
                var dom = $(".createvm-cpu .cpu-options[data-value=" + size + "]");
                if (dom.length > 0) {
                    dom.trigger("click");
                } else {
                    dom = $(".createvm-cpu .cpu-options[self-defined]");
                    dom.html(size + "G");
                    $scope.size.value = size;
                    $scope.size.userDef = true;

                    $(".createvm-cpu div.cpu-options").removeClass("selected");
                    dom.addClass("selected");
                }
            }
        }

        // 查询需要的其他信息
        function queryRelatedInfo() {
            // 初始化自定义规格颜色块
            setTimeout(function () {
                initDiskAnimal();
                $(".createvm-cpu .cpu-options[self-defined]").userDefSizeChangeDisk($scope.size);
                initDiskSizeByOrderDetail();
            }, 50);
        }

        //获取初始数据
        function init() {
            var defer = $scope.operate.queryOrderDetail();
            $.when(defer).done(function () {
                $scope.operate.queryDiskDetail();
                queryRelatedInfo();
            });
        }

        //初始化
        init();
    }];

    return sspChangDiskCtrl;
});
