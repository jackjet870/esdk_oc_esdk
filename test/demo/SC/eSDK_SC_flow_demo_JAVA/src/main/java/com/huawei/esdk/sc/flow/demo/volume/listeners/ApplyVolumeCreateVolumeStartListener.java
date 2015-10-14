package com.huawei.esdk.sc.flow.demo.volume.listeners;

import org.activiti.engine.delegate.DelegateExecution;
import org.apache.http.HttpStatus;
import org.wcc.framework.log.AppLogger;

import com.huawei.esdk.sc.flow.demo.volume.model.ApplyVolumeRequest;
import com.huawei.esdk.sc.flow.demo.volume.utils.VolumeFlowConstants;
import com.huawei.goku.business.ssp.flow.toolkit.common.listeners.AtomExecutionListener;
import com.huawei.goku.business.ssp.flow.toolkit.common.model.CommonInfo4Flow;
import com.huawei.goku.business.ssp.flow.toolkit.common.utils.CommonConstants;
import com.huawei.goku.business.ssp.flow.toolkit.common.utils.CommonUtils;
import com.huawei.goku.business.ssp.flow.toolkit.volume.atoms.CreateVolumeAtom;
import com.huawei.goku.common.exception.OperationException;
import com.huawei.goku.common.returncode.CommonCode;

/**
 * Apply卷得流程中创建卷原子启动前listener
 * 
 */
public class ApplyVolumeCreateVolumeStartListener extends AtomExecutionListener
{
    
    private static final long serialVersionUID = -8926855028141469296L;
    
    private static final AppLogger LOGGER = AppLogger.getInstance(ApplyVolumeCreateVolumeStartListener.class);
    
    @Override
    public void handleExecute(DelegateExecution execution) throws OperationException
    {
        LOGGER.notice("ApplyVolumeCreateVolumeStartListener START! try to get CreateVolumeRequest from ApplyVolumeRequest.");
        if (null == execution || null == execution.getVariables())
        {
            LOGGER
                .error("get CreateVolumeRequest from ApplyVolumeRequest failed! invalid input param, execution is null or veriables are null.");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "execution is null or variables are null");
        }
        // 获取公共请求
        CommonInfo4Flow commInfo4Flow = CommonUtils.getCommonInfo4Flow(execution);
        if (null == commInfo4Flow)
        {
            LOGGER.error("Atom execute FAILED! commInfo4Flow is null.");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "commInfo4Flow is null");
        }
        // 获取上下文中的申请卷请求参数
        ApplyVolumeRequest applyVolumeRequest = getValue(execution, CommonConstants.SERVICE_REQUEST, ApplyVolumeRequest.class);
        if (null == applyVolumeRequest)
        {
            LOGGER.error("CreateVolumeRequest FAILED! Invalid input param, service_request is null");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "service_request is null");
        }
        
        //创建卷原子的请求参数
        CreateVolumeAtom.Request createVolumeReq = new CreateVolumeAtom.Request();
        
        String volumeName = applyVolumeRequest.getName();
        createVolumeReq.setCloudInfraId(applyVolumeRequest.getCloudInfraId());
        createVolumeReq.setSize(applyVolumeRequest.getSize());
        createVolumeReq.setMediaType(applyVolumeRequest.getMediaType());
        createVolumeReq.setName(volumeName);
        createVolumeReq.setType(applyVolumeRequest.getType());
        createVolumeReq.setVpcId(commInfo4Flow.getVpcId());
        createVolumeReq.setAvailableZoneId(applyVolumeRequest.getAvailableZoneId());
        
        //将创建卷原子的请求参数设置在流程变量中，变量名为创建卷原子的输入变量create_volume_request
        setValue(execution, VolumeFlowConstants.CREATE_VOLUME_REQUEST, createVolumeReq);
        LOGGER.notice("ApplyVolumeCreateVolumeStartListener SUCCEED! set create_volume_request={}", createVolumeReq);
    }
    
}
