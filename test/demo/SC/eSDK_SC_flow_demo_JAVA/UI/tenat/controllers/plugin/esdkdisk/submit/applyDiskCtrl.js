/* global define */
define(["tiny-lib/jquery",
        "tiny-lib/angular",
        "tiny-lib/underscore",
        'tiny-common/UnifyValid',
        "app/services/httpService",
        'app/services/messageService',
        "app/services/tipMessageService",
        'app/services/validatorService',
        'app/services/exceptionService',
        'app/services/capacityService',
        "app/services/cloudInfraService",
        "app/business/ssp/services/catalog/catalogService",
        "app/business/ssp/services/order/orderService",
        "app/business/ssp/services/plugin/ecs/ecsService",
        "app/business/ssp/services/plugin/commonService",
        'app/services/commonService',
        'tiny-widgets/Window',
        'tiny-directives/RadioGroup'
], function ($, angular, _, UnifyValid, http, messageService, tipMessageService, validatorService, exceptionService, capacityService, cloudInfraService, catalogService, orderService, ecsService, commonService, timeCommonService, Window) {
    "use strict";

    // 自定义磁盘大小框
    $.fn.userDefDiskSize = function (size) {
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
        var action = $stateParams.action;

        var validator = new validatorService();
        var cloudInfraServiceIns = new cloudInfraService($q, camel);
        var capacityServiceIns = new capacityService($q, camel);
        var catalogServiceIns = new catalogService(exception, $q, camel);
        var orderServiceIns = new orderService(exception, $q, camel);
        var ecsServiceIns = new ecsService(exception, $q, camel);
        var commonServiceIns = new commonService(exception);
        var messageServiceIns = new messageService();
        var tipMessage = new tipMessageService();

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

        // 服务详情
        $scope.detail = {};
        // 订单详情
        $scope.orderDetail = {};
        $scope.cloudInfra = {};

        // 地域信息
        $scope.location = {
            "id": "serviceApplyDiskRegion",
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

                $scope.vm.clear();
            }
        };

        // az
        $scope.az = {
            "label": i18n.resource_term_AZ_label + ":",
            "id": "serviceApplyDiskAz",
            "width": "180",
            "values": [],
            "curr": {},
            "require": true,
            "validate": "required:" + i18n.common_term_null_valid + ";",
            "change": function () {
                var azId = $("#" + $scope.az.id).widget().getSelectedId();
                onSelectAz(azId);
                $scope.az.curr = cloudInfraServiceIns.getSpecAz($scope.az.values, azId);
                $scope.vm.clear();
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
                    cloudInfraId: $scope.cloudInfra.id,
                    needRefresh: false
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
                        if (winParam.needRefresh) {
                            $scope.$apply(function(){
                                $scope.vm.name = winParam.vmName;
                                $scope.vm.id = winParam.vmId;
                            });
                        }
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
            name: {
                "label": i18n.common_term_name_label + ":",
                "require": true,
                "width": "220",
                "value": "",
                "id": "serviceApplyEcsName",
                "extendFunction": ["nameValid"],
                "validate": "nameValid():" + i18n.common_term_composition3_valid + i18n.sprintf(i18n.common_term_length_valid, 1, 56)
            },

            diskNum: {
                "label": i18n.common_term_diskNum_label + ":",
                "require": true,
                "id": "serviceApplyDiskVmNum",
                "width": "180",
                "value": "1",
                "min": "1",
                "max": "10",
                "step": "1"
            },

            // 到期时间
            expireTime: {
                "label": i18n.common_term_overdueTime_label + ":",
                "id": "serviceApplyDiskExpireTime",
                "width": "178",
                "require": true,
                "disable": false,
                "type": "datetime",
                "minDate": commonServiceIns.getCurrentTime(),
                "defaultDate": commonServiceIns.get30DaysDate(),
                //"defaultTime": "23:59",
                "dateFormat": "yy-mm-dd",
                "timeFormat": "hh:mm:ss"
            },

            neverExpire: {
                "id": "serviceApplyDiskNeverExpire",
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
                "value": "20",
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
                "curr": "normal",
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
                "disable": false,
                "values": defaultConfigTypes,
                "curr": "0",
                "change": function() {
                    $scope.config.configType.curr = $("#" + $scope.config.configType.id).widget().getSelectedId();
                }
            }
        };

        $scope.okBtn = {
            "id": "serviceApplyDiskOkBtn",
            "text": i18n.common_term_submit_button,
            "tooltip": "",
            "click": function () {
                // 校验
                if (!$scope.okBtn.valid()) {
                    return;
                }
                $scope.operate.applyDisk();
            },
            "valid": function () {
                var param = $scope.detail.param;

                if ((param.cloudInfra && param.cloudInfra.lock === '1')) {
                    if (!UnifyValid.FormValid($("#sspApplyDiskLocationArea"))) {
                        return false;
                    }
                }

                if ((param.capacity && param.capacity.lock === '1')) {
                    if ($(".createvm-cpu .cpu-options[self-defined] input").length > 0) {
                        return false;
                    }
                }

                if (!$scope.isICT && param.mediaType.lock==='1') {
                    if (!UnifyValid.FormValid($("#sspApplyDiskConfigArea"))) {
                        return false;
                    }

                    if (!$scope.config.storageMedia.curr) {
                        tipMessage.alert("error", i18n.common_term_choose_label + i18n.common_term_storageMedia_label);
                        return false;
                    }
                }

                if (!UnifyValid.FormValid($("#sspApplyDiskBasicArea"))) {
                    return false;
                }

                var diskNum = $("#" + $scope.base.diskNum.id).widget().option("value");
                if (!diskNum || diskNum < 1) {
                    tipMessage.alert("error", i18n.service_term_chooseDiskNum_msg);
                    return false;
                }
                return true;
            }
        };
        $scope.cancelBtn = {
            "id": "serviceApplyDiskCancelBtn",
            "text": i18n.common_term_cancle_button,
            "tooltip": "",
            "click": function () {
                setTimeout(function () {
                    window.history.back();
                }, 0);
            }
        };

        $scope.clickAreaHeading = function (id) {
            var head = $("#" + id + " .s-heading");
            var content = $("#" + id + " .s-content");

            if (head.hasClass("collapse")) {
                // 收起来前，校验一下
                if (id === "sspApplyDiskLocationArea") {
                    if (!UnifyValid.FormValid($("#sspApplyDiskLocationArea"))) {
                        return false;
                    }
                } else if (id === "sspApplyDiskConfigArea") {
                    if ($(".createvm-cpu .cpu-options[self-defined] input").length > 0) {
                        return false;
                    }
                    if (!$scope.isICT && $scope.detail.param.mediaType.lock==='1' && !UnifyValid.FormValid($("#sspApplyDiskConfigArea"))) {
                        return false;
                    }
                } else if (id === "sspApplyDiskBasicArea") {
                    if (!UnifyValid.FormValid($("#sspApplyDiskBasicArea"))) {
                        return false;
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
            // 查询服务详情
            "queryServiceDetail": function () {
                var retDefer = $.Deferred();
                var options = {
                    "user": user,
                    "id": serviceId
                };
                var deferred = catalogServiceIns.queryServiceOffering(options);
                deferred.then(function (data) {
                    if (!data) {
                        retDefer.reject();
                        return;
                    }
                    $scope.detail = data;
                    var param = JSON.parse(data.params);
                    $scope.detail.param = param;

                    var cloudInfra = param.cloudInfra;
                    if (cloudInfra && cloudInfra.lock === "0") {
                        $scope.cloudInfra.id = cloudInfra.id;
                    }

                    var az = param.availableZone;
                    if (az && az.lock === "0") {
                        $scope.az.curr.id = az.id;
                    }
                    var cap = param.capacity;
                    if (cap && cap.lock === "0") {
                        $scope.config.size.value = cap.value;
                    }
                    var diskType = param.type;
                    if (diskType && diskType.lock === "0") {
                        $scope.config.diskType.curr = diskType.value;
                    }
                    var media = param.mediaType;
                    if (media && media.lock === "0") {
                        $scope.config.storageMedia.curr = media.value;
                    }
                    var configType = param.configType;
                    if (configType && configType.lock === "0") {
                        $scope.config.configType.curr = configType.value;
                    }

                    var vpc = param.vpc;
                    if (vpc && vpc.lock === "0") {
                        $scope.vpc.curr.vpcID = vpc.id;
                    }

                    retDefer.resolve();
                });
                return retDefer.promise();
            },

            // 查询订单详情
            "queryOrderDetail": function () {
                if (action !== "edit") {
                    return {};
                }
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
                    $scope.orderDetail = data;
                    var param = JSON.parse(data.params);
                    $scope.orderDetail.param = param;
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
                        if (action === "edit") {
                            data.cloudInfras[0].checked = false;
                            var selectedCloudInfra = cloudInfraServiceIns.getCloudInfra(data.cloudInfras, $scope.orderDetail.param.cloudInfraId);
                            if (selectedCloudInfra) {
                                selectedCloudInfra.checked = true;
                            }
                            $scope.cloudInfra = selectedCloudInfra;
                        } else {
                            $scope.cloudInfra = data.cloudInfras[0];
                        }
                        $scope.location.values = data.cloudInfras;
                        retDefer.resolve();
                    }
                });
                return retDefer.promise();
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

                        var selectAz;
                        if (action === "edit") {
                            data.availableZones[0].checked = false;
                            selectAz = cloudInfraServiceIns.getSpecAz(data.availableZones, $scope.orderDetail.param.availableZoneId);
                        }

                        if (!selectAz) {
                            selectAz = data.availableZones[0];
                        }

                        selectAz.checked = true;
                        $scope.az.curr = selectAz;
                        $scope.az.values = data.availableZones;
                        onSelectAz(selectAz.selectId, action==="edit");
                    }
                }, function (response) {
                    exception.doException(response);
                });
            },

            //查询AZ详情
            "queryAzDetail": function (id) {
                var options = {
                    "user": user,
                    "cloudInfraId": $scope.cloudInfra.id,
                    "azId": id
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
                                "azId": id,
                                "storage": tags.datastore
                            }
                        ];
                    }

                    $scope.az.curr = data.availableZone;
                    onSelectAz(id, action==="edit");
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

                        var param = $scope.orderDetail.param || {};
                        var curVpc;
                        if (action === "edit") {
                            curVpc = _.find(data.vpcs, function (item) {
                                return item.vpcID === param.vpcId;
                            });
                        } else {
                            curVpc = data.vpcs[0];
                        }

                        if (curVpc) {
                            curVpc.checked = true;
                            $scope.vpc.curr = curVpc;
                        }
                    }
                    $scope.vpc.values = data.vpcs;
                });
            },

            // 提交申请
            "applyDisk": function () {
                var diskParam = {
                    "cloudInfraId": getCloudInfraId(),
                    "availableZoneId": getAzId(),
                    "vpcId": getVpcId(),
                    "vmId": $scope.vm.id,
                    "vmName": $scope.vm.name,
                    "count": $("#" + $scope.base.diskNum.id).widget().option("value"),
                    "size": getDiskSize(),
                    "name": $("#" + $scope.base.name.id).widget().getValue(),
                    "type": getType(),
                    "mediaType": getMediaType()
                };

                if(!$scope.isICT){
                    _.extend(diskParam,{
                        "configType": getConfigType()
                    });
                }

                var options;
                var deferred;
                var tenancy = $("#" + $scope.base.neverExpire.id).widget().option("checked") ? "0" : timeCommonService.local2Utc($("#" + $scope.base.expireTime.id).widget().getDateTime());
                var comments = $("#" + $scope.base.remark.id).widget().getValue();
                if (action === "edit") { // 修改订单
                    options = {
                        "user": user,
                        "id": orderId,
                        "params": {
                            "params": JSON.stringify(diskParam),
                            "tenancy": tenancy,
                            "comments": comments
                        }
                    };
                    deferred = orderServiceIns.modifyOrder(options);
                } else { // 申请订单
                    options = {
                        "user": user,
                        "params": {
                            "apply": {
                                "serviceOfferingId": serviceId,
                                "params": JSON.stringify(diskParam),
                                "tenancy": tenancy
                            },
                            "comments": comments
                        }
                    };
                    deferred = orderServiceIns.createOrder(options);
                }

                deferred.then(function (data) {
                    if (data && data.orderId) {
                        tipMessage.sspAlert(data.orderId, function(){
                            $state.go("ssp.approvalDiskApply", {
                                "orderId" : data.orderId,
                                "action" : "view",
                                "serviceId" : serviceId
                            });
                        });
                    }
                    $state.go("ssp.order.apply");
                });
            }
        };

        // 提交时获取资源池id
        function getCloudInfraId() {
            var value = null;
            var cloudInfra = $scope.detail.param.cloudInfra || {};
            if (cloudInfra.lock === "0") {
                value = cloudInfra.id;
            } else if (cloudInfra.lock === "1") {
                value = $scope.cloudInfra.id;
            }
            return value;
        }

        // 提交时获取azID
        function getAzId() {
            var value = null;
            var az = $scope.detail.param.availableZone || {};
            if (az.lock === "0") {
                value = az.id;
            } else if (az.lock === "1") {
                value = $scope.az.curr.id;
            }
            return value;
        }

        // 提交时获取VPC ID，地域锁定时，vpc固定为申请时输入；地域申请时输入，vpc也申请时输入
        function getVpcId() {
            var value = null;
            var cloudInfra = $scope.detail.param.cloudInfra || {};
            if (cloudInfra.lock !== "2") {
                value = $scope.vpc.curr.vpcID;
            }
            return value;
        }

        // 提交时获取磁盘大小
        function getDiskSize() {
            var value = null;
            var capacity = $scope.detail.param.capacity || {};
            if (capacity.lock === "0") {
                value = capacity.value;
            } else if (capacity.lock === "1") {
                value = $scope.config.size.value;
            }
            return value;
        }

        // 提交时获取磁盘类型
        function getType() {
            var value = null;
            var type = $scope.detail.param.type || {};
            if (type.lock === "0") {
                value = type.value;
            } else if (type.lock === "1") {
                value = $scope.config.diskType.curr;
            }
            return value;
        }

        // 提交时获取存储介质类型
        function getMediaType() {
            var value = null;
            var type = $scope.detail.param.mediaType || {};
            if (type.lock === "0") {
                value = type.value;
            } else if (type.lock === "1") {
                value = $.trim($("#" + $scope.config.storageMedia.id).widget().getSelectedId());
            }
            return value;
        }

        // 提交时获取置备类型
        function getConfigType() {
            var value = null;
            var type = $scope.detail.param.configType || {};
            if (type.lock === "0") {
                value = type.value;
            } else if (type.lock === "1") {
                value = $.trim($("#" + $scope.config.configType.id).widget().getSelectedId());
            }
            return value;
        }

        //选择AZ, flag为true表示当前是修改订单，且需要选中orderDetail中的存储介质
        function onSelectAz(azId, flag) {
            if (azId && $scope.config.storageMedia.all.length > 0) {
                var mediaTypes = $scope.isICT ? [
                    {
                        "selectId": " ",
                        "label": " ",
                        "checked": !flag
                    }
                ] : [];
                var medias = _.find($scope.config.storageMedia.all, function (item) {
                    return azId === item.azId;
                });

                var param = $scope.orderDetail.param || {};
                var currMedia = param.mediaType;
                if (medias) {
                    if (medias.storage && medias.storage.length > 0) {
                        _.each(medias.storage, function (media) {
                            if (media.name.indexOf("MediaType") >= 0) {
                                mediaTypes.push({
                                    "selectId": media.value,
                                    "label": media.value === "SAN-Any" ? "Any" : media.value,
                                    "checked": flag && media.value === currMedia
                                });
                            }
                        });
                    }
                }

                if (!$scope.isICT && !flag && mediaTypes.length > 0) {
                    mediaTypes[0].checked = true;
                    $scope.config.storageMedia.curr = mediaTypes[0].selectId;
                }

                if (flag){
                    $scope.config.storageMedia.curr = currMedia;
                }
                $scope.config.storageMedia.values = mediaTypes;
            }
        }

        UnifyValid.nameValid = function () {
            var input = $("#" + $scope.base.name.id).widget().getValue();
            if ($.trim(input) === "") {
                return true;
            }
            var nameReg = /^[ ]*[A-Za-z0-9-_\u4e00-\u9fa5]{1,56}[ ]*$/;
            return nameReg.test(input);
        };

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
                    $scope.config.size.value = size;
                    $scope.config.size.userDef = true;

                    $(".createvm-cpu div.cpu-options").removeClass("selected");
                    dom.addClass("selected");
                }
            }
        }

        //根据订单详情，初始化页面信息
        function initBaseByOrderDetail() {
            if (action !== "edit") {
                return;
            }

            var param = $scope.orderDetail.param || {};

            // 绑定的虚拟机名称
            $scope.vm.name = param.vmName;

            // 磁盘类型
            $scope.config.diskType.curr = param.type;
            $scope.config.diskType.values = [
                {
                    "key": "normal",
                    "text": i18n.common_term_common_label,
                    "checked": param.type === "normal"
                },
                {
                    "key": "share",
                    "text": i18n.common_term_share_label,
                    "checked": param.type === "share"
                }
            ];

            if(param.type === "share"){
                $scope.config.configType.disable = true;
            }

            // IT场景设置磁盘置备类型
            if (!$scope.isICT && param.configType) {
                var value = param.configType;
                if(value){
                    $scope.config.configType.values = [
                        {
                            "selectId": "0",
                            "label": i18n.common_term_common_label,
                            "checked": "0" === value
                        },
                        {
                            "selectId": "1",
                            "label": i18n.common_term_lazyZeroed_label,
                            "checked": "1" === value
                        },
                        {
                            "selectId": "2",
                            "label": i18n.common_term_thinProv_label,
                            "checked": "2" === value
                        }
                    ];
                }
            }

            // 磁盘个数
            $scope.base.diskNum.value = param.count || "1";

            // 到期时间
            var tenancy = $scope.orderDetail.tenancy;
            if (tenancy) {
                if (tenancy === "0") {
                    $scope.base.expireTime.disable = true;
                    $scope.base.neverExpire.checked = true;
                } else {
                    var dateWidget = $("#" + $scope.base.expireTime.id).widget();
                    if (dateWidget) {
                        var localTime = timeCommonService.utc2Local(tenancy);
                        var dateTime = localTime.split(" ");
                        dateWidget.option("defaultTime", dateTime[1]);
                        dateWidget.option("defaultDate", dateTime[0]);
                    }
                }
            }

            // 名称 备注
            $scope.base.name.value = param.name;
            $scope.base.remark.value = $scope.orderDetail.comments;
        }

        // 查询需要的其他信息
        function queryRelatedInfo() {
            var param = $scope.detail.param || {};

            if (param.cloudInfra && param.cloudInfra.lock === "1") {
                var deferred = $scope.operate.queryLocations();
                $.when(deferred).done(function () {
                    $scope.operate.queryAzs();

                    if ($scope.isICT) {
                        $scope.operate.queryVpcs();
                    }
                });
            }

            // 位置锁定时，VPC固定为申请时输入
            if (param.cloudInfra && param.cloudInfra.lock === "0") {
                if ($scope.isICT) {
                    $scope.operate.queryVpcs();
                }
            }

            // 存储介质从AZ来，如果AZ锁定，需要查AZ详情
            if (param.mediaType && param.mediaType.lock !== "2") {
                if (param.availableZone && param.availableZone.lock === "0") {
                    $scope.operate.queryAzDetail(param.availableZone.id);
                }
            }

            // 初始化自定义规格颜色块
            setTimeout(function () {
                if (param.capacity && param.capacity.lock !== "2") {
                    initDiskAnimal();
                    $(".createvm-cpu .cpu-options[self-defined]").userDefDiskSize($scope.config.size);
                    $scope.$apply(function(){
                        initDiskSizeByOrderDetail();
                    });
                }
            }, 50);
        }

        // 初始化页面信息
        function init() {
            var deferred = $scope.operate.queryServiceDetail();
            var deferred2 = $scope.operate.queryOrderDetail();
            $.when(deferred, deferred2).done(function () {
                //根据订单详情，初始化基本信息部分
                initBaseByOrderDetail();
                queryRelatedInfo();
            });
        }

        init();
    }];

    return ctrl;
});
