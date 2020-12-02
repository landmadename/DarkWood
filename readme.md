1. 完成：构建简单的UI框架
2. 完成：切换选择区
3. 完成：开始版本控制
4.  - 完成：调整滑块
    - 修复：滑块在切换选择区时的显隐问题
5.  - 完成：打开框条介绍页面的按钮
    - 修复：由rpx的误差导致的问题(替换成vw)
    - 改进：菜单目前标志位的样式
    - 改进：整体的字体表现
    - 完成：新建介绍页面
6.  - 完成：切换 AR/图片 模式
    - 完成：引入Opencv
    - 修复：一系列表现不一致的问题
7.  - 完成：计算四点坐标
    - 改进：修改Pic模式的图片显示方式
    - 修复：camera组件和视频数据不一致的问题
8.  - 完成：框条渲染
    - 完成：框条和卡纸渲染
    - 完成：框条卡纸切换
    - 完成：宽度滑动条调整
    - 修复：实际识别区域超出屏幕的问题
9.  - 修复：缺少 面板当前选择项的标志的问题
    - 修复：初始化后无法进入AR模式的问题
    - 改进：优化 this.to_AR 的代码和性能
    - 改进：对wxml和wxss里的class进行了更加合理重命名
10. - 完成：显示场景
    - 修复：裁剪图片后无法识别图像
11. - 完成：拖拽角点
    - 修复：图片无法自动识别后无法手动设置
    - 修复：scale_points 参数不一致
12. 完成：扫码
13. - 完成：自动平衡框条显示效果
    - 改进：更规范的readme
14. 完成：随机画框卡纸
15. - 完成：选择透明背景
    - 修复：没有选择场景时，保存图片没有图片背景
16. - 完成：作品正畸
    - 完成：移动作品
    - 完成：缩放作品
17. - 修复：从Pic模式进入AR模式后仍会显示框条
    - 修复：手机无法在开启后直接进入AR模式
    - 修复：双指无法放大
18. - 重构：基本完成
    - 重构：onLoad, draw, save
    - 重构：tap_random_choose, 简单的按钮事件
    - 重构：在canvas上的滑动拖拽事件
    - 重构：index.js
19. - 修复：缩放时没有等比例改变框条卡纸的宽度
    - 修复：模式切换不人性化