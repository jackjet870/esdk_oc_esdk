package com.huawei.oc.as.esdk.resource;

import java.util.List;
import java.util.Map;

import com.huawei.oc.cbb.sdk.bean.InstanceBean;
import com.huawei.oc.cbb.sdk.constants.OcRestConstant;
import com.huawei.oc.cbb.sdk.exception.OCException;
import com.huawei.oc.cbb.sdk.utils.HttpUtils;
import com.huawei.oms.framework.rpc.api.RestFactory;
import com.huawei.oms.framework.rpc.api.RestParametes;
import com.huawei.oms.framework.rpc.api.RestResponse;
import com.huawei.oms.log.OMSLog;
import com.huawei.oms.log.OMSLogFactory;

public class QueryInstance {
	//记录日志
    private static OMSLog logger = OMSLogFactory.getLog(QueryInstance.class);
    
    /**��ѯʵ�����
     * @param instanceBean InstanceBean
     * @return List<Map<String, Object>
     * @throws OCException �쳣
     */
    public List<Map<String, Object>> queryInstance(InstanceBean instanceBean)
        throws OCException
    {
        if (logger.isInfoEnabled())
        {
            logger.info("query instance by condition!");
        }
        
        try
        {
            String json = HttpUtils.getJson(instanceBean);
            RestParametes restParam = new RestParametes();
            restParam.put(OcRestConstant.JSON, json);
            
            RestResponse resrRsp = RestFactory.getRestInstance()
                .post(OcRestConstant.MODB_QUERY_INSTANCE, restParam);
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
