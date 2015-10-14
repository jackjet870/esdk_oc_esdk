package com.huawei.esdk.sc.flow.demo.volume.listeners;

import com.huawei.esdk.sc.flow.demo.volume.utils.VolumeFlowConstants;

import org.activiti.engine.delegate.DelegateExecution;
import org.apache.http.HttpStatus;
import org.wcc.framework.log.AppLogger;

import com.huawei.goku.business.ssp.flow.toolkit.common.listeners.AtomExecutionListener;
import com.huawei.goku.business.ssp.flow.toolkit.common.utils.CommonConstants;
import com.huawei.goku.business.ssp.flow.toolkit.volume.atoms.QueryVolumeAtom;
import com.huawei.goku.common.exception.OperationException;
import com.huawei.goku.common.returncode.CommonCode;

public class ApplyVolumeQueryVolumeEndListener extends AtomExecutionListener
{
    private static final long serialVersionUID = -6004131240724469929L;
    
    private static final AppLogger LOGGER = AppLogger.getInstance(ApplyVolumeQueryVolumeEndListener.class);
    
    @Override
    public void handleExecute(DelegateExecution execution) throws OperationException
    {
        LOGGER.notice("ApplyVolumeQueryVolumeEndListener START! ");
        
        if (null == execution || null == execution.getVariables())
        {
            LOGGER.error("ApplyVolumeQueryVolumeEndListener FAILED! invalid input param, execution is null or variables are null");
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "execution is null or variables are null");
        }
        
        QueryVolumeAtom.Response resp =
            getValue(execution, VolumeFlowConstants.QUERY_VOLUME_ATOM_RESPONSE, QueryVolumeAtom.Response.class);
        if (null == resp)
        {
            LOGGER.error("get QueryVolumeAtom.Response FAILED! Invalid input param, {} is null",
                VolumeFlowConstants.QUERY_VOLUME_ATOM_RESPONSE);
            throw new OperationException(HttpStatus.SC_INTERNAL_SERVER_ERROR, CommonCode.INTERNAL_ERROR,
                "QueryVolumeAtom.Response is null");
        }
        
        Integer volumnLoopCounter = getValue(execution, CommonConstants.LOOP_COUNTER,Integer.class);
        String name_key = "volume_" + volumnLoopCounter + "name";
        
        //根据ID查询，只能有一个结果
        if (null != resp.getVolumes() && resp.getVolumes().size() >= 1)
        {
            setValue(execution, name_key, resp.getVolumes().get(0).getName());
            LOGGER.notice("ApplyVolumeQueryVolumeEndListener SUCCEED! set volume_{}_name={}",volumnLoopCounter, resp.getVolumes().get(0).getName());
        }
        else
        {
            setValue(execution, name_key, null);
            LOGGER.notice("ApplyVolumeQueryVolumeEndListener SUCCEED! set volume_{}_name=null",volumnLoopCounter);
        }
    }
    
}
