/*global define*/
define(["tiny-lib/jquery",
        "tiny-lib/angular",
        "bootstrapui/ui-bootstrap-tpls",
        "tiny-lib/underscore",
        'tiny-common/UnifyValid',
        "app/services/httpService",
        'app/services/messageService',
        "app/services/tipMessageService",
        'app/services/validatorService',
        "app/services/cloudInfraService",
        "app/business/ssp/services/catalog/catalogService",
        "app/business/ssp/services/order/orderService",
        "app/business/ssp/services/plugin/ecs/ecsService",
        "app/business/ssp/services/plugin/commonService",
        'app/services/commonService',
        'tiny-widgets/Window',
        'tiny-directives/RadioGroup'
], function ($, angular, uibootstrap, _, UnifyValid, http, messageService, tipMessageService, validatorService, cloudInfraService, catalogService, orderService, ecsService, commonService, timeCommonService, Window) {
    "use strict";

    // 自定义磁盘大小框
    $.fn.userDefSizeApprovalDisk = function (size) {
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

    var ctrl = ["$scope", "$state", "$stateParams", "$q", "camel", "exception", function ($scope, $state, $stateParams, $q, camel, exception) {
        var i18n = $scope.i18n;
        var user = $scope.user;
        var serviceId = $stateParams.serviceId;
        var orderId = $stateParams.orderId;

        var validator = new validatorService();
        var cloudInfraServiceIns = new cloudInfraService($q, camel);
        var catalogServiceIns = new catalogService(exception, $q, camel);
        var orderServiceIns = new orderService(exception, $q, camel);
        var ecsServiceIns = new ecsService(exception, $q, camel);
        var commonServiceIns = new commonService(exception);
        var messageServiceIns = new messageService();
        var tipMessageIns = new tipMessageService();
        var defaultConfigTypes = [
            {
                "selectId": "0",
                "label": i18n.common_term_common_label,
                "checked": true
            },
            {
                "selectId": "1",
                "label": i18n.common_term_lazyZeroed_label,
                "checked": false
            },
            {
                "selectId": "2",
                "label": i18n.common_term_thinProv_label,
                "checked": false
            }
        ];

        $scope.isICT = user.cloudType === "ICT";
        $scope.action = $stateParams.action;
        $scope.from = $stateParams.from;

        // 服务详情
        $scope.detail = {};
        // 订单详情
        $scope.orderDetail = {};
        $scope.cloudInfra = {};

        // 地域信息
        $scope.location = {
            "id": "sspApplyDiskRegion",
            "label": i18n.common_term_section_label + ":",
            "width": "180",
            "values": [],
            "require": true,
            "validate": "required:" + i18n.common_term_null_valid + ";",
            "change": function () {
                $scope.cloudInfra = cloudInfraServiceIns.getCloudInfra($scope.location.values, $("#" + $scope.location.id).widget().getSelectedId());
                $scope.operate.queryAzs();
                if ($scope.isICT) {
                    $scope.operate.queryVpcs();
                }
            }
        };

        // az
        $scope.az = {
            "label": i18n.resource_term_AZ_label + ":",
            "id": "sspApplyDiskAz",
            "width": "180",
            "values": [],
            "curr": {},
            "require": true,
            "validate": "required:" + i18n.common_term_null_valid + ";",
            "change": function () {
                var azId = $("#" + $scope.az.id).widget().getSelectedId();
                onSelectAz(azId);
                $scope.az.curr = cloudInfraServiceIns.getSpecAz($scope.az.values, azId);
            }
        };

        // vpc
        $scope.vpc = {
            "label": i18n.vpc_term_vpc_label + ":",
            "id": "ecsVmCreateVpcId",
            "width": "180",
            "values": [],
            "curr": {"vpcID": "-1"},
            "require": true,
            "validate": "required:" + i18n.common_term_null_valid + ";",
            "change": function () {
                var currId = $("#" + $scope.vpc.id).widget().getSelectedId();
                $scope.vpc.curr = _.find($scope.vpc.values, function(item){
                    return item.vpcID === currId;
                });
            }
        };

        // 绑定到虚拟机
        $scope.vm = {
            "label": i18n.org_term_bondVM_button + ":",
            "name": "",
            "id": null,
            "add": function(){
                var winParam = {
                    vpcId: $scope.vpc.curr.vpcID,
                    azId: $scope.az.curr.id,
                    cloudInfraId: $scope.cloudInfra.id
                };

                var options = {
                    "winId": "sspApplyDiskSelectVmWinId",
                    "winParam": winParam,
                    "title": i18n.org_term_bondVM_button,
                    "width": "800px",
                    "height": "520px",
                    "content-type": "url",
                    "content": "app/business/ssp/views/plugin/disk/submit/selectVm.html",
                    "buttons": null,
                    "close": function (event) {
                        $scope.$apply(function(){
                            $scope.vm.name = winParam.vmName;
                            $scope.vm.id = winParam.vmId;
                        });
                    }
                };
                var win = new Window(options);
                win.show();
            },
            "clear": function () {
                $scope.vm.name = null;
                $scope.vm.id = null;
            }
        };

        // 基本信息
        $scope.base = {
            applyUser: {
                "label": i18n.common_term_applyBy_label + ":"
            },

            currApprover: {
                "label": i18n.common_term_currentProcessor_label + ":"
            },

            name: {
                "label": i18n.common_term_name_label + ":",
                "require": true,
                "width": "220",
                "value": "",
                "id": "serviceApplyEcsName",
                "extendFunction": ["nameValid"],
                "validate": "nameValid():" + i18n.common_term_composition3_valid + i18n.sprintf(i18n.common_term_length_valid, 1, 64)
            },

            diskNum: {
                "label": i18n.common_term_diskNum_label + ":",
                "require": true,
                "id": "sspApplyDiskVmNum",
                "width": "180",
                "value": "1",
                "min": "1",
                "max": "10",
                "step": "1"
            },

            // 到期时间
            expireTime: {
                "label": i18n.common_term_overdueTime_label + ":",
                "id": "sspApplyDiskExpireTime",
                "width": "178",
                "require": true,
                "disable": false,
                "type": "datetime",
                "minDate": commonServiceIns.getCurrentTime(),
                "defaultDate": commonServiceIns.get30DaysDate(),
                "dateFormat": "yy-mm-dd",
                "timeFormat": "hh:mm:ss"
            },

            neverExpire: {
                "id": "sspApplyDiskNeverExpire",
                "checked": false,
                "text": i18n.common_term_neverExpires_label,
                "change": function () {
                    $scope.base.expireTime.disable = $("#" + $scope.base.neverExpire.id).widget().option("checked");
                }
            },

            // 备注
            remark: {
                "label": i18n.common_term_remark_label + ":",
                "id": "sspApplyDiskRemark",
                "value": "",
                "type": "multi",
                "width": "220",
                "height": "57",
                "validate": "regularCheck(" + validator.descriptionReg + "):" + i18n.sprintf(i18n.common_term_maxLength_valid, 1024)
            }
        };

        // 规格信息
        $scope.config = {
            size: {
                "label": i18n.common_term_capacity_label + ":",
                "require": true,
                "value": "",
                "userDef": false
            },

            diskType: {
                "label": i18n.common_term_type_label + ":",
                "id": "sspApplyDiskDiskType",
                "require": true,
                "layout": "horizon",
                "values": [
                    {
                        "key": "normal",
                        "text": i18n.common_term_common_label,
                        "checked": true
                    },
                    {
                        "key": "share",
                        "text": i18n.common_term_share_label
                    }
                ],
                "curr": "",
                "change": function(){
                    $scope.config.diskType.curr = $("#" + $scope.config.diskType.id).widget().opChecked("checked");
                    if("share" === $scope.config.diskType.curr){
                        $scope.config.configType.values = defaultConfigTypes.concat();
                        $scope.config.configType.curr = "0";
                        $scope.config.configType.disable = true;
                    }
                    else{
                        $scope.config.configType.disable = false;
                    }
                }
            },

            storageMedia: {
                "label": i18n.common_term_storageMedia_label + ":",
                "id": "sspApplyDiskStoreMedia",
                "width": "200",
                "require": $scope.isICT ? false : true,
                "values": [],
                "all": [],
                "curr": "",
                "validate": "regularCheck(" + validator.notAllSpaceReg + "):" + i18n.common_term_choose_label + " ;",
                "change": function() {
                    $scope.config.storageMedia.curr = $("#" + $scope.config.storageMedia.id).widget().getSelectedId();
                }
            },

            configType: {
                "label": i18n.common_term_setMode_label + ":",
                "id": "sspApplyDiskConfigType",
                "width": "200",
                "require": false,
                "values": defaultConfigTypes,
                "curr": "0",
                "change": function() {
                    $scope.config.configType.curr = $("#" + $scope.config.configType.id).widget().getSelectedId();
                }
            }
        };

        $scope.approvalResult = {
            "label": i18n.common_term_approveResult_label + ":",
            "require": "true",
            "id": "sspApprovalDiskApplyResult",
            "spacing": {
                "width": "50px",
                "height": "30px"
            },
            "values": orderServiceIns.approvalOptions
        };

        $scope.approvalOpinion = {
            "label": i18n.common_term_approveAdvice_label + ":",
            "id": "sspApprovalDiskApplyOpinion",
            "type": "multi",
            "width": "644",
            "height": "60",
            "value": "",
            "validate": "regularCheck(" + validator.descriptionReg + "):" + i18n.sprintf(i18n.common_term_maxLength_valid, 1024)
        };

        $scope.okBtn = {
            "id": "sspApplyDiskOkBtn",
            "text": i18n.common_term_submit_button,
            "tooltip": "",
            "click": function () {
                // 校验
                if (!$scope.okBtn.valid()) {
                    return;
                }
                $scope.operate.approvalDisk();
            },
            "valid": function () {
                // 审批意见
                if (!UnifyValid.FormValid($("#sspApprovalDiskApplyApprovalArea"))) {
                    return false;
                }

                // 如果是驳回或关闭，就不用再校验了
                if ($("#" + $scope.approvalResult.id).widget().opChecked("checked") !== "approve"){
                    return true;
                }

                var param = $scope.detail.param;

                if ((param.cloudInfra && param.cloudInfra.lock === '2')) {
                    if (!UnifyValid.FormValid($("#sspApprovalDiskApplyLocationArea"))) {
                        return false;
                    }
                    if (!$scope.cloudInfra.id) {
                        tipMessageIns.alert("error", i18n.service_term_chooseRegion_msg);
                        return false;
                    }
                    if (!$scope.az.curr.id) {
                        tipMessageIns.alert("error", i18n.service_term_chooseAZ_msg);
                        return false;
                    }
                }

                if ((param.capacity && param.capacity.lock === '2')) {
                    if ($(".createvm-cpu .cpu-options[self-defined] input").length > 0) {
                        return false;
                    }
                }

                if (param.mediaType.lock==='2' && $scope.action !== 'view' && !$scope.config.storageMedia.curr) {
                    tipMessageIns.alert("error", i18n.common_term_choose_label + i18n.common_term_storageMedia_label);
                    return false;
                }

                return true;
            }
        };
        $scope.cancelBtn = {
            "id": "sspApplyDiskCancelBtn",
            "text": i18n.common_term_cancle_button,
            "tooltip": "",
            "click": function () {
                setTimeout(function () {
                    window.history.back();
                }, 0);
            }
        };

        $scope.closeBtn = {
            "id": "sspApplyDiskCloseBtn",
            "text": i18n.common_term_return_button,
            "click": function () {
                setTimeout(function () {
                    window.history.back();
                }, 0);
            }
        };

        $scope.modifyBtn = {
            "id": "serviceApprovalEcsModifyBtn",
            "text": i18n.common_term_modify_button,
            "click": function () {
                $state.go($scope.orderDetail.applyUrl, {
                    "action": "edit",
                    "orderId": $scope.orderDetail.orderId,
                    "serviceId": $scope.orderDetail.serviceOffingId
                });
            }
        };

        $scope.doCancelBtn = {
            "id": "serviceApprovalEcsDoCancelBtn",
            "text": i18n.common_term_undo_button,
            "click": function () {
                messageServiceIns.confirmMsgBox({
                    "content": i18n.service_service_drawBack_info_confirm_msg,
                    "callback": function () {
                        $scope.operate.actionOrder({
                            "action": "cancel"
                        });
                    }
                });
            }
        };

        $scope.clickAreaHeading = function (id) {
            var head = $("#" + id + " .s-heading");
            var content = $("#" + id + " .s-content");

            if (head.hasClass("collapse")) {
                // 收起来前，校验一下
                if ($scope.action === "approval") {
                    if (id === "sspApprovalDiskApplyLocationArea") {
                        if (($scope.detail.param.cloudInfra && $scope.detail.param.cloudInfra.lock === '2')) {
                            if (!UnifyValid.FormValid($("#sspApprovalDiskApplyLocationArea"))) {
                                return false;
                            }
                        }
                    } else if (id === "sspApprovalDiskApplyConfigArea") {
                        if (($scope.detail.param.capacity && $scope.detail.param.capacity.lock === '2')) {
                            if ($(".createvm-cpu .cpu-options[self-defined] input").length > 0) {
                                return false;
                            }
                        }

                        if ($scope.detail.param.mediaType.lock==='2' && $scope.action !== 'view' && !$scope.isICT && !UnifyValid.FormValid($("#sspApprovalDiskApplyConfigArea"))){
                                return false;
                        }
                    } else if (id === "sspApprovalDiskApplyApprovalArea") {
                        if (!UnifyValid.FormValid($("#sspApprovalDiskApplyApprovalArea"))) {
                            return false;
                        }
                    }
                }

                head.removeClass("collapse");
                head.addClass("expand");
                content.css("display", "none");
            } else {
                head.removeClass("expand");
                head.addClass("collapse");
                content.css("display", "block");
            }
        };

        $scope.operate = {
            "actionOrder": function (param) {
                var options = {
                    "id": orderId,
                    "user": user,
                    "params": param
                };
                var deferred = orderServiceIns.userActionOrder(options);
                deferred.then(function (data) {
                    $state.go("ssp.order.apply");
                });
            },
            // 查询订单详情
            "queryOrderDetail": function () {
                var retDefer = $.Deferred();
                var options = {
                    "user": user,
                    "orderId": orderId
                };
                var deferred = orderServiceIns.queryOrder(options);
                deferred.then(function (data) {
                    if (!data) {
                        retDefer.reject();
                        return;
                    }

                    // 处理订单信息
                    commonServiceIns.processOrderDetail(data);

                    data.formatDate = data.tenancy !== "0" ? timeCommonService.utc2Local(data.tenancy) : i18n.common_term_neverExpires_label;

                    var orderParam = JSON.parse(data.params) || {};
                    data.param = orderParam;
                    $scope.orderDetail = data;

                    // 将磁盘规格保存下来
                    if (orderParam.size) {
                        $scope.config.size.value = orderParam.size;
                    }
                    if (orderParam.type) {
                        $scope.config.diskType.curr = orderParam.type;
                    }
                    if (orderParam.mediaType) {
                        $scope.config.storageMedia.curr = orderParam.mediaType;
                    }
                    if (!$scope.isICT && orderParam.configType) {
                        $scope.config.configType.curr = orderParam.configType;
                        $scope.config.configType.values = [
                            {
                                "selectId": "0",
                                "label": i18n.common_term_common_label,
                                "checked": "0" === orderParam.configType
                            },
                            {
                                "selectId": "1",
                                "label": i18n.common_term_lazyZeroed_label,
                                "checked": "1" === orderParam.configType
                            },
                            {
                                "selectId": "2",
                                "label": i18n.common_term_thinProv_label,
                                "checked": "2" === orderParam.configType
                            }
                        ];
                    }

                    $scope.detail.param = JSON.parse(data.definationParams);

                    retDefer.resolve();
                });
                return retDefer.promise();
            },

            // 查询地域列表
            "queryLocations": function () {
                var retDefer = $.Deferred();
                var deferred = cloudInfraServiceIns.queryCloudInfras(user.vdcId, user.id);
                deferred.then(function (data) {
                    if (!data) {
                        retDefer.reject();
                        return;
                    }
                    if (data.cloudInfras && data.cloudInfras.length > 0) {
                        $scope.cloudInfra = data.cloudInfras[0];
                        $scope.location.values = data.cloudInfras;
                        retDefer.resolve();
                    }
                });
                return retDefer.promise();
            },

            // 查询地域详情
            "queryLocationDetail": function (id) {
                if (!id) {
                    return;
                }
                var deferred = cloudInfraServiceIns.queryCloudInfra(user.vdcId, user.id, id);
                deferred.then(function (data) {
                    if (data && data.cloudInfra) {
                        $scope.cloudInfra = data.cloudInfra;
                    }
                });
            },

            //查询AZ列表
            "queryAzs": function () {
                var promise = cloudInfraServiceIns.queryAzs(user.vdcId, user.id, $scope.cloudInfra.id);
                promise.then(function (data) {
                    if (!data) {
                        return;
                    }
                    if (data.availableZones && data.availableZones.length > 0) {
                        var azMedia;
                        //保存存储介质
                        _.each(data.availableZones, function (item) {
                            if (item.tags) {
                                azMedia = {
                                    "azId": item.id,
                                    "storage": item.tags.datastore
                                };
                                $scope.config.storageMedia.all.push(azMedia);
                            }
                        });

                        $scope.az.values = data.availableZones;
                        $scope.az.curr = data.availableZones[0];
                        onSelectAz(data.availableZones[0].selectId);
                    }
                });
            },

            //查询AZ详情
            "queryAzDetail": function (azId, cloudInfraId) {
                if (!azId || !cloudInfraId){
                    return;
                }

                var options = {
                    "user": user,
                    "cloudInfraId": cloudInfraId,
                    "azId": azId
                };
                var promise = cloudInfraServiceIns.queryAzDetail(options);
                promise.then(function (data) {
                    if (!data || !data.availableZone) {
                        return;
                    }

                    //保存存储介质
                    var tags = data.availableZone.tags;
                    if (tags) {
                        $scope.config.storageMedia.all = [
                            {
                                "azId": azId,
                                "storage": tags.datastore
                            }
                        ];
                    }

                    $scope.az.curr = data.availableZone;
                    onSelectAz(azId);
                });
            },

            // 查询vpc列表
            "queryVpcs": function () {
                var options = {
                    "user": user,
                    "param": {
                        "cloud-infras": $scope.cloudInfra.id
                    }
                };
                var deferred = ecsServiceIns.queryVpcs(options);
                deferred.then(function (data) {
                    if (!data) {
                        return;
                    }
                    if (data.vpcs && data.vpcs.length > 0) {
                        _.each(data.vpcs, function (item) {
                            _.extend(item, {
                                "label": item.name,
                                "selectId": item.vpcID
                            });
                        });

                        var curVpc = data.vpcs[0];
                        curVpc.checked = true;
                        $scope.vpc.curr = curVpc;
                    }
                    $scope.vpc.values = data.vpcs;
                });
            },

            // 查询vpc详情
            "queryVpcDetail": function (id, cloudInfraId) {
                if (!id || id === "-1" || !cloudInfraId) {
                    return;
                }

                var options = {
                    "user": user,
                    "cloudInfraId": cloudInfraId,
                    "vpcId": id
                };
                var deferred = ecsServiceIns.queryVpcDetail(options);
                deferred.then(function (data) {
                    if (data) {
                        $scope.vpc.curr = data;
                    }
                });
            },

            // 提交申请
            "approvalDisk": function () {
                var approvalResult = $("#" + $scope.approvalResult.id).widget().opChecked("checked");
                var options = {
                    "user": user,
                    "id": $scope.orderDetail.orderId,
                    "params": {
                        "action": approvalResult,
                        "comments": $("#" + $scope.approvalOpinion.id).widget().getValue(),
                        "tenancy": $scope.orderDetail.tenancy
                    }
                };

                if (approvalResult === "approve"){
                    var diskParam = {
                        "cloudInfraId": getCloudInfraId(),
                        "availableZoneId": getAzId(),
                        "vpcId": getVpcId(),
                        "vmId": $scope.orderDetail.param.vmId,
                        "vmName": $scope.orderDetail.param.vmName,
                        "count": $scope.orderDetail.param.count,
                        "name": $scope.orderDetail.param.name,
                        "size": getDiskSize(),
                        "type": getType(),
                        "mediaType": getMediaType()
                    };
                    if(!$scope.isICT){
                        _.extend(diskParam,{
                            "configType": getConfigType()
                        });
                    }
                    options.params.params = JSON.stringify(diskParam);
                }

                var deferred = orderServiceIns.adminActionOrder(options);
                deferred.then(function (data) {
                    setTimeout(function () {
                        window.history.back();
                    }, 0);
                });
            }
        };

        // 提交时获取资源池id
        function getCloudInfraId() {
            var value = null;
            var cloudInfra = $scope.detail.param.cloudInfra;
            if (cloudInfra.lock === "2") {
                value = $scope.cloudInfra.id;
            } else {
                value = $scope.orderDetail.param.cloudInfraId;
            }
            return value;
        }

        // 提交时获取azID
        function getAzId() {
            var value = null;
            var az = $scope.detail.param.availableZone;
            if (az.lock === "2") {
                value = $scope.az.curr.id;
            } else {
                value = $scope.orderDetail.param.availableZoneId;
            }
            return value;
        }

        // 提交时获取VPC ID，vpc锁定情况跟AZ一样
        function getVpcId() {
            var value = null;
            var az = $scope.detail.param.availableZone;
            if (az) {
                if (az.lock === "2") {
                    value = $scope.vpc.curr.vpcID;
                } else {
                    value = $scope.orderDetail.param.vpcId;
                }
            }
            return value;
        }

        // 提交时获取磁盘大小
        function getDiskSize() {
            var value = null;
            var capacity = $scope.detail.param.capacity;
            if (capacity.lock === "2") {
                value = $scope.config.size.value;
            } else {
                value = $scope.orderDetail.param.size;
            }
            return value;
        }

        // 提交时获取磁盘类型
        function getType() {
            var value = null;
            var type = $scope.detail.param.type;
            if (type.lock === "2") {
                value = $scope.config.diskType.curr;
            } else {
                value = $scope.orderDetail.param.type;
            }
            return value;
        }

        // 提交时获取存储介质类型
        function getMediaType() {
            var value = null;
            var type = $scope.detail.param.mediaType;
            if (type.lock === "2") {
                value = $.trim($("#" + $scope.config.storageMedia.id).widget().getSelectedId());
            } else {
                value = $scope.orderDetail.param.mediaType;
            }
            return value;
        }

        // 提交时获取置备类型
        function getConfigType() {
            var value = null;
            var type = $scope.detail.param.configType;
            if (type.lock === "2") {
                value = $.trim($("#" + $scope.config.configType.id).widget().getSelectedId());
            } else {
                value = $scope.orderDetail.param.configType;
            }
            return value;
        }

        //选择AZ
        function onSelectAz(azId) {
            if (azId && $scope.config.storageMedia.all.length > 0) {
                var mediaTypes = $scope.isICT ? [
                    {
                        "selectId": " ",
                        "label": " ",
                        "checked": true
                    }
                ] : [];
                var medias = _.find($scope.config.storageMedia.all, function (item) {
                    return azId === item.azId;
                });
                if (medias) {
                    if (medias.storage && medias.storage.length > 0) {
                        _.each(medias.storage, function (media) {
                            if (media.name.indexOf("MediaType") >= 0) {
                                mediaTypes.push({
                                    "selectId": media.value,
                                    "label": media.value === "SAN-Any" ? "Any" : media.value
                                });
                            }
                        });
                    }
                }
                if (!$scope.isICT && mediaTypes.length > 0 && $scope.detail.param.mediaType.lock==='2' && $scope.action!=='view') {
                    mediaTypes[0].checked = true;
                    $scope.config.storageMedia.curr = mediaTypes[0].selectId;
                }
                $scope.config.storageMedia.values = mediaTypes;
            }
        }

        // 初始化磁盘颜色块事件
        function initDiskAnimal() {
            $(".createvm-cpu div.cpu-options").bind("click", function (evt) {
                if (typeof ($(evt.currentTarget).attr("self-defined")) === "undefined") {
                    $(".createvm-cpu .cpu-options[self-defined]").html(i18n.common_term_custom_label);
                    $(".createvm-cpu .input-tip").css("display", "none");
                    $scope.config.size.value = $(evt.currentTarget).data("value");
                    $scope.config.size.userDef = false;
                }

                $(".createvm-cpu div.cpu-options").removeClass("selected");
                $(evt.currentTarget).addClass("selected");
            });
        }

        // 查询需要的其他信息
        function queryRelatedInfo() {
            var param = $scope.detail.param || {};
            var orderParam = $scope.orderDetail.param || {};
            var tmpCloud = param.cloudInfra || {};

            // 位置信息
            if (tmpCloud.lock === "2" && $scope.action === "approval") { // 审批时输入，查列表
                var deferred = $scope.operate.queryLocations();
                $.when(deferred).done(function () {
                    $scope.operate.queryAzs();

                    if ($scope.isICT) {
                        $scope.operate.queryVpcs();
                    }
                });
            } else if (tmpCloud.lock === "1" || (tmpCloud.lock === "2" && $scope.action === "view")) { // 申请时输入 或查看审批输入订单，查详情
                $scope.operate.queryLocationDetail(orderParam.cloudInfraId);
                $scope.operate.queryAzDetail(orderParam.availableZoneId, orderParam.cloudInfraId);
                $scope.operate.queryVpcDetail(orderParam.vpcId, orderParam.cloudInfraId);
            } else if (tmpCloud.lock === "0") {
                if (param.mediaType && param.mediaType.lock === "2") {
                    $scope.operate.queryAzDetail(orderParam.availableZoneId, orderParam.cloudInfraId);
                }
                $scope.operate.queryVpcDetail(orderParam.vpcId, orderParam.cloudInfraId);
            }

            // 虚拟机必须申请时输入
            $scope.vm.id = orderParam.vmId;
            $scope.vm.name = orderParam.vmName;

            // 容量
            if (param.capacity && param.capacity.lock === "2" && $scope.action === "approval") {
                // 初始化自定义规格颜色块
                initDiskAnimal();
                $(".createvm-cpu .cpu-options[self-defined]").userDefSizeApprovalDisk($scope.config.size);
                $scope.config.size.value = 20;
            }

            // 类型
            if (param.type && param.type.lock === "2" && $scope.action === "approval") {
                $scope.config.diskType.curr = "normal";
            }
        }

        // 初始化页面信息
        function init() {
            var deferred = $scope.operate.queryOrderDetail();
            $.when(deferred).done(function () {
                queryRelatedInfo();
            });
        }

        init();
    }];

    return ctrl;
});
