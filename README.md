# CesiumHeatmap
修改了CesiumHeatmap的源码,提供修改bounds和缩放修改热力图效果

## Demo

[修改半径](https://zeminglun.github.io/CesiumHeatmap/demo/changeRadius.html)

[修改区域](https://zeminglun.github.io/CesiumHeatmap/demo/changeBounds.html)


## 修改半径
通过事件修改传入数据半径,重新设置数据
```bash
// 镜头移动事件
var camera = viewer.camera
    viewer.scene.camera.moveEnd.addEventListener(function(){
        var height = camera.positionCartographic.height
        sourceData.forEach(function(v) {
          v.radius = height/20000
        })
        heatMap.setWGS84Data(0, 100, sourceData)
    })
```

## 修改区域
heatMap实例调用changeBounds方法即可
```bash
    heatMap.changeBounds(bounds)
    heatMap.setWGS84Data(0, 100, sourceData)
```
