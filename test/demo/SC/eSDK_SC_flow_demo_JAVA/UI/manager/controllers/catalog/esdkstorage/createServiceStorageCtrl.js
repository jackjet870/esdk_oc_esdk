define(['jquery',
    'tiny-lib/angular',
    "tiny-widgets/Checkbox",
    "tiny-widgets/Radio",
    "tiny-widgets/Select",
    "tiny-widgets/Textbox",
    "tiny-widgets/Button",
    "tiny-widgets/Window",
    "tiny-widgets/Message",
    "tiny-common/UnifyValid",
    'app/services/validatorService',
    "app/business/service/services/catalog/catalogService",
    "app/business/service/services/service/createService"],
    function ($, angular, Checkbox, Radio, Select, Textbox, Button, Window, Message, UnifyValid, validatorService, catalogService, createService) {
        "use strict";
        var createStorageCtrl = ["$scope", "$compile", "$state", "$stateParams", "camel", "$q", "validator", "exception", function ($scope, $compile, $state, $stateParams, camel, $q, validator, exception) {
            var validatorServiceIns = new validatorService();
            var catalogServiceIns = new catalogService(exception, $q, camel);
            var createServiceIns = new createService(exception, $q, camel);
            var i18n = $scope.i18n;
            var user = $scope.user;
            var applyTypeId = $stateParams.applyTypeId;
            var templateId = $stateParams.templateId;
            var serviceId = $stateParams.serviceId;
            $scope.cloudType = $scope.user.cloudType == "OPENSTACK"?"ICT":"IT"
            if($scope.cloudType == "IT"){
                $scope.storageConifgData = [
                    {
                        "selectId": "0",
                        "label": (i18n.common_term_common_label ||"普通"),
                         checked:true
                    },
                    {
                        "selectId": "1",
                        "label": (i18n.common_term_lazyZeroed_label || "普通延迟置零")
                    },
                    {
                        "selectId": "2",
                        "label": (i18n.common_term_thinProv_label ||"精简")
                    }
                ];
            }else{
                $scope.storageConifgData = [
                    {
                        "selectId": "0",
                        "label": (i18n.common_term_common_label ||"普通"),
                        checked:true
                    }];
            }
            var getTypes = function (options) {
                options = options || {};
                options = {
                    disable: options.disable || [false, false, false],
                    checked: options.checked || [true, false, false]
                };
                return [
                    {
                        "key": "1",
                        "text": i18n.service_term_inputWhenApply_label||"申请时输入",
                        "disable": options.disable["1"],
                        "checked": options.checked["1"]
                    },
                    {
                        "key": "2",
                        "text": i18n.service_term_inputWhenApprove_label||"审批时输入",
                        "disable": options.disable["2"],
                        "checked": options.checked["2"]
                    },
                    {
                        "key": "0",
                        "text": i18n.user_term_lock_button || "锁定",
                        "disable": options.disable["0"],
                        "checked": options.checked["0"]
                    }
                ];
            };

            $scope.createStorageStep1 = {
                "url": "../src/app/business/service/views/catalog/esdkstorage/locationInfo.html"
            };
            $scope.createStorageStep2 = {
                "url": "../src/app/business/service/views/catalog/esdkstorage/storageQuotaInfo.html"
            };
            $scope.createStorageStep3 = {
                "url": "../src/app/business/service/views/catalog/esdkstorage/basicInfo.html"
            };
            $scope.createStorageStep4 = {
                "url": "../src/app/business/service/views/catalog/esdkstorage/createStorageConfirmInfo.html"
            };
            //控制步骤中各页面的显示
            $scope.locationInfoPage = true;
            $scope.storageQuotaPage = false;
            $scope.basicInfoPage = false;
            $scope.createStorageConfirmPage = false;
            $scope.createStorageStep = {
                "id": "createStorageStep",
                "values": [
                    i18n.common_term_location_label||"位置信息",
                    i18n.resource_term_setStor_button||"存储配置",
                    i18n.common_term_basicInfo_label || "基本信息",
                    i18n.common_term_confirmInfo_label || "确认信息"
                ],
                "width": "800",
                "jumpable": false
            };
            $scope.areaId = null;

            //定义全局变量
            $scope.params = {
                "applyType": null,
                "area": null,
                "areaLock": null,
                "az": null,
                "azLock": null,
                "storageType": null,
                "storageTypeLock": null,
                "storageSize": null,
                "storageSizeLock": null,
                "storageMedia": null,
                "storageMediaLock": null,
                "whiteList": null,
                "serviceName": null,
                "catalogList": null,
                "desc": null,
                "iconId": "",
                "storageConfigLock":null,
                "storageConfig":null
            };
            //位置信息界面
            $scope.locationInfo = {
                "location": {
                    label: (i18n.common_term_section_label || "地域") + ":",
                    require: true,
                    "id": "createApp-chooseLocation",
                    "width": 200,
                    'validate': 'required:' + (i18n.common_term_null_valid || "不能为空。"),
                    "change": function () {
                        $scope.areaId = $("#" + $scope.locationInfo.location.id).widget().getSelectedId();
                        queryAzlist();
                    },
                    "values": [],
                    "disable": "false"
                },
                "locationLock": {
                    "label": "",
                    "require": "true",
                    "id": "locationSelect",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false],
                        disable: [false, false, applyTypeId == "none"]
                    }),
                    "layout": "horizon",
                    "change": function () {
                        var loactLock = $("#" + $scope.locationInfo.locationLock.id).widget().opChecked("checked");
                        if (loactLock === '0') {
                            $scope.locationInfo.location.disable = false;
                            $scope.locationInfo.vpc.disable = false;
                            $("#createDisk-storageMedia").show();
                        }
                        else {
                            $scope.locationInfo.location.disable = true;
                            $scope.locationInfo.vpc.disable = true;
                            $scope.params.storageMedia = "";
                            $scope.createStorageConfirmInfo.storageMedia.value = "";
                            $scope.params.areaLock = "";
                            $scope.params.azLock = "";
                            $scope.params.area = "";
                            $scope.createStorageConfirmInfo.area.value = "";
                            $scope.params.az = "";
                            $scope.createStorageConfirmInfo.az.value = "";
                            $("#createDisk-storageMedia").hide();
                        }

                    }
                },
                "vpc": {
                    label: (i18n.resource_term_Azs_label || "可用分区") + ":",
                    require: true,
                    "id": "createApp-chooseVpc",
                    "width": 200,
                    'validate': 'required:' + (i18n.common_term_null_valid || "不能为空。"),
                    "values": [],
                    "disable": false,
                    "change": function () {
                        queryStorageMedia($("#" + $scope.locationInfo.vpc.id).widget().getSelectedId())
                    }
                },
                perBtn: {
                    "id": "create-catalog-basicInfo-pre",
                    "text": i18n.common_term_back_button || "上一步",
                    "display": !serviceId,
                    "click": function () {
                        $state.go("service.create");
                    }
                },
                nextBtn: {
                    "id": "create-catalog-basicInfo-next",
                    "text": i18n.common_term_next_button || "下一步",
                    "click": function () {
                        var valid = UnifyValid.FormValid($("#createStoragelocation"));
                        if (!valid) {
                            return;
                        }
                        $("#" + $scope.createStorageStep.id).widget().next();
                        $scope.locationInfoPage = false;
                        $scope.storageQuotaPage = true;
                        $scope.basicInfoPage = false;
                        $scope.createStorageConfirmPage = false;
                        var appTypeStatus = applyTypeId;
                        var storageTypeStatus = $("#" + $scope.disk.diskTypeLock.id).widget();
                        var storageSizeStatus = $("#" + $scope.disk.diskSizeLock.id).widget();
                        var storageMediaStatus = $("#" + $scope.disk.diskMediaLock.id).widget();
                        $scope.params.applyType = appTypeStatus;
                        var appText = i18n.service_term_approveNotRequire_label||"无审批";
                        if (appTypeStatus === "vdc") {
                            appText = i18n.service_term_approveByVDCadmin_label||"VDC管理员审批";
                        }
                        else if (appTypeStatus === "domain") {
                            appText = i18n.service_term_approveBySysadmin_label||"系统管理员审批";
                        }
                        $scope.createStorageConfirmInfo.apptype.value = appText;
                        var areaLock = $("#" + $scope.locationInfo.locationLock.id).widget().opChecked("checked");
                        $scope.params.areaLock = areaLock;
                        $scope.params.azLock = areaLock;
                        var confirmstorageAreaLock = $("#" + $scope.createStorageConfirmInfo.storageAreaappType.id).widget();
                        var confirmstorageAzLock = $("#" + $scope.createStorageConfirmInfo.storageAzappType.id).widget();
                        confirmstorageAreaLock.opChecked(areaLock, true);
                        confirmstorageAzLock.opChecked(areaLock, true);
                        if (appTypeStatus === "none") {
                            storageTypeStatus.opDisabled("2", true);
                            storageSizeStatus.opDisabled("2", true);
                            storageMediaStatus.opDisabled("2", true);
                        }
                        else {
                            storageTypeStatus.opDisabled("2", false);
                            storageSizeStatus.opDisabled("2", false);
                            storageMediaStatus.opDisabled("2", false);
                        }
                        if (areaLock === "0") {
                            $scope.params.area = $("#" + $scope.locationInfo.location.id).widget().getSelectedId();
                            $scope.createStorageConfirmInfo.area.value = $("#" + $scope.locationInfo.location.id).widget().getSelectedLabel();
                            $scope.params.az = $("#" + $scope.locationInfo.vpc.id).widget().getSelectedId();
                            $scope.createStorageConfirmInfo.az.value = $("#" + $scope.locationInfo.vpc.id).widget().getSelectedLabel();
                            storageMediaStatus.opDisabled("0", false);
                            storageMediaStatus.opDisabled("1", false);
                            storageMediaStatus.opDisabled("2", appTypeStatus === "none");
                            storageMediaStatus.opChecked(areaLock, true);
                        } else if (areaLock === "1") {
                            storageMediaStatus.opDisabled("0", true);
                            storageMediaStatus.opDisabled("1", false);
                            storageMediaStatus.opDisabled("2", appTypeStatus === "none");

                            var oldMedia = "0";
                            if ($scope.serviceInstaceQuota && $scope.serviceInstaceQuota.mediaType.lock) {
                                oldMedia = $scope.serviceInstaceQuota.mediaType.lock;
                            }
                            if (oldMedia == "0") {
                                storageMediaStatus.opChecked("2", true);
                            }
                        }
                        else {
                            storageMediaStatus.opDisabled("0", true);
                            storageMediaStatus.opDisabled("1", true);
                            storageMediaStatus.opDisabled("2", appTypeStatus === "none");
                            storageMediaStatus.opChecked("2", true);

                        }
                        $scope.disk.diskTypeLock.change();
                        $scope.disk.diskSizeLock.change();
                        $scope.disk.diskMediaLock.change();
                        if($scope.cloudType == "IT"){
                            $scope.disk.storageConfigLock.change();
                        }
                        queryStorageMedia();
                        initAnimal();
                        if(serviceId && $scope.cloudType == "IT"){
                            $("#" + $scope.disk.storageConfigType.id).widget().opChecked($scope.modifyStorageConfig);
                        }
                        var $selfDefined = $(".createStorage-disk .disk-options[self-defined]");
                        if ($scope.serviceInstaceQuota && $scope.serviceInstaceQuota.capacity.value) {
                            var $sizeBlock = $("[data-value='" + $scope.serviceInstaceQuota.capacity.value + "']");
                            var $allSizeBlock = $(".types-options.disk-options").removeClass("selected");
                            $allSizeBlock.removeClass("selected");
                            if ($sizeBlock && $sizeBlock.length) {
                                $sizeBlock.addClass("selected");
                            } else {
                                $scope.disk.userDefConfig.diskSizeInput = $scope.serviceInstaceQuota.capacity.value;
                                $allSizeBlock.last().addClass("selected");
                                $selfDefined.text($scope.serviceInstaceQuota.capacity.value + "G");
                            }
                        }
                        $selfDefined.editDisk($scope.disk.userDefConfig, $scope);
                    }
                },
                cancelBtn: {
                    "id": "create-catalog-basicInfo-cancel",
                    "text": i18n.common_term_cancle_button || "取消",
                    "click": function () {
                        $state.go("service.serviceManager");
                    }
                }
            };
            // 查询地域
            function queryArea(cloudInfraId, availableZoneId) {
                var deferred = createServiceIns.queryCloudInfras(user.orgId, user.id);
                deferred.then(function (data) {
                    if (data && data.cloudInfras) {
                        var cloudInfras = data.cloudInfras || [];
                        var selectValues = [];
                        for (var i = 0, len = cloudInfras.length; i < len; i++) {
                            var item = cloudInfras[i];
                            selectValues.push({
                                "selectId": item.id,
                                "label": item.region,
                                "checked": cloudInfraId == item.id || (!cloudInfraId && !i)
                            });
                        }
                        $scope.areaId = cloudInfraId || selectValues[0].selectId;
                        $scope.locationInfo.location.values = selectValues;

                        queryAzlist(availableZoneId);
                    }
                });
            }

            //查询AZ
            function queryAzlist(availableZoneId) {
                var deferred = createServiceIns.queryAzs(user.vdcId, user.id, $scope.areaId);
                deferred.then(function (data) {
                    if (data && data.availableZones) {

                        var availableZones = data.availableZones || [];
                        var selectValues = [];
                        for (var i = 0, len = availableZones.length; i < len; i++) {
                            var item = availableZones[i];
                            selectValues.push({
                                "selectId": item.id,
                                "label": item.name,
                                "checked": availableZoneId == item.id || (!availableZoneId && !i)
                            });
                        }
                        $scope.locationInfo.vpc.values = selectValues;
                    }
                })
            }

            // 存储配置
            $scope.disk = {
                userDefConfig: {
                    "diskSize": 20,
                    "diskSizeInput": false //是否是用户输入的diskSize
                },
                diskTypeLock: {
                    "label": "",
                    "require": "false",
                    "id": "diskTypeLock",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false]
                    }),
                    "layout": "horizon",
                    "change": function () {
                        var disktypeLockStatus = $("#" + $scope.disk.diskTypeLock.id).widget().opChecked("checked");
                        if (disktypeLockStatus === "0") {
                            $("#creatDisk-diskType").show();
                        }
                        else {
                            $("#creatDisk-diskType").hide();
                            $scope.params.storageType = "";
                            $scope.createStorageConfirmInfo.storageType.value = "";
                        }
                    }
                },
                disktype: {
                    "label": (i18n.common_term_type_label || "类型") + ":",
                    "require": "true",
                    "id": "disktype",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": [
                        {
                            "key": "normal",
                            "text": i18n.common_term_common_label || "普通",
                            "checked": true,
                            "disable": false
                        },
                        {
                            "key": "share",
                            "text": i18n.common_term_share_label || "共享",
                            "disable": false
                        }
                    ],
                    "layout": "horizon",
                    "change": function () {
                    }
                },
                storageConfigLock: {
                    "label": "",
                    "require": "false",
                    "id": "storageConfigLock",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false]
                    }),
                    "layout": "horizon",
                    "change": function () {
                        var storageConfigLockStatus = $("#" + $scope.disk.storageConfigLock.id).widget().opChecked("checked");
                        if (storageConfigLockStatus === "0") {
                            $("#creatDisk-storageConfigType").show();
                        }
                        else {
                            $("#creatDisk-storageConfigType").hide();
                            $scope.params.storageConfig = "";
                            $scope.createStorageConfirmInfo.storageConfigType.value = "";
                        }
                    }
                },
                storageConfigType:{
                    "label": (i18n.common_term_setMode_label || "配置模式：") + ":",
                    "id": "storageConfigType",
                    "width": "150",
                    "disable":false,
                    "require":false,
                    "values": $scope.storageConifgData
                },
                diskSizeLock: {
                    "label": "",
                    "require": "false",
                    "id": "diskSizeLock",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false]
                    }),
                    "layout": "horizon",
                    "change": function () {
                        var disksizeLockStatus = $("#" + $scope.disk.diskSizeLock.id).widget().opChecked("checked");
                        if (disksizeLockStatus === "0") {
                            $("#createDisk-size").show();
                        }
                        else {
                            $("#createDisk-size").hide();
                            $scope.params.storageSize = "";
                            $scope.createStorageConfirmInfo.storageSize.value = "";
                        }
                    }
                },
                size: {
                    "id": "diskSize",
                    "label": ""
                },
                diskMediaLock: {
                    "label": "",
                    "require": "false",
                    "id": "diskMediaLock",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false],
                        disable: [false, false, false]
                    }),
                    "layout": "horizon",
                    "change": function () {
                        var diskMediaLockStatus = $("#" + $scope.disk.diskMediaLock.id).widget().opChecked("checked");
                        if (diskMediaLockStatus == "0") {
                            $("#createDisk-storageMedia").show();
                        }
                        else {
                            $("#createDisk-storageMedia").hide();
                            $scope.params.storageMedia = "";
                            $scope.createStorageConfirmInfo.storageMedia.value = "";
                        }
                    }
                },
                diskMedia: {
                    label: (i18n.common_term_storageMedia_label || "存储介质" ) + ":",
                    require: $scope.cloudType =="IT",
                    'validate': $scope.cloudType =="IT"?'required:' + (i18n.common_term_null_valid || "不能为空。"):"",
                    "id": "diskMedia",
                    "width": 150,
                    "values": [],
                    "change": function () {
                    }
                },
                preBtn: {
                    "id": "create-disk-basic-pre",
                    "text": i18n.common_term_back_button || "上一步",
                    "click": function () {
                        $("#" + $scope.createStorageStep.id).widget().pre();
                        $scope.locationInfoPage = true;
                        $scope.storageQuotaPage = false;
                        $scope.basicInfoPage = false;
                        $scope.createStorageConfirmPage = false;
                    }
                },
                nextBtn: {
                    "id": "create-disk-basic-ok",
                    "text": i18n.common_term_next_button || "下一步",
                    "click": function () {
                        var typeLock = $("#" + $scope.disk.diskTypeLock.id).widget().opChecked("checked");
                        var sizeLock = $("#" + $scope.disk.diskSizeLock.id).widget().opChecked("checked");
                        var mediaLock = $("#" + $scope.disk.diskMediaLock.id).widget().opChecked("checked");
                        var valid = UnifyValid.FormValid($("#createDiskStorage"));
                        var validcstu= $(".createStorage-disk .disk-options[self-defined] input").length > 0?true:false;
                        var validcstuom=sizeLock=="0"?validcstu:false;
                        if (!valid || validcstuom) {
                            return;
                        }
                        $("#" + $scope.createStorageStep.id).widget().next();
                        if($scope.cloudType=="IT"){
                            var storageConfigLock = $("#" + $scope.disk.storageConfigLock.id).widget().opChecked("checked");
                        }
                        $scope.locationInfoPage = false;
                        $scope.storageQuotaPage = false;
                        $scope.basicInfoPage = true;
                        $scope.createStorageConfirmPage = false;
                        $scope.params.storageTypeLock = typeLock;
                        $scope.params.storageSizeLock = sizeLock;
                        $scope.params.storageMediaLock = mediaLock;
                        if($scope.cloudType=="IT"){
                            $scope.params.storageConfigLock = storageConfigLock;
                            var confirmstorageconfigLock = $("#" + $scope.createStorageConfirmInfo.storageConfigApplyType.id).widget();
                            confirmstorageconfigLock.opChecked(storageConfigLock, true);
                        }
                        var confirmstorageSizeLock = $("#" + $scope.createStorageConfirmInfo.storageSizeappType.id).widget();
                        var confirmstorageTypeLock = $("#" + $scope.createStorageConfirmInfo.storageTypeappType.id).widget();
                        var confirmstorageMediaLock = $("#" + $scope.createStorageConfirmInfo.storageMediaappType.id).widget();
                        confirmstorageSizeLock.opChecked(sizeLock, true);
                        confirmstorageTypeLock.opChecked(typeLock, true);
                        confirmstorageMediaLock.opChecked(mediaLock, true);

                        if (typeLock === "0") {
                            var typeDisk = $("#" + $scope.disk.disktype.id).widget().opChecked("checked");
                            $scope.params.storageType = typeLock === "0" ? typeDisk : "";
                            $scope.createStorageConfirmInfo.storageType.value = typeDisk === "normal" ? (i18n.org_disk_term_add_para_disk_label || "普通磁盘") : "共享磁盘";
                        }
                        else {
                            $scope.createStorageConfirmInfo.storageType.value = "";
                        }
                        if (sizeLock === "0") {
                            $scope.params.storageSize = sizeLock === "0" ? $scope.disk.userDefConfig.diskSize : "";
                            $scope.createStorageConfirmInfo.storageSize.value = sizeLock === "0" ? $scope.disk.userDefConfig.diskSize + "G" : "";
                        }
                        if (mediaLock === "0") {
                            $scope.params.storageMedia = mediaLock === "0" ? $("#" + $scope.disk.diskMedia.id).widget().getSelectedId() : "";
                            $scope.createStorageConfirmInfo.storageMedia.value = mediaLock === "0" ? $("#" + $scope.disk.diskMedia.id).widget().getSelectedLabel() : "";
                        }
                        if (storageConfigLock === "0" && $scope.cloudType=="IT") {
                            $scope.params.storageConfig = storageConfigLock === "0" ? $("#" + $scope.disk.storageConfigType.id).widget().getSelectedId() : "";
                            $scope.createStorageConfirmInfo.storageConfigType.value = storageConfigLock === "0" ? $("#" + $scope.disk.storageConfigType.id).widget().getSelectedLabel() : "";
                        }
                    }
                },
                cancelBtn: {
                    "id": "create-disk-basic-cancel",
                    "text": i18n.common_term_cancle_button||"取消",
                    "click": function () {
                        $state.go("service.serviceManager");
                    }
                }
            };
            $.fn.editDisk = function (userDef, scope) {
                var dom = this;
                this.bind("click", function (evt) {
                    evt.stopPropagation();
                    if (dom.find("input").length > 0) {
                        return;
                    }
                    var oldValue = userDef.diskSizeInput ? userDef.diskSize : "";
                    var input = $("<input type='text' value='" + oldValue + "'>");
                    input.css({
                        "width": dom.css("width"),
                        "height": dom.css("height")
                    });
                    var confirmInput = function () {
                        var value = input.val();
                        var reg = /^[0-9]*[1-9][0-9]*$/;
                        if (value === "" || value === null || value === undefined) {
                            $(".createStorage-disk .input-tip").css("display", "inline-block");
                            return;
                        }
                        else {
                            if (!reg.test(value)) {
                                $(".createStorage-disk .input-tip").css("display", "inline-block");
                                return;
                            }
                            else {
                                if (value < 1 || value > 65536) {
                                    $(".createStorage-disk .input-tip").css("display", "inline-block");
                                    return;
                                }
                            }
                        }
                        $(".createStorage-disk .input-tip").css("display", "none");
                        dom.html(value + "G");
                        userDef.diskSize = value;
                        userDef.diskSizeInput = true;
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
            // 初始化资源颜色块事件
            function initAnimal() {
                $(".createStorage-disk div.disk-options").bind("click", function (evt) {
                    if (typeof ($(evt.currentTarget).attr("self-defined")) === "undefined") {
                        $(".createStorage-disk .disk-options[self-defined]").html(i18n.common_term_custom_label || "自定义");
                        $(".createStorage-disk .input-tip").css("display", "none");
                        $scope.disk.userDefConfig.diskSize = $(evt.currentTarget).data("value");
                        $scope.disk.userDefConfig.diskSizeInput = false;
                    }
                    $(".createStorage-disk div.disk-options").removeClass("selected");
                    $(evt.currentTarget).addClass("selected");
                });
            }

            //查询存储介质
            function queryStorageMedia() {
                var deferred = createServiceIns.queryAzs(user.vdcId, user.id, $scope.areaId);
                deferred.then(function (data) {
                    var mediaType = $scope.serviceInstaceQuota && $scope.serviceInstaceQuota.mediaType.value;
                    if (data && data.availableZones && $scope.params.az) {
                        var objData = data.availableZones;
                        for (var j = 0; j < objData.length; j++) {
                            if (objData[j].id === $scope.params.az) {
                                var azMedia = (objData[j].tags && objData[j].tags.datastore) ? objData[j].tags.datastore : [];
                                var newMedia = [];
                                for (var i = 0; i < azMedia.length; i++) {
                                    var mediaValue = azMedia[i].value;
                                    newMedia.push({
                                        "selectId": mediaValue,
                                        "label": mediaValue=="SAN-Any"?"Any":mediaValue,
                                        "checked": mediaType == mediaValue || (!mediaType && !i)
                                    });
                                }
                                $scope.disk.diskMedia.values = newMedia;
                                break;
                            }
                        }
                    }
                });
            }

            //基本信息界面初始化
            $scope.baseInfo = {
                "name": {
                    "id": "createApp-appName",
                    "label": (i18n.common_term_name_label || "名称" ) + ":",
                    "width": 200,
                    "require": true,
                    "value": "",
                    "validate": "regularCheck(" + validator.serviceName + "):" + i18n.common_term_composition2_valid + i18n.sprintf(i18n.common_term_length_valid, "1", "64") +
                        ";regularCheck(" + validator.notAllSpaceReg + "):" + i18n.common_term_composition2_valid + i18n.sprintf(i18n.common_term_length_valid, "1", "64")
                },
                directory: {
                    "id": "createDirectory",
                    label: (i18n.service_term_catalog_label || "服务目录") + ":",
                    "mode": "multiple",
                    "require": false,
                    "width": 200,
                    values: []
                },
                "logo": {
                    "label": (i18n.common_term_icon_label || "图标" ) + ":",
                    "require": true,
                    "curLogo": "",
                    "switchIcon": function (icon) {
                        $scope.params.iconId = icon.id;
                        $scope.baseInfo.logo.curLogo = icon.imageUrl;
                    },
                    "deleteIcon": function (icon, index) {
                        deleteIcon(icon.id, index);
                    },
                    "toggle": function ($event) {
                        $event.stopPropagation();
                        $(".dropdown-menu").toggle();
                    },
                    "upload": function () {
                        var uploadImgWindow = new Window({
                            "winId": "uploadImgWindow",
                            "title": i18n.common_term_uploadLocalPic_button||"上传图片",
                            "minimizable": false,
                            "maximizable": false,
                            "content-type": "url",
                            "i18n": $scope.i18n,
                            "callback": function (icon) {
                                $scope.$apply(function () {
                                    $scope.params.iconId = icon.id;
                                    $scope.baseInfo.logo.curLogo = icon.imageUrl;
                                    $scope.icons.unshift(icon);
                                });
                            },
                            "content": "../src/app/business/service/views/catalog/iconUpload.html",
                            "height": 300,
                            "width": 530,
                            "buttons": null
                        }).show();
                    }
                },
                "description": {
                    "id": "createApp-appDescription",
                    "label": (i18n.common_term_desc_label || "描述") + ":",
                    "require": false,
                    "value": "",
                    "type": "multi",
                    "width": 300,
                    "height": "100",
                    "validate": "maxSize(1024):" + i18n.sprintf(i18n.common_term_length_valid, 1,1024)
                },
                preBtn: {
                    "id": "create-service-basicInfo-next",
                    "text": i18n.common_term_back_button || "上一步",
                    "click": function () {
                        $("#" + $scope.createStorageStep.id).widget().pre();
                        $scope.locationInfoPage = false;
                        $scope.storageQuotaPage = true;
                        $scope.basicInfoPage = false;
                        $scope.createStorageConfirmPage = false;
                    }
                },
                nextBtn: {
                    "id": "create-service-basicInfo-next",
                    "text": i18n.common_term_next_button || "下一步",
                    "click": function () {
                        var valid = UnifyValid.FormValid($("#createStoageBasicPage"));
                        if (!valid) {
                            return;
                        }
                        $("#" + $scope.createStorageStep.id).widget().next();
                        $scope.locationInfoPage = false;
                        $scope.storageQuotaPage = false;
                        $scope.basicInfoPage = false;
                        $scope.createStorageConfirmPage = true;
                        var catalogs = $("#" + $scope.baseInfo.directory.id).widget().getSelectedId();
                        $scope.params.serviceName = $("#" + $scope.baseInfo.name.id).widget().getValue();
                        $scope.params.catalogList = catalogs;
                        $scope.params.desc = $("#" + $scope.baseInfo.description.id).widget().getValue();
                        $scope.createStorageConfirmInfo.serviceName.value = $scope.params.serviceName;
                        $scope.createStorageConfirmInfo.serviceCatalog.value = $("#" + $scope.baseInfo.directory.id).widget().getSelectedLabel();
                        $scope.createStorageConfirmInfo.description.value = $scope.params.desc;
                    }
                },
                cancelBtn: {
                    "id": "create-service-basicInfo-cancel",
                    "text": i18n.common_term_cancle_button || "取消",
                    "click": function () {
                        $state.go("service.serviceManager");
                    }
                }
            };
            // 查询服务目录
            function queryCatalogs() {
                var catalogs = ($scope.serviceInstance && $scope.serviceInstance.catalogs) || [];
                var deferred = catalogServiceIns.queryCatalogs({"user": user});
                deferred.then(function (data) {
                    var SPER = "@";
                    var selectedCatalogsFormat = catalogs.length ? (SPER + catalogs.join(SPER) + SPER) : "";
                    data = data || {catalogs: []};
                    var allCatalogs = data.catalogs || [];
                    var selectValues = [];
                    for (var i = 0, len = allCatalogs.length; i < len; i++) {
                        var catalogId = allCatalogs[i].id;
                        var checked = (selectedCatalogsFormat && selectedCatalogsFormat.indexOf(SPER + catalogId + SPER) > -1);
                        selectValues.push({
                            "selectId": catalogId,
                            "label": allCatalogs[i].name,
                            "checked": checked
                        });
                    }
                    $scope.baseInfo.directory.values = selectValues;
                });
            };
            //查询icon list
            function queryIcons(serviceImageUrl) {
                var options = {
                    "userId": user.id,
                    "vdcId": user.vdcId
                };
                var deferred = createServiceIns.queryIcons(options);
                deferred.then(function (data) {
                    data = data || {serviceiconlist: []};
                    var list = data.serviceiconlist;
                    $scope.icons = list;
                    if (list.length) {
                        var icon = "";
                        if (serviceImageUrl) {
                            for (var i = 0, len = list.length; i < len; i++) {
                                if (list[i].imageUrl == serviceImageUrl) {
                                    icon = list[i];
                                    break;
                                }
                            }
                        }
                        else {
                            icon = list[0]
                        }
                        $scope.baseInfo.logo.curLogo = icon.imageUrl;
                        $scope.params.iconId = icon.id;
                    }
                });
            };
            //删除icon
            function deleteIcon(iconId, index) {
                var options = {
                    "userId": user.id,
                    "vdcId": user.vdcId,
                    "iconId": iconId
                };
                var deferred = createServiceIns.deleteIcon(options);
                deferred.then(function (data) {
                    $scope.icons.splice(index, 1);
                    if ($scope.icons.length) {
                        $scope.baseInfo.logo.switchIcon($scope.icons[0]);
                    }
                });
            };
            // 确认界面
            $scope.createStorageConfirmInfo = {
                serviceName: {
                    "id": "serviceName",
                    "label": (i18n.service_term_serviceName_label || "服务名称") + ":",
                    "value": ""
                },
                serviceCatalog: {
                    "id": "serviceCatalog",
                    "label": (i18n.service_term_catalog_label || "服务目录") + ":",
                    "value": ""
                },
                description: {
                    "id": "description：",
                    "label": (i18n.common_term_desc_label || "描述") + ":",
                    "value": ""
                },
                apptype: {
                    "id": "apptype",
                    "label": (i18n.service_term_approveType_label||"审批类型") + ":",
                    "value": ""
                },
                area: {
                    "id": "area",
                    "label": (i18n.common_term_section_label || "地域") + ":",
                    "value": ""
                },
                az: {
                    "id": "az",
                    "label": "AZ：",
                    "value": ""
                },
                storageType: {
                    "id": "storageType",
                    "label": (i18n.common_term_storageType_label || "存储类型") + ":",
                    "value": ""
                },
                storageSize: {
                    "id": "storageSize",
                    "label": (i18n.common_term_storagecCapacity_label || "存储容量") + ":",
                    "value": ""
                },
                storageConfigType:{
                    "id": "storageConfigType",
                    "label": (i18n.common_term_setMode_label || "配置模式") + ":",
                    "value": ""
                },
                storageMedia: {
                    "id": "storageMedia",
                    "label": (i18n.common_term_storageMedia_label || "存储介质") + ":",
                    "value": ""
                },
                storageMediaappType: {
                    "id": "storageMediaappType",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false],
                        disable: [true, true, true]
                    }),
                    "layout": "horizon"
                },
                storageConfigApplyType: {
                    "id": "storageConfigApplyType",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false],
                        disable: [true, true, true]
                    }),
                    "layout": "horizon"
                },
                storageTypeappType: {
                    "id": "storageTypeappType",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false],
                        disable: [true, true, true]
                    }),
                    "layout": "horizon"
                },
                storageSizeappType: {
                    "id": "storageSizeappType",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false],
                        disable: [true, true, true]
                    }),
                    "layout": "horizon"
                },
                storageAzappType: {
                    "id": "storageAzappType",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false],
                        disable: [true, true, true]
                    }),
                    "layout": "horizon"
                },
                storageAreaappType: {
                    "id": "storageAreaappType",
                    "spacing": {
                        "width": "50px",
                        "height": "30px"
                    },
                    "values": getTypes({
                        checked: [true, false, false],
                        disable: [true, true, true]
                    }),
                    "layout": "horizon"
                },
                preBtn: {
                    "id": "createStorageService-pre",
                    "text": i18n.common_term_back_button || "上一步",
                    "click": function () {
                        $("#" + $scope.createStorageStep.id).widget().pre();
                        $scope.locationInfoPage = false;
                        $scope.storageQuotaPage = false;
                        $scope.basicInfoPage = true;
                        $scope.createStorageConfirmPage = false;
                    }
                },
                addBtn: {
                    "id": "createStorageService-next",
                    "text": serviceId ? (i18n.common_term_save_label || "保存") : (i18n.common_term_create_button || "创建"),
                    "click": function () {
                        var objJSon = {};
                        if($scope.cloudType == "ICT"){
                            objJSon = {
                                "cloudInfra": {
                                    "id": $scope.params.area,
                                    "lock": $scope.params.areaLock
                                },
                                "availableZone": {
                                    "id": $scope.params.az,
                                    "lock": $scope.params.azLock
                                },
                                "vpc": {
                                 "id": "",
                                 "lock": $scope.params.azLock == "0"?"1":$scope.params.azLock
                                 },
                                "capacity": {
                                    "value": $scope.params.storageSize,
                                    "lock": $scope.params.storageSizeLock
                                },
                                "type": {
                                    "value": $scope.params.storageType,
                                    "lock": $scope.params.storageTypeLock
                                },
                                "mediaType": {
                                    "value": $scope.params.storageMedia,
                                    "lock": $scope.params.storageMediaLock
                                }
                            };
                        }else{
                            objJSon = {
                                "cloudInfra": {
                                    "id": $scope.params.area,
                                    "lock": $scope.params.areaLock
                                },
                                "availableZone": {
                                    "id": $scope.params.az,
                                    "lock": $scope.params.azLock
                                },
                                "configType":{
                                    "value": $scope.params.storageConfig,
                                    "lock": $scope.params.storageConfigLock
                                },
                                "capacity": {
                                    "value": $scope.params.storageSize,
                                    "lock": $scope.params.storageSizeLock
                                },
                                "type": {
                                    "value": $scope.params.storageType,
                                    "lock": $scope.params.storageTypeLock
                                },
                                "mediaType": {
                                    "value": $scope.params.storageMedia,
                                    "lock": $scope.params.storageMediaLock
                                }
                            };
                        }
                        if (serviceId) {
                            modifyServiceStorage(objJSon);
                        } else {
                            createServiceStorage(objJSon);
                        }
                    }
                },
                cancelBtn: {
                    "id": "createStorageService-cancel",
                    "text": i18n.common_term_cancle_button || "取消",
                    "click": function () {
                        $state.go("service.serviceManager");
                    }
                }
            };
            function modifyServiceStorage(params) {
                var options = {
                    "user": user,
                    "serviceId": serviceId,
                    "params": {
                        "name": $scope.params.serviceName,
                        "description": $scope.params.desc,
                        "approveType": $scope.serviceInstance.approveType,
                        "params": JSON.stringify(params),
                        "catalogs": $scope.params.catalogList,
                        "whiteListFlag": $scope.serviceInstance.whiteListFlag,
                        "vdcWhiteList": $scope.serviceInstance.vdcWhiteList,
                        "iconId": $scope.params.iconId
                    }
                };
                var deferred = catalogServiceIns.modifyServices(options);
                deferred.then(function (data) {
                    $state.go("service.serviceManager");
                });
            }

            //创建块存储服务
            function createServiceStorage(params) {
                var options = {
                    "user": user,
                    "serviceTemplateId": templateId,
                    "name": $scope.params.serviceName,
                    "description": $scope.params.desc,
                    "status": "unpublished",
                    "approveType": $scope.params.applyType,
                    "params": JSON.stringify(params),
                    "catalogs": $scope.params.catalogList,
                    "whiteListFlag": false,
                    "vdcWhiteList": $scope.params.whiteList,
                    "iconId": $scope.params.iconId
                };
                var deferred = createServiceIns.createService(options);
                deferred.then(function (data) {
                    $state.go("service.serviceManager");
                });
            }

            $(document).bind("click.upload", function ($event) {
                $event.stopPropagation();
                var $target = $($event.target);
                if (!$target.hasClass("dropdown-menu") && !$target.parents(".dropdown-menu").length) {
                    $(".dropdown-menu").hide();
                }
            });
            $scope.$on('$destroy', function () {
                $(document).unbind("click.upload");
            });
            function queryService(callback) {
                var options = {
                    "user": user,
                    "id": serviceId
                };
                var deferred = catalogServiceIns.queryServiceOffering(options);

                deferred.then(function (data) {
                    callback && callback(data);
                });
            }

            function stringToJson(params) {
                var serviceInstaceQuota = null;
                try {
                    serviceInstaceQuota = JSON.parse(params);
                } catch (e) {
                }
                return serviceInstaceQuota;
            }

            function initParams(serviceInstance) {
                var serviceInstaceQuota = stringToJson(serviceInstance.params);
                var getQuotaValue = function (key) {
                    var val = "";
                    if (key) {
                        var item = serviceInstaceQuota[key] || {};
                        val = item["value"] || "";
                    }
                    return val;
                };
                $scope.serviceInstance = serviceInstance;
                $scope.serviceInstaceQuota = serviceInstaceQuota;
                var serviceInstaceAreaLock = serviceInstaceQuota.cloudInfra.lock;
                if (serviceInstaceAreaLock != "0") {
                    $scope.locationInfo.location.disable = true;
                    $scope.locationInfo.vpc.disable = true;
                }
                applyTypeId = serviceInstance.approveType;
                $scope.locationInfo.locationLock.values = getTypes({
                    checked: [serviceInstaceAreaLock == "0", serviceInstaceAreaLock == "1", serviceInstaceAreaLock == "2"],
                    disable: [false, false, applyTypeId == "none"]
                });
                var diskTypeLock = serviceInstaceQuota.type.lock;
                $scope.disk.diskTypeLock.values = getTypes({
                    checked: [diskTypeLock == "0", diskTypeLock == "1", diskTypeLock == "2"]
                });

                var diskSizeLock = serviceInstaceQuota.capacity.lock;
                $scope.disk.diskSizeLock.values = getTypes({
                    checked: [diskSizeLock == "0", diskSizeLock == "1", diskSizeLock == "2"]
                });

                var diskMediaLock = serviceInstaceQuota.mediaType.lock;
                $scope.disk.diskMediaLock.values = getTypes({
                    checked: [diskMediaLock == "0", diskMediaLock == "1", diskMediaLock == "2"]
                });
                if($scope.cloudType == "IT"){
                    var storageConfigLock = serviceInstaceQuota.configType.lock;
                    $scope.disk.storageConfigLock.values = getTypes({
                        checked: [diskMediaLock == "0", diskMediaLock == "1", diskMediaLock == "2"]
                    });
                    $scope.modifyStorageConfig = serviceInstaceQuota.configType.value;
                }
                $scope.disk.disktype.values = [
                    {
                        "key": "normal",
                        "text": i18n.common_term_common_label || "普通",
                        "checked": "share" != serviceInstaceQuota.type.value
                    },
                    {
                        "key": "share",
                        "text": i18n.common_term_share_label || "共享",
                        "checked": "share" == serviceInstaceQuota.type.value
                    }
                ];
                if (serviceInstaceQuota.capacity.value) {
                    $scope.disk.userDefConfig.diskSize = serviceInstaceQuota.capacity.value;
                }
                $scope.disk.diskMedia.value = serviceInstaceQuota.mediaType.value;

                //基本信息
                $scope.params.appName = serviceInstance.name;
                $scope.params.description = serviceInstance.description;
                $scope.baseInfo.logo.curLogo = serviceInstance.serviceImageUrl;
            }

            function init(serviceId) {
                if (serviceId) {
                    $("#createStoragetitle").text(i18n.service_term_modifyBlockStorService_label||"编辑块存储服务");
                    //编辑
                    queryService(function (serviceInstance) {
                        initParams(serviceInstance);
                        var serviceInstaceQuota = stringToJson(serviceInstance.params);
                        queryArea(serviceInstaceQuota.cloudInfra && serviceInstaceQuota.cloudInfra.id, serviceInstaceQuota.availableZone && serviceInstaceQuota.availableZone.id);
                        queryCatalogs(serviceInstance.catalogs);
                        queryIcons($scope.baseInfo.logo.curLogo);
                        initAnimal();
                    });
                } else {
                    //创建
                    $("#createStoragetitle").text(i18n.service_term_addBlockStorService_label||"创建块存储服务");
                    queryArea(null, null);
                    initAnimal();
                    queryCatalogs();
                    queryIcons(null);
                }
            }

            init(serviceId);
        }];
        return createStorageCtrl;
    }
);