package com.huawei.esdk.sc.flow.demo.volume.model;

import java.io.Serializable;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.huawei.goku.common.returncode.CommonCode;
import com.huawei.goku.framework.common.utils.constants.ValidationConstant;

/**
 * 申请云硬盘的请求消息结构。
 * 
 */
@JsonIgnoreProperties (ignoreUnknown = true)
public class ApplyVolumeRequest implements Serializable
{
    private static final long serialVersionUID = -3966895510892573301L;
    
    /**
     * 资源池ID
     * @required false
     */
    private String cloudInfraId;
    
    /**
     * 虚拟机所在的VPC编码
     * @required false
     */
    private String vpcId;
    
    /**
     * 磁盘名称, 1-32位字符，中文、英文、下划线
     * 该参数本可非必填，为了流程相对简单，将该参数设为必填
     * @required true
     */
    private String name;
    
    /**
     * 可用分区 ID.
     * @required true
     */
    private String availableZoneId;

    /**
     * 磁盘大小，单位为GB， 1~65536 
     */
    @Min (value = 1, message = CommonCode.INVALID_INPUT_PARAMETER + ValidationConstant.MESSAGE_TEMPLATE_SEPARATOR
        + "Volume size must higher or equal to 1.")
    @Max (value = 65536, message = CommonCode.INVALID_INPUT_PARAMETER + ValidationConstant.MESSAGE_TEMPLATE_SEPARATOR
        + "Volume size must lower or equal to 65536.")
    private int size;
    /**
     *   磁盘类型,(normal)普通，(share)共享卷。【仅IT资源池支持】 
     *   @required false  
     */
    private String type;
    
    /**
     * 磁盘存储介质。【仅IT资源池支持】,SAN-SSD, SAN-SAS&FC,SAN-SATA,SAN-Any。默认为SAN-Any   
     * @required false
     */
    private String mediaType;
    
    public String getCloudInfraId()
    {
        return cloudInfraId;
    }

    public void setCloudInfraId(String cloudInfraId)
    {
        this.cloudInfraId = cloudInfraId;
    }

    public String getVpcId()
    {
        return vpcId;
    }

    public void setVpcId(String vpcId)
    {
        this.vpcId = vpcId;
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public int getSize()
    {
        return size;
    }

    public void setSize(int size)
    {
        this.size = size;
    }

    public String getType()
    {
        return type;
    }

    public void setType(String type)
    {
        this.type = type;
    }

    public String getMediaType()
    {
        return mediaType;
    }

    public void setMediaType(String mediaType)
    {
        this.mediaType = mediaType;
    }

    public String getAvailableZoneId()
    {
        return availableZoneId;
    }

    public void setAvailableZoneId(String availableZoneId)
    {
        this.availableZoneId = availableZoneId;
    }

    @Override
    public String toString()
    {
        StringBuilder builder = new StringBuilder();
        builder.append("ApplyVolumeRequest [cloudInfraId=");
        builder.append(cloudInfraId);
        builder.append(", vpcId=");
        builder.append(vpcId);
        builder.append(", name=");
        builder.append(name);
        builder.append(", size=");
        builder.append(size);
        builder.append(", type=");
        builder.append(type);
        builder.append(", mediaType=");
        builder.append(mediaType);
        builder.append(", availableZoneId=");
        builder.append(availableZoneId);
        builder.append("]");
        return builder.toString();
    }

}
