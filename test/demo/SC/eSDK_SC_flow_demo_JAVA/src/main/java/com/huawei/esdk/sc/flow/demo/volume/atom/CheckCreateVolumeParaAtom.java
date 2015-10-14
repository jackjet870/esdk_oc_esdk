package com.huawei.esdk.sc.flow.demo.volume.atom;

import org.activiti.engine.delegate.DelegateExecution;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpStatus;
import org.wcc.framework.log.AppLogger;

import com.huawei.esdk.sc.flow.demo.volume.model.ApplyVolumeRequest;
import com.huawei.goku.business.ssp.flow.toolkit.common.atoms.AtomJavaDelegate;
import com.huawei.goku.business.ssp.flow.toolkit.common.model.CommonInfo4Flow;
import com.huawei.goku.business.ssp.flow.toolkit.common.utils.CommonConstants;
import com.huawei.goku.business.ssp.flow.toolkit.common.utils.CommonUtils;
import com.huawei.goku.common.exception.OperationException;
import com.huawei.goku.common.returncode.CommonCode;
import com.huawei.goku.framework.common.utils.ConvertionUtil;

/**
 * 检查创建卷的请求消息。
 * 
 */
public class CheckCreateVolumeParaAtom extends AtomJavaDelegate
{
    private static final AppLogger LOGGER = AppLogger.getInstance(CheckCreateVolumeParaAtom.class);
    @Override
    public void handleExecute(DelegateExecution execution)
        throws OperationException
    {
        LOGGER.notice("CheckCreateVolumeParaAtom START!");
        
        if (null == execution || null == execution.getVariables())
        {
            LOGGER.error("Atom execute FAILED! invalid input param, execution is null or variables are null");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "execution is null or variables are null");
        }
        
        // 从execution中获取service_request对应的字符串,类型转换异常会在父类中捕获
        String applyVolumeRequestStr = getValue(execution,CommonConstants.SERVICE_REQUEST,String.class);
        if (StringUtils.isBlank(applyVolumeRequestStr))
        {
            LOGGER.error("CheckCreateVolumeParaAtom FAILED! Invalid input param, service_request value is null.");
            throw new OperationException(HttpStatus.SC_BAD_REQUEST, CommonCode.INVALID_INPUT_PARAMETER,
                "service_request value is null");
        }
        LOGGER.debug("applyVolumeRequestStr={}", applyVolumeRequestStr);
        ApplyVolumeRequest applyVolumeRequest = null;
        try
        {
            applyVolumeRequest = ConvertionUtil.convertJson2Bean(applyVolumeRequestStr, ApplyVolumeRequest.class);
        }
        catch (Throwable t)
        {
            LOGGER.error("CheckCreateVolumeParaAtom FAILED! Invalid input param, {} cannot cast into ApplyVolumeRequest",
                applyVolumeRequestStr);
            throw new OperationException(HttpStatus.SC_BAD_REQUEST, CommonCode.INVALID_INPUT_PARAMETER,
                "var cannot cast into ApplyVolumeRequest");
        }
        LOGGER.debug("Get ApplyVolumeRequest before approval, ApplyVolumeRequest={}", applyVolumeRequest);
   
        // 从execution中获取获取审批后修改的ApplyVolumeRequest,类型转换异常会在父类中捕获
        String submitReqObj = getValue(execution, CommonConstants.SUBMIT_SERVICE_REQUEST,String.class);
        ApplyVolumeRequest submitReq = null;
        if (StringUtils.isNotBlank(submitReqObj))
        {
            LOGGER.debug("get submitReqObj succeed! submitReqObj={}", submitReqObj);
            try
            {
                submitReq = ConvertionUtil.convertJson2Bean(submitReqObj, ApplyVolumeRequest.class);
                // 不做参数锁定校验,所以直接以审批结果为准。
                applyVolumeRequest = submitReq;
            }
            catch (Throwable t)
            {
                LOGGER.error(
                    "CheckCreateVolumeParaAtom FAILED! Invalid input param, {} cannot cast into ApplyVolumeRequest",
                    submitReqObj);
                throw new OperationException(HttpStatus.SC_BAD_REQUEST, CommonCode.INVALID_INPUT_PARAMETER,
                    "var cannot cast into ApplyVolumeRequest");
            }
        }
        else
        {
            LOGGER.warn("submit_service_request is null, maybe not need to approve");
        }
        LOGGER.debug("Get ApplyVolumeRequest after approval, ApplyVolumeRequest={}", submitReq);
        
        // 不做参数锁定校验，如果需要做参数校验的话，要先获取服务定义的参数，再按照定义结果赋值。可参考如下被注释代码
//        String params = getValue(execution, CommonConstants.SERVICE_DEFINITION_PARAMS, String.class);
//        if (StringUtils.isBlank(params))
//        {
//            LOGGER.error("CheckCreateVolumeParaAtom FAILED! Invalid input param. Params is blank.");
//            throw new OperationException(HttpStatus.SC_BAD_REQUEST, CommonCode.INVALID_INPUT_PARAMETER,
//                "Invalid input param. Params is blank.");
//        }
        //定义一个方法进行参数锁定校验
        //TODO 
        // 向commonInfo4Flow中放入cloudInfraId以及vpcId
        CommonInfo4Flow commonInfo4Flow = CommonUtils.getCommonInfo4Flow(execution);
        commonInfo4Flow.setCloudInfraId(applyVolumeRequest.getCloudInfraId());
        String vpcId = applyVolumeRequest.getVpcId();
        if (StringUtils.isBlank(vpcId))
        {
            //IT环境下入参中不会传入VPCID，默认为-1
            vpcId = "-1";
            applyVolumeRequest.setVpcId(vpcId);
        }
        
        commonInfo4Flow.setVpcId(vpcId);
        
        //根据注解检验参数
        CommonUtils.checkParameters(applyVolumeRequest);
        
        // 为了保证后面使用没有问题，此处需要将applyVolumeRequest重新设置到上下文中
        execution.removeVariable(CommonConstants.SERVICE_REQUEST);
        setValue(execution, CommonConstants.SERVICE_REQUEST, applyVolumeRequest);
        setValue(execution, CommonConstants.COMMON_INFO_4_FLOW, commonInfo4Flow);
        LOGGER.notice("CheckCreateVolumeParaAtom SUCCEED! applyVolumeRequest={}, commonInfo4Flow={}", applyVolumeRequest, commonInfo4Flow);
    }
    
}
