/*
 *  CesiumHeatmap.js v0.1 | Cesium Heatmap Library
 *
 *  Works with heatmap.js v2.0.0: http://www.patrick-wied.at/static/heatmapjs/
 */
(function(window) {
  'use strict'

  function define_CesiumHeatmap() {
    var CesiumHeatmap = {
      defaults: {
        useEntitiesIfAvailable: true, //whether to use entities if a Viewer is supplied or always use an ImageryProvider
        minCanvasSize: 700,           // minimum size (in pixels) for the heatmap canvas
        maxCanvasSize: 2000,          // maximum size (in pixels) for the heatmap canvas
        radiusFactor: 60,             // data point size factor used if no radius is given (the greater of height and width divided by this number yields the used radius)
        spacingFactor: 1.5,           // extra space around the borders (point radius multiplied by this number yields the spacing)
        maxOpacity: 0.8,              // the maximum opacity used if not given in the heatmap options object
        minOpacity: 0.1,              // the minimum opacity used if not given in the heatmap options object
        blur: 0.85,                   // the blur used if not given in the heatmap options object
        gradient: {                   // the gradient used if not given in the heatmap options object
          '.3': 'blue',
          '.65': 'yellow',
          '.8': 'orange',
          '.95': 'red'
        }
      }
    }

    /*  Create a CesiumHeatmap instance
     *
     *  cesium:  the CesiumWidget or Viewer instance
     *  bb:      the WGS84 bounding box like {north, east, south, west}
     *  options: a heatmap.js options object (see http://www.patrick-wied.at/static/heatmapjs/docs.html#h337-create)
     */
    CesiumHeatmap.create = function(cesium, bb, options) {
      var instance = new CHInstance(cesium, bb, options)
      return instance
    }

    CesiumHeatmap._changeContainerWidthHeight = function(width, height, id) {
      var c = document.getElementById(id)
      c.setAttribute('style', 'width: ' + width + 'px; height: ' + height + 'px; margin: 0px; display: none;')
    }

    CesiumHeatmap._getContainer = function(width, height, id) {
      var c = document.createElement('div')
      if (id) {
        c.setAttribute('id', id)
      }
      c.setAttribute('style', 'width: ' + width + 'px; height: ' + height + 'px; margin: 0px; display: none;')
      document.body.appendChild(c)
      return c
    }

    CesiumHeatmap._getImageryProvider = function(instance) {
      //var n = (new Date()).getTime();
      var d = instance._heatmap.getDataURL()
      //console.log("Create data URL: " + ((new Date()).getTime() - n));

      //var n = (new Date()).getTime();
      var imgprov = new Cesium.SingleTileImageryProvider({
        url: d,
        rectangle: instance._rectangle
      })
      //console.log("Create imageryprovider: " + ((new Date()).getTime() - n));

      imgprov._tilingScheme = new Cesium.WebMercatorTilingScheme({
        rectangleSouthwestInMeters: new Cesium.Cartesian2(instance._mbounds.west, instance._mbounds.south),
        rectangleNortheastInMeters: new Cesium.Cartesian2(instance._mbounds.east, instance._mbounds.north)
      })

      return imgprov
    }

    CesiumHeatmap._getID = function(len) {
      var text = ''
      var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

      for (var i = 0; i < ((len) ? len : 8); i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
      }

      return text
    }

    var WMP = new Cesium.WebMercatorProjection()

    /*  Convert a WGS84 location into a mercator location
     *
     *  p: the WGS84 location like {x: lon, y: lat}
     */
    CesiumHeatmap.wgs84ToMercator = function(p) {
      var mp = WMP.project(Cesium.Cartographic.fromDegrees(p.x, p.y))
      return {
        x: mp.x,
        y: mp.y
      }
    }

    /*  Convert a WGS84 bounding box into a mercator bounding box
     *
     *  bb: the WGS84 bounding box like {north, east, south, west}
     */
    CesiumHeatmap.wgs84ToMercatorBB = function(bb) {
      var sw = WMP.project(Cesium.Cartographic.fromDegrees(bb.west, bb.south))
      var ne = WMP.project(Cesium.Cartographic.fromDegrees(bb.east, bb.north))
      return {
        north: ne.y,
        east: ne.x,
        south: sw.y,
        west: sw.x
      }
    }

    /*  Convert a mercator location into a WGS84 location
     *
     *  p: the mercator lcation like {x, y}
     */
    CesiumHeatmap.mercatorToWgs84 = function(p) {
      var wp = WMP.unproject(new Cesium.Cartesian3(p.x, p.y))
      return {
        x: wp.longitude,
        y: wp.latitude
      }
    }

    /*  Convert a mercator bounding box into a WGS84 bounding box
     *
     *  bb: the mercator bounding box like {north, east, south, west}
     */
    CesiumHeatmap.mercatorToWgs84BB = function(bb) {
      var sw = WMP.unproject(new Cesium.Cartesian3(bb.west, bb.south))
      var ne = WMP.unproject(new Cesium.Cartesian3(bb.east, bb.north))
      return {
        north: this.rad2deg(ne.latitude),
        east: this.rad2deg(ne.longitude),
        south: this.rad2deg(sw.latitude),
        west: this.rad2deg(sw.longitude)
      }
    }

    /*  Convert degrees into radians
     *
     *  d: the degrees to be converted to radians
     */
    CesiumHeatmap.deg2rad = function(d) {
      var r = d * (Math.PI / 180.0)
      return r
    }

    /*  Convert radians into degrees
     *
     *  r: the radians to be converted to degrees
     */
    CesiumHeatmap.rad2deg = function(r) {
      var d = r / (Math.PI / 180.0)
      return d
    }

    return CesiumHeatmap
  }

  if (typeof (CesiumHeatmap) === 'undefined') {
    window.CesiumHeatmap = define_CesiumHeatmap()
  } else {
    console.log('CesiumHeatmap already defined.')
  }
})(window)

/*  Initiate a CesiumHeatmap instance
 *
 *  c:  CesiumWidget instance
 *  bb: a WGS84 bounding box like {north, east, south, west}
 *  o:  a heatmap.js options object (see http://www.patrick-wied.at/static/heatmapjs/docs.html#h337-create)
 */
function CHInstance(c, bb, o) {
  if (!bb) {
    return null
  }
  if (!o) {
    o = {}
  }

  this._cesium = c
  this._options = o
  this._id = CesiumHeatmap._getID()

  this._options.gradient = ((this._options.gradient) ? this._options.gradient : CesiumHeatmap.defaults.gradient)
  this._options.maxOpacity = ((this._options.maxOpacity) ? this._options.maxOpacity : CesiumHeatmap.defaults.maxOpacity)
  this._options.minOpacity = ((this._options.minOpacity) ? this._options.minOpacity : CesiumHeatmap.defaults.minOpacity)
  this._options.blur = ((this._options.blur) ? this._options.blur : CesiumHeatmap.defaults.blur)

  this.computeBBAttr(bb)

  this._container = CesiumHeatmap._getContainer(this.width, this.height, this._id)
  this._options.container = this._container
  this._heatmap = h337.create(this._options)
  this._container.children[0].setAttribute('id', this._id + '-hm')
}

// 计算各种属性(关于边界的)
CHInstance.prototype.computeBBAttr = function(bb) {
  this._mbounds = CesiumHeatmap.wgs84ToMercatorBB(bb)
  this._setWidthAndHeight(this._mbounds)
  this._options.radius = Math.round((this._options.radius) ? this._options.radius : ((this.width > this.height) ? this.width / CesiumHeatmap.defaults.radiusFactor : this.height / CesiumHeatmap.defaults.radiusFactor))
  this._spacing = this._options.radius * CesiumHeatmap.defaults.spacingFactor
  this._xoffset = this._mbounds.west
  this._yoffset = this._mbounds.south
  this.width = Math.round(this.width + this._spacing * 2)
  this.height = Math.round(this.height + this._spacing * 2)

  this._mbounds.west -= this._spacing * this._factor
  this._mbounds.east += this._spacing * this._factor
  this._mbounds.south -= this._spacing * this._factor
  this._mbounds.north += this._spacing * this._factor

  this.bounds = CesiumHeatmap.mercatorToWgs84BB(this._mbounds)
  this._rectangle = Cesium.Rectangle.fromDegrees(this.bounds.west, this.bounds.south, this.bounds.east, this.bounds.north)
}

// 修改热力图区域
CHInstance.prototype.changeBounds = function(bb) {
  if (!bb) {
    return null
  }
  // 清除旧的热力图layer
  if (this._layer) {
    this._cesium.entities.remove(this._layer)
  }

  this.computeBBAttr(bb)

  CesiumHeatmap._changeContainerWidthHeight(this.width, this.height, this._id)

  this._heatmap.configure({
    width: this.width,
    height: this.height
  })

}


/*  Convert a WGS84 location to the corresponding heatmap location
 *
 *  p: a WGS84 location like {x:lon, y:lat}
 */
CHInstance.prototype.wgs84PointToHeatmapPoint = function(p) {
  return this.mercatorPointToHeatmapPoint(CesiumHeatmap.wgs84ToMercator(p))
}

/*  Convert a mercator location to the corresponding heatmap location
 *
 *  p: a WGS84 location like {x: lon, y:lat}
 */
CHInstance.prototype.mercatorPointToHeatmapPoint = function(p) {
  var pn = {}

  pn.x = Math.round((p.x - this._xoffset) / this._factor + this._spacing)
  pn.y = Math.round((p.y - this._yoffset) / this._factor + this._spacing)
  pn.y = this.height - pn.y

  return pn
}

CHInstance.prototype._setWidthAndHeight = function(mbb) {
  this.width = ((mbb.east > 0 && mbb.west < 0) ? mbb.east + Math.abs(mbb.west) : Math.abs(mbb.east - mbb.west))
  this.height = ((mbb.north > 0 && mbb.south < 0) ? mbb.north + Math.abs(mbb.south) : Math.abs(mbb.north - mbb.south))
  this._factor = 1

  if (this.width > this.height && this.width > CesiumHeatmap.defaults.maxCanvasSize) {
    this._factor = this.width / CesiumHeatmap.defaults.maxCanvasSize

    if (this.height / this._factor < CesiumHeatmap.defaults.minCanvasSize) {
      this._factor = this.height / CesiumHeatmap.defaults.minCanvasSize
    }
  } else if (this.height > this.width && this.height > CesiumHeatmap.defaults.maxCanvasSize) {
    this._factor = this.height / CesiumHeatmap.defaults.maxCanvasSize

    if (this.width / this._factor < CesiumHeatmap.defaults.minCanvasSize) {
      this._factor = this.width / CesiumHeatmap.defaults.minCanvasSize
    }
  } else if (this.width < this.height && this.width < CesiumHeatmap.defaults.minCanvasSize) {
    this._factor = this.width / CesiumHeatmap.defaults.minCanvasSize

    if (this.height / this._factor > CesiumHeatmap.defaults.maxCanvasSize) {
      this._factor = this.height / CesiumHeatmap.defaults.maxCanvasSize
    }
  } else if (this.height < this.width && this.height < CesiumHeatmap.defaults.minCanvasSize) {
    this._factor = this.height / CesiumHeatmap.defaults.minCanvasSize

    if (this.width / this._factor > CesiumHeatmap.defaults.maxCanvasSize) {
      this._factor = this.width / CesiumHeatmap.defaults.maxCanvasSize
    }
  }

  this.width = this.width / this._factor
  this.height = this.height / this._factor
}

/*  Set an array of heatmap locations
 *
 *  min:  the minimum allowed value for the data values
 *  max:  the maximum allowed value for the data values
 *  data: an array of data points in heatmap coordinates and values like {x, y, value}
 */
CHInstance.prototype.setData = function(min, max, data) {
  if (data && data.length > 0 && min !== null && min !== false && max !== null && max !== false) {
    this._heatmap.setData({
      min: min,
      max: max,
      data: data
    })

    this.updateLayer()
    return true
  }

  return false
}

/*  Set an array of WGS84 locations
 *
 *  min:  the minimum allowed value for the data values
 *  max:  the maximum allowed value for the data values
 *  data: an array of data points in WGS84 coordinates and values like { x:lon, y:lat, value }
 */
CHInstance.prototype.setWGS84Data = function(min, max, data) {
  if (data && data.length > 0 && min !== null && min !== false && max !== null && max !== false) {
    var convdata = []

    for (var i = 0; i < data.length; i++) {
      var gp = data[i]

      var hp = this.wgs84PointToHeatmapPoint(gp)
      if (gp.value || gp.value === 0) {
        hp.value = gp.value
      }


      // 增加半径处理(动态热力图)
      if (gp.radius) {
        hp.radius = gp.radius
      }

      convdata.push(hp)
    }

    return this.setData(min, max, convdata)
  }

  return false
}

/*  Set whether or not the heatmap is shown on the map
 *
 *  s: true means the heatmap is shown, false means the heatmap is hidden
 */
CHInstance.prototype.show = function(s) {
  if (this._layer) {
    this._layer.show = s
  }
}

// 创建Layer层
CHInstance.prototype.createLayerEntity = function() {

  // Work around issue with material rendering in Cesium
  // provided by https://github.com/criis
  var material = new Cesium.ImageMaterialProperty({
    image: this._heatmap._renderer.canvas
  })
  if (Cesium.VERSION >= '1.21') {
    material.transparent = true
  } else if (Cesium.VERSION >= '1.16') {
    material.alpha = 0.99
  }

  this._layer = this._cesium.entities.add({
    show: true,
    rectangle: {
      coordinates: this._rectangle,
      material: material
    }
  })
}

/*  Update/(re)draw the heatmap
 */
CHInstance.prototype.updateLayer = function() {

  // only works with a Viewer instance since the cesiumWidget
  // instance doesn't contain an entities property
  if (CesiumHeatmap.defaults.useEntitiesIfAvailable && this._cesium.entities) {
    if (this._layer) {
      this._cesium.entities.remove(this._layer)
    }

    this.createLayerEntity()

  } else {
    if (this._layer) {
      this._cesium.scene.imageryLayers.remove(this._layer)
    }

    this._layer = this._cesium.scene.imageryLayers.addImageryProvider(CesiumHeatmap._getImageryProvider(this))
  }
};

/*
 * 新版 heatmap
 * heatmap.js v2.0.5 | JavaScript Heatmap Library
 *
 * Copyright 2008-2016 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.
 * Dual licensed under MIT and Beerware license
 *
 * :: 2016-09-05 01:16
 */
;(function (name, context, factory) {

  // Supports UMD. AMD, CommonJS/Node.js and browser context
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define(factory);
  } else {
    context[name] = factory();
  }

})("h337", this, function () {

  // Heatmap Config stores default values and will be merged with instance config
  var HeatmapConfig = {
    defaultRadius: 40,
    defaultRenderer: 'canvas2d',
    defaultGradient: { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
    defaultMaxOpacity: 1,
    defaultMinOpacity: 0,
    defaultBlur: .85,
    defaultXField: 'x',
    defaultYField: 'y',
    defaultValueField: 'value',
    plugins: {}
  };
  var Store = (function StoreClosure() {

    var Store = function Store(config) {
      this._coordinator = {};
      this._data = [];
      this._radi = [];
      this._min = 10;
      this._max = 1;
      this._xField = config['xField'] || config.defaultXField;
      this._yField = config['yField'] || config.defaultYField;
      this._valueField = config['valueField'] || config.defaultValueField;

      if (config["radius"]) {
        this._cfgRadius = config["radius"];
      }
    };

    var defaultRadius = HeatmapConfig.defaultRadius;

    Store.prototype = {
      // when forceRender = false -> called from setData, omits renderall event
      _organiseData: function(dataPoint, forceRender) {
        var x = dataPoint[this._xField];
        var y = dataPoint[this._yField];
        var radi = this._radi;
        var store = this._data;
        var max = this._max;
        var min = this._min;
        var value = dataPoint[this._valueField] || 1;
        var radius = dataPoint.radius || this._cfgRadius || defaultRadius;

        if (!store[x]) {
          store[x] = [];
          radi[x] = [];
        }

        if (!store[x][y]) {
          store[x][y] = value;
          radi[x][y] = radius;
        } else {
          store[x][y] += value;
        }
        var storedVal = store[x][y];

        if (storedVal > max) {
          if (!forceRender) {
            this._max = storedVal;
          } else {
            this.setDataMax(storedVal);
          }
          return false;
        } else if (storedVal < min) {
          if (!forceRender) {
            this._min = storedVal;
          } else {
            this.setDataMin(storedVal);
          }
          return false;
        } else {
          return {
            x: x,
            y: y,
            value: value,
            radius: radius,
            min: min,
            max: max
          };
        }
      },
      _unOrganizeData: function() {
        var unorganizedData = [];
        var data = this._data;
        var radi = this._radi;

        for (var x in data) {
          for (var y in data[x]) {

            unorganizedData.push({
              x: x,
              y: y,
              radius: radi[x][y],
              value: data[x][y]
            });

          }
        }
        return {
          min: this._min,
          max: this._max,
          data: unorganizedData
        };
      },
      _onExtremaChange: function() {
        this._coordinator.emit('extremachange', {
          min: this._min,
          max: this._max
        });
      },
      addData: function() {
        if (arguments[0].length > 0) {
          var dataArr = arguments[0];
          var dataLen = dataArr.length;
          while (dataLen--) {
            this.addData.call(this, dataArr[dataLen]);
          }
        } else {
          // add to store
          var organisedEntry = this._organiseData(arguments[0], true);
          if (organisedEntry) {
            // if it's the first datapoint initialize the extremas with it
            if (this._data.length === 0) {
              this._min = this._max = organisedEntry.value;
            }
            this._coordinator.emit('renderpartial', {
              min: this._min,
              max: this._max,
              data: [organisedEntry]
            });
          }
        }
        return this;
      },
      setData: function(data) {
        var dataPoints = data.data;
        var pointsLen = dataPoints.length;


        // reset data arrays
        this._data = [];
        this._radi = [];

        for(var i = 0; i < pointsLen; i++) {
          this._organiseData(dataPoints[i], false);
        }
        this._max = data.max;
        this._min = data.min || 0;

        this._onExtremaChange();
        this._coordinator.emit('renderall', this._getInternalData());
        return this;
      },
      removeData: function() {
        // TODO: implement
      },
      setDataMax: function(max) {
        this._max = max;
        this._onExtremaChange();
        this._coordinator.emit('renderall', this._getInternalData());
        return this;
      },
      setDataMin: function(min) {
        this._min = min;
        this._onExtremaChange();
        this._coordinator.emit('renderall', this._getInternalData());
        return this;
      },
      setCoordinator: function(coordinator) {
        this._coordinator = coordinator;
      },
      _getInternalData: function() {
        return {
          max: this._max,
          min: this._min,
          data: this._data,
          radi: this._radi
        };
      },
      getData: function() {
        return this._unOrganizeData();
      }/*,

       TODO: rethink.

       getValueAt: function(point) {
       var value;
       var radius = 100;
       var x = point.x;
       var y = point.y;
       var data = this._data;

       if (data[x] && data[x][y]) {
       return data[x][y];
       } else {
       var values = [];
       // radial search for datapoints based on default radius
       for(var distance = 1; distance < radius; distance++) {
       var neighbors = distance * 2 +1;
       var startX = x - distance;
       var startY = y - distance;

       for(var i = 0; i < neighbors; i++) {
       for (var o = 0; o < neighbors; o++) {
       if ((i == 0 || i == neighbors-1) || (o == 0 || o == neighbors-1)) {
       if (data[startY+i] && data[startY+i][startX+o]) {
       values.push(data[startY+i][startX+o]);
       }
       } else {
       continue;
       }
       }
       }
       }
       if (values.length > 0) {
       return Math.max.apply(Math, values);
       }
       }
       return false;
       }*/
    };


    return Store;
  })();

  var Canvas2dRenderer = (function Canvas2dRendererClosure() {

    var _getColorPalette = function(config) {
      var gradientConfig = config.gradient || config.defaultGradient;
      var paletteCanvas = document.createElement('canvas');
      var paletteCtx = paletteCanvas.getContext('2d');

      paletteCanvas.width = 256;
      paletteCanvas.height = 1;

      var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
      for (var key in gradientConfig) {
        gradient.addColorStop(key, gradientConfig[key]);
      }

      paletteCtx.fillStyle = gradient;
      paletteCtx.fillRect(0, 0, 256, 1);

      return paletteCtx.getImageData(0, 0, 256, 1).data;
    };

    var _getPointTemplate = function(radius, blurFactor) {
      var tplCanvas = document.createElement('canvas');
      var tplCtx = tplCanvas.getContext('2d');
      var x = radius;
      var y = radius;
      tplCanvas.width = tplCanvas.height = radius*2;

      if (blurFactor == 1) {
        tplCtx.beginPath();
        tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
        tplCtx.fillStyle = 'rgba(0,0,0,1)';
        tplCtx.fill();
      } else {
        var gradient = tplCtx.createRadialGradient(x, y, radius*blurFactor, x, y, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        tplCtx.fillStyle = gradient;
        tplCtx.fillRect(0, 0, 2*radius, 2*radius);
      }



      return tplCanvas;
    };

    var _prepareData = function(data) {
      var renderData = [];
      var min = data.min;
      var max = data.max;
      var radi = data.radi;
      var data = data.data;

      var xValues = Object.keys(data);
      var xValuesLen = xValues.length;

      while(xValuesLen--) {
        var xValue = xValues[xValuesLen];
        var yValues = Object.keys(data[xValue]);
        var yValuesLen = yValues.length;
        while(yValuesLen--) {
          var yValue = yValues[yValuesLen];
          var value = data[xValue][yValue];
          var radius = radi[xValue][yValue];
          renderData.push({
            x: xValue,
            y: yValue,
            value: value,
            radius: radius
          });
        }
      }

      return {
        min: min,
        max: max,
        data: renderData
      };
    };


    function Canvas2dRenderer(config) {
      var container = config.container;
      var shadowCanvas = this.shadowCanvas = document.createElement('canvas');
      var canvas = this.canvas = config.canvas || document.createElement('canvas');
      var renderBoundaries = this._renderBoundaries = [10000, 10000, 0, 0];

      var computed = getComputedStyle(config.container) || {};

      canvas.className = 'heatmap-canvas';

      this._width = canvas.width = shadowCanvas.width = config.width || +(computed.width.replace(/px/,''));
      this._height = canvas.height = shadowCanvas.height = config.height || +(computed.height.replace(/px/,''));

      this.shadowCtx = shadowCanvas.getContext('2d');
      this.ctx = canvas.getContext('2d');

      // @TODO:
      // conditional wrapper

      canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';

      container.style.position = 'relative';
      container.appendChild(canvas);

      this._palette = _getColorPalette(config);
      this._templates = {};

      this._setStyles(config);
    };

    Canvas2dRenderer.prototype = {
      renderPartial: function(data) {
        if (data.data.length > 0) {
          this._drawAlpha(data);
          this._colorize();
        }
      },
      renderAll: function(data) {
        // reset render boundaries
        this._clear();
        if (data.data.length > 0) {
          this._drawAlpha(_prepareData(data));
          this._colorize();
        }
      },
      _updateGradient: function(config) {
        this._palette = _getColorPalette(config);
      },
      updateConfig: function(config) {
        if (config['gradient']) {
          this._updateGradient(config);
        }
        this._setStyles(config);
      },
      setDimensions: function(width, height) {
        this._width = width;
        this._height = height;
        this.canvas.width = this.shadowCanvas.width = width;
        this.canvas.height = this.shadowCanvas.height = height;
      },
      _clear: function() {
        this.shadowCtx.clearRect(0, 0, this._width, this._height);
        this.ctx.clearRect(0, 0, this._width, this._height);
      },
      _setStyles: function(config) {
        this._blur = (config.blur == 0)?0:(config.blur || config.defaultBlur);

        if (config.backgroundColor) {
          this.canvas.style.backgroundColor = config.backgroundColor;
        }

        this._width = this.canvas.width = this.shadowCanvas.width = config.width || this._width;
        this._height = this.canvas.height = this.shadowCanvas.height = config.height || this._height;


        this._opacity = (config.opacity || 0) * 255;
        this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255;
        this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255;
        this._useGradientOpacity = !!config.useGradientOpacity;
      },
      _drawAlpha: function(data) {
        var min = this._min = data.min;
        var max = this._max = data.max;
        var data = data.data || [];
        var dataLen = data.length;
        // on a point basis?
        var blur = 1 - this._blur;

        while(dataLen--) {

          var point = data[dataLen];

          var x = point.x;
          var y = point.y;
          var radius = point.radius;
          // if value is bigger than max
          // use max as value
          var value = Math.min(point.value, max);
          var rectX = x - radius;
          var rectY = y - radius;
          var shadowCtx = this.shadowCtx;




          var tpl;
          if (!this._templates[radius]) {
            this._templates[radius] = tpl = _getPointTemplate(radius, blur);
          } else {
            tpl = this._templates[radius];
          }
          // value from minimum / value range
          // => [0, 1]
          var templateAlpha = (value-min)/(max-min);
          // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
          shadowCtx.globalAlpha = templateAlpha < .01 ? .01 : templateAlpha;

          shadowCtx.drawImage(tpl, rectX, rectY);

          // update renderBoundaries
          if (rectX < this._renderBoundaries[0]) {
            this._renderBoundaries[0] = rectX;
          }
          if (rectY < this._renderBoundaries[1]) {
            this._renderBoundaries[1] = rectY;
          }
          if (rectX + 2*radius > this._renderBoundaries[2]) {
            this._renderBoundaries[2] = rectX + 2*radius;
          }
          if (rectY + 2*radius > this._renderBoundaries[3]) {
            this._renderBoundaries[3] = rectY + 2*radius;
          }

        }
      },
      _colorize: function() {
        var x = this._renderBoundaries[0];
        var y = this._renderBoundaries[1];
        var width = this._renderBoundaries[2] - x;
        var height = this._renderBoundaries[3] - y;
        var maxWidth = this._width;
        var maxHeight = this._height;
        var opacity = this._opacity;
        var maxOpacity = this._maxOpacity;
        var minOpacity = this._minOpacity;
        var useGradientOpacity = this._useGradientOpacity;

        if (x < 0) {
          x = 0;
        }
        if (y < 0) {
          y = 0;
        }
        if (x + width > maxWidth) {
          width = maxWidth - x;
        }
        if (y + height > maxHeight) {
          height = maxHeight - y;
        }

        var img = this.shadowCtx.getImageData(x, y, width, height);
        var imgData = img.data;
        var len = imgData.length;
        var palette = this._palette;


        for (var i = 3; i < len; i+= 4) {
          var alpha = imgData[i];
          var offset = alpha * 4;


          if (!offset) {
            continue;
          }

          var finalAlpha;
          if (opacity > 0) {
            finalAlpha = opacity;
          } else {
            if (alpha < maxOpacity) {
              if (alpha < minOpacity) {
                finalAlpha = minOpacity;
              } else {
                finalAlpha = alpha;
              }
            } else {
              finalAlpha = maxOpacity;
            }
          }

          imgData[i-3] = palette[offset];
          imgData[i-2] = palette[offset + 1];
          imgData[i-1] = palette[offset + 2];
          imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha;

        }

        img.data = imgData;
        this.ctx.putImageData(img, x, y);

        this._renderBoundaries = [1000, 1000, 0, 0];

      },
      getValueAt: function(point) {
        var value;
        var shadowCtx = this.shadowCtx;
        var img = shadowCtx.getImageData(point.x, point.y, 1, 1);
        var data = img.data[3];
        var max = this._max;
        var min = this._min;

        value = (Math.abs(max-min) * (data/255)) >> 0;

        return value;
      },
      getDataURL: function() {
        return this.canvas.toDataURL();
      }
    };


    return Canvas2dRenderer;
  })();


  var Renderer = (function RendererClosure() {

    var rendererFn = false;

    if (HeatmapConfig['defaultRenderer'] === 'canvas2d') {
      rendererFn = Canvas2dRenderer;
    }

    return rendererFn;
  })();


  var Util = {
    merge: function() {
      var merged = {};
      var argsLen = arguments.length;
      for (var i = 0; i < argsLen; i++) {
        var obj = arguments[i]
        for (var key in obj) {
          merged[key] = obj[key];
        }
      }
      return merged;
    }
  };
  // Heatmap Constructor
  var Heatmap = (function HeatmapClosure() {

    var Coordinator = (function CoordinatorClosure() {

      function Coordinator() {
        this.cStore = {};
      };

      Coordinator.prototype = {
        on: function(evtName, callback, scope) {
          var cStore = this.cStore;

          if (!cStore[evtName]) {
            cStore[evtName] = [];
          }
          cStore[evtName].push((function(data) {
            return callback.call(scope, data);
          }));
        },
        emit: function(evtName, data) {
          var cStore = this.cStore;
          if (cStore[evtName]) {
            var len = cStore[evtName].length;
            for (var i=0; i<len; i++) {
              var callback = cStore[evtName][i];
              callback(data);
            }
          }
        }
      };

      return Coordinator;
    })();


    var _connect = function(scope) {
      var renderer = scope._renderer;
      var coordinator = scope._coordinator;
      var store = scope._store;

      coordinator.on('renderpartial', renderer.renderPartial, renderer);
      coordinator.on('renderall', renderer.renderAll, renderer);
      coordinator.on('extremachange', function(data) {
        scope._config.onExtremaChange &&
        scope._config.onExtremaChange({
          min: data.min,
          max: data.max,
          gradient: scope._config['gradient'] || scope._config['defaultGradient']
        });
      });
      store.setCoordinator(coordinator);
    };


    function Heatmap() {
      var config = this._config = Util.merge(HeatmapConfig, arguments[0] || {});
      this._coordinator = new Coordinator();
      if (config['plugin']) {
        var pluginToLoad = config['plugin'];
        if (!HeatmapConfig.plugins[pluginToLoad]) {
          throw new Error('Plugin \''+ pluginToLoad + '\' not found. Maybe it was not registered.');
        } else {
          var plugin = HeatmapConfig.plugins[pluginToLoad];
          // set plugin renderer and store
          this._renderer = new plugin.renderer(config);
          this._store = new plugin.store(config);
        }
      } else {
        this._renderer = new Renderer(config);
        this._store = new Store(config);
      }
      _connect(this);
    };

    // @TODO:
    // add API documentation
    Heatmap.prototype = {
      addData: function() {
        this._store.addData.apply(this._store, arguments);
        return this;
      },
      removeData: function() {
        this._store.removeData && this._store.removeData.apply(this._store, arguments);
        return this;
      },
      setData: function() {
        this._store.setData.apply(this._store, arguments);
        return this;
      },
      setDataMax: function() {
        this._store.setDataMax.apply(this._store, arguments);
        return this;
      },
      setDataMin: function() {
        this._store.setDataMin.apply(this._store, arguments);
        return this;
      },
      configure: function(config) {
        this._config = Util.merge(this._config, config);
        this._renderer.updateConfig(this._config);
        this._coordinator.emit('renderall', this._store._getInternalData());
        return this;
      },
      repaint: function() {
        this._coordinator.emit('renderall', this._store._getInternalData());
        return this;
      },
      getData: function() {
        return this._store.getData();
      },
      getDataURL: function() {
        return this._renderer.getDataURL();
      },
      getValueAt: function(point) {

        if (this._store.getValueAt) {
          return this._store.getValueAt(point);
        } else  if (this._renderer.getValueAt) {
          return this._renderer.getValueAt(point);
        } else {
          return null;
        }
      }
    };

    return Heatmap;

  })();


  // core
  var heatmapFactory = {
    create: function(config) {
      return new Heatmap(config);
    },
    register: function(pluginKey, plugin) {
      HeatmapConfig.plugins[pluginKey] = plugin;
    }
  };

  return heatmapFactory;


});
