package com.huawei.esdk.sc.flow.demo.volume.listeners;

import com.huawei.esdk.sc.flow.demo.volume.model.ApplyVolumeRequest;
import com.huawei.esdk.sc.flow.demo.volume.utils.VolumeFlowConstants;

import org.activiti.engine.delegate.DelegateExecution;
import org.apache.http.HttpStatus;
import org.wcc.framework.log.AppLogger;

import com.huawei.goku.business.ssp.flow.toolkit.common.listeners.AtomExecutionListener;
import com.huawei.goku.business.ssp.flow.toolkit.common.utils.CommonConstants;
import com.huawei.goku.business.ssp.flow.toolkit.volume.atoms.DeleteVolumeAtom;
import com.huawei.goku.common.exception.OperationException;
import com.huawei.goku.common.returncode.CommonCode;

/**
 * 删除卷原子启动前listener
 */
public class ApplyVolumeDeleteVolumeStartListener extends AtomExecutionListener
{
    
    private static final long serialVersionUID = -8926855028141469296L;
    
    private static final AppLogger LOGGER = AppLogger.getInstance(ApplyVolumeDeleteVolumeStartListener.class);
    
    @Override
    public void handleExecute(DelegateExecution execution) throws OperationException
    {
        LOGGER.notice("ApplyVolumeDeleteVolumeStartListener START! try to get DeleteVolumeRequest from ApplyVolumeRequest.");
        if (null == execution || null == execution.getVariables())
        {
            LOGGER
                .error("get DeleteVolumeRequest from ApplyVolumeRequest failed! invalid input param, execution is null or veriables are null.");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "execution is null or variables are null");
        }
        
        Integer volumnLoopCounter = getValue(execution, CommonConstants.LOOP_COUNTER,Integer.class);
        String volumeId = getValue(execution, "volume_" + volumnLoopCounter + "id",String.class);
        
        ApplyVolumeRequest applyVolumeReq = getValue(execution, CommonConstants.SERVICE_REQUEST, ApplyVolumeRequest.class);
        if (null == applyVolumeReq)
        {
            LOGGER.error("get service_request FAILED! {} is null", CommonConstants.SERVICE_REQUEST);
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "service_request is null");
        }
        
        DeleteVolumeAtom.Request deleteVloumeReq = new DeleteVolumeAtom.Request();
        deleteVloumeReq.setVolumeId(volumeId);
        deleteVloumeReq.setCloudInfraId(applyVolumeReq.getCloudInfraId());
        
        setValue(execution, VolumeFlowConstants.DELETE_VOLUME_REQUEST, deleteVloumeReq);
        LOGGER.notice("ApplyVolumeDeleteVolumeStartListener SUCCEED! set delete_volume_request={}", deleteVloumeReq);
    }
}
