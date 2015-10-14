package com.huawei.esdk.sc.flow.demo.volume.listeners;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.activiti.engine.delegate.DelegateExecution;
import org.apache.http.HttpStatus;
import org.wcc.framework.log.AppLogger;

import com.huawei.esdk.sc.flow.demo.volume.model.ApplyVolumeRequest;
import com.huawei.esdk.sc.flow.demo.volume.utils.VolumeFlowConstants;
import com.huawei.goku.business.ssp.flow.toolkit.common.listeners.AtomExecutionListener;
import com.huawei.goku.business.ssp.flow.toolkit.common.utils.CommonConstants;
import com.huawei.goku.business.ssp.flow.toolkit.servicemgnt.atoms.ModifyServiceInstanceAtom;
import com.huawei.goku.business.ssp.flow.toolkit.servicemgnt.atoms.ModifyServiceInstanceAtom.CreateServiceResource;
import com.huawei.goku.business.ssp.flow.toolkit.servicemgnt.utils.ServiceMgntFlowConstants;
import com.huawei.goku.business.ssp.flow.toolkit.volume.atoms.CreateVolumeAtom;
import com.huawei.goku.common.exception.OperationException;
import com.huawei.goku.common.returncode.CommonCode;

/**
 * ModifyServiceInstance原子启动前listener
 * @author     [作者]k00207574
 * @version    [版本号]FusionManager R5C00
 */
public class ApplyVolumeModifyServiceInstanceStartListener extends AtomExecutionListener
{
    
    private static final long serialVersionUID = -8253065232321473223L;
    
    private static final AppLogger LOGGER = AppLogger.getInstance(ApplyVolumeModifyServiceInstanceStartListener.class);
    
    //资源类型
    private static final String RESOURCE_TYPE = "disk";
    //资源URL
    private static final String RESOURCEURL = "ecs.storage.disk";
    //变更URL
    private static final String MODIFYURL = "demo.ssp.changeDisk";
    
    @Override
    public void handleExecute(DelegateExecution execution)
        throws OperationException
    {
        LOGGER.notice("ApplyVolumeModifyServiceInstanceStartListener START! try to get ModifyServiceInstanceRequest from ApplyVolumeRequest.");
        if (null == execution || null == execution.getVariables())
        {
            LOGGER.error("get ModifyServiceInstanceRequest from ApplyVolumeRequest failed! invalid input param, execution is null or veriables are null.");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "execution is null or variables are null");
        }
        
        // 获取上下文中的申请volume请求参数
        ApplyVolumeRequest applyVolumeReq =
            getValue(execution, CommonConstants.SERVICE_REQUEST, ApplyVolumeRequest.class);
        if (null == applyVolumeReq)
        {
            LOGGER.error("get ModifyServiceInstanceRequest from ApplyVolumeRequest FAILED! Invalid input param, {} is null",
                CommonConstants.SERVICE_REQUEST);
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "ApplyVolumeRequest is null");
        }
        
        //获取创建的服务实例ID
        String instanceId = getValue(execution, ServiceMgntFlowConstants.SERVICE_INSTANCE_ID, String.class);
        if (null == instanceId)
        {
            LOGGER.error("get instanceId from ApplyVolumeRequest FAILED! invalid input param,{} is null",
                ServiceMgntFlowConstants.SERVICE_INSTANCE_ID);
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "instanceId is null");
        }
        
        List<CreateServiceResource> csrlist = new ArrayList<CreateServiceResource>();
        CreateServiceResource createServiceResource = null;
        Map<String, String> metadata = null;
        String volumeId = null;
        CreateVolumeAtom.Response response =
            getValue(execution, VolumeFlowConstants.CREATE_VOLUME_RESPONSE, CreateVolumeAtom.Response.class);
        if (null != response)
        {
            volumeId = response.getVolumeId();
        }
        else
        {
            LOGGER.error("get response from create_volume_response FAILED! {} is null",
                VolumeFlowConstants.CREATE_VOLUME_RESPONSE);
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "create_volume_response is null");
        }
        createServiceResource = new CreateServiceResource();
        metadata = new HashMap<String, String>();
        //将资源池ID和VPC Id保存在服务实例的metadata中，用于以后对服务实例的变更或删除操作
        metadata.put(ServiceMgntFlowConstants.SERVICE_RESOURCE_METADATA_CLOUDINFRAID, applyVolumeReq.getCloudInfraId());
        metadata.put(ServiceMgntFlowConstants.SERVICE_RESOURCE_METADATA_VPCID, applyVolumeReq.getVpcId());
        
        createServiceResource.setMetadata(metadata);
        LOGGER.debug("metadata={}", metadata);
        
        createServiceResource.setResourceId(volumeId);
        createServiceResource.setName(applyVolumeReq.getName());
        createServiceResource.setType(RESOURCE_TYPE);
        createServiceResource.setResourceUrl(RESOURCEURL);
        createServiceResource.setModifyUrl(MODIFYURL);
        createServiceResource.setMetadata(metadata);
        LOGGER.info("createVolume SUCCEED!  volumeId={},volumeName={}", volumeId, applyVolumeReq.getName());
        csrlist.add(createServiceResource);
        
        ModifyServiceInstanceAtom.ModifyServiceInstanceRequest modifyServiceInstanceReq =
            new ModifyServiceInstanceAtom.ModifyServiceInstanceRequest();
        modifyServiceInstanceReq.setResources(csrlist);
        modifyServiceInstanceReq.setStatus(ModifyServiceInstanceAtom.ModifyServiceInstanceRequest.INSTANCE_NORMAL);
        modifyServiceInstanceReq.setInstanceId(instanceId);
        
        setValue(execution, ServiceMgntFlowConstants.MODIFY_SERVICE_INSTANCE_REQUEST, modifyServiceInstanceReq);
        LOGGER.notice("ApplyVolumeModifyServiceInstanceStartListener SUCCEED! get ModifyServiceInstanceRequest={} from ApplyVolumeRequest",
            modifyServiceInstanceReq);
    }
}
