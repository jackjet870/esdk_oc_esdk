/**
 * 定义 二次开发的 路由地址
 * 注意:
 * 1. 该文件不能删除;
 * 2. 在serviceConfigs中增加路由，不用删除其他内容
 */
define(['tiny-lib/jquery',
        "tiny-lib/angular",
        "ui-router/angular-ui-router"
], function ($, angular, router) {
    "use strict";

    // 定义框架的路由配置module
    var extendSspConfigs = [
        "$stateProvider", "$urlRouterProvider", "$controllerProvider",
        function ($stateProvider, $urlRouterProvider, $controllerProvider) {
            // 在此增加路由配置
            //eSDK 磁盘
            // 申请磁盘
            $stateProvider.state("ssp.applyEsdkDisk", {
                url: "/applyDisk?action&serviceId&orderId",
                templateUrl: "app/business/ssp/views/plugin/esdkdisk/submit/applyDisk.html",
                controller: "ssp.plugin.applyDisk.ctrl",
                resolve: {
                    deps: function ($q, $rootScope) {
                        var deferred = $q.defer();
                        var dependencies = [
                            'app/business/ssp/controllers/plugin/esdkdisk/submit/applyDiskCtrl'
                        ];
                        require(dependencies, function (ctrl) {
                            $rootScope.$apply(function () {
                                $controllerProvider.register("ssp.plugin.applyDisk.ctrl", ctrl);
                                deferred.resolve();
                            });
                        });
                        return deferred.promise;
                    }
                }
            });

            // 审批磁盘申请
            $stateProvider.state("ssp.approvalEsdkDiskApply", {
                url: "/approvalDisk?action&serviceId&orderId?from",
                templateUrl: "app/business/ssp/views/plugin/esdkdisk/approval/approvalDiskApply.html",
                controller: "ssp.plugin.approvalDisk.ctrl",
                resolve: {
                    deps: function ($q, $rootScope) {
                        var deferred = $q.defer();
                        var dependencies = [
                            'app/business/ssp/controllers/plugin/esdkdisk/approval/approvalDiskApplyCtrl'
                        ];
                        require(dependencies, function (ctrl) {
                            $rootScope.$apply(function () {
                                $controllerProvider.register("ssp.plugin.approvalDisk.ctrl", ctrl);
                                deferred.resolve();
                            });
                        });
                        return deferred.promise;
                    }
                }
            });

            // 变更磁盘
            $stateProvider.state("ssp.changeEsdkDisk", {
                url: "/changeDisk?action&id&resourceId&instanceId&cloudInfraId&vpcId&serviceId&orderId",
                templateUrl: "app/business/ssp/views/plugin/esdkdisk/submit/changeDisk.html",
                controller: "ssp.plugin.changeDisk.ctrl",
                resolve: {
                    deps: function ($q, $rootScope) {
                        var deferred = $q.defer();
                        var dependencies = [
                            'app/business/ssp/controllers/plugin/esdkdisk/submit/changeDiskCtrl'
                        ];
                        require(dependencies, function (ctrl) {
                            $rootScope.$apply(function () {
                                $controllerProvider.register("ssp.plugin.changeDisk.ctrl", ctrl);
                                deferred.resolve();
                            });
                        });
                        return deferred.promise;
                    }
                }
            });

            // 审批磁盘变更
            $stateProvider.state("ssp.approvalEsdkDiskChange", {
                url: "/approvalDiskChange?action&orderId?from",
                templateUrl: "app/business/ssp/views/plugin/esdkdisk/approval/approvalDiskChange.html",
                controller: "ssp.plugin.approvalDiskChange.ctrl",
                resolve: {
                    deps: function ($q, $rootScope) {
                        var deferred = $q.defer();
                        var dependencies = [
                            'app/business/ssp/controllers/plugin/esdkdisk/approval/approvalDiskChangeCtrl'
                        ];
                        require(dependencies, function (ctrl) {
                            $rootScope.$apply(function () {
                                $controllerProvider.register("ssp.plugin.approvalDiskChange.ctrl", ctrl);
                                deferred.resolve();
                            });
                        });
                        return deferred.promise;
                    }
                }
            });
        }
    ];

    var extendConfigModule = angular.module("ssp.extendConfig", ["ui.router"]);
    extendConfigModule.config(extendSspConfigs);
    return extendConfigModule;
});
