package com.huawei.esdk.sc.flow.demo.volume.listeners;

import java.util.ArrayList;
import java.util.List;

import com.huawei.esdk.sc.flow.demo.volume.model.ApplyVolumeRequest;

import org.activiti.engine.delegate.DelegateExecution;
import org.apache.http.HttpStatus;
import org.wcc.framework.log.AppLogger;

import com.huawei.goku.business.ssp.flow.toolkit.common.listeners.AtomExecutionListener;
import com.huawei.goku.business.ssp.flow.toolkit.common.utils.CommonConstants;
import com.huawei.goku.business.ssp.flow.toolkit.iam.model.enums.QuotaName;
import com.huawei.goku.business.ssp.flow.toolkit.vm.model.QuotaUsage;
import com.huawei.goku.business.ssp.flow.toolkit.vm.model.UpdateUsageRequest;
import com.huawei.goku.common.exception.OperationException;
import com.huawei.goku.common.returncode.CommonCode;

public class ApplyVolumeReduceUsageStartListener extends AtomExecutionListener
{
    private static final long serialVersionUID = 4370832866175889649L;
    
    private static final String UPDATE_USAGE_REQUEST = "update_usage_request";
    
    private static final AppLogger LOGGER = AppLogger.getInstance(ApplyVolumeReduceUsageStartListener.class);
    
    @Override
    public void handleExecute(DelegateExecution execution) throws OperationException
    {
        LOGGER.notice("ApplyVolumeReduceUsageStartListener START! Try to get UpdateUsageRequest from ApplyVolumeRequest");
        
        if (null == execution || null == execution.getVariables())
        {
            LOGGER.error("Invalid input param, execution is null or variables are null");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "execution is null or variables are null");
        }
        
        // 获取上下文中的申请卷的请求参数
        ApplyVolumeRequest applyVolumeRequest = getValue(execution, CommonConstants.SERVICE_REQUEST, ApplyVolumeRequest.class);
        if (null == applyVolumeRequest)
        {
            LOGGER.error("Get ApplyVolumeRequest FAILED! service_request is null");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "service_request is null");
        }
        int volumeQuotaUsageValue = applyVolumeRequest.getSize();
        
        // 磁盘
        QuotaUsage storageQuotaUsage = new QuotaUsage();
        storageQuotaUsage.setQuotaName(QuotaName.STORAGE);
        storageQuotaUsage.setValue(volumeQuotaUsageValue);
        
        List<QuotaUsage> quotaUsageList = new ArrayList<QuotaUsage>();
        quotaUsageList.add(storageQuotaUsage);
        
        UpdateUsageRequest request = new UpdateUsageRequest();
        request.setQuotaUsage(quotaUsageList);
        
        // 将UpdateUsageRequest存入execution
        setValue(execution, UPDATE_USAGE_REQUEST, request);
        
        LOGGER.notice("ApplyVolumeReduceUsageStartListener SUCCEED! set update_usage_request={}", request);
    }
    
}
