## vscode-tencent-cloud-cos-uploader

VSCode 插件，支持直接在 Markdown 文件中 **粘贴截图** 和 **选择文件** 上传到腾讯云 COS，得到文件地址后引用显示，大家直接在本地写 Markdown 时特别实用。

如果你没听说过腾讯云 COS，请点击[传送门](https://cloud.tencent.com/product/cos)。简单理解的话，你可以把它当做图床。

此插件拓展了 [tencent-cloud-cos-upload-image](https://github.com/Galen-Yip/tencent-cloud-cos-upload-image) 的功能。

---

## 使用

在 Markdown 文件中

- 使用 ctrl+ alt + p (Windows) / cmd + opt + p (Mac), 粘贴板里面的图片会直接上传至 cos
- 使用 ctrl+ alt + o (Windows) / cmd + opt + o (Mac), 选择本地文件上传至 cos

![demo.gif](https://galenye-1251496585.cos.ap-guangzhou.myqcloud.com/demo.gif)

## 参数配置

```json
{
  // 地区，在COS对象存储中bucket对应的地域
  "tencentCloudCOSUploader.region": "",
  // secretId，在 https://console.cloud.tencent.com/cam/capi 中获取
  "tencentCloudCOSUploader.secretId": "",
  // secretKey，在 https://console.cloud.tencent.com/cam/capi 中获取
  "tencentCloudCOSUploader.secretKey": "",
  // 输入你的bucket名称，如 a-1250000000
  "tencentCloudCOSUploader.bucket": "",
  // remotePath，您的存储目录，例如要把文件存在 http://${你的域名}/images/png 这个目录下，则这里填写images/png。默认为空，即存储在根路径下
  "tencentCloudCOSUploader.remotePath": "",
  // remoteName，文件名, 不用带文件扩展名，默认使用文件的 md5 值作为文件名
  "tencentCloudCOSUploader.remoteName": "{md5}",
  // 存储桶是否为公有可访问，如为私有，且希望上传后的url带签名，则设置为false，默认是 true
  "tencentCloudCOSUploader.isPublic": "true",
  // 签名有效期，单位为妙，isPublic设置为 false 时有效
  "tencentCloudCOSUploader.duration": "31536000",
  // 自定义域名，原来替换引用的默认COS域名，无特殊需求可不用修改
  "tencentCloudCOSUploader.domain": "",
  // 临时目录，默认 /tmp/.tencentCloudCOSUploader，无特殊需求可不用修改
  "tencentCloudCOSUploader.localPath": "/tmp/.tencentCloudCOSUploader"
}
```
