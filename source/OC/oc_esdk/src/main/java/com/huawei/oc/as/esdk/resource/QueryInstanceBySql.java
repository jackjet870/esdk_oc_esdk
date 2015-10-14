package com.huawei.oc.as.esdk.resource;

import java.util.List;
import java.util.Map;

import com.huawei.oc.cbb.sdk.constants.OcRestConstant;
import com.huawei.oc.cbb.sdk.exception.OCException;
import com.huawei.oc.cbb.sdk.utils.HttpUtils;
import com.huawei.oms.framework.rpc.api.RestFactory;
import com.huawei.oms.framework.rpc.api.RestParametes;
import com.huawei.oms.framework.rpc.api.RestResponse;
import com.huawei.oms.log.OMSLog;
import com.huawei.oms.log.OMSLogFactory;

public class QueryInstanceBySql {
	//日志实例
    private static OMSLog logger = OMSLogFactory.getLog(QueryInstanceBySql.class);
    
    /**查询实例数据
     * @param sql sql条件
     * @return List<Map<String, Object>
     * @throws OCException 异常
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> queryInstanceBySql(String sql)
        throws OCException
    {
        if (logger.isInfoEnabled())
        {
            logger.info("query instance by condition!");
        }
        
        try
        {
            RestParametes restParam = new RestParametes();
            restParam.put(OcRestConstant.JSON, sql);
            
            RestResponse resrRsp = RestFactory.getRestInstance()
                .post(OcRestConstant.MODB_QUERY_INSTANCE_BY_SQL, restParam);
            String responseJson = resrRsp.getResponseJson();
            return HttpUtils.getObj(responseJson, List.class);
        }
        catch (Exception e)
        {
            logger.error("Query instance by sql error!", e);
            throw new OCException("Query instance by sql error", e);
        }
    }
}
