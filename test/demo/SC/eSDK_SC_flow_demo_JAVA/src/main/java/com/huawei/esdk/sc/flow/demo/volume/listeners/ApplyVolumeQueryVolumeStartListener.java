package com.huawei.esdk.sc.flow.demo.volume.listeners;

import java.util.HashMap;
import java.util.Map;

import com.huawei.esdk.sc.flow.demo.volume.model.ApplyVolumeRequest;
import com.huawei.esdk.sc.flow.demo.volume.utils.VolumeFlowConstants;

import org.activiti.engine.delegate.DelegateExecution;
import org.apache.http.HttpStatus;
import org.wcc.framework.log.AppLogger;

import com.huawei.goku.business.ssp.flow.toolkit.common.listeners.AtomExecutionListener;
import com.huawei.goku.business.ssp.flow.toolkit.common.utils.CommonConstants;
import com.huawei.goku.business.ssp.flow.toolkit.volume.atoms.QueryVolumeAtom;
import com.huawei.goku.common.exception.OperationException;
import com.huawei.goku.common.returncode.CommonCode;

/** 
 * 申请Volume流程QueryVolume原子启动监听器。
 * 转换参数结构。
 * 
 */
public class ApplyVolumeQueryVolumeStartListener extends AtomExecutionListener
{
    private static final long serialVersionUID = -8463798709324684412L;
    
    private static final AppLogger LOGGER = AppLogger.getInstance(ApplyVolumeQueryVolumeStartListener.class);
    
    @Override
    public void handleExecute(DelegateExecution execution)
        throws OperationException
    {
        LOGGER.notice("ApplyVolumeQueryVolumeStartListener START!");
        
        if (null == execution || null == execution.getVariables())
        {
            LOGGER.error("ApplyVolumeQueryVolumeStartListener FAILED! invalid input param, execution is null or variables are null");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "execution is null or variables are null");
        }
        
        // 获取上下文中的申请虚拟机请求参数
        ApplyVolumeRequest applyVolumeRequest = getValue(execution, CommonConstants.SERVICE_REQUEST, ApplyVolumeRequest.class);
        if (null == applyVolumeRequest)
        {
            LOGGER.error("ApplyVolumeQueryVolumeStartListener FAILED! Invalid input param, service_request is null");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "service_request is null");
        }
        
        Integer volumnLoopCounter = getValue(execution, CommonConstants.LOOP_COUNTER,Integer.class);
        String volumeId = getValue(execution, "volume_" + volumnLoopCounter + "id",String.class);
        
        //公共原子的入参结构。
        QueryVolumeAtom.Request request = new QueryVolumeAtom.Request();
        request.setCloudInfraId(applyVolumeRequest.getCloudInfraId());
        request.setVpcId(applyVolumeRequest.getVpcId());
        request.setVolumeId(volumeId);
        request.setLimit(1);
        Map<String,String> searchCondition = new HashMap<String, String>();
        request.setSearchCondition(searchCondition);
        //存入上下文供公共原子使用。
        setValue(execution, VolumeFlowConstants.QUERY_VOLUME_ATOM_REQUEST, request);
        
        LOGGER.notice("ApplyVolumeQueryVolumeStartListener SUCCEED! set query_volume_atom_request={}", request);
    }
    
}
