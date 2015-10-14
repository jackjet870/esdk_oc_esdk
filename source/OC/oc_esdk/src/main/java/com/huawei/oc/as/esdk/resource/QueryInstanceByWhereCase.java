package com.huawei.oc.as.esdk.resource;

/*
 * �?�?�?  QueryInstance.java
 * �?   �?  Huawei Technologies Co., Ltd. Copyright YYYY-YYYY,  All rights reserved
 * �?   �?  <描述>
 * �?�?�?  q00187487
 * 修改时间:  2013-9-29
 * 跟踪单号:  <跟踪单号>
 * 修改单号:  <修改单号>
 * 修改内容:  <修改内容>com.huawei.oc.as.esdk.resourceb.resource.rest;
 */

import java.util.List;
import java.util.Map;
import com.huawei.oc.cbb.sdk.bean.QueryBean;
import com.huawei.oc.cbb.sdk.bean.InstanceBean;
import com.huawei.oc.cbb.sdk.constants.OcRestConstant;
import com.huawei.oc.cbb.sdk.exception.OCException;
import com.huawei.oc.cbb.sdk.utils.HttpUtils;
import com.huawei.oms.framework.rpc.api.RestFactory;
import com.huawei.oms.framework.rpc.api.RestParametes;
import com.huawei.oms.framework.rpc.api.RestResponse;
import com.huawei.oms.log.OMSLog;
import com.huawei.oms.log.OMSLogFactory;

/**
 * <按条件查询实例数�?
 * 
 * @author  q00187487
 * @version  [ManageOne V100R002C02, 2013-10-11]
 * @see  [相关�?方法]
 * @since  [产品/模块版本]
 */
public class QueryInstanceByWhereCase
{
    //日志实例
    private static OMSLog logger = OMSLogFactory.getLog(QueryInstanceByWhereCase.class);
    
    /**按条件查询实例数�?
     * @param queryBean 条件
     * @return List<Map<String, Object>
     * @throws OCException 异常
     */
    public List<Map<String, Object>> queryInstance(QueryBean queryBean)
        throws OCException
    {
        if (logger.isInfoEnabled())
        {
            logger.info("query instance by condition!");
        }
        
        try
        {
            String json = HttpUtils.getJson(queryBean);
            RestParametes restParam = new RestParametes();
            restParam.put(OcRestConstant.JSON, json);
            
            RestResponse resrRsp =
                RestFactory.getRestInstance().post(OcRestConstant.MODB_QUERY_INSTANCE_BY_WHERE, restParam);
            String responseJson = resrRsp.getResponseJson();
            
            InstanceBean instance = HttpUtils.getObj(responseJson, InstanceBean.class);
            return instance.getInstance();
        }
        catch (Exception e)
        {
            logger.error("Query instance by condition error!", e);
            throw new OCException("Query instance by condition error", e);
        }
    }
}
